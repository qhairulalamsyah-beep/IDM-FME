import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '@/lib/admin-guard';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB (before compression)

// Python image processor service URL
const IMAGE_PROCESSOR_URL = process.env.IMAGE_PROCESSOR_URL || 'http://localhost:5005';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
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
        { success: false, error: 'Only JPG, PNG, WebP, and GIF images are allowed' },
        { status: 400 },
      );
    }

    // Validate file size (before compression)
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be under 5MB' },
        { status: 400 },
      );
    }

    // ── Upload to Supabase Storage (production) ──
    if (isStorageConfigured()) {
      try {
        const result = await uploadToStorage('club-logos', file);
        return NextResponse.json({
          success: true,
          url: result.url,
          filename: result.path,
          size: result.size,
          originalSize: file.size,
          compressionRatio: file.size > 0 ? (result.size / file.size).toFixed(2) : '1.00',
          type: file.type,
          storage: 'supabase',
        });
      } catch (error) {
        console.error('[LOGO UPLOAD] Supabase storage error, falling back to local:', error);
        // Fall through to local upload
      }
    }

    // ── Local file upload (development / fallback) ──
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Send to Python image processor service if available
    try {
      const processorFormData = new FormData();
      processorFormData.append('file', file);

      const processorResponse = await fetch(
        `${IMAGE_PROCESSOR_URL}/process-and-save?folder=logos&max_width=512&quality=90`,
        { method: 'POST', body: processorFormData }
      );

      if (processorResponse.ok) {
        const result = await processorResponse.json();
        const sourcePath = result.filepath;
        const destFilename = result.filename;
        const destPath = path.join(UPLOAD_DIR, destFilename);
        const { copyFile } = await import('node:fs/promises');
        await copyFile(sourcePath, destPath);

        return NextResponse.json({
          success: true,
          url: `/uploads/logos/${destFilename}`,
          filename: destFilename,
          size: result.processed_size,
          originalSize: result.original_size,
          compressionRatio: result.compression_ratio,
          width: result.width,
          height: result.height,
          type: 'image/webp',
          storage: 'local',
        });
      }
    } catch {
      // Processor not available — fall through to direct save
    }

    // Direct file save (no compression)
    const bytes = await file.arrayBuffer();
    const ext = file.name.split('.').pop() || 'png';
    const uniqueName = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      url: `/uploads/logos/${uniqueName}`,
      filename: uniqueName,
      size: file.size,
      type: file.type,
      fallback: true,
      storage: 'local',
    });
  } catch (error) {
    console.error('[LOGO UPLOAD] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload logo' },
      { status: 500 },
    );
  }
}
