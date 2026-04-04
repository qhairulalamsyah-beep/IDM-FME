/**
 * Client-side helper: wraps fetch() to include admin auth headers.
 * Supports both JWT token (preferred) and legacy ID+Hash (backward compatible).
 *
 * Includes automatic re-authentication: when a 401 is received and the user
 * was logged in, a reauth modal is triggered. If re-auth succeeds, the
 * original request is retried with the new JWT token.
 *
 * Usage:
 *   import { adminFetch } from '@/lib/admin-fetch';
 *   const res = await adminFetch('/api/tournaments', { method: 'POST', body: ... });
 */

// ═══════════════════════════════════════════════════════════
// Re-authentication state management
// ═══════════════════════════════════════════════════════════

let pendingReauthPromise: Promise<boolean> | null = null;
let pendingReauthResolve: ((success: boolean) => void) | null = null;

/**
 * Trigger re-authentication flow. Shows a modal for the user to enter their PIN.
 * Multiple concurrent 401s share the same promise to avoid duplicate modals.
 */
function triggerReauth(): Promise<boolean> {
  if (pendingReauthPromise) return pendingReauthPromise;

  pendingReauthPromise = new Promise<boolean>((resolve) => {
    pendingReauthResolve = resolve;
    // Dispatch event to show ReAuthModal
    window.dispatchEvent(new CustomEvent('admin-reauth-required'));
  });

  return pendingReauthPromise;
}

/**
 * Called by ReAuthModal when re-auth succeeds or fails.
 */
export function resolveReauth(success: boolean): void {
  if (pendingReauthResolve) {
    pendingReauthResolve(success);
    pendingReauthResolve = null;
    pendingReauthPromise = null;
  }
}

/**
 * Cancel pending re-auth (e.g. when user closes the modal without entering PIN).
 */
export function cancelReauth(): void {
  resolveReauth(false);
}

// ═══════════════════════════════════════════════════════════
// Auth helpers
// ═══════════════════════════════════════════════════════════

export function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const isAuth = localStorage.getItem('idm_admin_auth');
    if (isAuth !== 'true') {
      return {};
    }

    // Method 1: JWT token (preferred)
    const token = localStorage.getItem('idm_admin_token');
    if (token) {
      return { 'x-admin-token': token };
    }

    // Method 2: Legacy ID + Hash (backward compatible)
    const raw = localStorage.getItem('idm_admin_user');
    const hash = localStorage.getItem('idm_admin_hash');

    if (!raw || !hash) {
      return {};
    }

    const user = JSON.parse(raw);
    if (!user?.id) {
      return {};
    }

    return {
      'x-admin-id': user.id,
      'x-admin-hash': hash,
    };
  } catch (err) {
    console.error('[adminFetch] Error getting auth headers:', err);
    return {};
  }
}

/**
 * Check if admin is currently authenticated
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isAuth = localStorage.getItem('idm_admin_auth') === 'true';
    if (!isAuth) return false;

    // Check for JWT token or legacy hash
    const token = localStorage.getItem('idm_admin_token');
    const hash = localStorage.getItem('idm_admin_hash');
    return !!(token || hash);
  } catch {
    return false;
  }
}

/**
 * Clear admin auth from localStorage and dispatch logout event
 */
export function clearAdminAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('idm_admin_auth');
  localStorage.removeItem('idm_admin_user');
  localStorage.removeItem('idm_admin_hash');
  localStorage.removeItem('idm_admin_token');

  // Dispatch custom event so store can react
  window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: { authenticated: false } }));
}

// ═══════════════════════════════════════════════════════════
// Main adminFetch with auto re-auth and retry
// ═══════════════════════════════════════════════════════════

export function adminFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const adminHeaders = getAdminAuthHeaders();

  // Build headers object
  const headers: Record<string, string> = {};

  // Add existing headers first
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.entries(existingHeaders).forEach(([key, value]) => {
      headers[key] = value;
    });
  }

  // Add admin auth headers (JWT token takes priority over legacy)
  if (adminHeaders['x-admin-token']) {
    headers['x-admin-token'] = adminHeaders['x-admin-token'];
  } else {
    if (!headers['x-admin-id'] && adminHeaders['x-admin-id']) {
      headers['x-admin-id'] = adminHeaders['x-admin-id'];
    }
    if (!headers['x-admin-hash'] && adminHeaders['x-admin-hash']) {
      headers['x-admin-hash'] = adminHeaders['x-admin-hash'];
    }
  }

  return fetch(url, {
    ...options,
    headers,
  }).then(async (response) => {
    // If 401 Unauthorized and user was logged in, try re-auth + retry
    if (response.status === 401) {
      const wasLoggedIn = localStorage.getItem('idm_admin_auth') === 'true';
      if (wasLoggedIn) {
        // Don't clear auth immediately — try re-auth first
        const reauthed = await triggerReauth();

        if (reauthed) {
          // Re-auth succeeded — retry the original request with new token
          const newHeaders = getAdminAuthHeaders();
          const retryHeaders: Record<string, string> = {};

          // Re-add original headers
          if (options.headers) {
            const existingHeaders = options.headers as Record<string, string>;
            Object.entries(existingHeaders).forEach(([key, value]) => {
              retryHeaders[key] = value;
            });
          }

          // Add new auth headers
          if (newHeaders['x-admin-token']) {
            retryHeaders['x-admin-token'] = newHeaders['x-admin-token'];
          } else if (newHeaders['x-admin-id']) {
            retryHeaders['x-admin-id'] = newHeaders['x-admin-id'];
            retryHeaders['x-admin-hash'] = newHeaders['x-admin-hash'];
          }

          return fetch(url, {
            ...options,
            headers: retryHeaders,
          });
        }

        // Re-auth failed — clear auth and dispatch logout
        clearAdminAuth();
      }
    }
    return response;
  });
}
