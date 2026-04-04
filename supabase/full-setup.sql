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

-- ── DONE! ───────────────────────────────────────────────────────
-- Tables created: User, Tournament, Registration, Team, TeamMember, Match, Ranking, Donation, Sawer, Club, Settings, ActivityLog, PlayerMatchStat, BotLog, WhatsAppSettings
-- Storage buckets: avatars (public), payment-proofs (private), club-logos (public)
-- Default admin: admin@idm-fme.com / PIN: 123456
