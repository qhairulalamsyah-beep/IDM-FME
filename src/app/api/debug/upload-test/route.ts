import { NextRequest, NextResponse } from 'next/server';
import { uploadToStorage, isStorageConfigured } from '@/lib/storage';

// GET - Check storage configuration status
export async function GET() {
  const config = isStorageConfigured();
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET ✅' : 'NOT SET ❌',
    NEXT_PUBLIC_SUPABASE_URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `SET ✅ (length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : 'NOT SET ❌',
    SUPABASE_LOGO_BUCKET: process.env.SUPABASE_LOGO_BUCKET || '(default: club-logos)',
  };

  return NextResponse.json({
    success: true,
    storageConfigured: config,
    env,
  });
}

// POST - Test upload without auth (temporary diagnostic)
export async function POST(request: NextRequest) {
  try {
    if (!isStorageConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Storage not configured',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
        },
      }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_LOGO_BUCKET || 'club-logos';

    // Step 1: Test connection to Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const healthRes = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
      headers: { Authorization: `Bearer ${serviceRoleKey}` },
    });

    const bucketInfo = healthRes.ok ? await healthRes.json().catch(() => null) : null;

    // Step 2: Try actual upload
    const uploadResult = await uploadToStorage(bucket, file);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      path: uploadResult.path,
      size: uploadResult.size,
      storage: 'supabase',
      bucket,
      bucketExists: !!bucketInfo,
      bucketPublic: bucketInfo?.public ?? 'unknown',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    // Determine specific error type
    let specificError = msg;
    let hint = '';

    if (msg.includes('not found') || msg.includes('does not exist') || msg.includes('Could not find')) {
      specificError = `Bucket "${process.env.SUPABASE_LOGO_BUCKET || 'club-logos'}" tidak ditemukan`;
      hint = 'Buat bucket di: Supabase Dashboard → Storage → New Bucket → Nama: club-logos → Public: ON';
    } else if (msg.includes('JWT') || msg.includes('token') || msg.includes('invalid api key')) {
      specificError = 'SUPABASE_SERVICE_ROLE_KEY tidak valid';
      hint = 'Copy dari: Supabase Dashboard → Settings → API → service_role key';
    } else if (msg.includes('policy') || msg.includes('permission') || msg.includes('RLS') || msg.includes('Forbidden')) {
      specificError = 'Tidak punya akses upload ke bucket';
      hint = 'Pastikan bucket PUBLIC dan cek Storage Policies';
    } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
      specificError = 'Tidak bisa terhubung ke Supabase Storage';
      hint = 'Cek NEXT_PUBLIC_SUPABASE_URL';
    }

    return NextResponse.json({
      success: false,
      error: specificError,
      detail: msg,
      hint,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
        bucket: process.env.SUPABASE_LOGO_BUCKET || 'club-logos',
      },
    }, { status: 500 });
  }
}
