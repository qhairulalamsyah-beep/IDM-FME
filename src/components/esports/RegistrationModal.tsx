'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  ChevronRight,
  Camera,
  UserCheck,
  Loader2,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { AvatarUpload } from '@/components/esports/AvatarUpload';

interface RegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  division: 'male' | 'female';
  tournament: {
    id: string;
    name: string;
    status: string;
    week: number;
    prizePool: number;
  } | null;
  users?: {
    id: string;
    name: string;
    phone?: string;
    city?: string | null;
    avatar?: string | null;
    club?: { name: string } | null;
  }[];
  onRegister: (
    name: string,
    phone: string,
    avatarUrl: string,
    club?: string,
    city?: string,
  ) => void;
}

export function RegistrationModal({
  isOpen,
  onOpenChange,
  division,
  tournament,
  users = [],
  onRegister,
}: RegistrationModalProps) {
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerCity, setRegisterCity] = useState('');
  const [registerClub, setRegisterClub] = useState('');
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [isAutoLoaded, setIsAutoLoaded] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMale = division === 'male';
  const accentClass = isMale ? 'text-[--ios-gold]' : 'text-[--ios-pink]';
  const accentBg = isMale ? 'bg-[--ios-gold]' : 'bg-[--ios-pink]';
  const btnClass = isMale ? 'btn-gold' : 'btn-pink';

  /* ── Reset form when modal closes ── */
  const resetForm = useCallback(() => {
    setRegisterName('');
    setRegisterPhone('');
    setRegisterCity('');
    setRegisterClub('');
    setUploadedAvatarUrl(null);
    setIsAutoLoaded(false);
    setIsLookingUp(false);
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
  }, []);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetForm();
      }
      onOpenChange(open);
    },
    [onOpenChange, resetForm],
  );

  /* ── Debounced user lookup on name change ── */
  useEffect(() => {
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }

    const trimmedName = registerName.trim().toLowerCase();

    // Don't lookup if name is too short — clear auto-load
    if (trimmedName.length < 2) {
      lookupTimerRef.current = setTimeout(() => {
        setIsAutoLoaded(false);
        setIsLookingUp(false);
      }, 0);
      return;
    }

    // Debounce: wait 400ms after user stops typing
    lookupTimerRef.current = setTimeout(() => {
      setIsLookingUp(true);
      const existing = users.find(
        (u) => u.name.trim().toLowerCase() === trimmedName,
      );
      if (existing) {
        if (existing.avatar && !uploadedAvatarUrl) {
          setUploadedAvatarUrl(existing.avatar);
        }
        if (existing.phone && !registerPhone) {
          setRegisterPhone(existing.phone);
        }
        if (existing.city && !registerCity) {
          setRegisterCity(existing.city);
        }
        if (existing.club?.name && !registerClub) {
          setRegisterClub(existing.club.name);
        }
        setIsAutoLoaded(true);
      } else {
        setIsAutoLoaded(false);
      }
      setIsLookingUp(false);
    }, 400);

    return () => {
      if (lookupTimerRef.current) {
        clearTimeout(lookupTimerRef.current);
      }
    };
  }, [registerName, users]);

  const handleAvatarUpload = useCallback((url: string) => {
    setUploadedAvatarUrl(url);
    setIsAutoLoaded(false);
  }, []);

  const handleAvatarClear = useCallback(() => {
    setUploadedAvatarUrl(null);
    setIsAutoLoaded(false);
  }, []);

  const handleRegister = () => {
    if (registerName.trim() && uploadedAvatarUrl) {
      onRegister(
        registerName.trim(),
        registerPhone.trim(),
        uploadedAvatarUrl,
        registerClub.trim() || undefined,
        registerCity.trim() || undefined,
      );
      onOpenChange(false);
    }
  };

  const isRegistrationOpen = tournament?.status === 'registration';

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        className="!max-h-[92vh] rounded-t-[28px] ios-modal-content bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/[0.06] overflow-hidden"
      >
        {/* Drag handle */}
        <div className="ios-sheet-grabber flex justify-center pt-2 pb-0">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        <SheetHeader className="px-5 pt-3 pb-1">
          <SheetTitle className="text-white/90 text-base font-bold flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isMale ? 'bg-amber-500/12' : 'bg-violet-500/12'
              }`}
            >
              <UserPlus
                className={`w-[18px] h-[18px] ${
                  isMale ? 'text-amber-400' : 'text-violet-400'
                }`}
              />
            </div>
            <div className="text-left">
              <span>Gabung Turnamen</span>
              {tournament && (
                <p className="text-[11px] text-white/30 font-normal mt-0.5">
                  Week {tournament.week} &bull; {tournament.name}
                </p>
              )}
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Formulir pendaftaran turnamen
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 overscroll-contain px-5 pb-6 max-h-[calc(92vh-80px)]">
          <AnimatePresence mode="wait">
            {isRegistrationOpen ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-4 pt-2"
              >
                {/* Registration status badge */}
                <div className="flex items-center gap-2">
                  <span className="status-pill status-registration text-[11px]">
                    PENDAFTARAN DIBUKA
                  </span>
                  {tournament?.prizePool !== undefined &&
                    tournament.prizePool > 0 && (
                      <span className="text-[11px] text-white/35 font-medium">
                        Prize:{' '}
                        <span className={accentClass}>
                          Rp {tournament.prizePool.toLocaleString('id-ID')}
                        </span>
                      </span>
                    )}
                </div>

                {/* ── Form Header ── */}
                <div className="glass-heavy rounded-2xl p-4 space-y-3.5">
                  {/* Header info */}
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isMale ? 'bg-amber-500/12' : 'bg-violet-500/12'
                      }`}
                    >
                      <UserPlus
                        className={`w-5 h-5 ${
                          isMale ? 'text-amber-400' : 'text-violet-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="ios-section-title text-[13px] font-bold text-white/90">
                        Formulir Pendaftaran
                      </h3>
                      <p className="text-[11px] text-white/30 font-medium">
                        Isi data dan upload foto karakter untuk bergabung
                      </p>
                    </div>
                  </div>

                  {/* ── Data Fields ── */}
                  <div className="space-y-3">
                    {/* Nama */}
                    <div>
                      <label className="text-[11px] text-white/40 mb-1.5 block uppercase tracking-wider font-semibold">
                        Nama <span className="text-purple-400/60">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          placeholder="Nama lengkap pemain"
                          className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 pr-10 text-white/90 text-sm placeholder-white/25 focus:outline-none focus:bg-white/[0.06] focus:ring-1 transition-all ${
                            isAutoLoaded
                              ? 'border-sky-400/30 focus:border-sky-400/40 focus:ring-sky-400/10'
                              : 'border-white/[0.06] focus:border-amber-400/30 focus:ring-amber-400/10'
                          }`}
                        />
                        {/* Loading spinner while looking up */}
                        {isLookingUp && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                          </div>
                        )}
                        {/* Check icon when existing user found */}
                        {isAutoLoaded && !isLookingUp && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 25,
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <UserCheck className="w-4 h-4 text-sky-400" />
                          </motion.div>
                        )}
                      </div>
                      {/* Auto-detected hint */}
                      <AnimatePresence>
                        {isAutoLoaded && !isLookingUp && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[11px] text-sky-400/70 mt-1 flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            Pemain ditemukan — data otomatis terisi
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* WA + Club side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-white/40 mb-1.5 block uppercase tracking-wider font-semibold">
                          No. WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          placeholder="08xxx"
                          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-3 text-white/90 text-[13px] placeholder-white/25 focus:outline-none focus:border-amber-400/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-amber-400/10 transition-all"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1.5 uppercase tracking-wider font-semibold">
                          Club
                        </label>
                        <input
                          type="text"
                          value={registerClub}
                          onChange={(e) => setRegisterClub(e.target.value)}
                          placeholder="Nama club"
                          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-3 text-white/90 text-[13px] placeholder-white/25 focus:outline-none focus:border-amber-400/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-amber-400/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* Asal Kota */}
                    <div>
                      <label className="text-[11px] text-white/40 mb-1.5 block uppercase tracking-wider font-semibold">
                        Asal Kota
                      </label>
                      <input
                        type="text"
                        value={registerCity}
                        onChange={(e) => setRegisterCity(e.target.value)}
                        placeholder="Contoh: Jakarta, Bandung, Surabaya"
                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-[13px] placeholder-white/25 focus:outline-none focus:border-amber-400/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-amber-400/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="divider ios-modal-divider" />

                  {/* ── Avatar Upload ── */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white/40 mb-2 uppercase tracking-wider font-semibold">
                      <Camera
                        className={`w-3 h-3 ${
                          isMale ? 'text-amber-400' : 'text-violet-400'
                        }`}
                      />
                      Foto Karakter <span className="text-purple-400/60">*</span>
                    </label>
                    <AvatarUpload
                      division={division}
                      onUpload={handleAvatarUpload}
                      previewUrl={uploadedAvatarUrl}
                      onClear={handleAvatarClear}
                      autoLoaded={isAutoLoaded}
                    />
                  </div>
                </div>

                {/* ── Submit Button ── */}
                <motion.button
                  onClick={handleRegister}
                  className={`${btnClass} btn-ios w-full py-3.5 text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 hero-shimmer-btn relative overflow-hidden`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!registerName.trim() || !uploadedAvatarUrl}
                >
                  <span className="relative z-[2] flex items-center gap-2">
                    <UserPlus className="w-[18px] h-[18px]" />
                    GABUNG TURNAMEN
                    <ChevronRight className="w-[16px] h-[16px]" />
                  </span>
                </motion.button>

                {!uploadedAvatarUrl && (
                  <p className="text-[11px] text-white/30 text-center -mt-1">
                    Upload foto karakter untuk melanjutkan pendaftaran
                  </p>
                )}
              </motion.div>
            ) : (
              /* ── Registration Not Open ── */
              <motion.div
                key="closed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center justify-center py-12 px-6 text-center"
              >
                <div
                  className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center ${
                    isMale ? 'bg-amber-500/8' : 'bg-violet-500/8'
                  }`}
                >
                  {tournament?.status === 'live' ? (
                    <ShieldCheck
                      className={`w-8 h-8 ${
                        isMale ? 'text-[--ios-gold]/30' : 'text-[--ios-pink]/30'
                      }`}
                    />
                  ) : (
                    <Clock
                      className={`w-8 h-8 ${
                        isMale ? 'text-[--ios-gold]/30' : 'text-[--ios-pink]/30'
                      }`}
                    />
                  )}
                </div>

                <h3 className="text-base font-bold text-white/70 mb-2">
                  {tournament?.status === 'live'
                    ? 'Turnamen Sedang Berlangsung'
                    : tournament?.status === 'completed'
                      ? 'Turnamen Sudah Selesai'
                      : 'Pendaftaran Belum Dibuka'}
                </h3>

                <p className="text-sm text-white/35 max-w-[260px] leading-relaxed">
                  {tournament?.status === 'live'
                    ? 'Pendaftaran sudah ditutup. Turnamen sedang berlangsung.'
                    : tournament?.status === 'completed'
                      ? 'Turnamen ini sudah selesai. Nantikan turnamen berikutnya!'
                      : 'Sabar ya! Pendaftaran akan segera dibuka oleh admin.'}
                </p>

                <div className="flex items-center gap-1.5 mt-4">
                  <span
                    className={`status-pill text-[11px] ${
                      tournament?.status === 'live'
                        ? 'status-live'
                        : tournament?.status === 'completed'
                          ? 'status-setup'
                          : 'status-setup'
                    }`}
                  >
                    {tournament?.status?.toUpperCase() || 'SETUP'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
