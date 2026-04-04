import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format file harus JPG, PNG, WebP, atau GIF' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file maksimal 5MB' },
        { status: 400 },
      );
    }

    // ── Check storage configuration ──
    if (!isStorageConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Storage belum dikonfigurasi. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah di-set di Environment Variables.',
          hint: 'SUPABASE_SERVICE_ROLE_KEY bisa didapat dari Supabase Dashboard → project → Settings → API → service_role key',
        },
        { status: 503 },
      );
    }

    // ── Upload to Supabase Storage ──
    const bucket = process.env.SUPABASE_LOGO_BUCKET || 'club-logos';

    try {
      const result = await uploadToStorage(bucket, file);
      return NextResponse.json({
        success: true,
        url: result.url,
        filename: result.path,
        size: result.size,
        originalSize: file.size,
        type: file.type,
        storage: 'supabase',
        bucket,
      });
    } catch (storageError) {
      const msg = storageError instanceof Error ? storageError.message : String(storageError);
      console.error('[LOGO UPLOAD] Storage error:', msg);

      // Provide helpful error messages
      if (msg.includes('not found') || msg.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: `Bucket "${bucket}" tidak ditemukan. Buat bucket "${bucket}" di Supabase Dashboard → Storage → New Bucket, lalu set Public.`,
            detail: msg,
          },
          { status: 400 },
        );
      }

      if (msg.includes('JWT') || msg.includes('token') || msg.includes('auth') || msg.includes('API key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'SUPABASE_SERVICE_ROLE_KEY tidak valid. Pastikan key sudah benar di Environment Variables.',
            detail: msg,
          },
          { status: 401 },
        );
      }

      if (msg.includes('policy') || msg.includes('RLS') || msg.includes('permission')) {
        return NextResponse.json(
          {
            success: false,
            error: `Tidak punya akses upload ke bucket "${bucket}". Set bucket sebagai PUBLIC di Supabase Storage.`,
            detail: msg,
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Gagal upload ke storage: ${msg}`,
          detail: msg,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[LOGO UPLOAD] Error:', msg);
    return NextResponse.json({ success: false, error: `Upload gagal: ${msg}` }, { status: 500 });
  }
}
