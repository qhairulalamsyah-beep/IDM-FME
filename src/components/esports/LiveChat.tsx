'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, UserCircle, Pencil, Check, ArrowLeft, Phone } from 'lucide-react';

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface LiveChatProps {
  tournamentId?: string;
  division: 'male' | 'female';
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  source?: 'web' | 'whatsapp';
}

/* ────────────────────────────────────────────
   Avatar Gradient Presets (deterministic by userId)
   ──────────────────────────────────────────── */

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #FF6B6B, #EE5A24)',
  'linear-gradient(135deg, #48DBFB, #0ABDE3)',
  'linear-gradient(135deg, #FECA57, #FF9F43)',
  'linear-gradient(135deg, #5F27CD, #341F97)',
  'linear-gradient(135deg, #1DD1A1, #10AC84)',
  'linear-gradient(135deg, #A78BFA, #7C3AED)',
  'linear-gradient(135deg, #54A0FF, #2E86DE)',
  'linear-gradient(135deg, #F368E0, #BE2EDD)',
];

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAvatarGradient(userId: string): string {
  return AVATAR_GRADIENTS[hashUserId(userId) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  const d = new Date(timestamp);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const timeStr = `${h}:${m}`;

  if (diffSec < 60) return timeStr;
  if (diffMin < 60) return timeStr;
  if (diffHour < 24) return timeStr;
  return `${d.getDate()}/${d.getMonth() + 1} ${timeStr}`;
}

function isToday(timestamp: string): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

/* ────────────────────────────────────────────
   Division Adaptive Color Tokens
   ──────────────────────────────────────────── */

function getChatTokens(division: 'male' | 'female') {
  const isMale = division === 'male';
  return {
    sentBubbleBg: isMale
      ? 'background: linear-gradient(135deg, #B8860B, #DAA520)'
      : 'background: linear-gradient(135deg, #7C3AED, #A78BFA)',
    sentBubbleBgStyle: isMale
      ? 'linear-gradient(135deg, #92700C, #C4951D)'
      : 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
    sentTextColor: 'text-white',
    accentColor: isMale ? '#FFD60A' : '#A78BFA',
    headerBg: isMale
      ? 'background: linear-gradient(135deg, rgba(255,214,10,0.08), rgba(255,149,0,0.06))'
      : 'background: linear-gradient(135deg, rgba(167,139,250,0.08), rgba(236,72,153,0.06))',
    sendBtnBg: isMale
      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
      : 'bg-gradient-to-r from-purple-500 to-violet-500',
    sendBtnText: isMale ? 'text-black' : 'text-white/90',
    senderNameColor: isMale ? 'text-amber-300/80' : 'text-purple-300/80',
    waIconBg: 'background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.25)',
  };
}

/* ────────────────────────────────────────────
   Chat Identity System
   ──────────────────────────────────────────── */

const CHAT_IDENTITY_KEY = 'idm-chat-identity';

interface ChatIdentity {
  userId: string;
  userName: string;
}

function loadChatIdentity(): ChatIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHAT_IDENTITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveChatIdentity(identity: ChatIdentity) {
  localStorage.setItem(CHAT_IDENTITY_KEY, JSON.stringify(identity));
}

function generateUserId(name: string): string {
  const prefix = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${suffix}`;
}

/* ────────────────────────────────────────────
   LiveChat Component
   ──────────────────────────────────────────── */

export function LiveChat({ tournamentId, division }: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Chat identity
  const [chatIdentity, setChatIdentity] = useState<ChatIdentity | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isMale = division === 'male';
  const t = getChatTokens(division);
  const MAX_MESSAGES = 200;

  // Unique participants count
  const uniqueParticipants = useMemo(() => {
    return new Set(messages.map((m) => m.userId)).size;
  }, [messages]);

  /* ── Load chat identity on mount ── */
  useEffect(() => {
    setChatIdentity(loadChatIdentity());
  }, []);

  /* ── Reset on tournamentId change ── */
  useEffect(() => {
    setMessages([]);
    setInputValue('');
    setIsOpen(false);
  }, [tournamentId]);

  /* ── Auto-scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Focus input when chat opens ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (chatIdentity) {
          inputRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
        }
      }, 350);
    }
  }, [isOpen, chatIdentity]);

  /* ── Focus name input when editing ── */
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isEditingName]);

  /* ── Polling (3s for faster live feel) ── */
  const fetchMessages = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const res = await fetch(`/api/tournaments/chat?tournamentId=${encodeURIComponent(tournamentId)}`);
      if (!res.ok) return;
      const data: ChatMessage[] = await res.json();
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = data.filter((m) => !existingIds.has(m.id));
        const merged = [...prev, ...newMsgs];
        return merged.slice(-MAX_MESSAGES);
      });
    } catch {
      // Silent fail
    }
  }, [tournamentId]);

  useEffect(() => {
    if (isOpen && tournamentId) {
      setIsLoading(true);
      fetchMessages().finally(() => setIsLoading(false));
      pollIntervalRef.current = setInterval(fetchMessages, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, tournamentId, fetchMessages]);

  /* ── Set Chat Identity ── */
  const handleSetIdentity = () => {
    const name = nameInput.trim();
    if (!name) {
      setNameError('Nama tidak boleh kosong');
      return;
    }
    if (name.length < 2) {
      setNameError('Nama minimal 2 karakter');
      return;
    }
    if (name.length > 20) {
      setNameError('Nama maksimal 20 karakter');
      return;
    }

    if (chatIdentity && chatIdentity.userName === name) {
      setIsEditingName(false);
      return;
    }

    const identity: ChatIdentity = {
      userId: chatIdentity?.userId || generateUserId(name),
      userName: name,
    };

    saveChatIdentity(identity);
    setChatIdentity(identity);
    setIsEditingName(false);
    setNameError('');
    setNameInput('');
  };

  /* ── Send Message ── */
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !tournamentId || isSending || !chatIdentity) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/tournaments/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          userId: chatIdentity.userId,
          userName: chatIdentity.userName,
          message: text,
          source: 'web',
        }),
      });

      if (res.ok) {
        setInputValue('');
        await fetchMessages();
      }
    } catch {
      // Silent fail
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSetIdentity();
    }
  };

  /* ── Close handler ── */
  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setIsEditingName(false);
    setNameError('');
    setNameInput('');
  };

  /* ── Don't render if no tournament ── */
  if (!tournamentId) return null;

  return (
    <>
      {/* ═══════════════════════════════════════
          Chat Panel — WhatsApp Group Style
          ═══════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && chatIdentity && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={handleClose}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[56] lg:hidden rounded-t-3xl overflow-hidden flex flex-col"
              style={{
                height: '92vh',
                background: '#0B0E11',
                border: '0.5px solid rgba(255,255,255,0.06)',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) {
                  handleClose();
                }
              }}
            >
              {/* ═══ WhatsApp-style Header ═══ */}
              <div
                className="flex items-center px-3 py-2.5 flex-shrink-0"
                style={{ ...{ t: t.headerBg } as any, borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                {/* Back button */}
                <motion.button
                  onClick={handleClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors flex-shrink-0"
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowLeft className="w-5 h-5 text-white/70" />
                </motion.button>

                {/* Group info */}
                <div className="flex items-center gap-3 ml-2 flex-1 min-w-0">
                  {/* Group avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isMale
                        ? 'linear-gradient(135deg, rgba(255,214,10,0.25), rgba(255,149,0,0.2))'
                        : 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(236,72,153,0.2))',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <MessageSquare
                      className="w-5 h-5"
                      style={{ color: t.accentColor }}
                      strokeWidth={1.8}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-semibold text-white/90 truncate">
                        Live Chat TARKAM
                      </h3>
                      {/* Online indicator */}
                      <motion.div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: '#25D366' }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                    <p className="text-[11px] text-white/35 truncate">
                      {uniqueParticipants > 0
                        ? `${uniqueParticipants} peserta`
                        : 'Grup live chat'
                      }
                    </p>
                  </div>
                </div>

                {/* Identity / Edit name */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
                        onKeyDown={handleNameKeyDown}
                        placeholder="Nama..."
                        maxLength={20}
                        className="h-7 w-24 rounded-lg bg-white/[0.08] text-white/80 text-[11px] px-2 outline-none border border-white/10 focus:border-amber-400/30"
                      />
                      <motion.button
                        onClick={handleSetIdentity}
                        className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"
                        whileTap={{ scale: 0.85 }}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </motion.button>
                      <motion.button
                        onClick={() => { setIsEditingName(false); setNameError(''); setNameInput(''); }}
                        className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center"
                        whileTap={{ scale: 0.85 }}
                      >
                        <X className="w-3 h-3 text-white/40" />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => { setIsEditingName(true); setNameInput(chatIdentity.userName); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                      whileTap={{ scale: 0.93 }}
                    >
                      <UserCircle className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-[10.5px] font-medium text-white/50 max-w-[70px] truncate">
                        {chatIdentity.userName}
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-white/20" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* ═══ Message List ═══ */}
              <div
                className="flex-1 min-h-0 overflow-y-auto px-3 py-2"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.008) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.005) 0%, transparent 40%)
                  `,
                }}
              >
                {isLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-white/25 text-xs">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/15 border-t-white/40 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Memuat chat...</span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-white/15">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <MessageSquare className="w-8 h-8" strokeWidth={1} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-white/25">Belum ada pesan</p>
                      <p className="text-[10px] text-white/15 mt-1">Jadilah yang pertama mengirim pesan!</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {/* Date separator */}
                    {messages.length > 0 && isToday(messages[0].timestamp) && (
                      <div className="flex justify-center my-3">
                        <span
                          className="text-[10px] font-medium text-white/25 px-3 py-1 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.03)' }}
                        >
                          Hari ini
                        </span>
                      </div>
                    )}

                    {messages.map((msg, idx) => {
                      const isMe = msg.userId === chatIdentity?.userId;
                      const isFromWA = msg.source === 'whatsapp';
                      const gradient = getAvatarGradient(msg.userId);
                      const initials = getInitials(msg.userName);

                      // Check if previous message is from same sender
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const isConsecutive = prevMsg?.userId === msg.userId;

                      // Check if this is the last message from this sender in a group
                      const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                      const isLastInGroup = nextMsg?.userId !== msg.userId;

                      if (isMe) {
                        // ── Sent Message (right-aligned) ──
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="flex justify-end"
                            style={{ marginTop: isConsecutive ? 2 : 6 }}
                          >
                            <div
                              className="relative max-w-[80%] px-3 py-1.5"
                              style={{
                                background: t.sentBubbleBgStyle,
                                borderRadius: isLastInGroup
                                  ? '12px 4px 12px 12px'
                                  : '12px 4px 12px 12px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                              }}
                            >
                              {/* WhatsApp source badge */}
                              {isFromWA && (
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className="text-[8px] font-bold text-emerald-400/80">WEB</span>
                                </div>
                              )}
                              <p className={`text-[13px] leading-[1.35] break-words ${t.sentTextColor}`}>
                                {msg.message}
                              </p>
                              <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
                                <span className="text-[9px] text-white/35 tabular-nums">
                                  {getRelativeTime(msg.timestamp)}
                                </span>
                                <svg className="w-3.5 h-3.5 text-white/35" viewBox="0 0 16 11" fill="currentColor">
                                  <path d="M11.07 0.73L5.42 6.38l-2.29-2.3L1.45 5.76l3.97 3.97 6.64-6.64z" />
                                  <path d="M14.07 0.73L8.42 6.38l-.96-.97 1.68-1.68-1.41-1.41-1.68 1.68-.29-.3L5.45 5.76l3.97 3.97 6.64-6.64z" opacity="0.5" />
                                </svg>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      // ── Received Message (left-aligned) ──
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="flex items-end gap-2"
                          style={{ marginTop: isConsecutive ? 1 : 8, paddingLeft: isConsecutive ? 42 : 0 }}
                        >
                          {/* Avatar — only show for first message in group */}
                          {!isConsecutive && (
                            <div
                              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mb-5"
                              style={{
                                background: gradient,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                              }}
                            >
                              {initials}
                            </div>
                          )}

                          {/* Message content */}
                          <div className="flex-1 min-w-0">
                            {/* Sender name — only show for first message in group */}
                            {!isConsecutive && (
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[12px] font-semibold ${t.senderNameColor} truncate`}>
                                  {msg.userName}
                                </span>
                                {/* WhatsApp badge */}
                                {isFromWA && (
                                  <span
                                    className="flex items-center gap-0.5 px-1.5 py-0 rounded-full flex-shrink-0"
                                    style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.15)' }}
                                  >
                                    <Phone className="w-2.5 h-2.5 text-emerald-400" strokeWidth={2.5} />
                                    <span className="text-[7.5px] font-bold text-emerald-400/70">WA</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Bubble */}
                            <div
                              className="relative inline-block max-w-[85%] px-2.5 py-1.5"
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: isLastInGroup
                                  ? '4px 12px 12px 12px'
                                  : '4px 12px 4px 12px',
                                border: '0.5px solid rgba(255,255,255,0.04)',
                              }}
                            >
                              <p className="text-[13px] text-white/75 leading-[1.35] break-words">
                                {msg.message}
                              </p>
                              <span className="text-[9px] text-white/20 tabular-nums float-right ml-3 -mb-0.5 mt-0.5">
                                {getRelativeTime(msg.timestamp)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ═══ WhatsApp-style Input Bar ═══ */}
              <div
                className="flex items-end gap-2 px-3 py-2 flex-shrink-0"
                style={{
                  paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
                  background: 'rgba(20,24,28,0.95)',
                  borderTop: '0.5px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Text Input */}
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan..."
                    maxLength={300}
                    className="w-full h-10 rounded-full bg-white/[0.06] text-white/80 text-[13px] px-4 outline-none transition-all duration-200 placeholder:text-white/20"
                    style={{
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  />
                </div>

                {/* Send Button */}
                <motion.button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSending}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.sendBtnBg}`}
                  whileTap={{ scale: 0.85 }}
                  whileHover={inputValue.trim() ? { scale: 1.06 } : {}}
                  transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                  style={{ opacity: inputValue.trim() && !isSending ? 1 : 0.35 }}
                >
                  <Send className={`w-4 h-4 ${t.sendBtnText}`} strokeWidth={2.2} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          Chat Identity Setup Screen
          ═══════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && !chatIdentity && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={handleClose}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[56] lg:hidden rounded-t-3xl overflow-hidden"
              style={{
                maxHeight: '85vh',
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(64px) saturate(200%)',
                WebkitBackdropFilter: 'blur(64px) saturate(200%)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  handleClose();
                }
              }}
            >
              <div className="flex flex-col items-center justify-center px-6 py-12" style={{ minHeight: '50vh' }}>
                <div className="flex justify-center pt-3 pb-6 cursor-grab active:cursor-grabbing">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: isMale
                      ? 'linear-gradient(135deg, rgba(255,214,10,0.15), rgba(255,149,0,0.15))'
                      : 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(236,72,153,0.15))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <UserCircle
                    className="w-8 h-8"
                    style={{ color: isMale ? '#FFD60A' : '#A78BFA' }}
                    strokeWidth={1.5}
                  />
                </motion.div>

                <motion.h3
                  className="text-lg font-bold text-white/90 mb-1.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  Masuk ke Live Chat
                </motion.h3>

                <motion.p
                  className="text-xs text-white/35 mb-6 text-center leading-relaxed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  Masukkan nama/nickname kamu untuk bergabung<br />dalam diskusi live chat turnamen
                </motion.p>

                <motion.div
                  className="w-full max-w-xs"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameInput}
                    onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
                    onKeyDown={handleNameKeyDown}
                    placeholder="Ketik nama kamu..."
                    maxLength={20}
                    autoFocus
                    className={`w-full h-12 rounded-xl bg-white/[0.06] text-white/90 text-sm px-4 outline-none transition-all duration-200 placeholder:text-white/25 ${nameError ? 'border-red-400/40 focus:border-red-400/60' : 'border-white/[0.08] focus:border-amber-400/30'}`}
                    style={{
                      border: nameError ? undefined : '0.5px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                  {nameError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-red-400/70 mt-2 px-1"
                    >
                      {nameError}
                    </motion.p>
                  )}
                </motion.div>

                <motion.button
                  onClick={handleSetIdentity}
                  disabled={!nameInput.trim()}
                  className={`mt-4 w-full max-w-xs h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${t.sendBtnBg}`}
                  style={{ opacity: nameInput.trim() ? 1 : 0.4 }}
                  whileTap={{ scale: 0.96 }}
                  whileHover={nameInput.trim() ? { scale: 1.02 } : {}}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.3 }}
                >
                  <MessageSquare className={`w-4 h-4 ${t.sendBtnText}`} strokeWidth={2} />
                  <span className={t.sendBtnText}>Gabung Chat</span>
                </motion.button>

                <motion.p
                  className="text-[10px] text-white/20 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  Nama kamu akan terlihat oleh semua peserta chat
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          Floating Action Button
          ═══════════════════════════════════════ */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-24 right-4 z-[54] w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
          }}
        >
          <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
          {messages.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center" style={{ border: '2px solid #0B0E11' }}>
              <span className="text-[8px] font-bold text-white">{messages.length > 99 ? '99+' : messages.length}</span>
            </div>
          )}
        </motion.button>
      )}
    </>
  );
}
