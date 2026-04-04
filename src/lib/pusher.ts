import Pusher from 'pusher';

/**
 * Server-side Pusher client
 *
 * In production (Supabase), this uses Pusher-compatible protocol via Supabase Realtime's
 * Broadcast feature. For local development, it connects to a local Pusher server.
 *
 * Credentials MUST be set via environment variables.
 */

const isSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Pusher client (local dev or fallback) ──
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'local-dev',
  key: process.env.PUSHER_KEY || 'local-dev-key',
  secret: process.env.PUSHER_SECRET || 'local-dev-secret',
  host: process.env.PUSHER_HOST || 'localhost',
  port: parseInt(process.env.PUSHER_PORT || '6001'),
  useTLS: process.env.NODE_ENV === 'production' && !isSupabase,
});

export default pusher;

// ── Channel name helpers ────────────────────────────────────────────────

/** Private channel for a specific tournament */
export const tournamentChannel = (tournamentId: string) =>
  `tournament-${tournamentId}`;

/** Public channel for a division (male/female) */
export const divisionChannel = (division: string) => {
  const validDivision = division === 'male' || division === 'female' ? division : 'male';
  return `division-${validDivision}`;
};

/** Global public channel for cross-division updates */
export const globalChannel = 'global-updates';

// ── Trigger helpers (convenience wrappers) ──────────────────────────────

export function triggerMatchScore(
  tournamentId: string,
  data: { matchId: string; scoreA: number; scoreB: number; tournamentId: string }
) {
  if (isSupabase) {
    return triggerSupabaseBroadcast(tournamentChannel(tournamentId), 'match-score', data);
  }
  return pusher.trigger(`private-${tournamentChannel(tournamentId)}`, 'match-score', data);
}

export function triggerMatchResult(
  tournamentId: string,
  data: { matchId: string; winnerId: string; tournamentId: string }
) {
  if (isSupabase) {
    return triggerSupabaseBroadcast(tournamentChannel(tournamentId), 'match-result', data);
  }
  return pusher.trigger(`private-${tournamentChannel(tournamentId)}`, 'match-result', data);
}

export function triggerAnnouncement(
  tournamentId: string,
  data: { message: string; type: string; tournamentId: string }
) {
  if (isSupabase) {
    return Promise.all([
      triggerSupabaseBroadcast(tournamentChannel(tournamentId), 'announcement', data),
      triggerSupabaseBroadcast(globalChannel, 'announcement', data),
    ]);
  }
  return Promise.all([
    pusher.trigger(`private-${tournamentChannel(tournamentId)}`, 'announcement', data),
    pusher.trigger(globalChannel, 'announcement', data),
  ]);
}

export function triggerNewDonation(
  tournamentId: string | undefined,
  data: { amount: number; userName: string; message?: string; tournamentId?: string }
) {
  const channels: string[] = [globalChannel];
  if (tournamentId) channels.push(tournamentChannel(tournamentId));

  if (isSupabase) {
    return Promise.all(channels.map(ch => triggerSupabaseBroadcast(ch, 'new-donation', data)));
  }
  return pusher.trigger(
    channels.map(ch => tournamentId && ch !== globalChannel ? `private-${ch}` : ch),
    'new-donation',
    data
  );
}

export function triggerPrizePoolUpdate(data: { totalPrizePool: number }) {
  if (isSupabase) {
    return triggerSupabaseBroadcast(globalChannel, 'prize-pool-update', data);
  }
  return pusher.trigger(globalChannel, 'prize-pool-update', data);
}

export function triggerNewSawer(
  tournamentId: string | undefined,
  data: Record<string, unknown>
) {
  const channels: string[] = [globalChannel];
  if (tournamentId) channels.push(tournamentChannel(tournamentId));

  if (isSupabase) {
    return Promise.all(channels.map(ch => triggerSupabaseBroadcast(ch, 'new-sawer', data)));
  }
  return pusher.trigger(
    channels.map(ch => tournamentId && ch !== globalChannel ? `private-${ch}` : ch),
    'new-sawer',
    data
  );
}

export function triggerTournamentUpdate(
  division: string,
  data: { action: string; tournamentId: string; division: string }
) {
  const channels: string[] = [globalChannel, divisionChannel(division)];

  if (isSupabase) {
    return Promise.all(channels.map(ch => triggerSupabaseBroadcast(ch, 'tournament-update', data)));
  }
  return pusher.trigger(channels, 'tournament-update', data);
}

export function triggerRegistrationUpdate(
  tournamentId: string,
  data: { userId: string; userName: string; status: string; tournamentId: string }
) {
  if (isSupabase) {
    return triggerSupabaseBroadcast(tournamentChannel(tournamentId), 'registration-update', data);
  }
  return pusher.trigger(`private-${tournamentChannel(tournamentId)}`, 'registration-update', data);
}

// ── Supabase Realtime Broadcast (server-side) ───────────────────────────

/**
 * Send a broadcast message via Supabase Realtime.
 * This is a lightweight alternative to Pusher that works server-side.
 *
 * Note: Supabase Realtime Broadcast uses WebSocket connections.
 * Server-side broadcasts require the Supabase REST API with service_role key.
 */
async function triggerSupabaseBroadcast(channel: string, event: string, payload: unknown) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.warn('[Realtime] Supabase credentials not configured, skipping broadcast');
      return;
    }

    // Supabase Realtime Broadcast uses the REST API endpoint
    // We use fetch to the Realtime API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        channel,
        event,
        payload,
      }),
    });

    if (!response.ok && response.status !== 404) {
      // 404 means the RPC doesn't exist yet — that's OK for setup
      console.warn(`[Realtime] Broadcast to ${channel}:${event} returned ${response.status}`);
    }
  } catch (error) {
    console.error('[Realtime] Broadcast error:', error);
  }
}
