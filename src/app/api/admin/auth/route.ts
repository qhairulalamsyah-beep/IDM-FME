import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { comparePin, isBcryptHash, legacySha256Hash, hashPin } from '@/lib/auth-helpers';
import { createAdminToken } from '@/lib/jwt';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// POST - Admin login with PIN
export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 login attempts per minute per IP
    const clientIp = getClientIp(request);
    const rl = rateLimit(`login:${clientIp}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa detik.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.resetMs / 1000)),
            'X-RateLimit-Remaining': '0',
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

    // Find all admins to check PIN against
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
        // bcrypt hash — use bcrypt.compare
        const valid = await comparePin(cleanPin, admin.adminPass);
        if (valid) {
          matchedAdmin = admin;
          break;
        }
      } else {
        // Legacy SHA-256 hash — compare directly
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

    // Migrate legacy SHA-256 hash to bcrypt on successful login
    if (!isBcryptHash(matchedAdmin.adminPass)) {
      try {
        const newHash = await hashPin(cleanPin);
        await db.user.update({
          where: { id: matchedAdmin.id },
          data: { adminPass: newHash },
        });
        console.log(`[AUTH] Migrated ${matchedAdmin.name} from SHA-256 to bcrypt`);
      } catch (migrateError) {
        console.error('[AUTH] Migration to bcrypt failed:', migrateError);
        // Non-blocking — continue login even if migration fails
      }
    }

    // Create JWT token for session
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
    console.error('[AUTH] Admin login error:', error);
    return NextResponse.json({ success: false, error: 'Gagal login' }, { status: 500 });
  }
}

// GET - List all admins (authenticated only)
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const admins = await db.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isAdmin: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const parsed = admins.map((a) => ({
      ...a,
      permissions: JSON.parse(a.permissions || '{}'),
    }));

    return NextResponse.json({ success: true, admins: parsed });
  } catch (error) {
    console.error('[AUTH] List admins error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data admin' }, { status: 500 });
  }
}
