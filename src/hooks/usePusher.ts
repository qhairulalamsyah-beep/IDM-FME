'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useRealtime - Unified real-time hook supporting both Pusher and Supabase Realtime.
 *
 * In production (Supabase): Uses Supabase Realtime channels via Broadcast.
 * In development: Uses Pusher-compatible WebSocket through the Caddy gateway.
 */

// ── Types ───────────────────────────────────────────────────────────────

interface RealtimeEventMap {
  'match-score': { matchId: string; scoreA: number; scoreB: number; tournamentId: string };
  'match-result': { matchId: string; winnerId: string; tournamentId: string };
  'announcement': { message: string; type: string; tournamentId?: string };
  'new-donation': { amount: number; userName: string; message?: string; tournamentId?: string };
  'prize-pool-update': { totalPrizePool: number };
  'tournament-update': { action: string; tournamentId: string; division?: string };
  'registration-update': { userId: string; userName: string; status: string; tournamentId: string };
  'new-sawer': { amount: number; senderName: string; tournamentId?: string };
}

type EventName = keyof RealtimeEventMap;
type EventHandler<T extends EventName> = (data: RealtimeEventMap[T]) => void;

interface UseRealtimeConfig {
  onMatchScore?: EventHandler<'match-score'>;
  onMatchResult?: EventHandler<'match-result'>;
  onAnnouncement?: EventHandler<'announcement'>;
  onNewDonation?: EventHandler<'new-donation'>;
  onPrizePoolUpdate?: EventHandler<'prize-pool-update'>;
  onTournamentUpdate?: EventHandler<'tournament-update'>;
  onRegistrationUpdate?: EventHandler<'registration-update'>;
  onNewSawer?: EventHandler<'new-sawer'>;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  joinTournament: (tournamentId: string) => void;
  leaveTournament: () => void;
  sendMatchUpdate: (tournamentId: string, matchId: string, scoreA: number, scoreB: number) => void;
  sendMatchComplete: (tournamentId: string, matchId: string, winnerId: string, mvpId?: string) => void;
  sendAnnouncement: (tournamentId: string, message: string, type: 'info' | 'warning' | 'success') => void;
  sendDonation: (tournamentId: string | undefined, amount: number, userName: string, message?: string) => void;
}

// ── Constants ───────────────────────────────────────────────────────────

const PUSHER_APP_KEY = 'local-dev-key';
const PUSHER_PORT = '6001';
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL = 120000;

// ── Detect mode ─────────────────────────────────────────────────────────

const isSupabaseMode = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

// ── Hook ────────────────────────────────────────────────────────────────

export function usePusher(config: UseRealtimeConfig = {}): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const supabaseChannelRef = useRef<any>(null);
  const globalChannelRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const configRef = useRef(config);
  const currentTournamentRef = useRef<string | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const connectFnRef = useRef<() => void>(() => {});

  // Keep config ref up to date without triggering reconnect
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // ── Dispatch incoming event to config handlers ──
  const dispatchEvent = useCallback((event: string, data: unknown) => {
    const c = configRef.current;
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    switch (event) {
      case 'match-score':
        c.onMatchScore?.(parsed);
        break;
      case 'match-result':
        c.onMatchResult?.(parsed);
        break;
      case 'announcement':
        c.onAnnouncement?.(parsed);
        break;
      case 'new-donation':
        c.onNewDonation?.(parsed);
        break;
      case 'prize-pool-update':
        c.onPrizePoolUpdate?.(parsed);
        break;
      case 'tournament-update':
        c.onTournamentUpdate?.(parsed);
        break;
      case 'registration-update':
        c.onRegistrationUpdate?.(parsed);
        break;
      case 'new-sawer':
        c.onNewSawer?.(parsed);
        break;
    }
  }, []);

  // ── Supabase Realtime (production) ──
  const connectSupabase = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Subscribe to global channel
      globalChannelRef.current = supabase
        .channel('global-updates', {
          config: {
            broadcast: { self: true },
          },
        })
        .on('broadcast', { event: '*' }, (payload: any) => {
          dispatchEvent(payload.event || payload.payload?.type, payload.payload || payload);
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED' && mountedRef.current) {
            setIsConnected(true);
            console.log('[Supabase RT] Subscribed to global-updates');
          }
        });

      console.log('[Supabase RT] Connecting...');
    } catch (error) {
      console.error('[Supabase RT] Connection error:', error);
    }
  }, [dispatchEvent]);

  const disconnectSupabase = useCallback(() => {
    if (globalChannelRef.current) {
      globalChannelRef.current.unsubscribe();
      globalChannelRef.current = null;
    }
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.unsubscribe();
      supabaseChannelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // ── Pusher WebSocket (development) ──
  const buildWsUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/app/${PUSHER_APP_KEY}?protocol=7&client=idol-meta&version=1.0.0&XTransformPort=${PUSHER_PORT}`;
  }, []);

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const stopPing = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const startPing = useCallback(() => {
    stopPing();
    pingTimerRef.current = setInterval(() => {
      send({ event: 'pusher:ping' });
    }, PING_INTERVAL);
  }, [send, stopPing]);

  const subscribe = useCallback((channel: string, channelData?: string) => {
    const data: Record<string, unknown> = { channel };
    if (channelData) data.channel_data = channelData;
    send({ event: 'pusher:subscribe', data: JSON.stringify(data) });
  }, [send]);

  const unsubscribe = useCallback((channel: string) => {
    send({ event: 'pusher:unsubscribe', data: JSON.stringify({ channel }) });
  }, [send]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[Pusher] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptRef.current),
      RECONNECT_MAX_DELAY
    );

    reconnectAttemptRef.current++;

    reconnectTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      connectFnRef.current();
    }, delay);
  }, []);

  const connectPusher = useCallback(() => {
    const url = buildWsUrl();
    if (!url) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      if (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
        startPing();

        if (currentTournamentRef.current) {
          subscribe(`private-tournament-${currentTournamentRef.current}`);
        }
        subscribe('global-updates');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string);

          if (msg.event === 'pusher:connection_established') return;
          if (msg.event === 'pusher:subscription_succeeded') return;
          if (msg.event === 'pusher:pong' || msg.event === 'pusher:ping') return;

          if (msg.event && msg.data) {
            dispatchEvent(msg.event, msg.data);
          }
        } catch (_e) {
          // Ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        stopPing();
        scheduleReconnect();
      };

      ws.onerror = () => {
        // Error is followed by onclose, reconnection handled there
      };
    } catch (e) {
      console.error('[Pusher] Connection error:', e);
      scheduleReconnect();
    }
  }, [buildWsUrl, startPing, stopPing, scheduleReconnect, subscribe, dispatchEvent]);

  useEffect(() => {
    connectFnRef.current = connectPusher;
  }, [connectPusher]);

  // ── Connect on mount ──
  useEffect(() => {
    mountedRef.current = true;

    if (isSupabaseMode()) {
      connectSupabase();
    } else {
      connectPusher();
    }

    return () => {
      mountedRef.current = false;
      stopPing();

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      // Disconnect Pusher
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      }
      wsRef.current = null;

      // Disconnect Supabase
      disconnectSupabase();
    };
  }, [connectPusher, connectSupabase, stopPing, disconnectSupabase]);

  // ── Join tournament (Supabase) ──
  const joinTournamentSupabase = useCallback(async (tournamentId: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const channelName = `tournament-${tournamentId}`;

      // Leave previous tournament channel
      if (supabaseChannelRef.current) {
        await supabaseChannelRef.current.unsubscribe();
      }

      currentTournamentRef.current = tournamentId;

      supabaseChannelRef.current = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
          },
        })
        .on('broadcast', { event: '*' }, (payload: any) => {
          dispatchEvent(payload.event || payload.payload?.type, payload.payload || payload);
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Supabase RT] Subscribed to ${channelName}`);
          }
        });
    } catch (error) {
      console.error('[Supabase RT] Error joining tournament:', error);
    }
  }, [dispatchEvent]);

  // ── joinTournament ──
  const joinTournament = useCallback((tournamentId: string) => {
    currentTournamentRef.current = tournamentId;

    if (isSupabaseMode()) {
      joinTournamentSupabase(tournamentId);
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribe(`private-tournament-${tournamentId}`);
    }
  }, [subscribe, joinTournamentSupabase]);

  // ── leaveTournament ──
  const leaveTournament = useCallback(() => {
    const id = currentTournamentRef.current;
    if (id) {
      if (isSupabaseMode()) {
        if (supabaseChannelRef.current) {
          supabaseChannelRef.current.unsubscribe();
          supabaseChannelRef.current = null;
        }
      } else {
        unsubscribe(`private-tournament-${id}`);
      }
    }
    currentTournamentRef.current = null;
  }, [unsubscribe]);

  // ── Legacy API methods ──
  const sendMatchUpdate = useCallback(
    (tournamentId: string, matchId: string, scoreA: number, scoreB: number) => {
      fetch('/api/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, scoreA, scoreB, tournamentId }),
      }).catch(() => {});
    },
    []
  );

  const sendMatchComplete = useCallback(
    (tournamentId: string, matchId: string, winnerId: string, mvpId?: string) => {
      fetch('/api/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winnerId, mvpId, tournamentId, status: 'completed' }),
      }).catch(() => {});
    },
    []
  );

  const sendAnnouncement = useCallback(
    (tournamentId: string, message: string, type: 'info' | 'warning' | 'success') => {
      fetch('/api/tournaments/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, message, type }),
      }).catch(() => {});
    },
    []
  );

  const sendDonation = useCallback(
    (tournamentId: string | undefined, amount: number, userName: string, message?: string) => {
      fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, message, anonymous: false, tournamentId }),
      }).catch(() => {});
    },
    []
  );

  return {
    isConnected,
    joinTournament,
    leaveTournament,
    sendMatchUpdate,
    sendMatchComplete,
    sendAnnouncement,
    sendDonation,
  };
}
