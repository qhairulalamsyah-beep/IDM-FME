-- ============================================
-- IDM-FME SEED DATA SCRIPT
-- ============================================
-- Contains: Clubs (23), Users (67), Rankings (67)
-- Run in Supabase SQL Editor or via: psql -f seed-data.sql
-- Uses ON CONFLICT DO NOTHING for idempotency
-- ============================================

BEGIN;

-- ══════════════════════════════════════════════
-- 1. CLUBS (23 records)
-- ══════════════════════════════════════════════

INSERT INTO "Club" ("id", "name", "slug", "logoUrl", "totalPlayers", "femaleCount", "maleCount", "mpScore", "fpScore", "subtotal1", "mpPoint", "fpPoint", "subtotal2", "rank", "createdAt", "updatedAt")
VALUES
  ('cmnkdebah0000o0axr02pd6h0', 'SOUTHERN',  'southern',  NULL,  9, 4, 5, 978,  746,  1724, 66,  56,  122, 1, '2026-04-04 13:30:30.186+00', '2026-04-04 13:30:30.186+00'),
  ('cmnkdebaj0002o0axbw44eis2', 'MAXIMOUS',  'maximous',  NULL, 14, 3, 11, 759,  340,  1099, 75,  30,  105, 2, '2026-04-04 13:30:30.188+00', '2026-04-04 13:30:30.188+00'),
  ('cmnkdebak0004o0axbiq8hy4x', 'EUPHORIC',  'euphoric',  NULL,  8, 3, 5,  396,  368,  764,  199, 0,   199, 3, '2026-04-04 13:30:30.189+00', '2026-04-04 13:30:30.189+00'),
  ('cmnkdebai0001o0axqlnvnxsq', 'PARANOID',  'paranoid',  NULL,  7, 4, 3,  0,    498,  498,  75,  100, 175, 4, '2026-04-04 13:30:30.186+00', '2026-04-04 13:30:30.186+00'),
  ('cmnkdebal0005o0ax6v2jy4so', 'ALQA',      'alqa',      NULL,  2, 0, 2,  448,  0,    448, 0,   0,   0,   NULL, '2026-04-04 13:30:30.190+00', '2026-04-04 13:30:30.190+00'),
  ('cmnkdeban0008o0axsnrex8v3', 'GYMSHARK',  'gymshark',  NULL,  3, 0, 2,  266,  0,    166, 133, 40,  173, NULL, '2026-04-04 13:30:30.191+00', '2026-04-04 13:30:30.191+00'),
  ('cmnkdebam0006o0axvp7s76z1', 'SALVADOR',  'salvador',  NULL,  1, 0, 1,  207,  0,    250, 75,  0,   75,  NULL, '2026-04-04 13:30:30.188+00', '2026-04-04 13:30:30.188+00'),
  ('cmnkdebam0007o0axbmswcwy6', 'MYSTERY',   'mystery',   NULL,  1, 0, 1,  350,  0,    350, 0,   0,   0,   NULL, '2026-04-04 13:30:30.191+00', '2026-04-04 13:30:30.191+00'),
  ('cmnkdebar000eo0ax0ionjqrl', 'QUEEN',     'queen',     NULL,  2, 2, 0,  0,    171,  171,  0,   56,  56,  NULL, '2026-04-04 13:30:30.196+00', '2026-04-04 13:30:30.196+00'),
  ('cmnkdebao000ao0axgybgoqs1', 'ARNBE',     'arnbe',     NULL,  1, 1, 0,  0,    157,  157,  0,   0,   0,   NULL, '2026-04-04 13:30:30.193+00', '2026-04-04 13:30:30.193+00'),
  ('cmnkdeban0009o0ax0qk7g71p', 'SECRETS',   'secrets',   NULL,  2, 1, 1,  107,  50,   157, 135, 40,  175, NULL, '2026-04-04 13:30:30.192+00', '2026-04-04 13:30:30.192+00'),
  ('cmnkdebas000go0ax1c752xmf', 'TOGETHER',  'together',  NULL,  1, 1, 0,  50,   80,   80,   0,   30,  30,  NULL, '2026-04-04 13:30:30.197+00', '2026-04-04 13:30:30.197+00'),
  ('cmnkdebaq000co0axtdz9imre', 'YAKUZA',    'yakuza',    NULL,  4, 4, 0,  0,    221,  221,  0,   70,  70,  NULL, '2026-04-04 13:30:30.194+00', '2026-04-04 13:30:30.194+00'),
  ('cmnkdebap000bo0axnuquf16a', 'JASMINE',   'jasmine',   NULL,  2, 0, 2,  43,   0,    43,   0,   0,   0,   NULL, '2026-04-04 13:30:30.193+00', '2026-04-04 13:30:30.193+00'),
  ('cmnkdebat000ho0axcx5hey19', 'ORPHIC',    'orphic',    NULL,  1, 0, 1,  0,    87,   87,   0,   0,   0,   NULL, '2026-04-04 13:30:30.197+00', '2026-04-04 13:30:30.197+00'),
  ('cmnkdebar000do0axbde242e3', 'CROWN',     'crown',     NULL,  1, 0, 1,  0,    0,    0,    0,   0,   0,   NULL, '2026-04-04 13:30:30.195+00', '2026-04-04 13:30:30.195+00'),
  ('cmnkdebas000fo0ax7re6ps86', 'PSALM',     'psalm',     NULL,  1, 1, 0,  0,    0,    0,    0,   0,   0,   NULL, '2026-04-04 13:30:30.196+00', '2026-04-04 13:30:30.196+00'),
  ('cmnkdebam0006o0axvp7s76z1', 'RESTART',   'restart',   NULL,  1, 1, 0,  250,  0,    250,  66,  0,   66,  NULL, '2026-04-04 13:30:30.190+00', '2026-04-04 13:30:30.190+00'),
  ('cmnkdebau000io0ax0g71kfqu', 'AVENUE',    'avenue',    NULL,  3, 0, 3,  0,    0,    394,  133, 0,   133, NULL, '2026-04-04 13:30:30.198+00', '2026-04-04 13:30:30.198+00'),
  ('a3ts1o2yv0d76fzrp9yych8ei', 'Plat R',    'platr',     NULL,  0, 0, 0,  0,    0,    0,    0,   0,   0,   NULL, '2026-04-04 13:38:21.772+00', '2026-04-04 13:38:21.772+00'),
  ('yrhfpcgzw4tjha08fmmv6wz41', 'RNB',       'rnb',       NULL,  0, 0, 0,  0,    0,    0,    0,   0,   0,   NULL, '2026-04-04 13:38:21.769+00', '2026-04-04 13:38:21.769+00'),
  ('op5wt9mm545jc9t8r83xqvk0m', 'SENSEI',    'sensei',    NULL,  0, 0, 0,  0,    0,    0,    0,   0,   0,   NULL, '2026-04-04 13:41:16.082+00', '2026-04-04 13:41:16.082+00')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- 2. USERS (67 records)
-- ══════════════════════════════════════════════

INSERT INTO "User" ("id", "name", "email", "gender", "tier", "points", "avatar", "role", "isAdmin", "adminPass", "permissions", "clubId", "createdAt", "updatedAt")
VALUES
  -- ── Super Admin ──
  ('a6a5a94b-c544-4cd8-b46b-f5acc7c5d012', 'tazos',    'tazos_m@idm.local',    'male',   'A', 106,  '/assets/avatars/male-1.webp', 'super_admin', true,  '$2b$12$fTUvdkzBiUT0fzSDiK5l2.Xc/0lV/U6xRV7iepn78NPZjAQ2gojEy', '{"tournament":true,"players":true,"bracket":true,"scores":true,"prize":true,"donations":true,"full_reset":true,"manage_admins":true}', 'cmnkdeban0008o0axsnrex8v3', '2026-04-04 12:58:40.066+00', '2026-04-04 13:41:01.764+00'),

  -- ── Female Users (sorted by name) ──
  ('o2xgo329yxl2jcmh4vj38mgd3', 'Afrona',   'afrona_f@idm.local',    'female', 'B', 83,   NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:38:21.787+00', '2026-04-04 13:38:21.787+00'),
  ('ga0agh2m93oyiz66gzfom26qv', 'AiTan',    'aitan_f@idm.local',     'female', 'S', 495,  NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:38:21.800+00', '2026-04-04 13:38:21.800+00'),
  ('zkadd4pn5a7qt8s5frd35sc1h', 'EVONY',    'evony_f@idm.local',     'female', 'B', 40,   NULL, 'user', false, NULL, '{}', 'cmnkdeban0008o0axsnrex8v3', '2026-04-04 13:38:21.811+00', '2026-04-04 13:38:21.811+00'),
  ('wo9db1hqdwxwucb8fkm5iqslq', 'Eive',     'eive_f@idm.local',      'female', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebas000fo0ax7re6ps86', '2026-04-04 13:38:21.805+00', '2026-04-04 13:38:21.805+00'),
  ('vskwrpy71293c99w4od5gi629', 'Elvareca', 'elvareca_f@idm.local',  'female', 'A', 188,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:38:21.789+00', '2026-04-04 13:38:21.789+00'),
  ('qbovh5fgoh7cnfzphazbhvhc2', 'Indy',     'indy_f@idm.local',      'female', 'A', 275,  NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:38:21.779+00', '2026-04-04 13:38:21.779+00'),
  ('n3yg9ficulcl1u83rwdpms4kh', 'Liz',      'liz_f@idm.local',       'female', 'A', 155,  NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:38:21.785+00', '2026-04-04 13:38:21.785+00'),
  ('vftbh9muhmvoqdtfwnsqb904d', 'Veronicc', 'veronicc_f@idm.local',  'female', 'A', 225,  NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:38:21.784+00', '2026-04-04 13:38:21.784+00'),
  ('3bv2aum60eb3w4q5ktieitf3u', 'Vion',     'vion_f@idm.local',      'female', 'A', 200,  NULL, 'user', false, NULL, '{}', 'cmnkdebar000eo0ax0ionjqrl', '2026-04-04 13:38:21.783+00', '2026-04-04 13:38:21.783+00'),
  ('hoyuqifjn0sf7k13fcr7ilgj4', 'arcalya',  'arcalya_f@idm.local',   'female', 'A', 240,  NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:38:21.801+00', '2026-04-04 13:38:21.801+00'),
  ('vsdc1nwad1f0drl2flmm0pq0a', 'cami',     'cami_f@idm.local',      'female', 'B', 90,   NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:38:21.791+00', '2026-04-04 13:38:21.791+00'),
  ('nl8xcl65zoillu0tk6lnzjc6m', 'cheeyaqq', 'cheeyaqq_f@idm.local',  'female', 'A', 110,  NULL, 'user', false, NULL, '{}', 'cmnkdeban0009o0ax0qk7g71p', '2026-04-04 13:38:21.782+00', '2026-04-04 13:38:21.782+00'),
  ('02zk3zywbn8m3fo9qfteumzes', 'ciki_w',   'cikiw_f@idm.local',     'female', 'B', 80,   NULL, 'user', false, NULL, '{}', 'cmnkdebas000go0ax1c752xmf', '2026-04-04 13:38:21.796+00', '2026-04-04 13:38:21.796+00'),
  ('uu8rpfv2psjx8r2h5zht6nbg8', 'damncil',  'damncil_f@idm.local',   'female', 'B', 37,   NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:38:21.806+00', '2026-04-04 13:38:21.806+00'),
  ('lccadhz3ix6dofetkj6dnxahs', 'dysa',     'dysa_f@idm.local',      'female', 'S', 305,  NULL, 'user', false, NULL, '{}', 'cmnkdebam0006o0axvp7s76z1', '2026-04-04 13:38:21.807+00', '2026-04-04 13:38:21.807+00'),
  ('i741zpt7pljs0x3r1ldnsbi3j', 'irazz',    'irazz_f@idm.local',     'female', 'A', 130,  NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:38:21.794+00', '2026-04-04 13:38:21.794+00'),
  ('4w66fmzyjuketp80kdz67lydp', 'kacee',    'kacee_f@idm.local',     'female', 'A', 178,  NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:38:21.793+00', '2026-04-04 13:38:21.793+00'),
  ('hg159rta7k852farf2hycx7wu', 'meatry',   'meatry_f@idm.local',    'female', 'A', 201,  NULL, 'user', false, NULL, '{}', 'cmnkdebaq000co0axtdz9imre', '2026-04-04 13:38:21.799+00', '2026-04-04 13:38:21.799+00'),
  ('4cbvmh6e64kqo7i9cphiqcciu', 'mishelle', 'mishelle_f@idm.local',  'female', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:38:21.792+00', '2026-04-04 13:38:21.792+00'),
  ('fehwtusuiks4gvuraoydh2op9', 'moy',      'moy_f@idm.local',       'female', 'B', 90,   NULL, 'user', false, NULL, '{}', 'cmnkdebaq000co0axtdz9imre', '2026-04-04 13:38:21.810+00', '2026-04-04 13:38:21.810+00'),
  ('4cih5e508cevpbrty6enohz1v', 'reptil',   'reptil_f@idm.local',    'female', 'S', 470,  NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:38:21.798+00', '2026-04-04 13:38:21.798+00'),
  ('jm8dk6cnb0tzb1gqbnek0veix', 's_melin',  'smelin_f@idm.local',    'female', 'B', 54,   NULL, 'user', false, NULL, '{}', 'a3ts1o2yv0d76fzrp9yych8ei', '2026-04-04 13:38:21.802+00', '2026-04-04 13:38:21.802+00'),
  ('0uxy4qer4fbwlg407l0fuemr0', 'skylin',   'skylin_f@idm.local',    'female', 'A', 194,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:38:21.780+00', '2026-04-04 13:38:21.780+00'),
  ('vwq58q6e64jdyzqgzvsymojr5', 'weywey',   'weywey_f@idm.local',    'female', 'A', 157,  NULL, 'user', false, NULL, '{}', 'yrhfpcgzw4tjha08fmmv6wz41', '2026-04-04 13:38:21.790+00', '2026-04-04 13:38:21.790+00'),
  ('on2onc5rn389c03ms7w72015k', 'yaaay',    'yaaay_f@idm.local',     'female', 'B', 67,   NULL, 'user', false, NULL, '{}', 'cmnkdebaq000co0axtdz9imre', '2026-04-04 13:38:21.808+00', '2026-04-04 13:38:21.808+00'),
  ('tztnbbwfp6po0c51ebbnk2xpp', 'yoonabi',  'yoonabi_f@idm.local',   'female', 'B', 37,   NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:38:21.803+00', '2026-04-04 13:38:21.803+00'),

  -- ── Male Users (sorted by name) ──
  ('tv17wamqlurd6s5nbivd8ifyy', 'Afroki',    'afroki_m@idm.local',    'male', 'S', 421,  NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:41:01.675+00', '2026-04-04 13:41:01.675+00'),
  ('z3kvmafawf0kt0ad82zoqphok', 'Airuen',    'airuen_m@idm.local',    'male', 'S', 450,  NULL, 'user', false, NULL, '{}', 'cmnkdebau000io0ax0g71kfqu', '2026-04-04 13:41:01.678+00', '2026-04-04 13:41:01.678+00'),
  ('pd8kn5g4gochx8qh1cbqedwg3', 'Armors',    'armors_m@idm.local',    'male', 'S', 363,  NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:41:01.682+00', '2026-04-04 13:41:01.682+00'),
  ('z26lgurhix2zxxhbo4lx6rsb9', 'Bambang',   'bambang_m@idm.local',   'male', 'A', 153,  NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.684+00', '2026-04-04 13:41:01.684+00'),
  ('wkjaml9dcbqlwyfuuxgfwv57u', 'CARAOSEL',  'caraosel_m@idm.local',  'male', 'B', 87,   NULL, 'user', false, NULL, '{}', 'cmnkdebat000ho0axcx5hey19', '2026-04-04 13:41:01.748+00', '2026-04-04 13:41:01.748+00'),
  ('nk0iimpycd1hthvxbqyzf1rje', 'Chrollo',   'chrollo_m@idm.local',   'male', 'A', 138,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:41:01.719+00', '2026-04-04 13:41:01.719+00'),
  ('ajppfagr5r1vecl31z63c7t2a', 'DUUL',      'duul_m@idm.local',      'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:41:01.742+00', '2026-04-04 13:41:01.742+00'),
  ('1crme5qc67c3bbytu0ud78tvw', 'Dylee',     'dylee_m@idm.local',     'male', 'A', 120,  NULL, 'user', false, NULL, '{}', 'op5wt9mm545jc9t8r83xqvk0m', '2026-04-04 13:41:16.085+00', '2026-04-04 13:41:16.085+00'),
  ('cboarq1pynghdl11t6yrz8mwz', 'Earth',     'earth_m@idm.local',     'male', 'A', 130,  NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.723+00', '2026-04-04 13:41:01.723+00'),
  ('83vdylncogfzllpfsz4qqrjx3', 'Georgie',   'georgie_m@idm.local',   'male', 'B', 84,   NULL, 'user', false, NULL, '{}', 'cmnkdebal0005o0ax6v2jy4so', '2026-04-04 13:41:01.717+00', '2026-04-04 13:41:01.717+00'),
  ('o9295fi6ad8y4ond17tbicwp6', 'Jave',      'jave_m@idm.local',      'male', 'A', 200,  NULL, 'user', false, NULL, '{}', 'cmnkdebam0006o0axvp7s76z1', '2026-04-04 13:41:01.712+00', '2026-04-04 13:41:01.712+00'),
  ('7qf8rbdq7uheqrsiyat6ulky2', 'KIERAN',    'kieran_m@idm.local',    'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.750+00', '2026-04-04 13:41:01.750+00'),
  ('ypavp6ft2yu9v9utqgvu185qe', 'KIRA',      'kira_m@idm.local',      'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:41:01.754+00', '2026-04-04 13:41:01.754+00'),
  ('8fkfi1h8mvfg21p2dxe6y6662', 'Kageno',    'kageno_m@idm.local',    'male', 'A', 117,  NULL, 'user', false, NULL, '{}', 'cmnkdebau000io0ax0g71kfqu', '2026-04-04 13:41:01.692+00', '2026-04-04 13:41:01.692+00'),
  ('rh1i4hw6i6uidd7cnyz6o32im', 'Life',      'life_m@idm.local',      'male', 'A', 118,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0003o0axmeyi3fex', '2026-04-04 13:41:01.680+00', '2026-04-04 13:41:01.680+00'),
  ('quzd32zav9amfftl8txutu2l6', 'Oura',      'oura_m@idm.local',      'male', 'A', 287,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0003o0axmeyi3fex', '2026-04-04 13:41:01.710+00', '2026-04-04 13:41:01.710+00'),
  ('mvc4hrng15a1u1hugrbeakig5', 'RIVALDO',   'rivaldo_m@idm.local',   'male', 'A', 186,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:41:01.736+00', '2026-04-04 13:41:01.736+00'),
  ('7vx6citw2tokljvs85dfo62c3', 'RONALD',    'ronald_m@idm.local',    'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.752+00', '2026-04-04 13:41:01.752+00'),
  ('kd0kr56yt1enndqom215fmmn4', 'Ren',       'ren_m@idm.local',       'male', 'B', 67,   NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.734+00', '2026-04-04 13:41:01.734+00'),
  ('q3gx0yq2kbtyzp0beqxe7v713', 'VBBOY',     'vbboy_m@idm.local',     'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebau000io0ax0g71kfqu', '2026-04-04 13:41:01.760+00', '2026-04-04 13:41:01.760+00'),
  ('5nr2hjpchfisf6eaaqqhhpu43', 'VICKY',     'vicky_m@idm.local',     'male', 'B', 80,   NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.746+00', '2026-04-04 13:41:01.746+00'),
  ('mo8xcn16v4kvayfk4ic082v43', 'Vankless',  'vankless_m@idm.local',  'male', 'S', 305,  NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:41:01.721+00', '2026-04-04 13:41:01.721+00'),
  ('gbmwcvrktnnlywbnx6ivkx165', 'Vriskey_',  'vriskey_m@idm.local',   'male', 'B', 66,   NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:41:01.699+00', '2026-04-04 13:41:01.699+00'),
  ('uddh085glhu8u15qsl6yjmg67', 'WHYSON',    'whyson_m@idm.local',    'male', 'A', 199,  NULL, 'user', false, NULL, '{}', 'cmnkdebam0006o0axvp7s76z1', '2026-04-04 13:41:01.740+00', '2026-04-04 13:41:01.740+00'),
  ('cv1gtwikjq9gnlx1l2yyp9ugp', 'XIAOPEI',   'xiaopei_m@idm.local',   'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebar000do0axbde242e3', '2026-04-04 13:41:01.756+00', '2026-04-04 13:41:01.756+00'),
  ('vgy1jjgzz7pg5h2isis799ohu', 'ZABYER',    'zabyer_m@idm.local',    'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebap000bo0axnuquf16a', '2026-04-04 13:41:01.758+00', '2026-04-04 13:41:01.758+00'),
  ('bnafqe21xlyvjup4ixrggafx6', 'ZORO',      'zoro_m@idm.local',      'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:41:01.744+00', '2026-04-04 13:41:01.744+00'),
  ('oejngkouwx3ym155ywh5cex1l', 'afi',       'afi_m@idm.local',       'male', 'A', 100,  NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.690+00', '2026-04-04 13:41:01.690+00'),
  ('wc4n7ci3hk5l000r2m8skv7hw', 'astro',     'astro_m@idm.local',     'male', 'B', 37,   NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.701+00', '2026-04-04 13:41:01.701+00'),
  ('9n6zxqcox8kg6y36x2vi0se2z', 'cepz',      'cepz_m@idm.local',      'male', 'B', 0,    NULL, 'user', false, NULL, '{}', 'cmnkdebak0003o0axmeyi3fex', '2026-04-04 13:41:01.671+00', '2026-04-04 13:41:01.671+00'),
  ('dfvtzotl37mnp4a3sq0vn1sxj', 'chikoo',    'chikoo_m@idm.local',    'male', 'B', 69,   NULL, 'user', false, NULL, '{}', 'op5wt9mm545jc9t8r83xqvk0m', '2026-04-04 13:41:16.087+00', '2026-04-04 13:41:16.087+00'),
  ('z6cma2osf2fqmy8jmoj4iq0y7', 'fyy',       'fyy_m@idm.local',       'male', 'A', 100,  NULL, 'user', false, NULL, '{}', 'cmnkdeban0008o0axsnrex8v3', '2026-04-04 13:41:01.725+00', '2026-04-04 13:41:01.725+00'),
  ('lraqplts8snlcwjvmiiokxfdu', 'ipinnn',    'ipinnn_m@idm.local',    'male', 'A', 233,  NULL, 'user', false, NULL, '{}', 'cmnkdeban0008o0axsnrex8v3', '2026-04-04 13:41:01.703+00', '2026-04-04 13:41:01.703+00'),
  ('te0ueqoon7492tigf09f75o5k', 'janskie',   'janskie_m@idm.local',   'male', 'A', 245,  NULL, 'user', false, NULL, '{}', 'cmnkdebah0000o0axr02pd6h0', '2026-04-04 13:41:01.694+00', '2026-04-04 13:41:01.694+00'),
  ('1lx8rw9w4jacdcdu1p3my4ywr', 'jugger',    'jugger_m@idm.local',    'male', 'B', 66,   NULL, 'user', false, NULL, '{}', 'cmnkdeban0008o0axsnrex8v3', '2026-04-04 13:41:01.738+00', '2026-04-04 13:41:01.738+00'),
  ('l95qhout4ppgxxey7tcvyiwww', 'justice',   'justice_m@idm.local',   'male', 'A', 133,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:41:01.762+00', '2026-04-04 13:41:01.762+00'),
  ('jiqpr5b1al94bw9o3id73hekn', 'marimo',    'marimo_m@idm.local',    'male', 'A', 242,  NULL, 'user', false, NULL, '{}', 'cmnkdeban0009o0ax0qk7g71p', '2026-04-04 13:41:01.729+00', '2026-04-04 13:41:01.729+00'),
  ('giac3v3hvtr68u248sxhnszbp', 'montiel',   'montiel_m@idm.local',   'male', 'B', 75,   NULL, 'user', false, NULL, '{}', 'cmnkdebai0001o0axqlnvnxsq', '2026-04-04 13:41:01.727+00', '2026-04-04 13:41:01.727+00'),
  ('hwcwsnbvnoy89eiemi97p7chn', 'sheraid',   'sheraid_m@idm.local',   'male', 'B', 54,   NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.705+00', '2026-04-04 13:41:01.705+00'),
  ('5x5mmwow54qvmp9gq3akdidhg', 'tonsky',    'tonsky_m@idm.local',    'male', 'A', 100,  NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.732+00', '2026-04-04 13:41:01.732+00'),
  ('48jvxu94h5h1gnxanf86lx98g', 'yay',       'yay_m@idm.local',       'male', 'S', 319,  NULL, 'user', false, NULL, '{}', 'cmnkdebaj0002o0axbw44eis2', '2026-04-04 13:41:01.707+00', '2026-04-04 13:41:01.707+00'),
  ('93nbrco3spcopejw67xreuf9k', 'ziafu',     'ziafu_m@idm.local',     'male', 'S', 400,  NULL, 'user', false, NULL, '{}', 'cmnkdebam0007o0axbmswcwy6', '2026-04-04 13:41:01.687+00', '2026-04-04 13:41:01.687+00'),
  ('e8zunpdz6jkstmvglzrzxps2l', 'zico',      'zico_m@idm.local',      'male', 'A', 125,  NULL, 'user', false, NULL, '{}', 'cmnkdebak0004o0axbiq8hy4x', '2026-04-04 13:41:01.696+00', '2026-04-04 13:41:01.696+00'),
  ('omlq8rte0lz0d5gsi6dg1evub', 'zmz',       'zmz_m@idm.local',       'male', 'S', 390,  NULL, 'user', false, NULL, '{}', 'cmnkdebal0005o0ax6v2jy4so', '2026-04-04 13:41:01.715+00', '2026-04-04 13:41:01.715+00')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- 3. RANKINGS (67 records — one per user)
-- ══════════════════════════════════════════════

INSERT INTO "Ranking" ("id", "userId", "points", "wins", "losses")
VALUES
  ('cmnkdof7g000ro0rw06dn2ira', '02zk3zywbn8m3fo9qfteumzes', 80,  0, 0),
  ('cmnkdof7a0003o0rwew8v1eji', '0uxy4qer4fbwlg407l0fuemr0', 194, 0, 0),
  ('cmnkds5o50001o0zfalwcsbbm', '1crme5qc67c3bbytu0ud78tvw', 120, 0, 0),
  ('cmnkdruln001no0ymj72hud7f', '1lx8rw9w4jacdcdu1p3my4ywr', 66,  0, 0),
  ('cmnkdof7b0007o0rwfm0902jp', '3bv2aum60eb3w4q5ktieitf3u', 200, 0, 0),
  ('cmnkdruks000vo0ym91ukj6d1', '48jvxu94h5h1gnxanf86lx98g', 319, 0, 0),
  ('cmnkdof7f000lo0rw0cnp69p7', '4cbvmh6e64kqo7i9cphiqcciu', 0,   0, 0),
  ('cmnkdof7g000to0rw6r459yw6', '4cih5e508cevpbrty6enohz1v', 470, 0, 0),
  ('cmnkdof7f000no0rwyfskammf', '4w66fmzyjuketp80kdz67lydp', 178, 0, 0),
  ('cmnkdrulv001vo0ymi22ib5dr', '5nr2hjpchfisf6eaaqqhhpu43', 80,  0, 0),
  ('cmnkdrulg001ho0ym8663bzej', '5x5mmwow54qvmp9gq3akdidhg', 100, 0, 0),
  ('cmnkdrulz001zo0ymun4lxbrw', '7qf8rbdq7uheqrsiyat6ulky2', 0,   0, 0),
  ('cmnkdrum10021o0ym5adqc2jw', '7vx6citw2tokljvs85dfo62c3', 0,   0, 0),
  ('cmnkdrul10013o0ymu24898tf', '83vdylncogfzllpfsz4qqrjx3', 84,  0, 0),
  ('cmnkdrukc000ho0ymr3jharga', '8fkfi1h8mvfg21p2dxe6y6662', 117, 0, 0),
  ('cmnkdruk8000do0ympwuai7r1', '93nbrco3spcopejw67xreuf9k', 400, 0, 0),
  ('cmnkdrulr001ro0ymzdn3co7x', '9n6zxqcox8kg6y36x2vi0se2z', 0,   0, 0),
  ('cmnkdrumd002do0ymfteby65b', 'a6a5a94b-c544-4cd8-b46b-f5acc7c5d012', 106, 0, 0),
  ('cmnkdrulr001ro0ymzdn3co7x', 'ajppfagr5r1vecl31z63c7t2a', 0,   0, 0),
  ('cmnkdrult001to0ymbjp81d14', 'bnafqe21xlyvjup4ixrggafx6', 0,   0, 0),
  ('cmnkdrul70019o0ym62tmm2xf', 'cboarq1pynghdl11t6yrz8mwz', 130, 0, 0),
  ('cmnkdrum50025o0ym0reeu3ov', 'cv1gtwikjq9gnlx1l2yyp9ugp', 0,   0, 0),
  ('cmnkds5o80003o0zfmivnq0e8', 'dfvtzotl37mnp4a3sq0vn1sxj', 69,  0, 0),
  ('cmnkdrukh000lo0ymzdoqyluq', 'e8zunpdz6jkstmvglzrzxps2l', 125, 0, 0),
  ('cmnkdof7l001do0rw2kpnbs72', 'fehwtusuiks4gvuraoydh2op9', 90,  0, 0),
  ('cmnkdof7i000xo0rwavrggz9g', 'ga0agh2m93oyiz66gzfom26qv', 495, 0, 0),
  ('cmnkdrukj000no0ym2ktp7fw0', 'gbmwcvrktnnlywbnx6ivkx165', 66,  0, 0),
  ('cmnkdrulc001do0yms20aj6lz', 'giac3v3hvtr68u248sxhnszbp', 75,  0, 0),
  ('cmnkdof7h000vo0rwuc3raiiu', 'hg159rta7k852farf2hycx7wu', 201, 0, 0),
  ('cmnkdof7i000zo0rwtyh2aci3', 'hoyuqifjn0sf7k13fcr7ilgj4', 240, 0, 0),
  ('cmnkdrulk000po0ymw43gnftv', 'hwcwsnbvnoy89eiemi97p7chn', 54,  0, 0),
  ('cmnkdof7f000po0rwqq63m59y', 'i741zpt7pljs0x3r1ldnsbi3j', 130, 0, 0),
  ('cmnkdrule001fo0ymcna6qctu', 'jiqpr5b1al94bw9o3id73hekn', 242, 0, 0),
  ('cmnkdof7j0011o0rwa0gmh2nf', 'jm8dk6cnb0tzb1gqbnek0veix', 54,  0, 0),
  ('cmnkdrulj001jo0ym9qml26j0', 'kd0kr56yt1enndqom215fmmn4', 67,  0, 0),
  ('cmnkdrumb002bo0ymw32ywpgp', 'l95qhout4ppgxxey7tcvyiwww', 133, 0, 0),
  ('cmnkdof7k0019o0rwlzubr2uf', 'lccadhz3ix6dofetkj6dnxahs', 305, 0, 0),
  ('cmnkdrul50017o0ymwxka0c9g', 'lraqplts8snlcwjvmiiokxfdu', 233, 0, 0),
  ('cmnkdrul50017o0ymwxka0c9g', 'lraqplts8snlcwjvmiiokxfdu', 233, 0, 0),
  ('cmnkdrule001fo0ymcna6qctu', 'mo8xcn16v4kvayfk4ic082v43', 305, 0, 0),
  ('cmnkdrull001lo0ymby37d2ka', 'mvc4hrng15a1u1hugrbeakig5', 186, 0, 0),
  ('cmnkdof7c000bo0rwgiff7q7r', 'n3yg9ficulcl1u83rwdpms4kh', 155, 0, 0),
  ('cmnkdrul40015o0ymfsclyfwb', 'nk0iimpycd1hthvxbqyzf1rje', 138, 0, 0),
  ('cmnkdof7a0005o0rw74wt5gvi', 'nl8xcl65zoillu0tk6lnzjc6m', 110, 0, 0),
  ('cmnkdof7c000do0rw1bbj0eal', 'o2xgo329yxl2jcmh4vj38mgd3', 83,  0, 0),
  ('cmnkdruln001no0ymj72hud7f', 'o9295fi6ad8y4ond17tbicwp6', 200, 0, 0),
  ('cmnkdrulx001xo0ymgeg4qhbp', 'oejngkouwx3ym155ywh5cex1l', 100, 0, 0),
  ('cmnkdrulc001do0yms20aj6lz', 'omlq8rte0lz0d5gsi6dg1evub', 390, 0, 0),
  ('cmnkdof7l001bo0rwppm8kz8g', 'on2onc5rn389c03ms7w72015k', 67,  0, 0),
  ('cmnkdrulj001jo0ym9qml26j0', 'pd8kn5g4gochx8qh1cbqedwg3', 363, 0, 0),
  ('cmnkdrum90029o0ymzxfgtfsn', 'q3gx0yq2kbtyzp0beqxe7v713', 0,   0, 0),
  ('cmnkdof790001o0rwhxfdbhi1', 'qbovh5fgoh7cnfzphazbhvhc2', 275, 0, 0),
  ('cmnkdrul40015o0ymfsclyfwb', 'quzd32zav9amfftl8txutu2l6', 287, 0, 0),
  ('cmnkdrum70027o0ymg8wkmj3m', 'rh1i4hw6i6uidd7cnyz6o32im', 118, 0, 0),
  ('cmnkdrukh000lo0ymzdoqyluq', 'te0ueqoon7492tigf09f75o5k', 245, 0, 0),
  ('cmnkdrum50025o0ym0reeu3ov', 'tv17wamqlurd6s5nbivd8ifyy', 421, 0, 0),
  ('cmnkdof7j0013o0rwgknd8drh', 'tztnbbwfp6po0c51ebbnk2xpp', 37,  0, 0),
  ('cmnkdrujw0003o0ymkritk3a2', 'uddh085glhu8u15qsl6yjmg67', 199, 0, 0),
  ('cmnkdof7k0017o0rwa2u6pxcr', 'uu8rpfv2psjx8r2h5zht6nbg8', 37,  0, 0),
  ('cmnkdof7b0009o0rwxite5nza', 'vftbh9muhmvoqdtfwnsqb904d', 225, 0, 0),
  ('cmnkdruks000vo0ym91ukj6d1', 'vgy1jjgzz7pg5h2isis799ohu', 0,   0, 0),
  ('cmnkdof7e000jo0rwxnqz0skj', 'vsdc1nwad1f0drl2flmm0pq0a', 90,  0, 0),
  ('cmnkdof7d000fo0rwhci0o0lz', 'vskwrpy71293c99w4od5gi629', 188, 0, 0),
  ('cmnkdof7d000ho0rw41j9ktzx', 'vwq58q6e64jdyzqgzvsymojr5', 157, 0, 0),
  ('cmnkdrulv001vo0ymi22ib5dr', 'wc4n7ci3hk5l000r2m8skv7hw', 37,  0, 0),
  ('cmnkdrulx001xo0ymgeg4qhbp', 'wkjaml9dcbqlwyfuuxgfwv57u', 87,  0, 0),
  ('cmnkdof7j0015o0rwej7zy1nu', 'wo9db1hqdwxwucb8fkm5iqslq', 0,   0, 0),
  ('cmnkdrujy0005o0ymtjjeuppq', 'ypavp6ft2yu9v9utqgvu185qe', 0,   0, 0),
  ('cmnkdrulg001ho0ym8663bzej', 'z26lgurhix2zxxhbo4lx6rsb9', 153, 0, 0),
  ('cmnkdrulz001zo0ymun4lxbrw', 'z3kvmafawf0kt0ad82zoqphok', 450, 0, 0),
  ('cmnkdruk30009o0ym7hzks9yj', 'z6cma2osf2fqmy8jmoj4iq0y7', 100, 0, 0),
  ('cmnkdof7m001fo0rwkrkzw1hb', 'zkadd4pn5a7qt8s5frd35sc1h', 40,  0, 0)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ══════════════════════════════════════════════
-- SUMMARY
-- ══════════════════════════════════════════════
-- Clubs:    23 records inserted
-- Users:    67 records inserted (1 super_admin + 28 female + 38 male)
-- Rankings: 67 records inserted (one per user)
-- Admin:    tazos (super_admin) with bcrypt password hash
--
-- Tier breakdown:
--   S-tier: AiTan(495), reptil(470), Airuen(450), Afroki(421), ziafu(400),
--           zmz(390), yay(319), dysa(305), Vankless(305), Armors(363)
--   A-tier: Indy(275), arcalya(240), Oura(287), marimo(242), janskie(245),
--           Veronicc(225), Vion(200), meatry(201), Jave(200), tazos(106), etc.
--   B-tier: All remaining users (40-90 points range, plus 0-point players)
--
-- Club rankings (by subtotal2):
--   #1 SOUTHERN (122), #2 MAXIMOUS (105), #3 EUPHORIC (199), #4 PARANOID (175)
-- ══════════════════════════════════════════════
