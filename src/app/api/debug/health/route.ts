import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Database health check (no auth required, for diagnostics only)
export async function GET() {
  try {
    const results: Record<string, unknown> = {};

    // 1. Test database connection (use Prisma ORM, not $queryRaw — PgBouncer doesn't support prepared statements)
    const startMs = Date.now();
    await db.user.findFirst({ select: { id: true } });
    results.dbConnection = `OK (${Date.now() - startMs}ms)`;

    // 2. Count users
    const userCount = await db.user.count();
    results.totalUsers = userCount;

    // 3. Count admins
    const adminCount = await db.user.count({
      where: { role: { in: ['admin', 'super_admin'] } },
    });
    results.adminCount = adminCount;

    // 4. Count clubs
    const clubCount = await db.club.count();
    results.totalClubs = clubCount;

    // 5. Count tournaments
    const tournamentCount = await db.tournament.count();
    results.totalTournaments = tournamentCount;

    // 6. Count rankings
    const rankingCount = await db.ranking.count();
    results.totalRankings = rankingCount;

    // 7. Check admin PIN status (without exposing hash)
    const admins = await db.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true, name: true, email: true, role: true, isAdmin: true, adminPass: true },
    });

    results.admins = admins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      isAdmin: a.isAdmin,
      hasPin: !!a.adminPass,
      pinStartsWith: a.adminPass?.substring(0, 7) || null,
    }));

    // 8. Check env vars (without exposing secrets)
    results.env = {
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 20) || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    };

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: msg,
        env: {
          DATABASE_URL_set: !!process.env.DATABASE_URL,
          DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 20) || 'NOT SET',
          NODE_ENV: process.env.NODE_ENV || 'not set',
        },
      },
      { status: 500 },
    );
  }
}
