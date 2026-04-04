import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, verifyAdmin } from '@/lib/admin-guard';
import { comparePin, isBcryptHash, hashPin } from '@/lib/auth-helpers';

// PUT - Change admin PIN
export async function PUT(request: NextRequest) {
  try {
    // Auth guard — verify the request comes from an authenticated admin
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Get authenticated admin via verifyAdmin (works with both JWT and legacy headers)
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPin, newPin } = body;

    if (!currentPin || !newPin) {
      return NextResponse.json({ success: false, error: 'PIN lama dan baru wajib diisi' }, { status: 400 });
    }

    // Normalize PINs
    const cleanCurrentPin = String(currentPin).trim();
    const cleanNewPin = String(newPin).trim();

    // Validate PINs
    if (!/^\d{6}$/.test(cleanCurrentPin)) {
      return NextResponse.json({ success: false, error: 'PIN lama harus 6 digit angka' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(cleanNewPin)) {
      return NextResponse.json({ success: false, error: 'PIN baru harus 6 digit angka' }, { status: 400 });
    }

    if (cleanCurrentPin === cleanNewPin) {
      return NextResponse.json({ success: false, error: 'PIN baru harus berbeda dari PIN lama' }, { status: 400 });
    }

    // Find admin and verify current PIN (supports both bcrypt and legacy SHA-256)
    const user = await db.user.findUnique({
      where: { id: admin.id },
      select: { id: true, adminPass: true },
    });

    if (!user || !user.adminPass) {
      return NextResponse.json({ success: false, error: 'Akun tidak valid' }, { status: 401 });
    }

    // Verify current PIN — support both bcrypt and legacy SHA-256
    let currentPinValid = false;
    if (isBcryptHash(user.adminPass)) {
      currentPinValid = await comparePin(cleanCurrentPin, user.adminPass);
    } else {
      // Legacy SHA-256
      const { legacySha256Hash } = await import('@/lib/auth-helpers');
      currentPinValid = user.adminPass === legacySha256Hash(cleanCurrentPin);
    }

    if (!currentPinValid) {
      return NextResponse.json({ success: false, error: 'PIN lama salah' }, { status: 403 });
    }

    // Hash new PIN with bcrypt
    const newHash = await hashPin(cleanNewPin);

    // Update PIN
    await db.user.update({
      where: { id: user.id },
      data: { adminPass: newHash },
    });

    return NextResponse.json({ success: true, message: 'PIN berhasil diubah' });
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengubah PIN' }, { status: 500 });
  }
}
