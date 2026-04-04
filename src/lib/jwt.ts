import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'idm-fme-jwt-secret-change-in-production'
);

const JWT_EXPIRY = '24h'; // Token expires after 24 hours

export interface AdminJwtPayload {
  adminId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Create a JWT token for an authenticated admin session
 */
export async function createAdminToken(adminId: string, role: string): Promise<string> {
  return new SignJWT({ adminId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token and return the payload
 * Returns null if token is invalid or expired
 */
export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminJwtPayload;
  } catch {
    return null;
  }
}
