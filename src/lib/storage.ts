import { getConfig } from '@/lib/config'

/**
 * Upload a file to Supabase Storage using the REST API.
 *
 * Uses raw binary body (not FormData) — the officially documented approach.
 * See: https://supabase.com/docs/guides/storage/api#upload-file
 *
 * @param bucket - Storage bucket name (e.g., 'avatars', 'sources')
 * @param file - The file to upload
 * @param subPath - Optional subdirectory within the bucket
 * @returns Public URL and metadata of the uploaded file
 */
export async function uploadToStorage(
  bucket: string,
  file: File | Blob,
  subPath?: string
): Promise<{ url: string; path: string; size: number }> {
  const config = getConfig()

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase storage is not configured (missing URL or service role key)')
  }

  const ext = file instanceof File
    ? file.name.split('.').pop() || 'bin'
    : 'bin'

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const uniquePath = [subPath || '', fileName].filter(Boolean).join('/')

  // Convert file to ArrayBuffer for raw binary upload
  const fileBuffer = await file.arrayBuffer()

  // Supabase Storage REST API expects raw binary body with proper Content-Type
  // Do NOT use FormData — that sets multipart/form-data which the API doesn't handle correctly
  const response = await fetch(
    `${config.supabase.url}/storage/v1/object/${bucket}/${uniquePath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
        'Content-Type': file.type || 'application/octet-stream',
        // Prefer to overwrite if same path exists
        'x-upsert': 'true',
      },
      body: fileBuffer,
    }
  )

  if (!response.ok) {
    // Parse Supabase error response — format varies:
    // - { "statusCode": "4XX", "error": "...", "message": "..." }
    // - { "errorMsg": "..." }
    const errorBody = await response.json().catch(() => null)
    const errorMsg = errorBody?.error
      || errorBody?.message
      || errorBody?.errorMsg
      || response.statusText
      || `HTTP ${response.status}`

    // Map common errors to actionable messages
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Storage auth failed: ${errorMsg}. Check SUPABASE_SERVICE_ROLE_KEY.`)
    }
    if (errorMsg.includes('not found') || errorMsg.includes('does not exist') || errorMsg.includes('bucket')) {
      throw new Error(`Bucket "${bucket}" tidak ditemukan. Buat di Supabase Dashboard → Storage → New Bucket, set Public. Detail: ${errorMsg}`)
    }
    if (errorMsg.includes('policy') || errorMsg.includes('RLS') || errorMsg.includes('permission')) {
      throw new Error(`Tidak punya akses upload ke bucket "${bucket}". Set bucket sebagai PUBLIC. Detail: ${errorMsg}`)
    }
    if (errorMsg.includes('JWT') || errorMsg.includes('invalid compact') || errorMsg.includes('jws')) {
      throw new Error(`SUPABASE_SERVICE_ROLE_KEY tidak valid. Detail: ${errorMsg}`)
    }

    throw new Error(`Storage upload failed (${response.status}): ${errorMsg}`)
  }

  // Construct public URL for the uploaded file
  const publicUrl = `${config.supabase.url}/storage/v1/object/public/${bucket}/${uniquePath}`

  return {
    url: publicUrl,
    path: uniquePath,
    size: file.size,
  }
}

/**
 * Delete files from Supabase Storage.
 *
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths to delete
 */
export async function deleteFromStorage(
  bucket: string,
  paths: string[]
): Promise<void> {
  const config = getConfig()

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase storage is not configured')
  }

  const response = await fetch(
    `${config.supabase.url}/storage/v1/object/${bucket}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: paths }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const errorMsg = errorBody?.error || errorBody?.message || response.statusText
    throw new Error(`Storage delete failed: ${errorMsg}`)
  }
}

/**
 * Get a public URL for a Supabase Storage object.
 *
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @returns Public URL string
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  const config = getConfig()
  return `${config.supabase.url}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Check if Supabase Storage is configured (URL and service role key are set).
 */
export function isStorageConfigured(): boolean {
  const config = getConfig()
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey)
}
