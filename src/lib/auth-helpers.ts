import crypto from 'crypto';

import bcrypt from 'bcryptjs';

/**
 * Hash a PIN using bcrypt
 */
export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

/**
 * Compare a plaintext PIN against a bcrypt hash
 */
export async function comparePin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Verify if a hash is a bcrypt hash (starts with $2)
 * Used for migration from legacy SHA-256 hashes
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2');
}

/**
 * Legacy SHA-256 hash function for migration support
 */
export function legacySha256Hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
