-- ============================================
-- IDM-FME Supabase Database Setup
-- ============================================
-- Run this in the Supabase SQL Editor to:
-- 1. Enable required extensions
-- 2. Create storage buckets
-- 3. Set up Row Level Security (RLS) policies
-- 4. Create a broadcast function for Realtime
-- ============================================

-- ── 1. Enable Extensions ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Create Storage Buckets ───────────────────────────────────
-- Note: These can also be created via Supabase Dashboard → Storage

-- Avatars bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Payment proofs bucket (private — admin only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Club logos bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('club-logos', 'club-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ── 3. Storage Policies ─────────────────────────────────────────

-- Avatars: anyone can read, authenticated (service_role) can upload
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated delete avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');

-- Payment proofs: no public read, admin upload/delete
CREATE POLICY "No public read proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs' AND auth.role() = 'service_role');

CREATE POLICY "Admin upload proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Admin delete proofs" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment-proofs');

-- Club logos: anyone can read, admin can upload/delete
CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'club-logos');

CREATE POLICY "Authenticated upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'club-logos');

CREATE POLICY "Authenticated delete logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'club-logos');

-- ── 4. Realtime Broadcast Function ─────────────────────────────
-- This function allows server-side broadcast via Supabase Realtime

CREATE OR REPLACE FUNCTION broadcast(channel text, event text, payload jsonb)
RETURNS void AS $$
DECLARE
  _pg_notify_result boolean;
BEGIN
  PERFORM pg_notify(
    'realtime:' || channel,
    json_build_object(
      'event', event,
      'payload', payload,
      'channel', channel
    )::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. RPC wrapper for REST API broadcast ──────────────────────
CREATE OR REPLACE FUNCTION rpc_broadcast(channel text, event text, payload jsonb)
RETURNS void AS $$
BEGIN
  PERFORM broadcast(channel, event, payload);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. Create Supabase Auth trigger for new user ────────────────
-- When a new user signs up via Supabase Auth, create a matching User record

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, name, email, gender, tier, points, role, "isAdmin", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
    COALESCE(NEW.raw_user_meta_data->>'tier', 'B'),
    0,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Done! ──────────────────────────────────────────────────────
-- After running this script:
-- 1. Run `npx prisma db push` to sync Prisma schema
-- 2. Verify storage buckets in Supabase Dashboard
-- 3. Test Realtime broadcast in the SQL Editor:
--    SELECT broadcast('global-updates', 'test', '{"message": "Hello!"}'::jsonb);
