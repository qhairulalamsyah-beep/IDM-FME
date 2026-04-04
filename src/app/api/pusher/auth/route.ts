import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Pusher credentials — must be set via environment variables
const PUSHER_KEY = process.env.PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;

/**
 * POST /api/pusher/auth
 *
 * Authenticates Pusher private/presence channel subscriptions
 * using proper HMAC-SHA256 signing.
 */
export async function POST(request: NextRequest) {
  try {
    if (!PUSHER_KEY || !PUSHER_SECRET) {
      console.error('[Pusher Auth] PUSHER_KEY and/or PUSHER_SECRET env vars are not set.');
      return NextResponse.json(
        { error: 'Pusher not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    // Validate channel name format (prevent channel injection)
    const allowedChannelPrefixes = [
      'private-tournament-',
      'presence-',
      'division-',
      'global-updates',
    ];

    const isAllowedChannel = allowedChannelPrefixes.some(prefix => channel_name.startsWith(prefix));
    if (!isAllowedChannel) {
      return NextResponse.json(
        { error: 'Channel not allowed' },
        { status: 403 }
      );
    }

    // HMAC-SHA256 signature: hash = HMAC-SHA256(secret, socket_id + ':' + channel_name)
    const stringToSign = `${socket_id}:${channel_name}`;
    const signature = crypto
      .createHmac('sha256', PUSHER_SECRET)
      .update(stringToSign)
      .digest('hex');

    const auth = `${PUSHER_KEY}:${signature}`;

    // Handle presence channels
    if (channel_name.startsWith('presence-')) {
      return NextResponse.json({
        auth,
        channel_data: JSON.stringify({ user_id: socket_id, user_info: '{}' }),
      });
    }

    return NextResponse.json({ auth });
  } catch (error) {
    console.error('[Pusher Auth] Error:', error);
    return NextResponse.json(
      { error: 'Auth failed' },
      { status: 500 }
    );
  }
}
