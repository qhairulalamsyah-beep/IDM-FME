import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-guard';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// POST - Verify current PIN for the authenticated admin (for change PIN flow)
export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 10 verify attempts per minute per IP
    const clientIp = getClientIp(request);
    const rl = rateLimit(`verify-pin:${clientIp}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { valid: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.resetMs / 1000)),
          },
        },
      );
    }

    // Get the authenticated admin via verifyAdmin (works with both JWT and legacy headers)
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ valid: false, sessionExpired: true, error: 'Session kedaluwarsa. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ valid: false, error: 'PIN wajib diisi' }, { status: 400 });
    }

    // Normalize PIN
    const cleanPin = String(pin).trim();

    // PIN must be exactly 6 digits
    if (!/^\d{6}$/.test(cleanPin)) {
      return NextResponse.json({ valid: false, error: 'PIN harus 6 digit angka' }, { status: 400 });
    }

    // Compare PIN — support both bcrypt and legacy SHA-256
    const user = await db.user.findUnique({
      where: { id: admin.id },
      select: { id: true, adminPass: true },
    });

    if (!user || !user.adminPass) {
      return NextResponse.json({ valid: false, error: 'Akun tidak valid' }, { status: 401 });
    }

    let pinValid = false;
    const { isBcryptHash, comparePin, legacySha256Hash } = await import('@/lib/auth-helpers');
    if (isBcryptHash(user.adminPass)) {
      pinValid = await comparePin(cleanPin, user.adminPass);
    } else {
      const inputHash = legacySha256Hash(cleanPin);
      pinValid = user.adminPass === inputHash;
    }

    if (!pinValid) {
      return NextResponse.json({ valid: false, error: 'PIN salah' }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('[VERIFY PIN] Error:', error);
    return NextResponse.json({ valid: false, error: 'Gagal memverifikasi PIN' }, { status: 500 });
  }
}
