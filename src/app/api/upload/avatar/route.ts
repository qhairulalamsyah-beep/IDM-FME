import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB for avatars

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

    // ── Upload to Supabase Storage (production) ──
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
      } catch (error) {
        console.error('[AVATAR UPLOAD] Supabase storage error, falling back to local:', error);
        // Fall through to local upload
      }
    }

    // ── Local file upload (development / fallback) ──
    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const publicUrl = `/uploads/avatars/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
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
