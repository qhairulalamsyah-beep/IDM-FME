/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window approach: tracks request timestamps per key,
 * allows up to `maxRequests` within `windowMs` milliseconds.
 *
 * Suitable for single-instance deployments (SQLite/dev).
 * For multi-instance, use Redis-backed rate limiting.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    // Remove timestamps older than 1 hour
    entry.timestamps = entry.timestamps.filter(t => now - t < 3600_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 5 * 60_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number; // ms until oldest request in window expires
}

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier (e.g., IP address, adminId)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult with allowed status and metadata
 */
export function rateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Filter out timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= maxRequests) {
    // Rate limited
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + windowMs - now,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: 0,
  };
}

/**
 * Get client IP from Next.js request.
 * Checks common proxy headers (X-Forwarded-For, X-Real-IP).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
