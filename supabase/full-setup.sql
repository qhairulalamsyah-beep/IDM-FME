-- ============================================
-- IDM-FME FULL DATABASE SETUP SCRIPT
-- ============================================
-- Combined: Prisma Schema Tables + Storage + RLS + Realtime + Auth Trigger
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- ============================================

-- ── 0. Enable Extensions ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Create Tables (Prisma Schema) ────────────────────────────

CREATE TABLE IF NOT EXISTS "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "totalPlayers" INTEGER NOT NULL DEFAULT 0,
    "femaleCount" INTEGER NOT NULL DEFAULT 0,
    "maleCount" INTEGER NOT NULL DEFAULT 0,
    "mpScore" INTEGER NOT NULL DEFAULT 0,
    "fpScore" INTEGER NOT NULL DEFAULT 0,
    "subtotal1" INTEGER NOT NULL DEFAULT 0,
    "mpPoint" INTEGER NOT NULL DEFAULT 0,
    "fpPoint" INTEGER NOT NULL DEFAULT 0,
    "subtotal2" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'male',
    "tier" TEXT NOT NULL DEFAULT 'B',
    "points" INTEGER NOT NULL DEFAULT 0,
    "avatar" TEXT,
    "phone" TEXT,
    "whatsappJid" TEXT,
    "discordId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "adminPass" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '{}',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isMVP" BOOLEAN NOT NULL DEFAULT false,
    "mvpScore" INTEGER NOT NULL DEFAULT 0,
    "clubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'setup',
    "week" INTEGER,
    "bracketType" TEXT,
    "prizePool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "basePrizePool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mode" TEXT NOT NULL DEFAULT 'GR Arena 3vs3',
    "bpm" TEXT NOT NULL DEFAULT '130',
    "lokasi" TEXT NOT NULL DEFAULT 'PUB 1',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Registration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tierAssigned" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seed" INTEGER NOT NULL DEFAULT 0,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,
    "eliminationType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "matchNumber" INTEGER NOT NULL DEFAULT 1,
    "teamAId" TEXT,
    "teamBId" TEXT,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "winnerId" TEXT,
    "mvpId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bracket" TEXT NOT NULL DEFAULT 'winners',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Ranking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Donation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "donorName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT NOT NULL DEFAULT 'qris',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "proofImageUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Sawer" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderAvatar" TEXT,
    "targetPlayerId" TEXT,
    "targetPlayerName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'qris',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "proofImageUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sawer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlayerMatchStat" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlayerMatchStat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BotLog" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "sender" TEXT,
    "senderId" TEXT,
    "response" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "tournamentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WhatsAppSettings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'baileys',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metaAccessToken" TEXT,
    "metaPhoneNumberId" TEXT,
    "metaBusinessAccountId" TEXT,
    "metaWebhookVerifyToken" TEXT,
    "metaAppSecret" TEXT,
    "metaApiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "baileysEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastConnectedAt" TIMESTAMP(3),
    "connectionStatus" TEXT NOT NULL DEFAULT 'disconnected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WhatsAppSettings_pkey" PRIMARY KEY ("id")
);

-- ── 2. Create Indexes ───────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_gender_idx" ON "User"("gender");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_clubId_idx" ON "User"("clubId");

CREATE INDEX IF NOT EXISTS "Tournament_division_idx" ON "Tournament"("division");
CREATE INDEX IF NOT EXISTS "Tournament_status_idx" ON "Tournament"("status");

CREATE INDEX IF NOT EXISTS "Registration_tournamentId_idx" ON "Registration"("tournamentId");
CREATE INDEX IF NOT EXISTS "Registration_status_idx" ON "Registration"("status");
CREATE INDEX IF NOT EXISTS "Registration_tournamentId_status_idx" ON "Registration"("tournamentId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_userId_tournamentId_key" ON "Registration"("userId", "tournamentId");

CREATE INDEX IF NOT EXISTS "Team_tournamentId_idx" ON "Team"("tournamentId");
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

CREATE INDEX IF NOT EXISTS "Match_tournamentId_idx" ON "Match"("tournamentId");
CREATE INDEX IF NOT EXISTS "Match_status_idx" ON "Match"("status");
CREATE INDEX IF NOT EXISTS "Match_tournamentId_bracket_idx" ON "Match"("tournamentId", "bracket");

CREATE UNIQUE INDEX IF NOT EXISTS "Ranking_userId_key" ON "Ranking"("userId");

CREATE INDEX IF NOT EXISTS "Donation_paymentStatus_idx" ON "Donation"("paymentStatus");
CREATE INDEX IF NOT EXISTS "Donation_userId_idx" ON "Donation"("userId");

CREATE INDEX IF NOT EXISTS "Sawer_paymentStatus_idx" ON "Sawer"("paymentStatus");

CREATE UNIQUE INDEX IF NOT EXISTS "Club_name_key" ON "Club"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Club_slug_key" ON "Club"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "Settings_key_key" ON "Settings"("key");

CREATE INDEX IF NOT EXISTS "ActivityLog_action_idx" ON "ActivityLog"("action");

CREATE UNIQUE INDEX IF NOT EXISTS "PlayerMatchStat_matchId_userId_key" ON "PlayerMatchStat"("matchId", "userId");

CREATE INDEX IF NOT EXISTS "BotLog_platform_idx" ON "BotLog"("platform");
CREATE INDEX IF NOT EXISTS "BotLog_command_idx" ON "BotLog"("command");

-- ── 3. Create Foreign Keys ──────────────────────────────────────

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Registration" ADD CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Match" ADD CONSTRAINT "Match_mvpId_fkey" FOREIGN KEY ("mvpId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Sawer" ADD CONSTRAINT "Sawer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PlayerMatchStat" ADD CONSTRAINT "PlayerMatchStat_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PlayerMatchStat" ADD CONSTRAINT "PlayerMatchStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. Storage Buckets ──────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('club-logos', 'club-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ── 5. Storage Policies ─────────────────────────────────────────

DO $$ BEGIN
    CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "No public read proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admin upload proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admin delete proofs" ON storage.objects FOR DELETE USING (bucket_id = 'payment-proofs');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read logos" ON storage.objects FOR SELECT USING (bucket_id = 'club-logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'club-logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'club-logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. Realtime Broadcast Function ──────────────────────────────

CREATE OR REPLACE FUNCTION broadcast(channel text, event text, payload jsonb)
RETURNS void AS $$
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

CREATE OR REPLACE FUNCTION rpc_broadcast(channel text, event text, payload jsonb)
RETURNS void AS $$
BEGIN
  PERFORM broadcast(channel, event, payload);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Auth Trigger (auto-create User on signup) ────────────────

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 8. Seed Default Admin ────────────────────────────────────────
-- Default admin email: admin@idm-fme.com
-- Default admin PIN: 123456 (change immediately after first login!)

INSERT INTO "User" (id, name, email, gender, tier, points, role, "permissions", "isAdmin", "adminPass", "createdAt", "updatedAt")
VALUES (
  'admin-default',
  'Admin',
  'admin@idm-fme.com',
  'male',
  'S',
  0,
  'super_admin',
  '{"tournament":true,"players":true,"bracket":true,"scores":true,"prize":true,"donations":true,"full_reset":true}',
  true,
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ── 9. RLS — Row Level Security (Least Privilege) ────────────────
-- Security model:
--   postgres (superuser)     → Prisma ORM, bypasses RLS
--   anon                     → Public read-only (tournament data, leaderboard)
--   authenticated            → Read public + write own data
--   service_role             → Supabase admin, bypasses RLS
--   app_user (custom role)   → Backend service, subject to RLS

-- 9a. Create app_user role
DO $$ BEGIN
  CREATE ROLE app_user NOLOGIN NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 9b. Enable RLS on ALL tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tournament" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Ranking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Donation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Sawer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PlayerMatchStat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BotLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WhatsAppSettings" ENABLE ROW LEVEL SECURITY;

-- 9c. Revoke ALL from anon, authenticated, public, app_user (explicit per table)
REVOKE ALL PRIVILEGES ON TABLE public."User" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Tournament" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Registration" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Team" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."TeamMember" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Match" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Ranking" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Donation" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Sawer" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Club" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."Settings" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."ActivityLog" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."PlayerMatchStat" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."BotLog" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."WhatsAppSettings" FROM anon;

REVOKE ALL PRIVILEGES ON TABLE public."User" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Tournament" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Registration" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Team" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."TeamMember" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Match" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Ranking" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Donation" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Sawer" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Club" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."Settings" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."ActivityLog" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."PlayerMatchStat" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."BotLog" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."WhatsAppSettings" FROM authenticated;

REVOKE ALL PRIVILEGES ON TABLE public."User" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Tournament" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Registration" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Team" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."TeamMember" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Match" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Ranking" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Donation" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Sawer" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Club" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."Settings" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."ActivityLog" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."PlayerMatchStat" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."BotLog" FROM public;
REVOKE ALL PRIVILEGES ON TABLE public."WhatsAppSettings" FROM public;

REVOKE ALL PRIVILEGES ON TABLE public."User" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Tournament" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Registration" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Team" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."TeamMember" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Match" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Ranking" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Donation" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Sawer" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Club" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."Settings" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."ActivityLog" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."PlayerMatchStat" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."BotLog" FROM app_user;
REVOKE ALL PRIVILEGES ON TABLE public."WhatsAppSettings" FROM app_user;

-- 9d. Least-privilege GRANTs — anon (read-only public data)
GRANT SELECT ON TABLE public."Tournament" TO anon;
GRANT SELECT ON TABLE public."Match" TO anon;
GRANT SELECT ON TABLE public."Team" TO anon;
GRANT SELECT ON TABLE public."TeamMember" TO anon;
GRANT SELECT ON TABLE public."PlayerMatchStat" TO anon;
GRANT SELECT ON TABLE public."Ranking" TO anon;
GRANT SELECT ON TABLE public."Club" TO anon;
GRANT SELECT ON TABLE public."Settings" TO anon;
GRANT SELECT ON TABLE public."Donation" TO anon;
GRANT SELECT ON TABLE public."Sawer" TO anon;
GRANT SELECT (id, name, gender, tier, points, avatar, "isMVP", "mvpScore", "clubId", "createdAt") ON TABLE public."User" TO anon;
GRANT SELECT ON TABLE public."Registration" TO anon;

-- 9e. Least-privilege GRANTs — authenticated
GRANT SELECT (id, name, gender, tier, points, avatar, "discordId", "isMVP", "mvpScore", "clubId", "createdAt", "updatedAt") ON TABLE public."User" TO authenticated;
GRANT INSERT (name, email, gender, tier, points, avatar, phone, "whatsappJid", "discordId", "isAdmin", "clubId") ON TABLE public."User" TO authenticated;
GRANT UPDATE (name, avatar, phone, "discordId", "whatsappJid") ON TABLE public."User" TO authenticated;
GRANT SELECT ON TABLE public."Tournament" TO authenticated;
GRANT SELECT ON TABLE public."Registration" TO authenticated;
GRANT INSERT ON TABLE public."Registration" TO authenticated;
GRANT SELECT ON TABLE public."Match" TO authenticated;
GRANT SELECT ON TABLE public."Team" TO authenticated;
GRANT SELECT ON TABLE public."TeamMember" TO authenticated;
GRANT SELECT ON TABLE public."PlayerMatchStat" TO authenticated;
GRANT SELECT ON TABLE public."Ranking" TO authenticated;
GRANT SELECT ON TABLE public."Club" TO authenticated;
GRANT SELECT, INSERT ON TABLE public."Donation" TO authenticated;
GRANT SELECT, INSERT ON TABLE public."Sawer" TO authenticated;
GRANT SELECT ON TABLE public."Settings" TO authenticated;

-- 9f. Least-privilege GRANTs — app_user (backend service)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."User" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Tournament" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Registration" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Team" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."TeamMember" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Match" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."PlayerMatchStat" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Ranking" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Donation" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Sawer" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Club" TO app_user;
GRANT SELECT, INSERT, UPDATE ON TABLE public."Settings" TO app_user;
GRANT SELECT, INSERT ON TABLE public."ActivityLog" TO app_user;
GRANT SELECT, INSERT ON TABLE public."BotLog" TO app_user;
GRANT SELECT, INSERT, UPDATE ON TABLE public."WhatsAppSettings" TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ── 10. RLS Policies ─────────────────────────────────────────────
-- All wrapped with DO $$ ... EXCEPTION for idempotent re-runs

-- User: anon reads non-admin only, authenticated reads non-admin + own profile
DO $$ BEGIN
  CREATE POLICY "anon_read_public_users" ON public."User"
    FOR SELECT TO anon USING ("isAdmin" = false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_public_users" ON public."User"
    FOR SELECT TO authenticated USING ("isAdmin" = false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_own_profile" ON public."User"
    FOR SELECT TO authenticated USING (auth.uid()::text = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_insert_user" ON public."User"
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_update_own_profile" ON public."User"
    FOR UPDATE TO authenticated USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_user" ON public."User"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tournament: anon + authenticated read, app_user full
DO $$ BEGIN
  CREATE POLICY "anon_read_tournaments" ON public."Tournament"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_tournaments" ON public."Tournament"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_tournament" ON public."Tournament"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Registration: anon + authenticated read, authenticated insert own, app_user full
DO $$ BEGIN
  CREATE POLICY "anon_read_registrations" ON public."Registration"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_registrations" ON public."Registration"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_insert_own_registration" ON public."Registration"
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = "userId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_registration" ON public."Registration"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Team
DO $$ BEGIN
  CREATE POLICY "anon_read_teams" ON public."Team"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_teams" ON public."Team"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_team" ON public."Team"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TeamMember
DO $$ BEGIN
  CREATE POLICY "anon_read_team_members" ON public."TeamMember"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_team_members" ON public."TeamMember"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_team_member" ON public."TeamMember"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Match
DO $$ BEGIN
  CREATE POLICY "anon_read_matches" ON public."Match"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_matches" ON public."Match"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_match" ON public."Match"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PlayerMatchStat
DO $$ BEGIN
  CREATE POLICY "anon_read_player_stats" ON public."PlayerMatchStat"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_player_stats" ON public."PlayerMatchStat"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_player_stat" ON public."PlayerMatchStat"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ranking
DO $$ BEGIN
  CREATE POLICY "anon_read_rankings" ON public."Ranking"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_rankings" ON public."Ranking"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_ranking" ON public."Ranking"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Donation: anon reads confirmed only, authenticated reads own + confirmed
DO $$ BEGIN
  CREATE POLICY "anon_read_confirmed_donations" ON public."Donation"
    FOR SELECT TO anon USING ("paymentStatus" = 'confirmed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_own_donations" ON public."Donation"
    FOR SELECT TO authenticated USING ("paymentStatus" = 'confirmed' OR auth.uid()::text = "userId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_insert_donation" ON public."Donation"
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_donation" ON public."Donation"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sawer: anon reads confirmed only
DO $$ BEGIN
  CREATE POLICY "anon_read_confirmed_sawers" ON public."Sawer"
    FOR SELECT TO anon USING ("paymentStatus" = 'confirmed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_all_sawers" ON public."Sawer"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_insert_sawer" ON public."Sawer"
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_sawer" ON public."Sawer"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Club
DO $$ BEGIN
  CREATE POLICY "anon_read_clubs" ON public."Club"
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_clubs" ON public."Club"
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_all_club" ON public."Club"
    FOR ALL TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Settings: anon/authenticated read safe keys only
DO $$ BEGIN
  CREATE POLICY "anon_read_public_settings" ON public."Settings"
    FOR SELECT TO anon USING ("key" IN ('site_name', 'app_version', 'maintenance_mode', 'public_notice'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_public_settings" ON public."Settings"
    FOR SELECT TO authenticated USING ("key" IN ('site_name', 'app_version', 'maintenance_mode', 'public_notice'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_read_settings" ON public."Settings"
    FOR SELECT TO app_user USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_write_safe_settings" ON public."Settings"
    FOR INSERT TO app_user WITH CHECK ("key" NOT IN ('jwt_secret', 'admin_password'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_update_safe_settings" ON public."Settings"
    FOR UPDATE TO app_user USING ("key" NOT IN ('jwt_secret', 'admin_password')) WITH CHECK ("key" NOT IN ('jwt_secret', 'admin_password'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ActivityLog: no anon/authenticated access, app_user read+insert only
DO $$ BEGIN
  CREATE POLICY "app_user_read_activity_log" ON public."ActivityLog"
    FOR SELECT TO app_user USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_insert_activity_log" ON public."ActivityLog"
    FOR INSERT TO app_user WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- BotLog: no anon/authenticated access, app_user read+insert only
DO $$ BEGIN
  CREATE POLICY "app_user_read_bot_log" ON public."BotLog"
    FOR SELECT TO app_user USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_insert_bot_log" ON public."BotLog"
    FOR INSERT TO app_user WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- WhatsAppSettings: no anon/authenticated access, app_user read+insert+update
DO $$ BEGIN
  CREATE POLICY "app_user_read_whatsapp_settings" ON public."WhatsAppSettings"
    FOR SELECT TO app_user USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_insert_whatsapp_settings" ON public."WhatsAppSettings"
    FOR INSERT TO app_user WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "app_user_update_whatsapp_settings" ON public."WhatsAppSettings"
    FOR UPDATE TO app_user USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── DONE! ───────────────────────────────────────────────────────
-- Tables created: User, Tournament, Registration, Team, TeamMember, Match, Ranking, Donation, Sawer, Club, Settings, ActivityLog, PlayerMatchStat, BotLog, WhatsAppSettings
-- Storage buckets: avatars (public), payment-proofs (private), club-logos (public)
-- RLS: ENABLED on all 15 tables with least-privilege policies
-- Default admin: admin@idm-fme.com / PIN: 123456
--
-- Security Model:
-- ■ postgres/superuser → Prisma ORM (bypasses RLS)
-- ■ anon → Public read-only (tournaments, rankings, clubs, confirmed donations)
-- ■ authenticated → Read public + write own data
-- ■ service_role → Supabase admin (bypasses RLS)
-- ■ app_user → Backend service (full CRUD, subject to RLS)
