/**
 * IDM-FME Database Seed Script
 * Generates all initial data: 22 clubs, 71 players, rankings
 *
 * Data source: https://github.com/qhairulalamsyah-beep/IDM-FME
 *
 * Usage:
 *   bun run prisma db seed
 *   (or: npx prisma db seed)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Club Data ───────────────────────────────────────────────
const CLUBS = [
  "SOUTHERN", "PARANOID", "MAXIMOUS", "SALVADOR", "EUPHORIC",
  "ALQA", "RESTART", "MYSTERY", "GYMSHARK", "SECRETS",
  "ARNBE", "JASMINE", "YAKUZA", "CROWN", "QUEEN",
  "PSALM", "TOGETHER", "ORPHIC", "AVENUE", "SENSEI",
  "RNB", "Plat R",
];

// ─── Player Data ─────────────────────────────────────────────
// [name, clubSlug, totalPoints, gender, rank?]
const PLAYERS: [string, string, number, "male" | "female", number | null][] = [
  // ── MALE (45) ──
  ["cepz",      "salvador",  0,   "male", null],
  ["Afroki",    "southern",  421, "male", 2],
  ["Airuen",    "avenue",    450, "male", 1],
  ["Life",      "salvador",  118, "male", null],
  ["Armors",    "southern",  363, "male", 5],
  ["Bambang",   "maximous",  153, "male", null],
  ["ziafu",     "mystery",   400, "male", 3],
  ["afi",       "maximous",  100, "male", null],
  ["Kageno",    "avenue",    117, "male", null],
  ["janskie",   "southern",  245, "male", 10],
  ["zico",      "euphoric",  125, "male", null],
  ["Vriskey_",  "euphoric",  66,  "male", null],
  ["astro",     "maximous",  37,  "male", null],
  ["ipinnn",    "gymshark",  233, "male", 8],
  ["sheraid",   "maximous",  54,  "male", null],
  ["yay",       "maximous",  319, "male", 5],
  ["Oura",      "salvador",  287, "male", 9],
  ["Jave",      "restart",   200, "male", null],
  ["zmz",       "alqa",      390, "male", 4],
  ["Georgie",   "alqa",      84,  "male", null],
  ["Chrollo",   "euphoric",  138, "male", null],
  ["Vankless",  "southern",  305, "male", 6],
  ["Dylee",     "sensei",    120, "male", null],
  ["Earth",     "maximous",  130, "male", null],
  ["chikoo",    "sensei",    69,  "male", null],
  ["fyy",       "gymshark",  100, "male", null],
  ["montiel",   "paranoid",  75,  "male", null],
  ["marimo",    "secrets",   242, "male", 7],
  ["tonsky",    "maximous",  100, "male", null],
  ["Ren",       "maximous",  67,  "male", null],
  ["RIVALDO",   "euphoric",  186, "male", null],
  ["jugger",    "gymshark",  66,  "male", null],
  ["WHYSON",    "restart",   199, "male", null],
  ["DUUL",      "paranoid",  0,   "male", null],
  ["ZORO",      "paranoid",  0,   "male", null],
  ["VICKY",     "maximous",  80,  "male", null],
  ["CARAOSEL",  "orphic",    87,  "male", null],
  ["KIERAN",    "maximous",  0,   "male", null],
  ["RONALD",    "maximous",  0,   "male", null],
  ["KIRA",      "southern",  0,   "male", null],
  ["XIAOPEI",   "crown",     0,   "male", null],
  ["ZABYER",    "jasmine",   0,   "male", null],
  ["VBBOY",     "avenue",    0,   "male", null],
  ["justice",   "euphoric",  133, "male", null],
  ["TAZOS",     "gymshark",  106, "male", null],

  // ── FEMALE (26) ──
  ["Indy",      "maximous",  275, "female", null],
  ["skylin",    "euphoric",  194, "female", null],
  ["cheeyaqq",  "secrets",   110, "female", null],
  ["Vion",      "queen",     200, "female", null],
  ["Veronicc",  "paranoid",  225, "female", null],
  ["Liz",       "southern",  155, "female", null],
  ["Afrona",    "southern",  83,  "female", null],
  ["Elvareca",  "euphoric",  188, "female", null],
  ["weywey",    "rnb",       157, "female", null],
  ["cami",      "maximous",  90,  "female", null],
  ["mishelle",  "paranoid",  0,   "female", null],
  ["kacee",     "maximous",  178, "female", null],
  ["irazz",     "paranoid",  130, "female", null],
  ["ciki_w",    "together",  80,  "female", null],
  ["reptil",    "southern",  470, "female", null],
  ["meatry",    "yakuza",    201, "female", null],
  ["AiTan",     "paranoid",  495, "female", null],
  ["arcalya",   "southern",  240, "female", null],
  ["s_melin",   "plat-r",    54,  "female", null],
  ["yoonabi",   "paranoid",  37,  "female", null],
  ["Eive",      "psalm",     0,   "female", null],
  ["damncil",   "euphoric",  37,  "female", null],
  ["dysa",      "restart",   305, "female", null],
  ["yaaay",     "yakuza",    67,  "female", null],
  ["moy",       "yakuza",    90,  "female", null],
  ["EVONY",     "gymshark",  40,  "female", null],
];

// TAZOS admin config
const ADMIN_PIN_HASH = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"; // SHA-256 of "123456"
const ADMIN_PERMISSIONS = JSON.stringify({
  tournament: true,
  players: true,
  bracket: true,
  scores: true,
  prize: true,
  donations: true,
  full_reset: true,
});

function getTier(points: number): string {
  if (points >= 300) return "S";
  if (points >= 100) return "A";
  return "B";
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   IDM-FME Database Seed                     ║");
  console.log("║   IDOL META - TARKAM Fan Made Edition       ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  // ── Step 0: Clean existing data ──
  console.log("[0/4] Cleaning existing data...");
  await prisma.playerMatchStat.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.sawer.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.botLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.club.deleteMany();
  await prisma.settings.deleteMany();
  console.log("  ✓ All existing data cleared");

  // ── Step 1: Create Clubs ──
  console.log(`[1/4] Creating ${CLUBS.length} clubs...`);
  const clubMap: Record<string, string> = {};

  for (const name of CLUBS) {
    const slug = toSlug(name);
    const club = await prisma.club.create({
      data: { name, slug },
    });
    clubMap[slug] = club.id;
  }
  console.log(`  ✓ ${CLUBS.length} clubs created`);

  // ── Step 2: Create Players + Rankings ──
  console.log(`[2/4] Creating ${PLAYERS.length} players...`);

  let maleCount = 0;
  let femaleCount = 0;

  for (const [name, clubSlug, totalPoints, gender, rank] of PLAYERS) {
    const clubId = clubSlug ? clubMap[clubSlug] : null;
    const tier = getTier(totalPoints);

    const emailSuffix = gender === "female" ? "_f" : "";

    const user = await prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase()}${emailSuffix}@tarkam.id`,
        gender,
        tier,
        points: totalPoints,
        clubId,
        // TAZOS is super_admin
        ...(name === "TAZOS"
          ? {
              role: "super_admin",
              isAdmin: true,
              adminPass: ADMIN_PIN_HASH,
              permissions: ADMIN_PERMISSIONS,
            }
          : {}),
      },
    });

    // Create ranking
    await prisma.ranking.create({
      data: {
        userId: user.id,
        points: totalPoints,
        wins: 0,
        losses: 0,
        rank,
      },
    });

    if (gender === "male") maleCount++;
    else femaleCount++;
  }

  console.log(`  ✓ ${maleCount} male + ${femaleCount} female = ${PLAYERS.length} players created`);
  console.log(`  ✓ ${PLAYERS.length} ranking records created`);

  // ── Step 3: Calculate Club Stats ──
  console.log(`[3/4] Calculating club stats...`);

  const allUsers = await prisma.user.findMany({
    select: { id: true, clubId: true, gender: true, points: true },
  });

  const clubStats: Record<string, { male: number; female: number; mpScore: number; fpScore: number }> = {};

  for (const user of allUsers) {
    if (!user.clubId) continue;
    if (!clubStats[user.clubId]) {
      clubStats[user.clubId] = { male: 0, female: 0, mpScore: 0, fpScore: 0 };
    }
    if (user.gender === "male") {
      clubStats[user.clubId].male++;
      clubStats[user.clubId].mpScore += user.points;
    } else {
      clubStats[user.clubId].female++;
      clubStats[user.clubId].fpScore += user.points;
    }
  }

  for (const [clubId, stats] of Object.entries(clubStats)) {
    const subtotal1 = stats.mpScore + stats.fpScore;
    await prisma.club.update({
      where: { id: clubId },
      data: {
        totalPlayers: stats.male + stats.female,
        maleCount: stats.male,
        femaleCount: stats.female,
        mpScore: stats.mpScore,
        fpScore: stats.fpScore,
        subtotal1,
      },
    });
  }
  console.log(`  ✓ Club stats updated`);

  // ── Step 4: Rank Clubs ──
  console.log(`[4/4] Ranking clubs...`);

  const clubScores = await prisma.club.findMany({
    include: { members: { select: { id: true, points: true } } },
  });

  const ranked = clubScores
    .map((c) => ({
      id: c.id,
      name: c.name,
      members: c.members.length,
      pts: c.members.reduce((s: number, m: { points: number }) => s + m.points, 0),
    }))
    .filter((c) => c.members > 0)
    .sort((a, b) => b.pts - a.pts);

  for (let i = 0; i < ranked.length; i++) {
    await prisma.club.update({
      where: { id: ranked[i].id },
      data: { rank: i + 1 },
    });
  }

  // Unrank clubs with no members
  for (const c of clubScores.filter((c) => c.members.length === 0)) {
    await prisma.club.update({
      where: { id: c.id },
      data: { rank: null },
    });
  }

  console.log(`  ✓ ${ranked.length} clubs ranked, ${clubScores.length - ranked.length} unranked`);

  // ── Summary ──
  console.log();
  console.log("══════════════════════════════════════════════");
  console.log("  SEED COMPLETE!");
  console.log("══════════════════════════════════════════════");
  console.log(`  Players : ${PLAYERS.length} (Male: ${maleCount}, Female: ${femaleCount})`);
  console.log(`  Clubs   : ${CLUBS.length}`);
  console.log(`  Rankings: ${PLAYERS.length}`);
  console.log(`  Admin   : TAZOS (PIN: 123456)`);
  console.log();

  // Print ranked players
  const rankedPlayers = PLAYERS.filter((p) => p[4] !== null).sort(
    (a, b) => (a[4] ?? 99) - (b[4] ?? 99)
  );

  console.log("  🏆 Top Ranked Players:");
  for (const [name, club, pts, , rank] of rankedPlayers) {
    console.log(`     #${rank} ${name.padEnd(12)} (${club.toUpperCase().padEnd(10)}) — ${pts} pts`);
  }
  console.log();

  // Print club rankings
  console.log("  🏅 Club Rankings:");
  for (let i = 0; i < Math.min(ranked.length, 10); i++) {
    console.log(
      `     #${i + 1} ${ranked[i].name.padEnd(12)} | ${ranked[i].members} members | ${ranked[i].pts} pts`
    );
  }
  if (ranked.length > 10) {
    console.log(`     ... and ${ranked.length - 10} more`);
  }

  console.log();
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
