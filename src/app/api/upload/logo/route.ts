import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '@/lib/admin-guard';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos');
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

    // ── Try Supabase Storage first (production) ──
    if (isStorageConfigured()) {
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
        console.error('[LOGO UPLOAD] Supabase storage error:', msg);

        // Provide specific error messages for known issues
        if (msg.includes('not found') || msg.includes('does not exist')) {
          return NextResponse.json(
            {
              success: false,
              error: `Bucket "${bucket}" tidak ditemukan di Supabase. Buat bucket "${bucket}" di Supabase Dashboard → Storage → New Bucket, lalu set Public.`,
              detail: msg,
            },
            { status: 400 },
          );
        }

        if (msg.includes('JWT') || msg.includes('invalid compact') || msg.includes('jws') || msg.includes('token') || msg.includes('auth') || msg.includes('API key')) {
          return NextResponse.json(
            {
              success: false,
              error: 'SUPABASE_SERVICE_ROLE_KEY tidak valid atau belum di-set.',
              hint: 'Di Vercel: Settings → Environment Variables → tambahkan SUPABASE_SERVICE_ROLE_KEY (dari Supabase Dashboard → Settings → API → service_role key). Pastikan key lengkap, dimulai dengan "eyJ..."',
              detail: msg,
            },
            { status: 503 },
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

        // For other Supabase errors, fall through to local upload
        console.warn('[LOGO UPLOAD] Falling back to local upload due to:', msg);
      }
    } else {
      console.warn('[LOGO UPLOAD] Supabase not configured, using local upload');
    }

    // ── Local file upload (fallback / development) ──
    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const publicUrl = `/uploads/logos/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueName,
      size: file.size,
      originalSize: file.size,
      type: file.type,
      storage: 'local',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[LOGO UPLOAD] Error:', msg);
    return NextResponse.json({ success: false, error: `Upload gagal: ${msg}` }, { status: 500 });
  }
}
