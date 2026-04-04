'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  ChevronDown,
  Search,
  User,
} from 'lucide-react';

interface ClubMember {
  id: string;
  name: string;
  avatar: string | null;
  tier: string;
  points: number;
  gender: string;
  wins: number;
  losses: number;
}

interface ClubData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  totalPlayers: number;
  femaleCount: number;
  maleCount: number;
  members: ClubMember[];
}

interface UnassignedPlayer extends ClubMember {
  clubName: string | null;
}

interface ParticipantsClubTabProps {
  division: 'male' | 'female';
}

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25' },
  A: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25' },
  B: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/25' },
};

const clubGradients = [
  'linear-gradient(135deg, #FF6B6B, #EE5A24)',
  'linear-gradient(135deg, #A29BFE, #6C5CE7)',
  'linear-gradient(135deg, #55E6C1, #26de81)',
  'linear-gradient(135deg, #FD79A8, #E84393)',
  'linear-gradient(135deg, #FDCB6E, #F39C12)',
  'linear-gradient(135deg, #74B9FF, #0984E3)',
  'linear-gradient(135deg, #FF9FF3, #F368E0)',
  'linear-gradient(135deg, #48DBFB, #0ABDE3)',
  'linear-gradient(135deg, #FF9F43, #EE5A24)',
  'linear-gradient(135deg, #C8D6E5, #8395A7)',
];

function getClubGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return clubGradients[Math.abs(hash) % clubGradients.length];
}

export function ParticipantsClubTab({ division }: ParticipantsClubTabProps) {
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>(division);
  const [showUnassigned, setShowUnassigned] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [maleRes, femaleRes] = await Promise.all([
        fetch('/api/users?gender=male'),
        fetch('/api/users?gender=female'),
      ]);

      const maleData = maleRes.ok ? await maleRes.json() : { success: false, users: [] };
      const femaleData = femaleRes.ok ? await femaleRes.json() : { success: false, users: [] };

      const allUsers = [
        ...(maleData.users || []),
        ...(femaleData.users || []),
      ];

      const clubMap = new Map<string, ClubData>();
      const unassignedPlayers: UnassignedPlayer[] = [];

      for (const user of allUsers) {
        const club = (user as Record<string, unknown>).club as { id: string; name: string; slug: string; logoUrl: string | null } | null;

        const member: ClubMember = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          tier: user.tier,
          points: user.points,
          gender: user.gender,
          wins: (user as Record<string, unknown>).rankings
            ? (((user as Record<string, unknown>).rankings as Array<{ wins: number }>)[0]?.wins ?? 0)
            : 0,
          losses: (user as Record<string, unknown>).rankings
            ? (((user as Record<string, unknown>).rankings as Array<{ losses: number }>)[0]?.losses ?? 0)
            : 0,
        };

        if (club && club.id) {
          const existing = clubMap.get(club.id);
          if (existing) {
            existing.members.push(member);
            existing.totalPlayers = existing.members.length;
            existing.maleCount = existing.members.filter(m => m.gender === 'male').length;
            existing.femaleCount = existing.members.filter(m => m.gender === 'female').length;
            existing.members.sort((a, b) => b.points - a.points);
          } else {
            clubMap.set(club.id, {
              id: club.id,
              name: club.name,
              slug: club.slug,
              logoUrl: club.logoUrl,
              totalPlayers: 1,
              femaleCount: user.gender === 'female' ? 1 : 0,
              maleCount: user.gender === 'male' ? 1 : 0,
              members: [member],
            });
          }
        } else {
          unassignedPlayers.push({
            ...member,
            clubName: club?.name || null,
          });
        }
      }

      const sortedClubs = Array.from(clubMap.values()).sort((a, b) => {
        const totalA = a.members.reduce((s, m) => s + m.points, 0);
        const totalB = b.members.reduce((s, m) => s + m.points, 0);
        return totalB - totalA;
      });

      setClubs(sortedClubs);
      setUnassigned(unassignedPlayers);
      setExpandedClubs(new Set(sortedClubs.map(c => c.id)));
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const toggleClub = (clubId: string) => {
    setExpandedClubs(prev => {
      const next = new Set(prev);
      if (next.has(clubId)) next.delete(clubId);
      else next.add(clubId);
      return next;
    });
  };

  const expandAll = () => setExpandedClubs(new Set(clubs.map(c => c.id)));
  const collapseAll = () => setExpandedClubs(new Set());

  // Filters
  const filteredClubs = clubs.map(club => {
    let filteredMembers = club.members;
    if (genderFilter !== 'all') {
      filteredMembers = filteredMembers.filter(m => m.gender === genderFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filteredMembers = filteredMembers.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.tier.toLowerCase().includes(q)
      );
    }
    return { ...club, filteredMembers };
  }).filter(club => club.filteredMembers.length > 0 || searchQuery.trim() === '' || club.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  let filteredUnassigned = unassigned;
  if (genderFilter !== 'all') {
    filteredUnassigned = filteredUnassigned.filter(m => m.gender === genderFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredUnassigned = filteredUnassigned.filter(m => m.name.toLowerCase().includes(q));
  }

  const totalParticipants = clubs.reduce((s, c) => s + c.members.length, 0) + unassigned.length;
  const totalMale = clubs.reduce((s, c) => s + c.maleCount, 0) + unassigned.filter(m => m.gender === 'male').length;
  const totalFemale = clubs.reduce((s, c) => s + c.femaleCount, 0) + unassigned.filter(m => m.gender === 'female').length;

  const isMale = division === 'male';
  const accentColor = isMale ? 'amber' : 'violet';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl bg-${accentColor}-500/10 flex items-center justify-center`}>
          <Shield className={`w-5 h-5 text-${accentColor}-400`} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white/90">Peserta & Club</h2>
          <p className="text-[11px] text-white/35">
            {totalParticipants} peserta &middot; {clubs.length} club
          </p>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <Users className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[11px] font-semibold text-white/60">{totalParticipants}</span>
          <span className="text-[10px] text-white/30">Total</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/[0.05] border border-amber-500/10">
          <User className="w-3.5 h-3.5 text-amber-400/60" />
          <span className="text-[11px] font-semibold text-amber-400/80">{totalMale}</span>
          <span className="text-[10px] text-amber-400/40">Male</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/[0.05] border border-violet-500/10">
          <User className="w-3.5 h-3.5 text-violet-400/60" />
          <span className="text-[11px] font-semibold text-violet-400/80">{totalFemale}</span>
          <span className="text-[10px] text-violet-400/40">Female</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          placeholder="Cari peserta atau club..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/30 focus:ring-1 focus:ring-amber-400/10 transition-colors"
        />
      </div>

      {/* Gender filter + controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {(['all', 'male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                genderFilter === g
                  ? g === 'all'
                    ? 'bg-white/10 text-white border border-white/15'
                    : g === 'male'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    : 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                  : 'bg-white/[0.03] text-white/30 border border-white/[0.04] hover:text-white/50'
              }`}
            >
              {g === 'all' ? 'Semua' : g === 'male' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-white/30 hover:text-white/50 transition-colors cursor-pointer"
          >
            Buka Semua
          </button>
          <span className="text-white/10">|</span>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-white/30 hover:text-white/50 transition-colors cursor-pointer"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className={`w-8 h-8 border-2 border-${accentColor}-400/20 border-t-${accentColor}-400 rounded-full animate-spin`} />
          <p className="text-[12px] text-white/30">Memuat data peserta...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Club cards */}
          {filteredClubs.map((club, clubIdx) => {
            const isExpanded = expandedClubs.has(club.id);
            const totalPoints = club.members.reduce((s, m) => s + m.points, 0);

            return (
              <motion.div
                key={club.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: clubIdx * 0.03, duration: 0.2 }}
                className="rounded-2xl border border-white/[0.05] overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(14,14,18,0.6) 100%)',
                }}
              >
                {/* Club header */}
                <button
                  onClick={() => toggleClub(club.id)}
                  className="w-full flex items-center gap-3 p-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  {/* Club avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm"
                    style={{ background: getClubGradient(club.name) }}
                  >
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      club.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Club info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-white/90 truncate">{club.name}</h3>
                      <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">
                        {club.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-white/30">
                        {club.members.length} anggota
                      </span>
                      <span className="text-white/10">&middot;</span>
                      <span className="text-[11px] text-amber-400/40 font-semibold">
                        {totalPoints.toLocaleString()} pts
                      </span>
                      <span className="text-white/10">&middot;</span>
                      <span className="text-[10px] text-amber-400/30">
                        {club.maleCount}M
                      </span>
                      <span className="text-[10px] text-violet-400/30">
                        {club.femaleCount}F
                      </span>
                    </div>
                  </div>

                  {/* Expand icon */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/20" />
                  </motion.div>
                </button>

                {/* Members list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.04]">
                        {club.filteredMembers.map((member, idx) => {
                          const tier = tierColors[member.tier] || tierColors.B;
                          const filteredIdx = genderFilter === 'all' && !searchQuery.trim()
                            ? idx + 1
                            : null;

                          return (
                            <motion.div
                              key={member.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03, duration: 0.2 }}
                              className={`flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors ${
                                idx < club.filteredMembers.length - 1 ? 'border-b border-white/[0.02]' : ''
                              }`}
                            >
                              {/* Rank number */}
                              {filteredIdx !== null && filteredIdx <= 3 ? (
                                <div className="w-5 flex items-center justify-center">
                                  <span className="text-[10px] font-black" style={{
                                    color: filteredIdx === 1 ? '#FFD60A' : filteredIdx === 2 ? '#C7C7CC' : '#CD7F32',
                                  }}>
                                    {filteredIdx}
                                  </span>
                                </div>
                              ) : filteredIdx !== null ? (
                                <div className="w-5 flex items-center justify-center">
                                  <span className="text-[10px] font-medium text-white/15">{filteredIdx}</span>
                                </div>
                              ) : <div className="w-5" />}

                              {/* Avatar */}
                              <div
                                className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0"
                                style={{
                                  border: member.gender === 'male'
                                    ? '1px solid rgba(255,214,10,0.15)'
                                    : '1px solid rgba(167,139,250,0.15)',
                                }}
                              >
                                {member.avatar ? (
                                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[11px] font-bold text-white/60">{member.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-semibold text-white/85 truncate">
                                    {member.name}
                                  </p>
                                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    member.gender === 'male'
                                      ? 'bg-amber-500/10 text-amber-400/60'
                                      : 'bg-violet-500/10 text-violet-400/60'
                                  }`}>
                                    {member.gender === 'male' ? 'M' : 'F'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-white/25">{member.points.toLocaleString()} pts</span>
                                  <span className="text-white/8">&middot;</span>
                                  <span className="text-[10px] text-white/25">{member.wins}W / {member.losses}L</span>
                                </div>
                              </div>

                              {/* Tier badge */}
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${tier.bg} ${tier.text} border ${tier.border}`}>
                                {member.tier}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Unassigned players */}
          {filteredUnassigned.length > 0 && (
            <motion.div
              layout
              className="rounded-2xl border border-dashed border-white/[0.08] overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.01) 0%, rgba(14,14,18,0.4) 100%)',
              }}
            >
              <button
                onClick={() => setShowUnassigned(!showUnassigned)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white/25" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-[14px] font-bold text-white/50">Tanpa Club</h3>
                  <span className="text-[11px] text-white/25">
                    {filteredUnassigned.length} peserta
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: showUnassigned ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-white/15" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showUnassigned && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-dashed border-white/[0.05]">
                      {filteredUnassigned.map((member) => {
                        const tier = tierColors[member.tier] || tierColors.B;
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/[0.02] last:border-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[11px] font-bold text-white/50">{member.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-white/50 truncate">{member.name}</p>
                              <span className="text-[10px] text-white/20">{member.points} pts</span>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${tier.bg} ${tier.text} border ${tier.border}`}>
                              {member.tier}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && filteredClubs.length === 0 && filteredUnassigned.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-10 h-10 text-white/10 mb-3" />
              <p className="text-[13px] text-white/25">Tidak ada peserta ditemukan</p>
            </div>
          )}
        </div>
      )}

      {/* Footer info */}
      {!loading && (
        <div className="flex items-center justify-center pt-2 pb-4">
          <p className="text-[10px] text-white/20">
            {filteredClubs.reduce((s, c) => s + c.filteredMembers.length, 0) + filteredUnassigned.length} peserta ditampilkan
          </p>
        </div>
      )}
    </div>
  );
}
