import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getConfig } from '@/lib/config'

/**
 * Supabase server client — for use in API routes, Server Components, Server Actions.
 *
 * Automatically refreshes expired tokens via cookie-based session management.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getConfig().supabase.url,
    getConfig().supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from a Server Component.
            // This can be ignored if middleware refreshes sessions.
          }
        },
      },
    }
  )
}

/**
 * Supabase admin client — uses service_role key for backend operations
 * that bypass Row Level Security (RLS). Use ONLY in trusted server-side code.
 */
export function createAdminClient() {
  return createServerClient(
    getConfig().supabase.url,
    getConfig().supabase.serviceRoleKey,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
