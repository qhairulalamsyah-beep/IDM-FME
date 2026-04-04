/**
 * Client-side helper: wraps fetch() to include admin auth headers.
 * Reads admin credentials from localStorage (same values used by Zustand store).
 *
 * Usage:
 *   import { adminFetch } from '@/lib/admin-fetch';
 *   const res = await adminFetch('/api/tournaments', { method: 'POST', body: ... });
 */

export function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const isAuth = localStorage.getItem('idm_admin_auth');
    const raw = localStorage.getItem('idm_admin_user');
    const hash = localStorage.getItem('idm_admin_hash');

    if (isAuth !== 'true') {
      return {};
    }

    if (!raw) {
      return {};
    }

    const user = JSON.parse(raw);
    if (!user?.id) {
      return {};
    }

    if (!hash) {
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
 * Check if admin is currently authenticated (has valid localStorage data)
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isAuth = localStorage.getItem('idm_admin_auth') === 'true';
    const raw = localStorage.getItem('idm_admin_user');
    const hash = localStorage.getItem('idm_admin_hash');
    return isAuth && !!raw && !!hash;
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

  // Dispatch custom event so store can react
  window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: { authenticated: false } }));
}

export function adminFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const adminHeaders = getAdminAuthHeaders();

  // Build headers object properly
  const headers: Record<string, string> = {};

  // Add existing headers first
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.entries(existingHeaders).forEach(([key, value]) => {
      headers[key] = value;
    });
  }

  // Add admin headers if not present
  if (!headers['x-admin-id'] && adminHeaders['x-admin-id']) {
    headers['x-admin-id'] = adminHeaders['x-admin-id'];
  }
  if (!headers['x-admin-hash'] && adminHeaders['x-admin-hash']) {
    headers['x-admin-hash'] = adminHeaders['x-admin-hash'];
  }

  return fetch(url, {
    ...options,
    headers,
  }).then((response) => {
    // If 401 Unauthorized, clear admin auth and dispatch event
    if (response.status === 401) {
      clearAdminAuth();
    }
    return response;
  });
}
