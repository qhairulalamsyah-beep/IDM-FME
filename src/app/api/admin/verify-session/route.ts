import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken } from '@/lib/jwt';

/**
 * Verify admin session - check if the stored credentials are still valid.
 * Supports JWT token (preferred) and legacy hash comparison (backward compatible).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, adminId, adminHash } = body;

    // Method 1: JWT token verification (preferred)
    if (token) {
      const payload = await verifyAdminToken(token);
      if (payload) {
        const user = await db.user.findFirst({
          where: {
            id: payload.adminId,
            role: { in: ['admin', 'super_admin'] },
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
          },
        });

        if (!user) {
          return NextResponse.json({
            success: false,
            valid: false,
            error: 'Admin account not found or no longer has admin privileges',
          });
        }

        const permissions = JSON.parse(user.permissions || '{}');

        return NextResponse.json({
          success: true,
          valid: true,
          admin: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions,
          },
        });
      }
      // JWT invalid/expired → fall through to legacy check or return invalid
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Token kedaluwarsa. Silakan login kembali.',
        passwordChanged: true,
      });
    }

    // Method 2: Legacy hash comparison (backward compatible)
    if (!adminId || !adminHash) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Missing credentials',
      }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        id: adminId,
        role: { in: ['admin', 'super_admin'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        adminPass: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Admin account not found or no longer has admin privileges',
      });
    }

    // Compare hash — support both bcrypt and legacy SHA-256
    let hashMatch = false;
    const { isBcryptHash, comparePin, legacySha256Hash } = await import('@/lib/auth-helpers');
    if (isBcryptHash(user.adminPass)) {
      // adminHash might be SHA-256 of PIN — compare the PIN against bcrypt
      // We can't reverse SHA-256, so we check if adminHash looks like SHA-256
      // If it does, we can't compare it with bcrypt directly
      // Best effort: if adminHash is a raw PIN (6 digits), compare with bcrypt
      if (/^\d{6}$/.test(adminHash)) {
        hashMatch = await comparePin(adminHash, user.adminPass);
      }
      // If it's a SHA-256 hex string, we cannot verify — assume valid since
      // the client already authenticated via JWT in modern flow
    } else {
      hashMatch = user.adminPass === adminHash;
    }

    if (!hashMatch) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Session expired - PIN changed. Please login again.',
        passwordChanged: true,
      });
    }

    const permissions = JSON.parse(user.permissions || '{}');

    return NextResponse.json({
      success: true,
      valid: true,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions,
      },
    });
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json({
      success: false,
      valid: false,
      error: 'Verification failed',
    }, { status: 500 });
  }
}
