import Pusher from 'pusher';

/**
 * Server-side Pusher client
 *
 * Triggers real-time events to the Pusher-compatible server.
 * Credentials MUST be set via environment variables.
 */
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  host: process.env.PUSHER_HOST || 'localhost',
  port: parseInt(process.env.PUSHER_PORT || '6001'),
  useTLS: process.env.NODE_ENV === 'production',
});

export default pusher;

// ── Channel name helpers ────────────────────────────────────────────────

/** Private channel for a specific tournament */
export const tournamentChannel = (tournamentId: string) =>
  `private-tournament-${tournamentId}`;

/** Public channel for a division (male/female) */
export const divisionChannel = (division: string) => {
  // Validate division to prevent channel injection
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
  return pusher.trigger(tournamentChannel(tournamentId), 'match-score', data);
}

export function triggerMatchResult(
  tournamentId: string,
  data: { matchId: string; winnerId: string; tournamentId: string }
) {
  return pusher.trigger(tournamentChannel(tournamentId), 'match-result', data);
}

export function triggerAnnouncement(
  tournamentId: string,
  data: { message: string; type: string; tournamentId: string }
) {
  return pusher.trigger(tournamentChannel(tournamentId), 'announcement', data);
}

export function triggerNewDonation(
  tournamentId: string | undefined,
  data: { amount: number; userName: string; message?: string; tournamentId?: string }
) {
  const channels: string[] = [];
  if (tournamentId) channels.push(tournamentChannel(tournamentId));
  channels.push(globalChannel);
  return pusher.trigger(channels, 'new-donation', data);
}

export function triggerPrizePoolUpdate(data: { totalPrizePool: number }) {
  return pusher.trigger(globalChannel, 'prize-pool-update', data);
}

export function triggerNewSawer(
  tournamentId: string | undefined,
  data: Record<string, unknown>
) {
  const channels: string[] = [globalChannel];
  if (tournamentId) channels.push(tournamentChannel(tournamentId));
  return pusher.trigger(channels, 'new-sawer', data);
}

export function triggerTournamentUpdate(
  division: string,
  data: { action: string; tournamentId: string; division: string }
) {
  const channels: string[] = [globalChannel, divisionChannel(division)];
  return pusher.trigger(channels, 'tournament-update', data);
}

export function triggerRegistrationUpdate(
  tournamentId: string,
  data: { userId: string; userName: string; status: string; tournamentId: string }
) {
  return pusher.trigger(tournamentChannel(tournamentId), 'registration-update', data);
}
