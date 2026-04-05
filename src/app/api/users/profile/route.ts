import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import pusher, { globalChannel } from '@/lib/pusher';

// GET - Find user by search (name or phone) for profile lookup
// No auth required — public search among registered players only
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const gender = searchParams.get('gender');

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    const where: Record<string, unknown> = {
      isAdmin: false,
    };

    if (gender) where.gender = gender;

    // Search by name (case-insensitive) or phone
    const users = await db.user.findMany({
      where: {
        ...where,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      include: {
        club: { select: { id: true, name: true, slug: true, logoUrl: true } },
        rankings: true,
      },
      take: 15,
      orderBy: { points: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

// PUT - Player self-service profile update (no admin auth needed)
// Only allows updating own fields: name, phone, city, avatar
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, phone, city, avatar } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists and is not admin
    const existing = await db.user.findUnique({
      where: { id: userId },
      include: {
        club: { select: { id: true, name: true, slug: true, logoUrl: true } },
        rankings: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (existing.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify admin profiles' },
        { status: 403 }
      );
    }

    // Build update data — only allow safe fields
    const updateData: Record<string, string | null> = {};
    if (name !== undefined && typeof name === 'string' && name.trim().length >= 2) {
      updateData.name = name.trim();
    }
    if (phone !== undefined) {
      updateData.phone = phone && typeof phone === 'string' ? phone.trim() : null;
    }
    if (city !== undefined) {
      updateData.city = city && typeof city === 'string' ? city.trim() : null;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar && typeof avatar === 'string' ? avatar : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        club: { select: { id: true, name: true, slug: true, logoUrl: true } },
        rankings: true,
      },
    });

    // Notify realtime
    pusher.trigger(globalChannel, 'user-profile-updated', {
      userId: updated.id,
      userName: updated.name,
      gender: updated.gender,
    }).catch(() => {});

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
