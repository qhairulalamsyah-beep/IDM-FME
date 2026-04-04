import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';
import { requireAdmin } from '@/lib/admin-guard';

// PUT - Change own password (requires current password verification)
export async function PUT(request: NextRequest) {
  try {
    // Auth guard — verify the request comes from an authenticated admin
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const adminId = request.headers.get('x-admin-id')!;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ success: false, error: 'Password baru minimal 4 karakter' }, { status: 400 });
    }

    const currentHash = createHash('sha256').update(currentPassword).digest('hex');

    // Use the authenticated admin's ID instead of username-based lookup
    // This prevents changing another admin's password by guessing their username
    const user = await db.user.findUnique({
      where: { id: adminId },
      select: { id: true, name: true },
    });

    // Also verify the current password hash matches
    if (!user || !(await db.user.findFirst({ where: { id: adminId, adminPass: currentHash }, select: { id: true } }))) {
      return NextResponse.json({ success: false, error: 'Password saat ini salah' }, { status: 401 });
    }

    const newHash = createHash('sha256').update(newPassword).digest('hex');
    await db.user.update({
      where: { id: user.id },
      data: { adminPass: newHash },
    });

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengubah password' }, { status: 500 });
  }
}
