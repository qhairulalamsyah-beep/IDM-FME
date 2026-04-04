/**
 * Reset database: clear all data except admin, insert 19 clubs.
 * Run: bun run scripts/reset-clubs.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🧹 Clearing all data (except admin users)...')

  // Delete in reverse dependency order
  await db.playerMatchStat.deleteMany()
  await db.teamMember.deleteMany()
  await db.match.deleteMany()
  await db.team.deleteMany()
  await db.registration.deleteMany()
  await db.sawer.deleteMany()
  await db.donation.deleteMany()
  await db.ranking.deleteMany()
  await db.activityLog.deleteMany()
  await db.botLog.deleteMany()
  await db.whatsAppSettings.deleteMany()
  await db.tournament.deleteMany()
  await db.club.deleteMany()
  await db.settings.deleteMany()

  // Delete non-admin users
  const deletedUsers = await db.user.deleteMany({
    where: { isAdmin: false },
  })
  console.log(`  Deleted ${deletedUsers.count} non-admin users`)

  console.log('✅ Database cleared\n')

  // ── Insert 19 Clubs ──
  const clubs = [
    {
      name: 'SOUTHERN', slug: 'southern',
      totalPlayers: 9, femaleCount: 4, maleCount: 5,
      mpScore: 978, fpScore: 746, subtotal1: 1724,
      mpPoint: 66, fpPoint: 56, subtotal2: 122, rank: 1,
    },
    {
      name: 'PARANOID', slug: 'paranoid',
      totalPlayers: 7, femaleCount: 4, maleCount: 3,
      mpScore: 0, fpScore: 498, subtotal1: 498,
      mpPoint: 75, fpPoint: 100, subtotal2: 175, rank: 4,
    },
    {
      name: 'MAXIMOUS', slug: 'maximous',
      totalPlayers: 14, femaleCount: 3, maleCount: 11,
      mpScore: 759, fpScore: 340, subtotal1: 1099,
      mpPoint: 75, fpPoint: 30, subtotal2: 105, rank: 2,
    },
    {
      name: 'SALVADOR', slug: 'salvador',
      totalPlayers: 1, femaleCount: 0, maleCount: 1,
      mpScore: 207, fpScore: 0, subtotal1: 250,
      mpPoint: 75, fpPoint: 0, subtotal2: 75, rank: 0,
    },
    {
      name: 'EUPHORIC', slug: 'euphoric',
      totalPlayers: 8, femaleCount: 3, maleCount: 5,
      mpScore: 396, fpScore: 368, subtotal1: 764,
      mpPoint: 199, fpPoint: 0, subtotal2: 199, rank: 3,
    },
    {
      name: 'ALQA', slug: 'alqa',
      totalPlayers: 2, femaleCount: 0, maleCount: 2,
      mpScore: 448, fpScore: 0, subtotal1: 448,
      mpPoint: 0, fpPoint: 0, subtotal2: 0, rank: 0,
    },
    {
      name: 'RESTART', slug: 'restart',
      totalPlayers: 1, femaleCount: 1, maleCount: 0,
      mpScore: 250, fpScore: 0, subtotal1: 250,
      mpPoint: 66, fpPoint: 0, subtotal2: 66, rank: 0,
    },
    {
      name: 'MYSTERY', slug: 'mystery',
      totalPlayers: 1, femaleCount: 0, maleCount: 1,
      mpScore: 350, fpScore: 0, subtotal1: 350,
      mpPoint: 0, fpPoint: 0, subtotal2: 0, rank: 0,
    },
    {
      name: 'GYMSHARK', slug: 'gymshark',
      totalPlayers: 3, femaleCount: 0, maleCount: 2,
      mpScore: 266, fpScore: 0, subtotal1: 166,
      mpPoint: 133, fpPoint: 40, subtotal2: 173, rank: 0,
    },
    {
      name: 'SECRETS', slug: 'secrets',
      totalPlayers: 2, femaleCount: 1, maleCount: 1,
      mpScore: 107, fpScore: 50, subtotal1: 157,
      mpPoint: 135, fpPoint: 40, subtotal2: 175, rank: 0,
    },
    {
      name: 'ARNBE', slug: 'arnbe',
      totalPlayers: 1, femaleCount: 1, maleCount: 0,
      mpScore: 0, fpScore: 157, subtotal1: 157,
      mpPoint: 0, fpPoint: 0, subtotal2: 0, rank: 0,
    },
    {
      name: 'JASMINE', slug: 'jasmine',
      totalPlayers: 2, femaleCount: 0, maleCount: 2,
      mpScore: 43, fpScore: 0, subtotal1: 43,
      mpPoint: 0, fpPoint: 0, subtotal2: 0, rank: 0,
    },
    {
      name: 'YAKUZA', slug: 'yakuza',
      totalPlayers: 4, femaleCount: 4, maleCount: 0,
      mpScore: 0, fpScore: 221, subtotal1: 221,
      mpPoint: 0, fpPoint: 70, subtotal2: 70, rank: 0,
    },
    {
      name: 'CROWN', slug: 'crown',
      totalPlayers: 1, femaleCount: 0, maleCount: 1,
      mpScore: 0, fpScore: 0, subtotal1: 0,
      mpPoint: 0, fpPoint: 0, subtotal2: 0, rank: 0,
    },
    {
      name: 'QUEEN', slug: 'queen',
      totalPlayers: 2, femaleCount: 2, maleCount: 0,
      mpScore: 0, fpScore: 171, subtotal1: 171,
      mpPoint: 0, fpPoint: 56, subtotal2: 56, rank: 0,
    },
    {
      name: 'PSALM', slug: 'psalm',
      totalPlayers: 1, femaleCount: 1, maleCount: 0,
      mpScore: 0, fpScore: 0, subtotal1: 0,
      mpPoint: 0, fpPoint: 0, subtotal2: 0, rank: 0,
    },
    {
      name: 'TOGETHER', slug: 'together',
      totalPlayers: 1, femaleCount: 1, maleCount: 0,
      mpScore: 50, fpScore: 80, subtotal1: 80,
      mpPoint: 0, fpPoint: 30, subtotal2: 30, rank: 0,
    },
    {
      name: 'ORPHIC', slug: 'orphic',
      totalPlayers: 1, femaleCount: 0, maleCount: 1,
      mpScore: 0, fpScore: 87, subtotal1: 87,
      mpPoint: 0, fpPoint: 0, subtotal2: 0, rank: 0,
    },
    {
      name: 'AVENUE', slug: 'avenue',
      totalPlayers: 3, femaleCount: 0, maleCount: 3,
      mpScore: 0, fpScore: 0, subtotal1: 394,
      mpPoint: 133, fpPoint: 0, subtotal2: 133, rank: 0,
    },
  ]

  console.log('📦 Inserting clubs...')
  for (const c of clubs) {
    await db.club.create({ data: c })
    console.log(`  ✅ ${c.name} (${c.totalPlayers} players)`)
  }

  // Show remaining admin users
  const admins = await db.user.findMany({
    where: { isAdmin: true },
    select: { id: true, name: true, role: true },
  })
  console.log(`\n👤 Admin users retained: ${admins.map(a => `${a.name} (${a.role})`).join(', ')}`)
  console.log(`📊 Total clubs: ${clubs.length}`)
  console.log('\n✅ Done! Database is ready for manual player entry.')
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
