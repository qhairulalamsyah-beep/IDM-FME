import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Database health check (no auth required, for diagnostics only)
export async function GET() {
  try {
    const results: Record<string, unknown> = {};

    // Parse DATABASE_URL to show connection details (without password)
    const dbUrl = process.env.DATABASE_URL || '';
    try {
      const url = new URL(dbUrl.replace('postgresql://', 'http://'));
      results.connectionInfo = {
        protocol: 'postgresql',
        username: url.username,           // should be postgres.[project-ref]
        host: url.hostname,               // should end with pooler.supabase.com
        port: url.port,                   // 6543 for pooler
        database: url.pathname.slice(1),  // postgres
        hasPgbouncer: url.searchParams.has('pgbouncer'),
        pgbouncerValue: url.searchParams.get('pgbouncer'),
        passwordLength: url.password?.length || 0,
        usernameFormat: url.username.includes('.') ? 'pooler format ✅' : 'WRONG — should be postgres.[project-ref] ❌',
      };
    } catch {
      results.connectionInfo = { error: 'Failed to parse DATABASE_URL', raw_prefix: dbUrl.substring(0, 30) };
    }

    // Parse DIRECT_DATABASE_URL too
    const directUrl = process.env.DIRECT_DATABASE_URL || '';
    results.directUrlInfo = {
      set: !!directUrl,
      sameAsDbUrl: directUrl === dbUrl,
    };

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
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    results.env = {
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      DIRECT_DATABASE_URL_set: !!process.env.DIRECT_DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV || 'not set',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: {
        set: !!serviceRoleKey,
        length: serviceRoleKey.length,
        startsWith_eyJ: serviceRoleKey.startsWith('eyJ'),
        // service_role key is ~250+ chars, anon key is ~200+ chars
        looksValid: serviceRoleKey.length > 100 && serviceRoleKey.startsWith('eyJ'),
      },
      SUPABASE_LOGO_BUCKET: process.env.SUPABASE_LOGO_BUCKET || 'NOT SET (default: club-logos)',
      SUPABASE_AVATAR_BUCKET: process.env.SUPABASE_AVATAR_BUCKET || 'NOT SET (default: avatars)',
    };

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    // Still parse connection info even on error
    const dbUrl = process.env.DATABASE_URL || '';
    let connectionInfo: Record<string, unknown> = { error: 'Failed to parse' };
    try {
      const url = new URL(dbUrl.replace('postgresql://', 'http://'));
      connectionInfo = {
        username: url.username,
        host: url.hostname,
        port: url.port,
        hasPgbouncer: url.searchParams.has('pgbouncer'),
        passwordLength: url.password?.length || 0,
        usernameFormat: url.username.includes('.') ? 'pooler format ✅' : 'WRONG — should be postgres.[project-ref] ❌',
      };
    } catch {
      // ignore parse error
    }

    return NextResponse.json(
      {
        success: false,
        error: msg,
        connectionInfo,
        env: {
          DATABASE_URL_set: !!process.env.DATABASE_URL,
          DIRECT_DATABASE_URL_set: !!process.env.DIRECT_DATABASE_URL,
          NODE_ENV: process.env.NODE_ENV || 'not set',
        },
      },
      { status: 500 },
    );
  }
}
