import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '@/lib/admin-guard';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';
import { getConfig } from '@/lib/config';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

    // On production, Supabase Storage is required (Vercel has read-only filesystem)
    if (IS_PRODUCTION && !isStorageConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upload gagal: Supabase Storage belum dikonfigurasi.',
          hint: 'Admin: Vercel → Settings → Environment Variables → tambahkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 503 },
      );
    }

    // ── Try Supabase Storage ──
    if (isStorageConfigured()) {
      const bucket = getConfig().supabase.logoBucket;

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

        // Map specific errors to user-friendly messages
        if (msg.includes('auth failed') || msg.includes('SERVICE_ROLE_KEY') || msg.includes('JWT') || msg.includes('invalid compact') || msg.includes('jws')) {
          return NextResponse.json(
            {
              success: false,
              error: 'SUPABASE_SERVICE_ROLE_KEY tidak valid atau belum di-set.',
              hint: 'Admin: Vercel → Settings → Environment Variables → tambahkan SUPABASE_SERVICE_ROLE_KEY (dari Supabase Dashboard → Settings → API → service_role key).',
              detail: msg,
            },
            { status: 503 },
          );
        }

        if (msg.includes('tidak ditemukan') || msg.includes('not found') || msg.includes('does not exist') || msg.includes('bucket')) {
          return NextResponse.json(
            {
              success: false,
              error: `Bucket "${bucket}" tidak ditemukan di Supabase.`,
              hint: `Admin: Supabase Dashboard → Storage → New Bucket → nama: "${bucket}", set Public.`,
              detail: msg,
            },
            { status: 503 },
          );
        }

        if (msg.includes('policy') || msg.includes('RLS') || msg.includes('permission')) {
          return NextResponse.json(
            {
              success: false,
              error: `Tidak punya akses upload ke bucket "${bucket}".`,
              hint: 'Admin: Supabase Dashboard → Storage → pilih bucket → Edit → toggle Public.',
              detail: msg,
            },
            { status: 403 },
          );
        }

        // On production, don't fall through to local upload
        if (IS_PRODUCTION) {
          return NextResponse.json(
            { success: false, error: `Upload gagal: ${msg}` },
            { status: 500 },
          );
        }

        // On development, fall through to local upload
        console.warn('[LOGO UPLOAD] Falling back to local upload due to:', msg);
      }
    }

    // ── Local file upload (development only) ──
    const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos');
    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      url: `/uploads/logos/${uniqueName}`,
      filename: uniqueName,
      size: file.size,
      originalSize: file.size,
      type: file.type,
      storage: 'local',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[LOGO UPLOAD] Unhandled error:', msg);
    return NextResponse.json({ success: false, error: `Upload gagal: ${msg}` }, { status: 500 });
  }
}
