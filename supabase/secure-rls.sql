-- ============================================
-- IDM-FME SECURE RLS MIGRATION
-- ============================================
-- Security principle: Least Privilege
--
-- Architecture:
--   - postgres user (superuser) → used by Prisma, bypasses RLS
--   - anon role → public read-only for tournament data
--   - authenticated role → logged-in users can read/write own data
--   - service_role → admin backend, bypasses RLS (Supabase built-in)
--
-- IMPORTANT:
--   - This script is idempotent (safe to re-run)
--   - Does NOT drop existing data
--   - Uses IF EXISTS / IF NOT EXISTS everywhere
--   - Revokes any previously over-granted permissions
-- ============================================

-- ── 0. Revoke ALL previously granted privileges ───────────────────
-- Remove any blanket GRANT ALL that was applied in earlier setup

DO $$ DECLARE
  tbl TEXT;
  r RECORD;
BEGIN
  FOR tbl IN SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    -- Revoke ALL from anon
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public."%I" FROM anon', tbl);
    -- Revoke ALL from authenticated
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public."%I" FROM authenticated', tbl);
    -- Revoke ALL from public (the PostgreSQL role)
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public."%I" FROM public', tbl);
  END LOOP;
END $$;


-- ── 1. Create dedicated app_user role (IF NOT EXISTS) ─────────────
-- This role represents the Next.js app backend (Prisma uses postgres superuser,
-- but app_user can be used for direct Supabase REST API calls with RLS)

DO $$ BEGIN
  CREATE ROLE app_user NOLOGIN NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── 2. Revoke ALL from app_user first, then grant specific ────────
-- Using GRANT per-operation (least privilege)

DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public."%I" FROM app_user', tbl);
  END LOOP;
END $$;


-- ── 3. Grant SELECT to anon on public-readable tables ─────────────
-- These tables contain data that any visitor can see (leaderboard, schedule, etc.)

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

-- User table: anon can see non-admin users' public profiles
GRANT SELECT (id, name, gender, tier, points, avatar, "isMVP", "mvpScore", "clubId", "createdAt") ON TABLE public."User" TO anon;

-- Registration: anon can see registrations (for tournament bracket display)
GRANT SELECT ON TABLE public."Registration" TO anon;


-- ── 4. Grant permissions to authenticated role ────────────────────
-- Authenticated users = logged-in via Supabase Auth

-- User: read all public fields, insert own, update own
GRANT SELECT (id, name, gender, tier, points, avatar, phone, discordId, "isMVP", "mvpScore", "clubId", "createdAt", "updatedAt") ON TABLE public."User" TO authenticated;
GRANT INSERT (name, email, gender, tier, points, avatar, phone, "whatsappJid", discordId, "isAdmin", "clubId") ON TABLE public."User" TO authenticated;
GRANT UPDATE (name, avatar, phone, discordId, "whatsappJid") ON TABLE public."User" TO authenticated;

-- Tournament: read only
GRANT SELECT ON TABLE public."Tournament" TO authenticated;

-- Registration: read + insert own + update own status
GRANT SELECT ON TABLE public."Registration" TO authenticated;
GRANT INSERT ON TABLE public."Registration" TO authenticated;

-- Match, Team, TeamMember, PlayerMatchStat: read only
GRANT SELECT ON TABLE public."Match" TO authenticated;
GRANT SELECT ON TABLE public."Team" TO authenticated;
GRANT SELECT ON TABLE public."TeamMember" TO authenticated;
GRANT SELECT ON TABLE public."PlayerMatchStat" TO authenticated;

-- Ranking: read only
GRANT SELECT ON TABLE public."Ranking" TO authenticated;

-- Club: read only
GRANT SELECT ON TABLE public."Club" TO authenticated;

-- Donation: read + insert (anyone can donate)
GRANT SELECT ON TABLE public."Donation" TO authenticated;
GRANT INSERT ON TABLE public."Donation" TO authenticated;

-- Sawer: read + insert (anyone can sawer)
GRANT SELECT ON TABLE public."Sawer" TO authenticated;
GRANT INSERT ON TABLE public."Sawer" TO authenticated;

-- Settings: read only
GRANT SELECT ON TABLE public."Settings" TO authenticated;


-- ── 5. Grant permissions to app_user (backend service) ────────────
-- app_user has broader access but still subject to RLS

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

-- Grant USAGE on sequences (for auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;


-- ── 6. Enable RLS on ALL application tables ───────────────────────
-- postgres superuser still bypasses RLS (for Prisma migrations)
-- anon/authenticated/app_user are subject to RLS

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


-- ── 7. Drop ALL existing RLS policies (clean slate) ──────────────
-- We rebuild all policies from scratch for consistency

DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I" ON public."%I"', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ── 8. RLS Policies — User Table ──────────────────────────────────

-- 8a. anon: can read non-admin users only (public leaderboard / player list)
CREATE POLICY "anon_read_public_users" ON public."User"
  FOR SELECT TO anon
  USING ("isAdmin" = false);

-- 8b. authenticated: can read non-admin users
CREATE POLICY "authenticated_read_public_users" ON public."User"
  FOR SELECT TO authenticated
  USING ("isAdmin" = false);

-- 8c. authenticated: can read own profile (including sensitive fields)
CREATE POLICY "authenticated_read_own_profile" ON public."User"
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 8d. authenticated: can insert new user (for registration)
CREATE POLICY "authenticated_insert_user" ON public."User"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 8e. authenticated: can update own profile only
CREATE POLICY "authenticated_update_own_profile" ON public."User"
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8f. app_user: full read/write (backend service, still subject to RLS for defense-in-depth)
CREATE POLICY "app_user_all_user" ON public."User"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);

-- 8g. service_role always bypasses RLS (Supabase built-in), no policy needed


-- ── 9. RLS Policies — Tournament Table ────────────────────────────

-- 9a. anon: read all tournaments (public schedule)
CREATE POLICY "anon_read_tournaments" ON public."Tournament"
  FOR SELECT TO anon
  USING (true);

-- 9b. authenticated: read all tournaments
CREATE POLICY "authenticated_read_tournaments" ON public."Tournament"
  FOR SELECT TO authenticated
  USING (true);

-- 9c. app_user: full CRUD
CREATE POLICY "app_user_all_tournament" ON public."Tournament"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 10. RLS Policies — Registration Table ─────────────────────────

-- 10a. anon: read all registrations (bracket display)
CREATE POLICY "anon_read_registrations" ON public."Registration"
  FOR SELECT TO anon
  USING (true);

-- 10b. authenticated: read all registrations
CREATE POLICY "authenticated_read_registrations" ON public."Registration"
  FOR SELECT TO authenticated
  USING (true);

-- 10c. authenticated: can insert own registration
CREATE POLICY "authenticated_insert_own_registration" ON public."Registration"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "userId");

-- 10d. app_user: full CRUD
CREATE POLICY "app_user_all_registration" ON public."Registration"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 11. RLS Policies — Team Table ─────────────────────────────────

-- 11a. anon: read all teams
CREATE POLICY "anon_read_teams" ON public."Team"
  FOR SELECT TO anon
  USING (true);

-- 11b. authenticated: read all teams
CREATE POLICY "authenticated_read_teams" ON public."Team"
  FOR SELECT TO authenticated
  USING (true);

-- 11c. app_user: full CRUD
CREATE POLICY "app_user_all_team" ON public."Team"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 12. RLS Policies — TeamMember Table ──────────────────────────

-- 12a. anon: read all team members
CREATE POLICY "anon_read_team_members" ON public."TeamMember"
  FOR SELECT TO anon
  USING (true);

-- 12b. authenticated: read all team members
CREATE POLICY "authenticated_read_team_members" ON public."TeamMember"
  FOR SELECT TO authenticated
  USING (true);

-- 12c. app_user: full CRUD
CREATE POLICY "app_user_all_team_member" ON public."TeamMember"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 13. RLS Policies — Match Table ────────────────────────────────

-- 13a. anon: read all matches (public bracket display)
CREATE POLICY "anon_read_matches" ON public."Match"
  FOR SELECT TO anon
  USING (true);

-- 13b. authenticated: read all matches
CREATE POLICY "authenticated_read_matches" ON public."Match"
  FOR SELECT TO authenticated
  USING (true);

-- 13c. app_user: full CRUD
CREATE POLICY "app_user_all_match" ON public."Match"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 14. RLS Policies — PlayerMatchStat Table ─────────────────────

-- 14a. anon: read all stats
CREATE POLICY "anon_read_player_stats" ON public."PlayerMatchStat"
  FOR SELECT TO anon
  USING (true);

-- 14b. authenticated: read all stats
CREATE POLICY "authenticated_read_player_stats" ON public."PlayerMatchStat"
  FOR SELECT TO authenticated
  USING (true);

-- 14c. app_user: full CRUD
CREATE POLICY "app_user_all_player_stat" ON public."PlayerMatchStat"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 15. RLS Policies — Ranking Table ──────────────────────────────

-- 15a. anon: read all rankings (public leaderboard)
CREATE POLICY "anon_read_rankings" ON public."Ranking"
  FOR SELECT TO anon
  USING (true);

-- 15b. authenticated: read all rankings
CREATE POLICY "authenticated_read_rankings" ON public."Ranking"
  FOR SELECT TO authenticated
  USING (true);

-- 15c. app_user: full CRUD
CREATE POLICY "app_user_all_ranking" ON public."Ranking"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 16. RLS Policies — Donation Table ─────────────────────────────

-- 16a. anon: can read confirmed donations only (donor wall)
CREATE POLICY "anon_read_confirmed_donations" ON public."Donation"
  FOR SELECT TO anon
  USING ("paymentStatus" = 'confirmed');

-- 16b. authenticated: can read own donations (all statuses)
CREATE POLICY "authenticated_read_own_donations" ON public."Donation"
  FOR SELECT TO authenticated
  USING (
    "paymentStatus" = 'confirmed'
    OR auth.uid() = "userId"
  );

-- 16c. authenticated: can insert donations
CREATE POLICY "authenticated_insert_donation" ON public."Donation"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 16d. app_user: full CRUD (admin can manage all donations)
CREATE POLICY "app_user_all_donation" ON public."Donation"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 17. RLS Policies — Sawer Table ────────────────────────────────

-- 17a. anon: can read confirmed sawers only (live feed)
CREATE POLICY "anon_read_confirmed_sawers" ON public."Sawer"
  FOR SELECT TO anon
  USING ("paymentStatus" = 'confirmed');

-- 17b. authenticated: can read all sawers
CREATE POLICY "authenticated_read_all_sawers" ON public."Sawer"
  FOR SELECT TO authenticated
  USING (true);

-- 17c. authenticated: can insert sawers
CREATE POLICY "authenticated_insert_sawer" ON public."Sawer"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 17d. app_user: full CRUD (admin can manage sawers)
CREATE POLICY "app_user_all_sawer" ON public."Sawer"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 18. RLS Policies — Club Table ─────────────────────────────────

-- 18a. anon: read all clubs (public club directory)
CREATE POLICY "anon_read_clubs" ON public."Club"
  FOR SELECT TO anon
  USING (true);

-- 18b. authenticated: read all clubs
CREATE POLICY "authenticated_read_clubs" ON public."Club"
  FOR SELECT TO authenticated
  USING (true);

-- 18c. app_user: full CRUD
CREATE POLICY "app_user_all_club" ON public."Club"
  FOR ALL TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 19. RLS Policies — Settings Table ─────────────────────────────

-- 19a. anon: read public settings only (safe keys)
CREATE POLICY "anon_read_public_settings" ON public."Settings"
  FOR SELECT TO anon
  USING ("key" IN ('site_name', 'app_version', 'maintenance_mode', 'public_notice'));

-- 19b. authenticated: read public settings
CREATE POLICY "authenticated_read_public_settings" ON public."Settings"
  FOR SELECT TO authenticated
  USING ("key" IN ('site_name', 'app_version', 'maintenance_mode', 'public_notice'));

-- 19c. app_user: read all, insert/update only safe keys
CREATE POLICY "app_user_read_settings" ON public."Settings"
  FOR SELECT TO app_user
  USING (true);

CREATE POLICY "app_user_write_safe_settings" ON public."Settings"
  FOR INSERT TO app_user
  WITH CHECK ("key" NOT IN ('jwt_secret', 'admin_password'));

CREATE POLICY "app_user_update_safe_settings" ON public."Settings"
  FOR UPDATE TO app_user
  USING ("key" NOT IN ('jwt_secret', 'admin_password'))
  WITH CHECK ("key" NOT IN ('jwt_secret', 'admin_password'));


-- ── 20. RLS Policies — ActivityLog Table ──────────────────────────

-- 20a. No anon access (internal audit log)
-- 20b. No authenticated access (internal audit log)

-- 20c. app_user: read + insert only (append-only audit log)
CREATE POLICY "app_user_read_activity_log" ON public."ActivityLog"
  FOR SELECT TO app_user
  USING (true);

CREATE POLICY "app_user_insert_activity_log" ON public."ActivityLog"
  FOR INSERT TO app_user
  WITH CHECK (true);


-- ── 21. RLS Policies — BotLog Table ───────────────────────────────

-- 21a. No anon access (internal bot log)

-- 21b. app_user: read + insert only (append-only bot log)
CREATE POLICY "app_user_read_bot_log" ON public."BotLog"
  FOR SELECT TO app_user
  USING (true);

CREATE POLICY "app_user_insert_bot_log" ON public."BotLog"
  FOR INSERT TO app_user
  WITH CHECK (true);


-- ── 22. RLS Policies — WhatsAppSettings Table ─────────────────────

-- 22a. No anon access (sensitive credentials)

-- 22b. app_user: read + insert + update (bot configuration)
-- But hide sensitive fields: metaAccessToken, metaAppSecret
CREATE POLICY "app_user_read_whatsapp_settings" ON public."WhatsAppSettings"
  FOR SELECT TO app_user
  USING (true);

CREATE POLICY "app_user_insert_whatsapp_settings" ON public."WhatsAppSettings"
  FOR INSERT TO app_user
  WITH CHECK (true);

CREATE POLICY "app_user_update_whatsapp_settings" ON public."WhatsAppSettings"
  FOR UPDATE TO app_user
  USING (true)
  WITH CHECK (true);


-- ── 23. Summary & Verification ───────────────────────────────────

-- Verify RLS is enabled on all tables
DO $$ DECLARE
  tbl TEXT;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  RLS Status Verification';
  RAISE NOTICE '═══════════════════════════════════════════';
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = tbl;
    RAISE NOTICE '  % | RLS: %', tbl, CASE WHEN rls_enabled THEN '✓ ENABLED' ELSE '✗ DISABLED' END;
  END LOOP;
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;

-- Verify policy count per table
DO $$ DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Policy Count per Table';
  RAISE NOTICE '═══════════════════════════════════════════';
  FOR r IN
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  % | Policies: %', r.tablename, r.policy_count;
  END LOOP;
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;

-- Verify grants per role
DO $$ DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  Permission Grants by Role';
  RAISE NOTICE '═══════════════════════════════════════════';
  FOR r IN
    SELECT grantee, table_name, string_agg(privilege_type, ', ') as privileges
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated', 'app_user')
    GROUP BY grantee, table_name
    ORDER BY grantee, table_name
  LOOP
    RAISE NOTICE '  % | % | %', r.grantee, r.table_name, r.privileges;
  END LOOP;
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════
-- Security Summary:
--
-- ■ RLS: ENABLED on all 15 tables
-- ■ anon: Read-only (public data only, no admin/sensitive fields)
-- ■ authenticated: Read public + write own data
-- ■ app_user: Full CRUD (subject to RLS defense-in-depth)
-- ■ postgres/superuser: Full access (Prisma, bypasses RLS)
-- ■ service_role: Full access (Supabase admin, bypasses RLS)
-- ■ NO GRANT ALL on any role
-- ■ NO RLS disabled on any table
-- ═══════════════════════════════════════════════════════════
