-- ============================================
-- IDM-FME SECURE RLS MIGRATION
-- ============================================
-- Security principle: Least Privilege
--
-- IMPORTANT:
--   - This script is idempotent (safe to re-run)
--   - Does NOT drop existing data
--   - Revokes any previously over-granted permissions
-- ============================================

-- ── 0. Create app_user role (IF NOT EXISTS) ──────────────────────
DO $$ BEGIN
  CREATE ROLE app_user NOLOGIN NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── 1. REVOKE ALL from anon ──────────────────────────────────────
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


-- ── 2. REVOKE ALL from authenticated ─────────────────────────────
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


-- ── 3. REVOKE ALL from public (PostgreSQL role) ──────────────────
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


-- ── 4. REVOKE ALL from app_user ──────────────────────────────────
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


-- ── 5. Least-privilege GRANTs — anon (read-only public data) ────
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


-- ── 6. Least-privilege GRANTs — authenticated ────────────────────
GRANT SELECT (id, name, gender, tier, points, avatar, phone, "discordId", "isMVP", "mvpScore", "clubId", "createdAt", "updatedAt") ON TABLE public."User" TO authenticated;
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


-- ── 7. Least-privilege GRANTs — app_user (backend service) ──────
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


-- ── 8. Enable RLS on ALL tables ──────────────────────────────────
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


-- ── 9. Drop ALL existing RLS policies (clean slate) ─────────────
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public."' || r.tablename || '"';
  END LOOP;
END $$;


-- ── 10. RLS Policies — User ──────────────────────────────────────
CREATE POLICY anon_read_public_users ON public."User"
  FOR SELECT TO anon USING ("isAdmin" = false);

CREATE POLICY authenticated_read_public_users ON public."User"
  FOR SELECT TO authenticated USING ("isAdmin" = false);

CREATE POLICY authenticated_read_own_profile ON public."User"
  FOR SELECT TO authenticated USING (auth.uid()::text = id);

CREATE POLICY authenticated_insert_user ON public."User"
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id);

CREATE POLICY authenticated_update_own_profile ON public."User"
  FOR UPDATE TO authenticated USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

CREATE POLICY app_user_all_user ON public."User"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 11. RLS Policies — Tournament ───────────────────────────────
CREATE POLICY anon_read_tournaments ON public."Tournament"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_tournaments ON public."Tournament"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY app_user_all_tournament ON public."Tournament"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 12. RLS Policies — Registration ─────────────────────────────
CREATE POLICY anon_read_registrations ON public."Registration"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_registrations ON public."Registration"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY authenticated_insert_own_registration ON public."Registration"
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY app_user_all_registration ON public."Registration"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 13. RLS Policies — Team ─────────────────────────────────────
CREATE POLICY anon_read_teams ON public."Team"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_teams ON public."Team"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY app_user_all_team ON public."Team"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 14. RLS Policies — TeamMember ──────────────────────────────
CREATE POLICY anon_read_team_members ON public."TeamMember"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_team_members ON public."TeamMember"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY app_user_all_team_member ON public."TeamMember"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 15. RLS Policies — Match ────────────────────────────────────
CREATE POLICY anon_read_matches ON public."Match"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_matches ON public."Match"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY app_user_all_match ON public."Match"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 16. RLS Policies — PlayerMatchStat ─────────────────────────
CREATE POLICY anon_read_player_stats ON public."PlayerMatchStat"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_player_stats ON public."PlayerMatchStat"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY app_user_all_player_stat ON public."PlayerMatchStat"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 17. RLS Policies — Ranking ──────────────────────────────────
CREATE POLICY anon_read_rankings ON public."Ranking"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_rankings ON public."Ranking"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY app_user_all_ranking ON public."Ranking"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 18. RLS Policies — Donation ─────────────────────────────────
CREATE POLICY anon_read_confirmed_donations ON public."Donation"
  FOR SELECT TO anon USING ("paymentStatus" = 'confirmed');

CREATE POLICY authenticated_read_own_donations ON public."Donation"
  FOR SELECT TO authenticated USING ("paymentStatus" = 'confirmed' OR auth.uid()::text = "userId");

CREATE POLICY authenticated_insert_donation ON public."Donation"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY app_user_all_donation ON public."Donation"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 19. RLS Policies — Sawer ────────────────────────────────────
CREATE POLICY anon_read_confirmed_sawers ON public."Sawer"
  FOR SELECT TO anon USING ("paymentStatus" = 'confirmed');

CREATE POLICY authenticated_read_all_sawers ON public."Sawer"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY authenticated_insert_sawer ON public."Sawer"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY app_user_all_sawer ON public."Sawer"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 20. RLS Policies — Club ─────────────────────────────────────
CREATE POLICY anon_read_clubs ON public."Club"
  FOR SELECT TO anon USING (true);

CREATE POLICY authenticated_read_clubs ON public."Club"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY app_user_all_club ON public."Club"
  FOR ALL TO app_user USING (true) WITH CHECK (true);


-- ── 21. RLS Policies — Settings ─────────────────────────────────
CREATE POLICY anon_read_public_settings ON public."Settings"
  FOR SELECT TO anon USING ("key" IN ('site_name', 'app_version', 'maintenance_mode', 'public_notice'));

CREATE POLICY authenticated_read_public_settings ON public."Settings"
  FOR SELECT TO authenticated USING ("key" IN ('site_name', 'app_version', 'maintenance_mode', 'public_notice'));

CREATE POLICY app_user_read_settings ON public."Settings"
  FOR SELECT TO app_user USING (true);

CREATE POLICY app_user_write_safe_settings ON public."Settings"
  FOR INSERT TO app_user WITH CHECK ("key" NOT IN ('jwt_secret', 'admin_password'));

CREATE POLICY app_user_update_safe_settings ON public."Settings"
  FOR UPDATE TO app_user USING ("key" NOT IN ('jwt_secret', 'admin_password')) WITH CHECK ("key" NOT IN ('jwt_secret', 'admin_password'));


-- ── 22. RLS Policies — ActivityLog (no anon/authenticated) ─────
CREATE POLICY app_user_read_activity_log ON public."ActivityLog"
  FOR SELECT TO app_user USING (true);

CREATE POLICY app_user_insert_activity_log ON public."ActivityLog"
  FOR INSERT TO app_user WITH CHECK (true);


-- ── 23. RLS Policies — BotLog (no anon/authenticated) ──────────
CREATE POLICY app_user_read_bot_log ON public."BotLog"
  FOR SELECT TO app_user USING (true);

CREATE POLICY app_user_insert_bot_log ON public."BotLog"
  FOR INSERT TO app_user WITH CHECK (true);


-- ── 24. RLS Policies — WhatsAppSettings (no anon/authenticated) ─
CREATE POLICY app_user_read_whatsapp_settings ON public."WhatsAppSettings"
  FOR SELECT TO app_user USING (true);

CREATE POLICY app_user_insert_whatsapp_settings ON public."WhatsAppSettings"
  FOR INSERT TO app_user WITH CHECK (true);

CREATE POLICY app_user_update_whatsapp_settings ON public."WhatsAppSettings"
  FOR UPDATE TO app_user USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════
-- ■ RLS: ENABLED on all 15 tables
-- ■ anon: Read-only public data
-- ■ authenticated: Read public + write own data
-- ■ app_user: Full CRUD (subject to RLS)
-- ■ postgres/superuser: Full access (bypasses RLS)
-- ■ service_role: Full access (bypasses RLS)
-- ═══════════════════════════════════════════════════════════
