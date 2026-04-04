import { getConfig } from '@/lib/config'

/**
 * Upload a file to Supabase Storage.
 *
 * @param bucket - Storage bucket name (e.g., 'avatars', 'payment-proofs', 'club-logos')
 * @param file - The file to upload
 * @param path - Optional subdirectory within the bucket
 * @returns Public URL of the uploaded file
 */
export async function uploadToStorage(
  bucket: string,
  file: File | Blob,
  path?: string
): Promise<{ url: string; path: string; size: number }> {
  const config = getConfig()

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase storage is not configured')
  }

  const ext = file instanceof File
    ? file.name.split('.').pop() || 'bin'
    : 'bin'

  const uniquePath = [
    path || '',
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
  ].filter(Boolean).join('/')

  // Use Supabase REST API for upload (server-side)
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${config.supabase.url}/storage/v1/object/${bucket}/${uniquePath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
        // Prefer upload via multipart if possible
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Storage upload failed: ${error.message || response.statusText}`)
  }

  // Construct public URL
  // Supabase Storage URL format: {supabase_url}/storage/v1/object/public/{bucket}/{path}
  const publicUrl = `${config.supabase.url.replace('/co', '/co')}/storage/v1/object/public/${bucket}/${uniquePath}`

  return {
    url: publicUrl,
    path: uniquePath,
    size: file.size,
  }
}

/**
 * Delete a file from Supabase Storage.
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
    const error = await response.json().catch(() => ({}))
    throw new Error(`Storage delete failed: ${error.message || response.statusText}`)
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
 * Check if Supabase Storage is configured and available.
 */
export function isStorageConfigured(): boolean {
  const config = getConfig()
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey)
}
