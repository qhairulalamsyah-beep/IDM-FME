'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase browser client — for use in Client Components and hooks.
 *
 * Reads auth tokens from cookies and handles automatic refresh.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
