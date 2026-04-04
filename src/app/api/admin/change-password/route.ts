import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { comparePin, isBcryptHash, legacySha256Hash, hashPin } from '@/lib/auth-helpers';
import { verifyAdmin } from '@/lib/admin-guard';

// PUT - Change own PIN (requires current PIN verification)
export async function PUT(request: NextRequest) {
  try {
    // Auth guard
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Get authenticated admin info (works with both JWT and legacy headers)
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPin, newPin } = body;

    if (!currentPin || !newPin) {
      return NextResponse.json({ success: false, error: 'PIN lama dan baru wajib diisi' }, { status: 400 });
    }

    // Validate PIN format (6 digits)
    const cleanCurrentPin = String(currentPin).trim();
    const cleanNewPin = String(newPin).trim();

    if (!/^\d{6}$/.test(cleanCurrentPin) || !/^\d{6}$/.test(cleanNewPin)) {
      return NextResponse.json({ success: false, error: 'PIN harus 6 digit angka' }, { status: 400 });
    }

    // Don't allow same PIN
    if (cleanCurrentPin === cleanNewPin) {
      return NextResponse.json({ success: false, error: 'PIN baru harus berbeda dari PIN lama' }, { status: 400 });
    }

    // Get current admin's password hash
    const user = await db.user.findUnique({
      where: { id: admin.id },
      select: { id: true, adminPass: true },
    });

    if (!user || !user.adminPass) {
      return NextResponse.json({ success: false, error: 'Akun tidak valid' }, { status: 400 });
    }

    // Verify current PIN
    let currentPinValid = false;
    if (isBcryptHash(user.adminPass)) {
      currentPinValid = await comparePin(cleanCurrentPin, user.adminPass);
    } else {
      currentPinValid = legacySha256Hash(cleanCurrentPin) === user.adminPass;
    }

    if (!currentPinValid) {
      return NextResponse.json({ success: false, error: 'PIN saat ini salah' }, { status: 401 });
    }

    // Hash new PIN with bcrypt
    const newHash = await hashPin(cleanNewPin);
    await db.user.update({
      where: { id: admin.id },
      data: { adminPass: newHash },
    });

    return NextResponse.json({ success: true, message: 'PIN berhasil diubah' });
  } catch (error) {
    console.error('[CHANGE PIN] Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengubah PIN' }, { status: 500 });
  }
}
