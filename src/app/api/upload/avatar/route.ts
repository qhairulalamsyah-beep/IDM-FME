import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getConfig } from '@/lib/config';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB for avatars

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 10 uploads per minute per IP (prevent abuse)
    const clientIp = getClientIp(request);
    const rl = rateLimit(`avatar-upload:${clientIp}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak upload. Coba lagi nanti.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.resetMs / 1000)),
          },
        },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Hanya file JPG, PNG, WebP, dan GIF yang diperbolehkan' },
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

    // ── Try Supabase Storage first ──
    if (isStorageConfigured()) {
      const bucket = getConfig().supabase.avatarBucket;

      try {
        const result = await uploadToStorage(bucket, file);
        return NextResponse.json({
          success: true,
          url: result.url,
          filename: result.path,
          size: result.size,
          type: file.type,
          storage: 'supabase',
          bucket,
        });
      } catch (storageError) {
        const msg = storageError instanceof Error ? storageError.message : String(storageError);
        console.error('[AVATAR UPLOAD] Supabase error:', msg);

        // On production, don't fall through to local — Supabase is the only option
        if (IS_PRODUCTION) {
          // Map specific errors to user-friendly messages
          if (msg.includes('auth failed') || msg.includes('SERVICE_ROLE_KEY')) {
            return NextResponse.json(
              {
                success: false,
                error: 'Upload gagal: SUPABASE_SERVICE_ROLE_KEY tidak valid atau belum di-set.',
                hint: 'Admin: Vercel → Settings → Environment Variables → tambahkan SUPABASE_SERVICE_ROLE_KEY.',
              },
              { status: 503 },
            );
          }
          if (msg.includes('tidak ditemukan') || msg.includes('not found') || msg.includes('does not exist')) {
            return NextResponse.json(
              {
                success: false,
                error: `Bucket "${bucket}" belum ada di Supabase Storage.`,
                hint: `Admin: Supabase Dashboard → Storage → New Bucket → nama: "${bucket}", set Public.`,
              },
              { status: 503 },
            );
          }
          if (msg.includes('RLS') || msg.includes('policy') || msg.includes('permission')) {
            return NextResponse.json(
              {
                success: false,
                error: `Bucket "${bucket}" belum diset Public.`,
                hint: 'Admin: Supabase Dashboard → Storage → pilih bucket → Edit → toggle Public.',
              },
              { status: 403 },
            );
          }

          // Generic error
          return NextResponse.json(
            { success: false, error: `Upload gagal: ${msg}` },
            { status: 500 },
          );
        }

        // On development, fall through to local upload
        console.warn('[AVATAR UPLOAD] Supabase failed, falling back to local upload:', msg);
      }
    }

    // ── Local file upload (development only) ──
    if (IS_PRODUCTION) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upload gagal: Supabase Storage belum dikonfigurasi.',
          hint: 'Admin: Vercel → Settings → Environment Variables → tambahkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 503 },
      );
    }

    const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      url: `/uploads/avatars/${uniqueName}`,
      filename: uniqueName,
      size: file.size,
      type: file.type,
      storage: 'local',
    });
  } catch (error) {
    console.error('[AVATAR UPLOAD] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupload gambar' },
      { status: 500 },
    );
  }
}
