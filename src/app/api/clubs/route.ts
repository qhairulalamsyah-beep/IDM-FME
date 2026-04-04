// Club API - Leaderboard, detail, create, edit, delete
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

// GET - Get club leaderboard (top clubs by total member points) or single club
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get('gender');
    const limit = parseInt(searchParams.get('limit') || '10');
    const slug = searchParams.get('slug');
    const admin = searchParams.get('admin') === 'true';

    // Single club detail
    if (slug) {
      const club = await db.club.findUnique({
        where: { slug },
        include: {
          members: {
            where: { isAdmin: false },
            select: {
              id: true,
              name: true,
              avatar: true,
              tier: true,
              points: true,
              gender: true,
              rankings: { select: { wins: true, losses: true } },
            },
            orderBy: { points: 'desc' },
          },
        },
      });

      if (!club) {
        return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 });
      }

      const totalPoints = club.members.reduce((sum, m) => sum + m.points, 0);
      const memberCount = club.members.length;
      const filteredMembers = gender ? club.members.filter(m => m.gender === gender) : club.members;

      return NextResponse.json({
        success: true,
        club: {
          id: club.id,
          name: club.name,
          slug: club.slug,
          logoUrl: club.logoUrl,
          totalPoints,
          memberCount,
          totalPlayers: club.totalPlayers,
          femaleCount: club.femaleCount,
          maleCount: club.maleCount,
          mpScore: club.mpScore,
          fpScore: club.fpScore,
          subtotal1: club.subtotal1,
          mpPoint: club.mpPoint,
          fpPoint: club.fpPoint,
          subtotal2: club.subtotal2,
          rank: club.rank,
          members: filteredMembers.map(m => ({
            ...m,
            wins: m.rankings[0]?.wins ?? 0,
            losses: m.rankings[0]?.losses ?? 0,
            rankings: undefined,
          })),
        },
      });
    }

    // Admin list — return all clubs with full stats (auth required)
    if (admin) {
      const denied = await requireAdmin(request);
      if (denied) return denied;

      const allClubs = await db.club.findMany({
        orderBy: { rank: 'asc' },
      });

      // Separate ranked and unranked
      const ranked = allClubs.filter(c => c.rank !== null).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
      const unranked = allClubs.filter(c => c.rank === null);

      return NextResponse.json({
        success: true,
        clubs: [...ranked, ...unranked].map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          logoUrl: c.logoUrl,
          totalPlayers: c.totalPlayers,
          femaleCount: c.femaleCount,
          maleCount: c.maleCount,
          mpScore: c.mpScore,
          fpScore: c.fpScore,
          subtotal1: c.subtotal1,
          mpPoint: c.mpPoint,
          fpPoint: c.fpPoint,
          subtotal2: c.subtotal2,
          rank: c.rank,
        })),
      });
    }

    // Club leaderboard with aggregated points (public)
    const allClubs = await db.club.findMany({
      include: {
        members: {
          where: { isAdmin: false },
          select: {
            id: true,
            name: true,
            avatar: true,
            tier: true,
            points: true,
            gender: true,
            rankings: { select: { wins: true, losses: true } },
          },
        },
      },
    });

    // Aggregate and rank clubs
    const clubLeaderboard = allClubs
      .map(club => {
        const members = gender ? club.members.filter(m => m.gender === gender) : club.members;
        const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
        return {
          id: club.id,
          name: club.name,
          slug: club.slug,
          logoUrl: club.logoUrl,
          totalPoints,
          totalPlayers: club.totalPlayers,
          femaleCount: club.femaleCount,
          maleCount: club.maleCount,
          mpScore: club.mpScore,
          fpScore: club.fpScore,
          subtotal1: club.subtotal1,
          mpPoint: club.mpPoint,
          fpPoint: club.fpPoint,
          subtotal2: club.subtotal2,
          rank: club.rank,
          memberCount: members.length,
          topMembers: members.slice(0, 3).map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            tier: m.tier,
            points: m.points,
          })),
        };
      })
      .filter(c => c.memberCount > 0 && c.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((c, i) => ({ ...c, rank: i + 1 }));

    return NextResponse.json({
      success: true,
      clubs: clubLeaderboard,
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clubs' },
      { status: 500 },
    );
  }
}

// POST - Create a new club
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { name, logoUrl, totalPlayers, femaleCount, maleCount, mpScore, fpScore, subtotal1, mpPoint, fpPoint, subtotal2, rank } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nama club minimal 2 karakter' },
        { status: 400 },
      );
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

    // Check for similar slug (case-insensitive match)
    const existing = await db.club.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Club sudah ada', club: existing },
        { status: 409 },
      );
    }

    const club = await db.club.create({
      data: {
        name: name.trim(),
        slug,
        ...(logoUrl ? { logoUrl } : {}),
        ...(totalPlayers !== undefined ? { totalPlayers: Number(totalPlayers) || 0 } : {}),
        ...(femaleCount !== undefined ? { femaleCount: Number(femaleCount) || 0 } : {}),
        ...(maleCount !== undefined ? { maleCount: Number(maleCount) || 0 } : {}),
        ...(mpScore !== undefined ? { mpScore: Number(mpScore) || 0 } : {}),
        ...(fpScore !== undefined ? { fpScore: Number(fpScore) || 0 } : {}),
        ...(subtotal1 !== undefined ? { subtotal1: Number(subtotal1) || 0 } : {}),
        ...(mpPoint !== undefined ? { mpPoint: Number(mpPoint) || 0 } : {}),
        ...(fpPoint !== undefined ? { fpPoint: Number(fpPoint) || 0 } : {}),
        ...(subtotal2 !== undefined ? { subtotal2: Number(subtotal2) || 0 } : {}),
        ...(rank !== undefined && rank !== null && rank !== '' ? { rank: Number(rank) } : {}),
      },
    });

    return NextResponse.json({ success: true, club });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create club' },
      { status: 500 },
    );
  }
}

// PUT - Update club (name, logoUrl, stats)
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { clubId, name, logoUrl, totalPlayers, femaleCount, maleCount, mpScore, fpScore, subtotal1, mpPoint, fpPoint, subtotal2, rank } = body;

    if (!clubId) {
      return NextResponse.json({ success: false, error: 'clubId required' }, { status: 400 });
    }

    const existing = await db.club.findUnique({ where: { id: clubId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 });
    }

    const updateData: Record<string, string | number | null | undefined> = {};
    if (name !== undefined) {
      const newName = name.trim();
      if (newName.length < 2) {
        return NextResponse.json({ success: false, error: 'Nama club minimal 2 karakter' }, { status: 400 });
      }
      const newSlug = newName.toLowerCase().replace(/\s+/g, '-');
      // Check slug collision
      if (newSlug !== existing.slug) {
        const collision = await db.club.findUnique({ where: { slug: newSlug } });
        if (collision) {
          return NextResponse.json({ success: false, error: 'Nama club sudah digunakan' }, { status: 409 });
        }
      }
      updateData.name = newName;
      updateData.slug = newSlug;
    }
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (totalPlayers !== undefined) updateData.totalPlayers = Number(totalPlayers) || 0;
    if (femaleCount !== undefined) updateData.femaleCount = Number(femaleCount) || 0;
    if (maleCount !== undefined) updateData.maleCount = Number(maleCount) || 0;
    if (mpScore !== undefined) updateData.mpScore = Number(mpScore) || 0;
    if (fpScore !== undefined) updateData.fpScore = Number(fpScore) || 0;
    if (subtotal1 !== undefined) updateData.subtotal1 = Number(subtotal1) || 0;
    if (mpPoint !== undefined) updateData.mpPoint = Number(mpPoint) || 0;
    if (fpPoint !== undefined) updateData.fpPoint = Number(fpPoint) || 0;
    if (subtotal2 !== undefined) updateData.subtotal2 = Number(subtotal2) || 0;
    if (rank !== undefined) {
      updateData.rank = (rank === null || rank === '') ? null : Number(rank);
    }

    const club = await db.club.update({
      where: { id: clubId },
      data: updateData,
    });

    return NextResponse.json({ success: true, club });
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update club' },
      { status: 500 },
    );
  }
}

// DELETE - Delete a club (members become club-less)
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('id');

    if (!clubId) {
      return NextResponse.json({ success: false, error: 'clubId required' }, { status: 400 });
    }

    const existing = await db.club.findUnique({ where: { id: clubId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 });
    }

    // Remove club from all members
    await db.user.updateMany({
      where: { clubId },
      data: { clubId: null },
    });

    // Delete the club
    await db.club.delete({ where: { id: clubId } });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete club' },
      { status: 500 },
    );
  }
}
