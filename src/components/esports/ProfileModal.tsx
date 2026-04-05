'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  Search,
  Edit3,
  X,
  Camera,
  Phone,
  MapPin,
  Trophy,
  Shield,
  LogOut,
  Check,
  Loader2,
  ChevronRight,
  Users,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

/* ── Interfaces ── */

interface UserProfile {
  id: string;
  name: string;
  gender: string;
  tier: string;
  points: number;
  avatar: string | null;
  phone: string | null;
  city: string | null;
  club: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  rankings: { points: number; wins: number; losses: number }[];
  isMVP: boolean;
  createdAt: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  division: 'male' | 'female';
}

/* ── Tier helpers ── */

const tierConfig: Record<string, { label: string; badgeClass: string }> = {
  S: { label: 'Profesional', badgeClass: 'tier-s' },
  A: { label: 'Lanjutan', badgeClass: 'tier-a' },
  B: { label: 'Pemula', badgeClass: 'tier-b' },
};

const STORAGE_KEY_ID = 'idm_player_profile_id';
const STORAGE_KEY_DATA = 'idm_player_profile_data';

/* ── Main Component ── */

export function ProfileModal({ isOpen, onOpenChange, division }: ProfileModalProps) {
  const isMale = division === 'male';
  const btnClass = isMale ? 'btn-gold' : 'btn-pink';
  const accentClass = isMale ? 'text-amber-400' : 'text-violet-400';
  const accentBg = isMale ? 'bg-amber-500/12' : 'bg-violet-500/12';
  const ringClass = isMale ? 'avatar-ring-gold' : 'avatar-ring-pink';
  const focusRing = isMale
    ? 'focus:border-amber-400/30 focus:ring-amber-400/10'
    : 'focus:border-violet-400/30 focus:ring-violet-400/10';

  /* ── Screen state: 'search' | 'profile' | 'edit' ── */
  const [screen, setScreen] = useState<'search' | 'profile' | 'edit'>('search');

  /* ── Profile data ── */
  const [profile, setProfile] = useState<UserProfile | null>(null);

  /* ── Search state ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHasSearched, setSearchHasSearched] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Edit state ── */
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* ── Profile loading state ── */
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  /* ── File input ref ── */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Refs to avoid stale closures ── */
  const divisionRef = useRef(division);
  divisionRef.current = division;

  /* ── Reset to search screen ── */
  const resetToSearch = useCallback(() => {
    setScreen('search');
    setProfile(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchHasSearched(false);
    setEditName('');
    setEditPhone('');
    setEditCity('');
    setEditAvatar(null);
    setIsSaving(false);
    setIsUploadingAvatar(false);
    setSaveMessage(null);
    setIsLoadingProfile(false);
  }, []);

  /* ── Handle sheet open change ── */
  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetToSearch();
      }
      onOpenChange(open);
    },
    [onOpenChange, resetToSearch],
  );

  /* ── On mount: check localStorage for saved profile ── */
  useEffect(() => {
    if (!isOpen) return;

    const savedId = localStorage.getItem(STORAGE_KEY_ID);
    const savedData = localStorage.getItem(STORAGE_KEY_DATA);

    if (savedId) {
      // Load from cache first for instant display
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData) as UserProfile;
          if (parsed.id === savedId && parsed.gender === division) {
            setProfile(parsed);
            setScreen('profile');
          }
        } catch {
          // Ignore parse errors, will fetch from API
        }
      }

      // Verify via API in background
      const verifyProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const res = await fetch(
            `/api/users/profile?q=${encodeURIComponent(savedId)}&gender=${divisionRef.current}`,
          );
          const data = await res.json();
          if (data.success && data.users.length > 0) {
            const user = data.users.find((u: UserProfile) => u.id === savedId);
            if (user) {
              setProfile(user);
              setScreen('profile');
              localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(user));
            } else {
              // Saved user not found in results — clear and show search
              localStorage.removeItem(STORAGE_KEY_ID);
              localStorage.removeItem(STORAGE_KEY_DATA);
              setScreen('search');
              setProfile(null);
            }
          } else {
            // API returned no results — clear storage
            localStorage.removeItem(STORAGE_KEY_ID);
            localStorage.removeItem(STORAGE_KEY_DATA);
            setScreen('search');
            setProfile(null);
          }
        } catch {
          // If API fails but we have cached data, keep showing it
          if (!savedData) {
            setScreen('search');
          }
        } finally {
          setIsLoadingProfile(false);
        }
      };

      // Only verify if screen wasn't already set from cache
      if (!localStorage.getItem(STORAGE_KEY_DATA)) {
        verifyProfile();
      } else {
        // Still verify in background but don't show loading spinner
        verifyProfile();
      }
    } else {
      setScreen('search');
    }
  }, [isOpen, division]);

  /* ── Debounced search ── */
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchHasSearched(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const genderParam = divisionRef.current;
        const res = await fetch(
          `/api/users/profile?q=${encodeURIComponent(trimmed)}&gender=${genderParam}`,
        );
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.users);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, division]);

  /* ── Select a user from search results ── */
  const handleSelectUser = useCallback((user: UserProfile) => {
    setProfile(user);
    setScreen('profile');
    localStorage.setItem(STORAGE_KEY_ID, user.id);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(user));
  }, []);

  /* ── Switch profile: clear localStorage and go back to search ── */
  const handleSwitchProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_DATA);
    resetToSearch();
  }, [resetToSearch]);

  /* ── Enter edit mode ── */
  const handleEnterEdit = useCallback(() => {
    if (!profile) return;
    setEditName(profile.name);
    setEditPhone(profile.phone || '');
    setEditCity(profile.city || '');
    setEditAvatar(profile.avatar);
    setSaveMessage(null);
    setScreen('edit');
  }, [profile]);

  /* ── Cancel edit ── */
  const handleCancelEdit = useCallback(() => {
    setEditName('');
    setEditPhone('');
    setEditCity('');
    setEditAvatar(null);
    setSaveMessage(null);
    setScreen('profile');
  }, []);

  /* ── Avatar upload in edit mode ── */
  const handleAvatarUpload = useCallback(async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setSaveMessage({ type: 'error', text: 'Hanya file JPG, PNG, WebP, dan GIF' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' });
      return;
    }

    setSaveMessage(null);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.success) {
        setEditAvatar(data.url);
        setSaveMessage({ type: 'success', text: 'Foto berhasil diupload' });
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Gagal mengupload gambar' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Gagal mengupload gambar' });
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleAvatarUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleAvatarUpload],
  );

  /* ── Save profile ── */
  const handleSave = useCallback(async () => {
    if (!profile) return;

    if (editName.trim().length < 2) {
      setSaveMessage({ type: 'error', text: 'Nama minimal 2 karakter' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const body: Record<string, string> = { userId: profile.id };
      if (editName.trim() !== profile.name) body.name = editName.trim();
      if (editPhone !== (profile.phone || '')) body.phone = editPhone.trim() || '';
      if (editCity !== (profile.city || '')) body.city = editCity.trim() || '';
      if (editAvatar !== profile.avatar) body.avatar = editAvatar || '';

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setProfile(data.user);
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data.user));
        setSaveMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
        setScreen('profile');

        // Dispatch custom event so page.tsx can refresh data
        window.dispatchEvent(new CustomEvent('profile-updated'));
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Gagal menyimpan profil' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Gagal menyimpan profil' });
    } finally {
      setIsSaving(false);
    }
  }, [profile, editName, editPhone, editCity, editAvatar]);

  /* ── Render avatar helper ── */
  const renderAvatar = useCallback(
    (url: string | null, name: string, size: number, ring?: boolean) => {
      const inner = (
        <div
          className="bg-gradient-to-br from-white/10 to-white/[0.02] flex items-center justify-center overflow-hidden rounded-full"
          style={{ width: size, height: size }}
        >
          {url ? (
            <img src={url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-white/70" style={{ fontSize: size * 0.35 }}>
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      );

      if (ring) {
        return <div className={ringClass}>{inner}</div>;
      }
      return inner;
    },
    [ringClass],
  );

  /* ── Tier helper ── */
  const getTier = useCallback((tier: string) => {
    return tierConfig[tier] || tierConfig.B;
  }, []);

  /* ── Total wins/losses from rankings ── */
  const getTotalStats = useCallback((user: UserProfile) => {
    if (!user.rankings || user.rankings.length === 0) return { points: user.points, wins: 0, losses: 0 };
    return user.rankings.reduce(
      (acc, r) => ({
        points: r.points || acc.points,
        wins: (r.wins || 0) + acc.wins,
        losses: (r.losses || 0) + acc.losses,
      }),
      { points: user.points, wins: 0, losses: 0 },
    );
  }, []);

  /* ================================================================
     RENDER
     ================================================================ */

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className="!max-w-md w-full bg-[#0a0a0f]/95 backdrop-blur-2xl border-l border-white/[0.06] p-0 overflow-hidden ios-modal-content"
      >
        {/* Close button (override default) */}
        <button
          onClick={() => handleSheetOpenChange(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.10] transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="ios-section-title text-white/90 text-base font-bold flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentBg}`}>
              <UserCircle className={`w-[18px] h-[18px] ${accentClass}`} />
            </div>
            <span>Profil Pemain</span>
          </SheetTitle>
          <SheetDescription className="sr-only">Cari dan kelola profil pemain</SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 max-h-[calc(100vh-80px)]">
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════
                SEARCH SCREEN
                ══════════════════════════════════════════ */}
            {screen === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-4"
              >
                {/* Search input */}
                <div className="relative">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isMale ? 'text-amber-400/50' : 'text-violet-400/50'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pemain..."
                    className={`w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-10 py-3 text-white/90 text-sm placeholder-white/25 focus:outline-none focus:bg-white/[0.06] focus:ring-1 transition-all ${focusRing}`}
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Results */}
                {searchHasSearched && (
                  <div className="max-h-[60vh] overflow-y-auto overscroll-contain space-y-2 pr-1">
                    {!isSearching && searchResults.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-10 text-center"
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${accentBg}`}>
                          <Users className={`w-6 h-6 ${isMale ? 'text-amber-400/40' : 'text-violet-400/40'}`} />
                        </div>
                        <p className="text-sm text-white/50 font-medium">Tidak ada pemain ditemukan</p>
                        <p className="text-[11px] text-white/25 mt-1">Coba kata kunci lain</p>
                      </motion.div>
                    )}

                    {searchResults.map((user, idx) => {
                      const tier = getTier(user.tier);
                      return (
                        <motion.button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.2 }}
                          className="ios-list-item w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all text-left group"
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {renderAvatar(user.avatar, user.name, 40)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white/85 truncate">{user.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`tier-badge ${tier.badgeClass}`}>{user.tier}</span>
                              {user.club && (
                                <span className="text-[11px] text-white/30 truncate">{user.club.name}</span>
                              )}
                            </div>
                          </div>

                          {/* Points + Chevron */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[12px] font-semibold ${accentClass} opacity-70`}>
                              {user.points}
                            </span>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Hint text */}
                {!searchHasSearched && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${accentBg}`}>
                      <UserCircle className={`w-7 h-7 ${isMale ? 'text-amber-400/40' : 'text-violet-400/40'}`} />
                    </div>
                    <p className="text-[13px] text-white/40 font-medium">Ketik nama untuk mencari profil</p>
                    <p className="text-[11px] text-white/20 mt-1">Minimal 2 karakter</p>
                  </motion.div>
                )}

                {/* Not registered hint */}
                <p className="text-[11px] text-white/20 text-center pt-2">
                  Belum terdaftar? Hubungi admin untuk mendaftar.
                </p>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                PROFILE VIEW
                ══════════════════════════════════════════ */}
            {screen === 'profile' && profile && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-5"
              >
                {isLoadingProfile ? (
                  /* Loading skeleton */
                  <div className="flex flex-col items-center py-10 gap-4">
                    <div className="w-20 h-20 rounded-full skeleton" />
                    <div className="w-32 h-5 rounded-lg skeleton" />
                    <div className="w-20 h-4 rounded-lg skeleton" />
                  </div>
                ) : (
                  <>
                    {/* Avatar + Name + Tier */}
                    <div className="flex flex-col items-center text-center pb-2">
                      {/* Avatar with ring */}
                      <div className="relative mb-4">
                        <div
                          className="absolute -inset-3 rounded-full blur-xl opacity-50"
                          style={{
                            background: isMale
                              ? 'radial-gradient(circle, rgba(255,214,10,0.25) 0%, transparent 70%)'
                              : 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)',
                          }}
                        />
                        {renderAvatar(profile.avatar, profile.name, 80, true)}

                        {/* Tier badge on avatar */}
                        <div
                          className={`absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                            profile.tier === 'S'
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black'
                              : profile.tier === 'A'
                                ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                                : 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-black'
                          }`}
                          style={{
                            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                            border: '2px solid rgba(0,0,0,0.3)',
                          }}
                        >
                          {profile.tier}
                        </div>
                      </div>

                      {/* Name */}
                      <h2 className="text-xl font-bold text-white/90 tracking-tight">{profile.name}</h2>

                      {/* Tier label + points */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`tier-badge ${getTier(profile.tier).badgeClass}`}>
                          {getTier(profile.tier).label}
                        </span>
                        <span className={`text-[12px] font-semibold ${accentClass} opacity-70`}>
                          {profile.points.toLocaleString()} pts
                        </span>
                      </div>

                      {/* MVP badge */}
                      {profile.isMVP && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
                          className="flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/15"
                        >
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">MVP</span>
                        </motion.div>
                      )}

                      {/* Club */}
                      {profile.club && (
                        <div className="flex items-center gap-2 mt-3">
                          {profile.club.logoUrl ? (
                            <img
                              src={profile.club.logoUrl}
                              alt={profile.club.name}
                              className="w-5 h-5 rounded-md object-cover"
                            />
                          ) : (
                            <Shield className={`w-4 h-4 ${accentClass} opacity-50`} />
                          )}
                          <span className="text-[12px] text-white/50 font-medium">{profile.club.name}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Divider ── */}
                    <div className="divider ios-modal-divider" />

                    {/* ── Stats Grid ── */}
                    {(() => {
                      const stats = getTotalStats(profile);
                      return (
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="glass-subtle rounded-2xl p-3.5 flex flex-col items-center text-center">
                            <Trophy className="w-[18px] h-[18px] text-amber-400 mb-1.5" />
                            <p className="text-base font-bold text-white/90 leading-none">{stats.points.toLocaleString()}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-1">Points</p>
                          </div>
                          <div className="glass-subtle rounded-2xl p-3.5 flex flex-col items-center text-center">
                            <Check className="w-[18px] h-[18px] text-emerald-400 mb-1.5" />
                            <p className="text-base font-bold text-white/90 leading-none">{stats.wins}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-1">Menang</p>
                          </div>
                          <div className="glass-subtle rounded-2xl p-3.5 flex flex-col items-center text-center">
                            <X className="w-[18px] h-[18px] text-red-400 mb-1.5" />
                            <p className="text-base font-bold text-white/90 leading-none">{stats.losses}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-1">Kalah</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Info Rows ── */}
                    <div className="glass-subtle rounded-2xl px-4">
                      {profile.phone && (
                        <div className="ios-list-item flex items-center gap-3 py-3.5 border-b border-white/[0.04]">
                          <Phone className="w-4 h-4 text-white/25 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">WhatsApp</p>
                            <p className="text-[13px] text-white/60 font-medium mt-0.5">{profile.phone}</p>
                          </div>
                        </div>
                      )}
                      {profile.city && (
                        <div className="ios-list-item flex items-center gap-3 py-3.5 border-b border-white/[0.04]">
                          <MapPin className="w-4 h-4 text-white/25 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Asal Kota</p>
                            <p className="text-[13px] text-white/60 font-medium mt-0.5">{profile.city}</p>
                          </div>
                        </div>
                      )}
                      <div className="ios-list-item flex items-center gap-3 py-3.5">
                        <Users className="w-4 h-4 text-white/25 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Bergabung</p>
                          <p className="text-[13px] text-white/60 font-medium mt-0.5">
                            {new Date(profile.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="space-y-2.5 pt-1">
                      {/* Edit button */}
                      <motion.button
                        onClick={handleEnterEdit}
                        className={`${btnClass} btn-ios w-full py-3.5 text-[13px] flex items-center justify-center gap-2 hero-shimmer-btn relative overflow-hidden`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-[2] flex items-center gap-2">
                          <Edit3 className="w-[16px] h-[16px]" />
                          Edit Profil
                        </span>
                      </motion.button>

                      {/* Switch profile button */}
                      <motion.button
                        onClick={handleSwitchProfile}
                        className="btn-ios w-full py-3 text-[12px] text-white/40 flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60 transition-colors rounded-[14px]"
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Ganti Profil
                      </motion.button>

                      {/* Close button */}
                      <motion.button
                        onClick={() => handleSheetOpenChange(false)}
                        className="btn-ios w-full py-3 text-[12px] text-white/25 flex items-center justify-center gap-1.5 hover:text-white/40 transition-colors rounded-[14px]"
                        whileTap={{ scale: 0.98 }}
                      >
                        Tutup
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                EDIT MODE
                ══════════════════════════════════════════ */}
            {screen === 'edit' && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-5"
              >
                {/* Avatar with camera overlay */}
                <div className="flex justify-center pt-2">
                  <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                    {editAvatar ? (
                      <div className={ringClass}>
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-white/10 to-white/[0.02]">
                          <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : (
                      <div className={ringClass}>
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-white/10 to-white/[0.02] flex items-center justify-center">
                          <span className="text-2xl font-bold text-white/70">
                            {(editName || profile?.name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Camera overlay */}
                    <div
                      className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ${isUploadingAvatar ? 'opacity-100' : ''}`}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-white/25 text-center -mt-2">Tap avatar untuk ganti foto</p>

                {/* ── Edit Fields ── */}
                <div className="glass-heavy rounded-2xl p-4 space-y-3.5">
                  {/* Nickname */}
                  <div>
                    <label className="text-[11px] text-white/40 mb-1.5 block uppercase tracking-wider font-semibold">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama pemain"
                      className={`w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder-white/25 focus:outline-none focus:bg-white/[0.06] focus:ring-1 transition-all ${focusRing}`}
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="text-[11px] text-white/40 mb-1.5 block uppercase tracking-wider font-semibold">
                      No. WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="08xxx"
                      className={`w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder-white/25 focus:outline-none focus:bg-white/[0.06] focus:ring-1 transition-all ${focusRing}`}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-[11px] text-white/40 mb-1.5 block uppercase tracking-wider font-semibold">
                      Asal Kota
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Contoh: Jakarta"
                      className={`w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm placeholder-white/25 focus:outline-none focus:bg-white/[0.06] focus:ring-1 transition-all ${focusRing}`}
                    />
                  </div>
                </div>

                {/* ── Inline message ── */}
                <AnimatePresence>
                  {saveMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium ${
                        saveMessage.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/10 border border-red-500/15 text-red-400'
                      }`}
                    >
                      {saveMessage.type === 'success' ? (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      {saveMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Action Buttons ── */}
                <div className="space-y-2.5">
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving || editName.trim().length < 2}
                    className={`${btnClass} btn-ios w-full py-3.5 text-[13px] flex items-center justify-center gap-2 hero-shimmer-btn relative overflow-hidden disabled:opacity-40`}
                    whileHover={!isSaving ? { scale: 1.01 } : undefined}
                    whileTap={!isSaving ? { scale: 0.98 } : undefined}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Simpan
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={handleCancelEdit}
                    className="btn-ios w-full py-3 text-[12px] text-white/40 flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60 transition-colors rounded-[14px]"
                    whileTap={{ scale: 0.98 }}
                  >
                    Batal
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
