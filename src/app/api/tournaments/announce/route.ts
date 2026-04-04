import { NextRequest, NextResponse } from 'next/server';
import { triggerAnnouncement } from '@/lib/pusher';
import { requireAdmin } from '@/lib/admin-guard';

/**
 * POST /api/tournaments/announce
 *
 * Sends a tournament announcement (info/warning/success) to all subscribers via Pusher.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { tournamentId, message, type } = body;

    if (!tournamentId || !message || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['info', 'warning', 'success'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid announcement type' },
        { status: 400 }
      );
    }

    // Broadcast via Pusher
    await triggerAnnouncement(tournamentId, {
      message,
      type,
      tournamentId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Announcement error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send announcement' },
      { status: 500 }
    );
  }
}
