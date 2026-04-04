import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePin, isBcryptHash, legacySha256Hash, hashPin } from '@/lib/auth-helpers';
import { createAdminToken } from '@/lib/jwt';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// POST - Re-authenticate admin with PIN (no valid JWT needed)
// This is used when the JWT has expired and the admin needs to get a new session
// without being fully logged out first.
export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 reauth attempts per minute per IP
    const clientIp = getClientIp(request);
    const rl = rateLimit(`reauth:${clientIp}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak percobaan. Coba lagi dalam beberapa detik.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.resetMs / 1000)),
          },
        },
      );
    }

    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN wajib diisi' }, { status: 400 });
    }

    // Normalize PIN
    const cleanPin = String(pin).trim();

    // PIN must be exactly 6 digits
    if (!/^\d{6}$/.test(cleanPin)) {
      return NextResponse.json({ success: false, error: 'PIN harus 6 digit angka' }, { status: 400 });
    }

    // Find all admins to check PIN against (same as login)
    const admins = await db.user.findMany({
      where: {
        role: { in: ['admin', 'super_admin'] },
        adminPass: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isAdmin: true,
        avatar: true,
        tier: true,
        adminPass: true,
      },
    });

    let matchedAdmin: typeof admins[0] | null = null;

    for (const admin of admins) {
      if (!admin.adminPass) continue;

      if (isBcryptHash(admin.adminPass)) {
        const valid = await comparePin(cleanPin, admin.adminPass);
        if (valid) {
          matchedAdmin = admin;
          break;
        }
      } else {
        const inputHash = legacySha256Hash(cleanPin);
        if (admin.adminPass === inputHash) {
          matchedAdmin = admin;
          break;
        }
      }
    }

    if (!matchedAdmin) {
      return NextResponse.json({ success: false, error: 'PIN salah' }, { status: 401 });
    }

    // Migrate legacy SHA-256 hash to bcrypt on successful reauth
    if (!isBcryptHash(matchedAdmin.adminPass)) {
      try {
        const newHash = await hashPin(cleanPin);
        await db.user.update({
          where: { id: matchedAdmin.id },
          data: { adminPass: newHash },
        });
        console.log(`[REAUTH] Migrated ${matchedAdmin.name} from SHA-256 to bcrypt`);
      } catch (migrateError) {
        console.error('[REAUTH] Migration to bcrypt failed:', migrateError);
      }
    }

    // Create new JWT token
    const token = await createAdminToken(matchedAdmin.id, matchedAdmin.role);
    const permissions = JSON.parse(matchedAdmin.permissions || '{}');

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: matchedAdmin.id,
        name: matchedAdmin.name,
        email: matchedAdmin.email,
        role: matchedAdmin.role,
        permissions,
        avatar: matchedAdmin.avatar,
        tier: matchedAdmin.tier,
      },
    });
  } catch (error) {
    console.error('[REAUTH] Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal re-autentikasi' }, { status: 500 });
  }
}
