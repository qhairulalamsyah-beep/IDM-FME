/**
 * Client-side helper: wraps fetch() to include admin auth headers.
 * Supports both JWT token (preferred) and legacy ID+Hash (backward compatible).
 *
 * Usage:
 *   import { adminFetch } from '@/lib/admin-fetch';
 *   const res = await adminFetch('/api/tournaments', { method: 'POST', body: ... });
 */

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

export function adminFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const adminHeaders = getAdminAuthHeaders();
  if (Object.keys(adminHeaders).length === 0) {
    // No auth available — still send request, let server return 401
    // Only log at debug level since this is expected for non-authenticated requests
  }

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
  }).then((response) => {
    // If 401 Unauthorized, clear admin auth and dispatch event
    // BUT only if the user was actually logged in before this request
    if (response.status === 401) {
      const wasLoggedIn = localStorage.getItem('idm_admin_auth') === 'true';
      if (wasLoggedIn) {
        clearAdminAuth();
      }
    }
    return response;
  });
}
