import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken } from '@/lib/jwt';
import { comparePin, isBcryptHash, legacySha256Hash } from '@/lib/auth-helpers';

/**
 * Verify that the request comes from an authenticated admin.
 *
 * Supports two auth methods:
 *   1. JWT token (x-admin-token header) — preferred, new system
 *   2. Legacy ID+Hash (x-admin-id + x-admin-hash) — backward compatible
 *
 * Returns { admin } on success, or null on failure.
 */
export async function verifyAdmin(request: NextRequest): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
} | null> {
  try {
    // Method 1: JWT token (preferred)
    const token = request.headers.get('x-admin-token');
    if (token) {
      const payload = await verifyAdminToken(token);
      if (!payload) {
        return null;
      }

      const user = await db.user.findUnique({
        where: { id: payload.adminId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isAdmin: true,
        },
      });

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return null;
      }

      const permissions = JSON.parse(user.permissions || '{}');
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions,
      };
    }

    // Method 2: Legacy ID + Hash (backward compatible)
    const adminId = request.headers.get('x-admin-id');
    const adminHash = request.headers.get('x-admin-hash');

    if (!adminId || !adminHash) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isAdmin: true,
        adminPass: true,
      },
    });

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin') || !user.adminPass) {
      return null;
    }

    // Compare hash — support both bcrypt and legacy SHA-256
    let hashValid = false;
    if (isBcryptHash(user.adminPass)) {
      hashValid = await comparePin(adminHash, user.adminPass);
      // For legacy clients, adminHash is the raw PIN, so compare directly
      if (!hashValid && /^\d{6}$/.test(adminHash)) {
        hashValid = await comparePin(adminHash, user.adminPass);
      }
    } else {
      // Legacy SHA-256: adminHash might be the raw PIN or the SHA-256 hash
      const sha256OfInput = legacySha256Hash(adminHash);
      hashValid = user.adminPass === sha256OfInput;
    }

    if (!hashValid) {
      return null;
    }

    const permissions = JSON.parse(user.permissions || '{}');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
    };
  } catch (error) {
    // Avoid logging sensitive data (hashes, passwords) — log userId/role only if available
    console.error('[Admin Guard] Verification error');
    return null;
  }
}

/**
 * Middleware helper — call at the top of any admin-only API route handler.
 * Returns an error response if not admin, or null if authorized.
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<NextResponse | null> {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak. Hanya admin yang bisa melakukan tindakan ini.' },
      { status: 401 },
    );
  }
  return null;
}

/**
 * Check if admin has specific permission.
 * Super admin (by role) always has all permissions.
 */
export function hasPermission(
  permissions: Record<string, boolean>,
  permission: string,
): boolean {
  // Note: We no longer check permissions['super_admin'] from JSON —
  // super_admin status is determined by user.role in the database.
  return permissions[permission] === true;
}

/**
 * Require specific permission — returns error response if not authorized.
 * Also checks if user is super_admin (by role), which bypasses all permission checks.
 */
export async function requirePermission(
  request: NextRequest,
  permission: string,
): Promise<{ authorized: boolean; admin: Awaited<ReturnType<typeof verifyAdmin>> } | NextResponse> {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak. Silakan login kembali.' },
      { status: 401 },
    );
  }

  // Super admin bypasses all permission checks
  if (admin.role === 'super_admin') {
    return { authorized: true, admin };
  }

  if (!hasPermission(admin.permissions, permission)) {
    return NextResponse.json(
      { success: false, error: `Anda tidak memiliki izin untuk aksi ini (${permission})` },
      { status: 403 },
    );
  }

  return { authorized: true, admin };
}
