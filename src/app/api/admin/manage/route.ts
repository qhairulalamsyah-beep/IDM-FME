import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, requirePermission } from '@/lib/admin-guard';
import { hashPin } from '@/lib/auth-helpers';

interface Permission {
  tournament?: boolean;
  players?: boolean;
  bracket?: boolean;
  scores?: boolean;
  prize?: boolean;
  donations?: boolean;
  full_reset?: boolean;
  manage_admins?: boolean;
}

const DEFAULT_PERMISSIONS: Permission = {
  tournament: true,
  players: true,
  bracket: true,
  scores: true,
  prize: true,
  donations: true,
  full_reset: false,
  manage_admins: false,
};

// POST - Add new admin (super_admin only)
export async function POST(request: NextRequest) {
  try {
    // Auth guard — verify authenticated admin session
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Permission guard — require manage_admins permission
    const permDenied = await requirePermission(request, 'manage_admins');
    if (permDenied instanceof NextResponse) return permDenied;

    // Get authenticated admin ID from headers (NOT from request body)
    const adminId = request.headers.get('x-admin-id')!;
    const requester = await db.user.findUnique({ where: { id: adminId } });
    if (!requester || requester.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Akses ditolak — hanya super admin' }, { status: 403 });
    }

    const body = await request.json();
    const { name, pin, permissions: customPermissions } = body;

    if (!name || !pin) {
      return NextResponse.json({ success: false, error: 'Nama dan PIN wajib diisi' }, { status: 400 });
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ success: false, error: 'PIN harus 6 digit angka' }, { status: 400 });
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Nama minimal 2 karakter' }, { status: 400 });
    }

    const emailVal = `${name.trim().toLowerCase().replace(/\s+/g, '_')}@idm.id`;

    // Check duplicate name among admins only
    const existingAdmin = await db.user.findFirst({
      where: {
        name: name.trim(),
        role: { in: ['admin', 'super_admin'] }
      }
    });
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: 'Nama admin sudah digunakan' }, { status: 409 });
    }

    const hash = await hashPin(pin);
    const permissions = JSON.stringify({ ...DEFAULT_PERMISSIONS, ...customPermissions });

    const admin = await db.user.create({
      data: {
        name: name.trim(),
        email: emailVal,
        gender: 'male',
        role: 'admin',
        adminPass: hash,
        permissions,
        isAdmin: true,
        tier: 'S',
      },
      select: { id: true, name: true, email: true, role: true, permissions: true, createdAt: true },
    });

    return NextResponse.json({
      success: true,
      admin: { ...admin, permissions: JSON.parse(admin.permissions) },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ADMIN CREATE] Error:', msg);
    if (msg.includes('Unique')) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Gagal menambah admin' }, { status: 500 });
  }
}

// PUT - Update admin permissions or PIN (super_admin only)
export async function PUT(request: NextRequest) {
  try {
    // Auth guard — verify authenticated admin session
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Permission guard — require manage_admins permission
    const permDenied = await requirePermission(request, 'manage_admins');
    if (permDenied instanceof NextResponse) return permDenied;

    // Get authenticated admin ID from headers (NOT from request body)
    const adminId = request.headers.get('x-admin-id')!;
    const requester = await db.user.findUnique({ where: { id: adminId } });
    if (!requester || requester.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Akses ditolak — hanya super admin' }, { status: 403 });
    }

    const body = await request.json();
    const { targetAdminId, permissions: newPermissions, newPin } = body;

    if (!targetAdminId) {
      return NextResponse.json({ success: false, error: 'targetAdminId wajib diisi' }, { status: 400 });
    }

    // Prevent modifying own role (safety)
    if (targetAdminId === adminId) {
      return NextResponse.json({ success: false, error: 'Tidak bisa mengubah akun sendiri dari sini' }, { status: 400 });
    }

    const target = await db.user.findUnique({ where: { id: targetAdminId } });
    if (!target || target.role === 'super_admin') {
      return NextResponse.json({ success: false, error: 'Admin tidak ditemukan atau tidak bisa diubah' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (newPermissions) {
      updateData.permissions = JSON.stringify(newPermissions);
    }
    if (newPin) {
      // Validate PIN format (6 digits)
      if (!/^\d{6}$/.test(newPin)) {
        return NextResponse.json({ success: false, error: 'PIN harus 6 digit angka' }, { status: 400 });
      }
      const hash = await hashPin(newPin);
      updateData.adminPass = hash;
    }

    const updated = await db.user.update({
      where: { id: targetAdminId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, permissions: true },
    });

    return NextResponse.json({
      success: true,
      admin: { ...updated, permissions: JSON.parse(updated.permissions || '{}') },
    });
  } catch (error) {
    console.error('[ADMIN UPDATE] Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengupdate admin' }, { status: 500 });
  }
}

// DELETE - Remove admin (super_admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Auth guard — verify authenticated admin session
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Permission guard — require manage_admins permission
    const permDenied = await requirePermission(request, 'manage_admins');
    if (permDenied instanceof NextResponse) return permDenied;

    // Get authenticated admin ID from headers (NOT from query params)
    const adminId = request.headers.get('x-admin-id')!;
    const requester = await db.user.findUnique({ where: { id: adminId } });
    if (!requester || requester.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Akses ditolak — hanya super admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'targetId wajib diisi' }, { status: 400 });
    }

    if (targetId === adminId) {
      return NextResponse.json({ success: false, error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
    }

    const target = await db.user.findUnique({ where: { id: targetId } });
    if (!target || target.role === 'super_admin') {
      return NextResponse.json({ success: false, error: 'Tidak bisa menghapus super admin' }, { status: 400 });
    }

    await db.user.delete({ where: { id: targetId } });

    return NextResponse.json({ success: true, message: `Admin "${target.name}" berhasil dihapus` });
  } catch (error) {
    console.error('[ADMIN DELETE] Error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus admin' }, { status: 500 });
  }
}
