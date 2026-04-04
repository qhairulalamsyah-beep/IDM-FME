import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

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

    // ── Try Supabase Storage ──
    if (isStorageConfigured()) {
      try {
        const result = await uploadToStorage('avatars', file);
        return NextResponse.json({
          success: true,
          url: result.url,
          filename: result.path,
          size: result.size,
          type: file.type,
          storage: 'supabase',
        });
      } catch (storageError) {
        const msg = storageError instanceof Error ? storageError.message : String(storageError);
        console.error('[AVATAR UPLOAD] Supabase error:', msg);

        // On production, don't fall through to local — Supabase is the only option
        if (IS_PRODUCTION) {
          if (msg.includes('JWT') || msg.includes('invalid compact') || msg.includes('jws') || msg.includes('token')) {
            return NextResponse.json(
              {
                success: false,
                error: 'Upload gagal: SUPABASE_SERVICE_ROLE_KEY tidak valid atau belum di-set.',
                hint: 'Admin perlu mengatur Environment Variable SUPABASE_SERVICE_ROLE_KEY di Vercel.',
              },
              { status: 503 },
            );
          }
          return NextResponse.json(
            { success: false, error: `Upload gagal: ${msg}` },
            { status: 500 },
          );
        }

        // On development, fall through to local upload
        console.warn('[AVATAR UPLOAD] Falling back to local upload');
      }
    }

    // ── Local file upload (development only) ──
    if (IS_PRODUCTION) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upload gagal: Supabase Storage belum dikonfigurasi.',
          hint: 'Admin perlu mengatur Environment Variables di Vercel: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY',
        },
        { status: 503 },
      );
    }

    // Local upload (dev only)
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
    console.error('[AVATAR UPLOAD] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupload gambar' },
      { status: 500 },
    );
  }
}
