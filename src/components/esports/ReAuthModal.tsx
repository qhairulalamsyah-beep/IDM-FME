'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, XCircle } from 'lucide-react';
import { resolveReauth, cancelReauth } from '@/lib/admin-fetch';

const PIN_LENGTH = 6;

/**
 * Global ReAuthModal — shown when admin session expires (JWT expired)
 * and the admin needs to re-enter their PIN to continue.
 *
 * This modal is always mounted (in page.tsx) and listens for the
 * 'admin-reauth-required' event dispatched by adminFetch on 401.
 *
 * On successful PIN entry, it calls resolveReauth(true) which:
 * 1. Resolves the pending reauth Promise in adminFetch
 * 2. adminFetch retries the original request with the new JWT
 */
export function ReAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for reauth-required event
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setPin('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 150);
    };
    window.addEventListener('admin-reauth-required', handler);
    return () => window.removeEventListener('admin-reauth-required', handler);
  }, []);

  // Auto focus when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(value);
    setError('');

    if (value.length === PIN_LENGTH) {
      handleReauth(value);
    }
  };

  const handleReauth = async (pinValue: string) => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/reauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.admin) {
        // Store new session data (same as login)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('idm_admin_auth', 'true');
          localStorage.setItem('idm_admin_user', JSON.stringify(data.admin));
          if (data.token) {
            localStorage.setItem('idm_admin_token', data.token);
          }
          // Update legacy hash
          const encoder = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(pinValue));
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          localStorage.setItem('idm_admin_hash', hashHex);
        }

        // Dispatch event so store updates
        window.dispatchEvent(new CustomEvent('admin-auth-changed', {
          detail: { authenticated: true, admin: data.admin },
        }));

        // Close modal and resolve the pending reauth promise
        setIsOpen(false);
        setPin('');
        resolveReauth(true);
      } else {
        setError('PIN salah. Coba lagi.');
        setPin('');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        inputRef.current?.focus();
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPin('');
    setError('');
    // Cancel the pending reauth — original request will get 401
    cancelReauth();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-[340px]"
            initial={
              shake
                ? { scale: 1, opacity: 1, y: 0 }
                : { scale: 0.85, opacity: 0, y: 30 }
            }
            animate={
              shake
                ? { x: [0, -12, 10, -8, 6, -3, 0], scale: 1, opacity: 1, y: 0 }
                : { scale: 1, opacity: 1, y: 0 }
            }
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={
              shake
                ? { x: { duration: 0.5, ease: 'easeInOut' }, scale: { duration: 0 }, opacity: { duration: 0 }, y: { duration: 0 } }
                : { type: 'spring', damping: 28, stiffness: 350 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
              {/* Ambient glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl" />

              <div className="relative p-8 pt-10">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <XCircle className="w-4 h-4 text-white/40" />
                </button>

                <div className="flex flex-col items-center relative">
                  {/* Icon */}
                  <motion.div
                    className="relative mb-6"
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  >
                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-orange-400/30 to-orange-600/10 blur-2xl opacity-70" />
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400/20 to-orange-600/10 border border-orange-400/30 flex items-center justify-center">
                      <Fingerprint className="w-9 h-9 text-orange-400" />
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    className="text-xl font-bold text-white/90 tracking-tight mb-1"
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                  >
                    Sesi Berakhir
                  </motion.h2>
                  <motion.p
                    className="text-xs text-white/30 mb-8 font-medium text-center"
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  >
                    Masukkan PIN admin untuk melanjutkan
                  </motion.p>

                  {/* PIN Dots */}
                  <motion.div
                    className="flex items-center justify-center gap-4 mb-6"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.35 }}
                  >
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                      const isFilled = pin.length > i;
                      return (
                        <motion.div
                          key={i}
                          className="relative"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                            isFilled
                              ? 'border-orange-400 bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.5)]'
                              : 'border-white/20 bg-transparent'
                          }`} />
                          {isFilled && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            >
                              <div className="w-2 h-2 rounded-full bg-orange-300" />
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Hidden input */}
                  <input
                    ref={inputRef}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    value={pin}
                    onChange={handlePinChange}
                    className="absolute -top-10 left-0 w-1 h-1 opacity-0"
                    disabled={isSubmitting}
                    aria-label="Masukkan PIN admin"
                  />

                  {/* Click to focus hint */}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="w-full h-12 flex items-center justify-center text-xs text-white/20 hover:text-white/40 transition-colors mt-2"
                  >
                    {isSubmitting ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-white/20 border-t-orange-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      />
                    ) : (
                      'Ketuk untuk memasukkan PIN'
                    )}
                  </button>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="w-full mt-4"
                      >
                        <div className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 font-medium">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom gradient */}
              <div className="h-1 bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
