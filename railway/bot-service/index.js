/**
 * IDM-FME WhatsApp Bot Service
 * 
 * Deployed on Railway as a standalone service.
 * Connects to Supabase for data and receives webhook events.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

// ── Configuration ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WEBHOOK_SECRET = process.env.WHATSAPP_BOT_SECRET || '';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// ── Supabase Client ────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Express App ────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'idm-bot-service', timestamp: new Date().toISOString() });
});

// Webhook receiver — receives events from main API
app.post('/webhook', (req, res) => {
  // Verify secret
  const secret = req.headers['x-webhook-secret'];
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }

  const { event, data } = req.body;
  console.log(`[Webhook] Received: ${event}`, data ? JSON.stringify(data).slice(0, 200) : '');

  // Handle events
  switch (event) {
    case 'match-completed':
      handleMatchCompleted(data);
      break;
    case 'tournament-announcement':
      handleAnnouncement(data);
      break;
    case 'donation-confirmed':
      handleDonation(data);
      break;
    case 'registration-approved':
      handleRegistrationApproved(data);
      break;
    default:
      console.log(`[Webhook] Unknown event: ${event}`);
  }

  res.json({ received: true });
});

// ── Event Handlers ─────────────────────────────────────────────
async function handleMatchCompleted(data: any) {
  console.log(`[Bot] Match completed: ${data.matchId}`);
  // TODO: Send WhatsApp notification to relevant groups/players
}

async function handleAnnouncement(data: any) {
  console.log(`[Bot] Announcement: ${data.message}`);
  // TODO: Send WhatsApp broadcast announcement
}

async function handleDonation(data: any) {
  console.log(`[Bot] Donation: ${data.amount} from ${data.userName}`);
  // TODO: Send thank-you message
}

async function handleRegistrationApproved(data: any) {
  console.log(`[Bot] Registration approved for: ${data.userName}`);
  // TODO: Send WhatsApp notification to player
}

// ── WhatsApp Connection (placeholder) ──────────────────────────
// This will be implemented with @whiskeysockets/baileys or whatsapp-web.js
// depending on the deployment environment.

async function connectWhatsApp() {
  console.log('[WhatsApp] Connection placeholder — implement with baileys/meta API');
  
  // For Meta Business API integration:
  // 1. Set up webhook endpoint at /webhook/meta
  // 2. Verify webhook token
  // 3. Handle incoming messages and status updates
}

// Meta API Webhook verification
app.get('/webhook/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[Meta] Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Meta API Webhook handler
app.post('/webhook/meta', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await handleIncomingMessage(change.value);
        }
      }
    }
    res.status(200).send('OK');
  } else {
    res.status(404).send('Not Found');
  }
});

async function handleIncomingMessage(value: any) {
  console.log('[Meta] Incoming message:', JSON.stringify(value).slice(0, 300));
  // TODO: Process incoming WhatsApp messages
}

// ── Start Server ───────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 IDM Bot Service running on port ${PORT}`);
  console.log(`📡 Supabase: ${SUPABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔗 API Base: ${API_BASE_URL}`);

  // Attempt WhatsApp connection
  connectWhatsApp().catch((err) => {
    console.error('[WhatsApp] Connection failed:', err.message);
  });
});

export default app;
