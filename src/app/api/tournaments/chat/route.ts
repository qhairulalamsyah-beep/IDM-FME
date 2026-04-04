import { NextRequest, NextResponse } from 'next/server';

/* ────────────────────────────────────────────
   In-memory chat message store
   ──────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  source?: 'web' | 'whatsapp';
}

// Map of tournamentId → ChatMessage[]
const chatStore = new Map<string, ChatMessage[]>();
const MAX_MESSAGES_PER_TOURNAMENT = 200;

// Shared secret for WhatsApp bot → Next.js bridge
const CHAT_BRIDGE_SECRET = process.env.CHAT_BRIDGE_SECRET || 'idm-chat-bridge-2025';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/* ────────────────────────────────────────────
   POST /api/tournaments/chat
   Send a new message (from web chat)
   ──────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, userId, userName, message, source } = body;

    if (!tournamentId || !message) {
      return NextResponse.json(
        { error: 'tournamentId and message are required' },
        { status: 400 }
      );
    }

    // Validate userId and userName are provided (no anonymous chat)
    if (!userId || !userName || userId === 'anon' || userName === 'Pengunjung') {
      return NextResponse.json(
        { error: 'Identitas pengguna diperlukan. Silakan masukkan nama terlebih dahulu.' },
        { status: 403 }
      );
    }

    const trimmed = typeof message === 'string' ? message.trim() : '';
    if (!trimmed) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmed.length > 300) {
      return NextResponse.json(
        { error: 'Message too long (max 300 characters)' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const cleanUserName = String(userName).trim().slice(0, 25);
    const cleanUserId = String(userId).trim().slice(0, 40);
    const msgSource = source === 'whatsapp' ? 'whatsapp' : 'web';

    const newMessage: ChatMessage = {
      id: generateId(),
      userId: cleanUserId,
      userName: cleanUserName,
      message: trimmed,
      timestamp: new Date().toISOString(),
      source: msgSource,
    };

    // Get or create store for this tournament
    let store = chatStore.get(tournamentId);
    if (!store) {
      store = [];
      chatStore.set(tournamentId, store);
    }

    // Add message and enforce cap
    store.push(newMessage);
    if (store.length > MAX_MESSAGES_PER_TOURNAMENT) {
      store.splice(0, store.length - MAX_MESSAGES_PER_TOURNAMENT);
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/* ────────────────────────────────────────────
   GET /api/tournaments/chat?tournamentId=xxx
   Fetch messages for a tournament
   ──────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId query parameter is required' },
        { status: 400 }
      );
    }

    const store = chatStore.get(tournamentId) || [];
    return NextResponse.json(store);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/* ────────────────────────────────────────────
   POST /api/tournaments/chat/whatsapp
   Bridge endpoint for WhatsApp bot
   Requires X-Chat-Bridge-Secret header
   ──────────────────────────────────────────── */

export async function PUT(request: NextRequest) {
  try {
    // For internal requests (localhost), skip secret validation
    // External requests must provide X-Chat-Bridge-Secret header
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const isInternal = clientIP === 'unknown' || clientIP === '::1' || clientIP.startsWith('127.') || clientIP.startsWith('10.') || clientIP.startsWith('172.') || clientIP.startsWith('192.168.');

    if (!isInternal) {
      const bridgeSecret = request.headers.get('x-chat-bridge-secret');
      if (bridgeSecret !== CHAT_BRIDGE_SECRET) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid bridge secret' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { tournamentId, userId, userName, message, senderPhone } = body;

    if (!tournamentId || !message) {
      return NextResponse.json(
        { error: 'tournamentId and message are required' },
        { status: 400 }
      );
    }

    if (!userName || typeof userName !== 'string' || !userName.trim()) {
      return NextResponse.json(
        { error: 'userName is required' },
        { status: 400 }
      );
    }

    const trimmed = String(message).trim();
    if (!trimmed || trimmed.length > 300) {
      return NextResponse.json(
        { error: 'Invalid message (empty or too long)' },
        { status: 400 }
      );
    }

    const cleanUserName = String(userName).trim().slice(0, 25);
    // Use phone as userId if available, otherwise generate from name
    const cleanUserId = senderPhone
      ? `wa-${String(senderPhone).replace(/[^0-9]/g, '').slice(-12)}`
      : `wa-${cleanUserName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}-${Math.random().toString(36).substring(2, 6)}`;

    const newMessage: ChatMessage = {
      id: generateId(),
      userId: cleanUserId,
      userName: cleanUserName,
      message: trimmed,
      timestamp: new Date().toISOString(),
      source: 'whatsapp',
    };

    // Get or create store for this tournament
    let store = chatStore.get(tournamentId);
    if (!store) {
      store = [];
      chatStore.set(tournamentId, store);
    }

    // Add message and enforce cap
    store.push(newMessage);
    if (store.length > MAX_MESSAGES_PER_TOURNAMENT) {
      store.splice(0, store.length - MAX_MESSAGES_PER_TOURNAMENT);
    }

    console.log(`[Chat Bridge] 📱 WA message from ${cleanUserName} (${cleanUserId}): "${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}"`);

    return NextResponse.json({ success: true, message: newMessage });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
