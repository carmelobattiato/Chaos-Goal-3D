import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Search,
  PlusCircle,
  Users,
  Lock,
  Unlock,
  MailCheck,
  Crown,
  BookOpen,
  UserPlus,
  Check,
  X,
  LogOut,
  MessageSquarePlus,
  MessageCircle,
  Send,
  Smile,
  Swords,
  Trophy,
  Clock,
  Zap,
  MapPin,
} from 'lucide-react';
import { Club, ClubAccessType, ClubChatMessage, ClubRole, ClubWar } from '../types/game';

const QUICK_CHAT_EMOJIS = ['⚽', '🔥', '🏆', '😂', '👏', '💪', '❤️', '🎯', '⚡', '👑', '😎', '🙌'];

const EMOJI_PICKER_GROUPS: Array<{ title: string; emojis: string[] }> = [
  {
    title: 'Calcio & Vittoria',
    emojis: ['⚽', '🥅', '🏆', '🥇', '🥈', '🥉', '🏅', '🏟️', '👟', '🧤', '📣', '🎺'],
  },
  {
    title: 'Faccine',
    emojis: ['😀', '😂', '🤣', '😎', '🤩', '🥳', '😜', '😤', '😱', '🤯', '😭', '🫡'],
  },
  {
    title: 'Gesti & Cuori',
    emojis: ['👏', '🙌', '👍', '👎', '💪', '🤝', '✌️', '🫶', '❤️', '🧡', '💛', '💙'],
  },
  {
    title: 'Energia & Simboli',
    emojis: ['🔥', '⚡', '💥', '✨', '🌟', '👑', '💎', '🎯', '🚀', '⚔️', '🛡️', '🎉'],
  },
];

const CITY_COUNTRY_PRESETS = [
  'Palermo',
  'São Paulo',
  'Napoli',
  'Milano',
  'Roma',
  'Torino',
  'Buenos Aires',
  'Rio de Janeiro',
  'Madrid',
  'Londra',
  'Parigi',
  'Tokyo',
  'Italia',
  'Brasile',
  'Argentina',
  'Spagna',
];

function getCupBoostInfo(trophies: number) {
  if (trophies >= 700) return { tier: 'Leggenda', multiplier: 2.0, bonusPct: 100, next: null, badge: 'text-rose-300 bg-rose-500/20 border-rose-500/40' };
  if (trophies >= 350) return { tier: 'Oro', multiplier: 1.65, bonusPct: 65, next: 700, badge: 'text-amber-300 bg-amber-500/20 border-amber-500/40' };
  if (trophies >= 150) return { tier: 'Argento', multiplier: 1.4, bonusPct: 40, next: 350, badge: 'text-sky-300 bg-sky-500/20 border-sky-500/40' };
  if (trophies >= 50) return { tier: 'Bronzo', multiplier: 1.2, bonusPct: 20, next: 150, badge: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' };
  return { tier: 'Base', multiplier: 1.0, bonusPct: 0, next: 50, badge: 'text-slate-300 bg-slate-800 border-slate-700' };
}

interface ClubModalProps {
  playerId: string;
  playerName: string;
  myClub: Club | null;
  onClubUpdated: (club: Club | null, explicitLeave?: boolean) => void;
  onClose: () => void;
}

export const ROLE_LABELS: Record<ClubRole, { label: string; badgeClass: string; desc: string }> = {
  presidente: {
    label: 'Fondatore',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Capo supremo del club: gestisce inviti, ruoli, guerre e città della squadra.',
  },
  vicepresidente: {
    label: 'Semifondatore',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    desc: 'Meno potenza del Fondatore, ma può scegliere e accettare gli inviti.',
  },
  consigliere: {
    label: 'Aiutante',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    desc: 'Consiglia e aiuta il Fondatore sulle scelte e sulla gestione del club.',
  },
  socio_saggio: {
    label: 'Calciatore Anziano',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    desc: 'Veterano storico presente nel club da tanto tempo.',
  },
  socio: {
    label: 'Calciatore',
    badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600',
    desc: 'Giocatore ufficiale del club.',
  },
};

export const ACCESS_LABELS: Record<ClubAccessType, { label: string; color: string; desc: string }> = {
  aperto: {
    label: 'Aperto',
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15',
    desc: 'Possono entrare tutti i giocatori finché il club non è pieno.',
  },
  solo_invito: {
    label: 'Solo Invito',
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/15',
    desc: 'I giocatori mandano una richiesta/invito; Fondatore e Semifondatore scelgono chi introdurre.',
  },
  chiuso: {
    label: 'Chiuso',
    color: 'text-rose-400 border-rose-500/40 bg-rose-500/15',
    desc: 'Non può entrare nessun nuovo giocatore.',
  },
};

export const ClubModal: React.FC<ClubModalProps> = ({
  playerId,
  playerName,
  myClub,
  onClubUpdated,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'create' | 'my_club' | 'leaderboard'>(
    myClub ? 'my_club' : 'search'
  );
  const [clubSubTab, setClubSubTab] = useState<'members' | 'chat' | 'invites' | 'advice' | 'war'>('members');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [clubsList, setClubsList] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);

  // Wars & Leaderboard state
  const [activeWars, setActiveWars] = useState<ClubWar[]>([]);
  const [finishedWars, setFinishedWars] = useState<ClubWar[]>([]);
  const [leaderboard, setLeaderboard] = useState<Club[]>([]);

  // Create Club state (1 to 50 characters including spaces)
  const [newClubName, setNewClubName] = useState('');
  const [newClubLocation, setNewClubLocation] = useState('');
  const [newClubAccess, setNewClubAccess] = useState<ClubAccessType>('aperto');
  const [locationDraft, setLocationDraft] = useState(myClub?.cityOrCountry || '');

  // Invite / Advice / Live Club Chat inputs
  const [inviteTargetName, setInviteTargetName] = useState('');
  const [adviceInput, setAdviceInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ClubChatMessage[]>(myClub?.chatMessages || []);
  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showNotice = (type: 'ok' | 'err', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchWarsAndLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/wars');
      const data = await res.json();
      setActiveWars(data.activeWars || []);
      setFinishedWars(data.finishedWars || []);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.warn('Error fetching wars:', err);
    }
  }, []);

  const fetchClubs = useCallback(async (q: string = '') => {
    setLoadingClubs(true);
    try {
      const res = await fetch(`/api/clubs?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClubsList(data.clubs || []);
      // Also refresh myClub if present
      if (myClub) {
        const updatedMine = (data.clubs || []).find((c: Club) => c.id === myClub.id);
        if (updatedMine) onClubUpdated(updatedMine);
      }
    } catch (err) {
      console.warn('Error fetching clubs:', err);
    } finally {
      setLoadingClubs(false);
    }
  }, [myClub, onClubUpdated]);

  useEffect(() => {
    fetchClubs(searchQuery);
    fetchWarsAndLeaderboard();
  }, [searchQuery, fetchClubs, fetchWarsAndLeaderboard]);

  useEffect(() => {
    if (myClub) {
      setActiveTab('my_club');
      setLocationDraft(myClub.cityOrCountry || '');
      if (Array.isArray(myClub.chatMessages)) {
        setChatMessages(myClub.chatMessages);
      }
    } else {
      setChatMessages([]);
    }
  }, [myClub?.id, myClub?.cityOrCountry]);

  // Real-time WebSocket subscription + initial REST history sync for Club Chat
  useEffect(() => {
    const clubId = myClub?.id;
    if (!clubId) return;
    let closed = false;
    let reconnectTimer: number | null = null;
    let ws: WebSocket | null = null;

    // Initial history sync via REST
    fetch(`/api/clubs/${clubId}/chat?playerId=${encodeURIComponent(playerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!closed && data && Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        }
      })
      .catch(() => {});

    const connectChatWs = () => {
      if (closed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            type: 'subscribe_club_chat',
            clubId,
            playerId,
          })
        );
      };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'club_chat_history' && payload.clubId === clubId && Array.isArray(payload.messages)) {
            setChatMessages(payload.messages);
          } else if (payload.type === 'club_chat_message' && payload.clubId === clubId && payload.message) {
            const incoming: ClubChatMessage = payload.message;
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming].slice(-120);
            });
          }
        } catch {
          // Ignore malformed WS message
        }
      };
      ws.onclose = () => {
        if (!closed) {
          reconnectTimer = window.setTimeout(connectChatWs, 3000);
        }
      };
    };

    connectChatWs();

    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [myClub?.id, playerId]);

  // Auto-scroll chat to newest message
  useEffect(() => {
    if (clubSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages.length, clubSubTab]);

  // Create Club handler
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClubName.length < 1 || newClubName.length > 50 || newClubName.trim().length < 1) {
      showNotice('err', 'Il nome del club deve avere da 1 a 50 lettere (compresi gli spazi).');
      return;
    }

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          playerName,
          clubName: newClubName,
          accessType: newClubAccess,
          cityOrCountry: newClubLocation.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Errore nella creazione del club.');
        return;
      }
      onClubUpdated(data.club);
      setNewClubName('');
      setNewClubLocation('');
      setActiveTab('my_club');
      showNotice('ok', `Club "${data.club.name}" creato! Sei il Fondatore!`);
      fetchClubs(searchQuery);
    } catch (err) {
      showNotice('err', 'Errore di connessione al server.');
    }
  };

  // Presidente updates club city or country (e.g. Palermo, São Paulo) at any time
  const handleUpdateClubLocation = async (targetLocation: string) => {
    if (!myClub) return;
    const clean = targetLocation.trim();
    if (!clean) {
      showNotice('err', 'Scrivi o scegli un paese o una città valida!');
      return;
    }
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          cityOrCountry: clean,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile aggiornare città/paese.');
        return;
      }
      onClubUpdated(data.club);
      setLocationDraft(data.club.cityOrCountry || clean);
      showNotice('ok', data.message || `Squadra impostata su ${clean}!`);
      fetchClubs(searchQuery);
    } catch {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Join or request invite to a club
  const handleJoinClub = async (club: Club) => {
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          playerName,
          message: `Richiesta di ingresso da ${playerName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile entrare nel club.');
        return;
      }
      if (data.status === 'joined') {
        onClubUpdated(data.club);
        setActiveTab('my_club');
      }
      showNotice('ok', data.message || 'Operazione completata!');
      fetchClubs(searchQuery);
    } catch (err) {
      showNotice('err', 'Errore di rete.');
    }
  };

  // Respond to invite (Presidente or Vicepresidente)
  const handleRespondInvite = async (inviteId: string, decision: 'accept' | 'reject') => {
    if (!myClub) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/invites/${inviteId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          decision,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Errore nella gestione invito.');
        return;
      }
      onClubUpdated(data.club);
      showNotice('ok', data.message);
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Send direct invite by player name (Presidente or Vicepresidente)
  const handleSendDirectInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClub || !inviteTargetName.trim()) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/send-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          targetPlayerName: inviteTargetName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile mandare invito.');
        return;
      }
      onClubUpdated(data.club);
      setInviteTargetName('');
      showNotice('ok', data.message);
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Update Club Access Type
  const handleChangeAccessType = async (accessType: ClubAccessType) => {
    if (!myClub) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          accessType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile modificare impostazioni.');
        return;
      }
      onClubUpdated(data.club);
      showNotice('ok', `Tipo di accesso del club impostato su: ${ACCESS_LABELS[accessType].label}`);
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Change Member Role
  const handleChangeRole = async (targetPlayerId: string, newRole: ClubRole) => {
    if (!myClub) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/members/${targetPlayerId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Non hai i permessi per questo ruolo.');
        return;
      }
      onClubUpdated(data.club);
      showNotice('ok', `Ruolo aggiornato a ${ROLE_LABELS[newRole].label}!`);
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Kick Member
  const handleKickMember = async (targetPlayerId: string) => {
    if (!myClub) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/members/${targetPlayerId}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: playerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile rimuovere il membro.');
        return;
      }
      onClubUpdated(data.club);
      showNotice('ok', 'Giocatore rimosso dal club.');
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Send Advice from Aiutante to Fondatore
  const handleSendAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClub || !adviceInput.trim()) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          text: adviceInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile inviare il consiglio.');
        return;
      }
      onClubUpdated(data.club);
      setAdviceInput('');
      showNotice('ok', 'Consiglio inviato al Fondatore!');
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Send Club Chat Message (text & emoji, open to ALL club members)
  const handleSendClubChat = async (e?: React.FormEvent, directEmoji?: string) => {
    if (e) e.preventDefault();
    if (!myClub || sendingChat) return;
    const textToSend = (directEmoji !== undefined ? directEmoji : chatInput).trim();
    if (!textToSend) return;

    setSendingChat(true);
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          text: textToSend,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile inviare il messaggio.');
        return;
      }
      if (data.message) {
        const sentMsg: ClubChatMessage = data.message;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg].slice(-120);
        });
      }
      if (directEmoji === undefined) {
        setChatInput('');
        setShowEmojiPicker(false);
      }
    } catch {
      showNotice('err', 'Errore di connessione alla chat del club.');
    } finally {
      setSendingChat(false);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setChatInput((prev) => (prev + emoji).slice(0, 400));
    chatInputRef.current?.focus();
  };

  // Leave Club
  const handleLeaveClub = async () => {
    if (!myClub) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        onClubUpdated(null, true);
        setActiveTab('search');
        showNotice('ok', 'Hai lasciato il club.');
        fetchClubs(searchQuery);
      }
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  // Declare 1-Week War (Presidente only)
  const handleDeclareWar = async (targetClubId: string) => {
    if (!myClub) return;
    try {
      const res = await fetch(`/api/clubs/${myClub.id}/war/declare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: playerId,
          targetClubId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice('err', data.error || 'Impossibile dichiarare guerra.');
        return;
      }
      showNotice('ok', data.message);
      fetchWarsAndLeaderboard();
    } catch (err) {
      showNotice('err', 'Errore di connessione.');
    }
  };

  const myMemberRecord = myClub?.members.find((m) => m.playerId === playerId) || null;
  const myRole: ClubRole | null = myMemberRecord ? myMemberRecord.role : null;
  const canManageInvites = myRole === 'presidente' || myRole === 'vicepresidente';
  const canSendAdvice = myRole === 'consigliere' || myRole === 'presidente' || myRole === 'vicepresidente';

  const viceCount = myClub?.members.filter((m) => m.role === 'vicepresidente').length || 0;
  const consigliereCount = myClub?.members.filter((m) => m.role === 'consigliere').length || 0;
  const socioSaggioCount = myClub?.members.filter((m) => m.role === 'socio_saggio').length || 0;
  const socioCount = myClub?.members.filter((m) => m.role === 'socio').length || 0;

  const myActiveWar = myClub
    ? activeWars.find((w) => w.challengerClubId === myClub.id || w.defenderClubId === myClub.id) || null
    : null;

  const formatTimeRemaining = (endsAt: number) => {
    const diff = Math.max(0, endsAt - Date.now());
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days}g ${hours}h rimaste`;
  };

  const formatSeniority = (joinedAt: number) => {
    const mins = Math.max(1, Math.floor((Date.now() - joinedAt) / 60000));
    if (mins < 60) return `${mins} min nel club`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ore nel club`;
    const days = Math.floor(hours / 24);
    return `${days} giorni nel club`;
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                CLUB UFFICIALI
              </h2>
              <p className="text-xs text-slate-400">
                Crea o entra in un club, accumula Coppe vincendo partite e potenzia le tue Guerre settimanali!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/90 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'search'
                ? 'border-amber-400 text-amber-400 bg-slate-800/70'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            Cerca Club ({clubsList.length})
          </button>

          {!myClub && (
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'create'
                  ? 'border-rose-400 text-rose-400 bg-slate-800/70'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Crea Club
            </button>
          )}

          {myClub && (
            <button
              onClick={() => setActiveTab('my_club')}
              className={`px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'my_club'
                  ? 'border-emerald-400 text-emerald-400 bg-slate-800/70'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              Il Mio Club: {myClub.name}
              {canManageInvites && myClub.invites.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-black">
                  {myClub.invites.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('leaderboard');
              fetchWarsAndLeaderboard();
            }}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'leaderboard'
                ? 'border-yellow-400 text-yellow-400 bg-slate-800/70'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Classifica Club
          </button>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
              feedbackMsg.type === 'ok'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs underline ml-4">
              Chiudi
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: SEARCH CLUBS */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca il nome di un club (da 1 a 50 lettere)..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white font-semibold focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => fetchClubs(searchQuery)}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cerca
                </button>
              </div>

              {/* List of Real Player Clubs */}
              {loadingClubs ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  Ricerca dei club dei giocatori in corso...
                </div>
              ) : clubsList.length === 0 ? (
                <div className="text-center py-12 px-6 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <div className="text-base font-black text-slate-200">
                    {searchQuery
                      ? `Nessun club trovato con il nome "${searchQuery}"`
                      : 'Nessun club trovato al momento'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Fonda subito il tuo club, invita i tuoi amici e vinci partite per accumulare Coppe e potenziamenti in Guerra!
                  </p>
                  {!myClub && (
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-4 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/20"
                    >
                      + Crea il Tuo Club Ora
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clubsList.map((club) => {
                    const president = club.members.find((m) => m.role === 'presidente');
                    const accessInfo = ACCESS_LABELS[club.accessType];
                    const isMember = club.members.some((m) => m.playerId === playerId);
                    const hasPendingInvite = club.invites.some((i) => i.playerId === playerId);
                    const isFull = club.members.length >= club.maxMembers;

                    return (
                      <div
                        key={club.id}
                        className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-colors"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-black text-white">{club.name}</span>
                            {club.cityOrCountry && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                <MapPin className="w-3 h-3" /> {club.cityOrCountry}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${accessInfo.color}`}
                            >
                              {accessInfo.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5 text-amber-400" /> Fondatore:{' '}
                              <strong className="text-slate-200">{president?.playerName || 'N/D'}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-sky-400" /> {club.members.length}/{club.maxMembers} Membri
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-300 font-bold">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" /> {club.trophies || 0} Coppe
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMember ? (
                            <button
                              onClick={() => setActiveTab('my_club')}
                              className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase"
                            >
                              Sei nel Club →
                            </button>
                          ) : hasPendingInvite ? (
                            <span className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs">
                              ⏳ Invito in attesa
                            </span>
                          ) : club.accessType === 'chiuso' ? (
                            <span className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" /> Club Chiuso
                            </span>
                          ) : isFull ? (
                            <span className="px-3.5 py-2 rounded-xl bg-slate-700 text-slate-400 font-bold text-xs">
                              Club Pieno
                            </span>
                          ) : (
                            <button
                              disabled={Boolean(myClub)}
                              onClick={() => handleJoinClub(club)}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md"
                            >
                              {club.accessType === 'aperto' ? 'Entra nel Club' : 'Manda Invito / Richiedi'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE CLUB */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateClub} className="space-y-5 max-w-xl mx-auto py-2">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70">
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-1.5">
                  Nome del Club (da 1 a 50 lettere, compresi gli spazi)
                </label>
                <input
                  type="text"
                  minLength={1}
                  maxLength={50}
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value.slice(0, 50))}
                  placeholder="Es. Real Campioni Chaos 3D"
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-white font-bold text-base focus:outline-none"
                />
                <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-400">
                  <span>Spazi e lettere consentiti</span>
                  <span className={newClubName.length >= 45 ? 'text-amber-400 font-bold' : ''}>
                    {newClubName.length} / 50 caratteri
                  </span>
                </div>
              </div>

              {/* Optional City or Country on Creation */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Paese o Città della Squadra (es. Palermo, São Paulo)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={newClubLocation}
                  onChange={(e) => setNewClubLocation(e.target.value.slice(0, 40))}
                  placeholder="Scrivi una città o un paese (potrai cambiarlo sempre!)"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-white font-bold text-sm focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5">
                  {CITY_COUNTRY_PRESETS.slice(0, 10).map((loc) => (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => setNewClubLocation(loc)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        newClubLocation === loc
                          ? 'bg-sky-500 text-slate-950 border-sky-300'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-400'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Access Types */}
              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  Scegli il Tipo di Accesso del Club (3 Modalità):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['aperto', 'solo_invito', 'chiuso'] as ClubAccessType[]).map((type) => {
                    const info = ACCESS_LABELS[type];
                    const selected = newClubAccess === type;
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setNewClubAccess(type)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                          selected
                            ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-sm text-white uppercase">{info.label}</span>
                            {type === 'aperto' && <Unlock className="w-4 h-4 text-emerald-400" />}
                            {type === 'solo_invito' && <MailCheck className="w-4 h-4 text-amber-400" />}
                            {type === 'chiuso' && <Lock className="w-4 h-4 text-rose-400" />}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{info.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={newClubName.trim().length < 1}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-40 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl"
              >
                Fonda il Club come Fondatore
              </button>
            </form>
          )}

          {/* TAB 3: MY CLUB DASHBOARD */}
          {activeTab === 'my_club' && myClub && (
            <div className="space-y-5">
              {/* Club Header Info & Settings */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl sm:text-2xl font-black text-white">{myClub.name}</h3>
                    {myClub.cityOrCountry && (
                      <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/50">
                        <MapPin className="w-3.5 h-3.5" /> {myClub.cityOrCountry}
                      </span>
                    )}
                    <span
                      className={`text-xs font-black uppercase px-3 py-0.5 rounded-full border ${
                        ACCESS_LABELS[myClub.accessType].color
                      }`}
                    >
                      {ACCESS_LABELS[myClub.accessType].label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> {myClub.trophies || 0} Coppe
                    </span>
                    {(() => {
                      const boost = getCupBoostInfo(myClub.trophies || 0);
                      return (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${boost.badge}`}>
                          <Zap className="w-3 h-3" /> Boost Guerra {boost.tier} (x{boost.multiplier.toFixed(2)})
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Il tuo ruolo attuale:{' '}
                    <strong className="text-amber-300">
                      {myRole ? ROLE_LABELS[myRole].label : 'Membro'}
                    </strong>{' '}
                    — {myRole ? ROLE_LABELS[myRole].desc : ''}
                  </p>
                </div>

                {/* Access Type Switcher for Presidente & Vicepresidente */}
                <div className="flex flex-wrap items-center gap-2">
                  {canManageInvites && (
                    <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                      {(['aperto', 'solo_invito', 'chiuso'] as ClubAccessType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => handleChangeAccessType(t)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-colors ${
                            myClub.accessType === t
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {ACCESS_LABELS[t].label}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleLeaveClub}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Esci dal Club
                  </button>
                </div>
              </div>

              {/* FONDATORE CONTROL: Choose City or Country of the Team at ANY time */}
              {myRole === 'presidente' && (
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/35 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      Paese o Città della Squadra (Il Fondatore può cambiarlo in qualsiasi momento)
                    </span>
                    {myClub.cityOrCountry && (
                      <span className="text-[11px] font-bold text-white">
                        Attuale: <strong className="text-sky-300">{myClub.cityOrCountry}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      maxLength={40}
                      value={locationDraft}
                      onChange={(e) => setLocationDraft(e.target.value.slice(0, 40))}
                      placeholder="Es. Palermo, São Paulo, Napoli, Brasile..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 text-sm text-white font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateClubLocation(locationDraft)}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider shrink-0"
                    >
                      Salva Squadra
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {CITY_COUNTRY_PRESETS.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => handleUpdateClubLocation(loc)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          myClub.cityOrCountry === loc
                            ? 'bg-sky-500 text-slate-950 border-sky-300'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-sky-400'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Navigation inside Club */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setClubSubTab('members')}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                    clubSubTab === 'members'
                      ? 'bg-slate-800 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Gerarchia & Membri ({myClub.members.length}/{myClub.maxMembers})
                </button>

                {/* Scheda Chat Club (aperta a tutti i membri con testo + emoji) */}
                <button
                  onClick={() => setClubSubTab('chat')}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                    clubSubTab === 'chat'
                      ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Club ({chatMessages.length})
                </button>

                {/* Pagina Inviti for Fondatore & Semifondatore */}
                {canManageInvites && (
                  <button
                    onClick={() => setClubSubTab('invites')}
                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                      clubSubTab === 'invites'
                        ? 'bg-slate-800 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Pagina Inviti Mandati ({myClub.invites.length})
                  </button>
                )}

                {/* Pagina Consigli dell'Aiutante */}
                <button
                  onClick={() => setClubSubTab('advice')}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                    clubSubTab === 'advice'
                      ? 'bg-slate-800 border-sky-400 text-sky-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Consigli ({myClub.adviceList.length})
                </button>

                {/* Scheda Guerra tra Club (Fondatore sceglie club avversario) */}
                <button
                  onClick={() => {
                    setClubSubTab('war');
                    fetchWarsAndLeaderboard();
                  }}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                    clubSubTab === 'war'
                      ? 'bg-slate-800 border-rose-400 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  Guerra {myActiveWar ? '🔴 ATTIVA' : ''}
                </button>
              </div>

              {/* SUB-TAB 1: GERARCHIA & MEMBRI */}
              {clubSubTab === 'members' && (
                <div className="space-y-3">
                  {/* Legend of the 5 Roles with strict caps */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px]">
                    <div>
                      <span className="font-black text-amber-400 block">👑 Fondatore (1/1)</span>
                      <span className="text-slate-400">Capo + Guerra</span>
                    </div>
                    <div>
                      <span className="font-black text-purple-400 block">🛡️ Semifondatore ({viceCount}/2)</span>
                      <span className="text-slate-400">Max 2 • Inviti</span>
                    </div>
                    <div>
                      <span className="font-black text-sky-400 block">📜 Aiutante ({consigliereCount}/5)</span>
                      <span className="text-slate-400">Max 5 • Aiuta</span>
                    </div>
                    <div>
                      <span className="font-black text-emerald-400 block">🧙‍♂️ Calciatore Anziano ({socioSaggioCount}/∞)</span>
                      <span className="text-slate-400">Infiniti • Veterani</span>
                    </div>
                    <div>
                      <span className="font-black text-slate-300 block">⚽ Calciatore ({socioCount}/∞)</span>
                      <span className="text-slate-400">Infiniti • Giocatori</span>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2">
                    {myClub.members.map((member) => {
                      const rInfo = ROLE_LABELS[member.role];
                      const isSelf = member.playerId === playerId;

                      const canPresidenteEdit = myRole === 'presidente' && !isSelf;
                      const canViceEdit =
                        myRole === 'vicepresidente' &&
                        !isSelf &&
                        member.role !== 'presidente' &&
                        member.role !== 'vicepresidente';

                      const viceFull = viceCount >= 2 && member.role !== 'vicepresidente';
                      const consigliereFull = consigliereCount >= 5 && member.role !== 'consigliere';

                      return (
                        <div
                          key={member.playerId}
                          className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-sm text-amber-400">
                              {member.role === 'presidente'
                                ? '👑'
                                : member.role === 'vicepresidente'
                                ? '🛡️'
                                : member.role === 'consigliere'
                                ? '📜'
                                : member.role === 'socio_saggio'
                                ? '🧙‍♂️'
                                : '⚽'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">
                                  {member.playerName} {isSelf && '(Tu)'}
                                </span>
                                <span
                                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${rInfo.badgeClass}`}
                                >
                                  {rInfo.label}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Anzianità: {formatSeniority(member.joinedAt)}
                              </div>
                            </div>
                          </div>

                          {/* Role Management Controls */}
                          {(canPresidenteEdit || canViceEdit) && (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={member.role}
                                onChange={(e) => handleChangeRole(member.playerId, e.target.value as ClubRole)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                              >
                                {canPresidenteEdit && (
                                  <option value="vicepresidente" disabled={viceFull}>
                                    Nomina Semifondatore {viceFull ? '(Max 2 raggiunto)' : `(${viceCount}/2)`}
                                  </option>
                                )}
                                <option value="consigliere" disabled={consigliereFull}>
                                  Nomina Aiutante {consigliereFull ? '(Max 5 raggiunto)' : `(${consigliereCount}/5)`}
                                </option>
                                <option value="socio_saggio">Nomina Calciatore Anziano (∞)</option>
                                <option value="socio">Imposta come Calciatore (∞)</option>
                              </select>

                              <button
                                onClick={() => handleKickMember(member.playerId)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold"
                                title="Espelli dal club"
                              >
                                Espelli
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: CHAT DEL CLUB (Tutti i membri possono scriversi con testo & emoji in tempo reale!) */}
              {clubSubTab === 'chat' && (
                <div className="flex flex-col rounded-2xl bg-slate-950/75 border border-cyan-500/35 overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-cyan-300">
                          Chat del Club — {myClub.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tutti i membri del club possono scriversi messaggi ed emoji in tempo reale!
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Live • {myClub.members.length} membri
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="p-4 space-y-2.5 h-72 sm:h-80 overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-4">
                        <MessageCircle className="w-9 h-9 text-slate-700 mb-2" />
                        <div className="text-sm font-black text-slate-300">Nessun messaggio ancora</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Scrivi il primo saluto o manda un emoji ai tuoi compagni di club! ⚽🔥
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMine = msg.authorId === playerId;
                        const roleMeta = ROLE_LABELS[msg.authorRole] || ROLE_LABELS.socio;
                        const timeLabel = new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[11px] font-bold text-slate-200">
                                {isMine ? `${msg.authorName} (Tu)` : msg.authorName}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${roleMeta.badgeClass}`}
                              >
                                {roleMeta.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">{timeLabel}</span>
                            </div>
                            <div
                              className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-sm font-medium break-words whitespace-pre-wrap shadow-sm ${
                                isMine
                                  ? 'bg-gradient-to-r from-cyan-600/90 to-emerald-600/90 text-white rounded-tr-sm'
                                  : 'bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-tl-sm'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick Emoji Bar */}
                  <div className="px-3 pt-2.5 pb-1.5 bg-slate-900/95 border-t border-slate-800 flex items-center gap-1 overflow-x-auto">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-1 shrink-0">Emoji:</span>
                    {QUICK_CHAT_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleInsertEmoji(em)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/70 flex items-center justify-center text-base transition-transform hover:scale-110 active:scale-95 shrink-0"
                        title={`Inserisci ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  {/* Expandable Full Emoji Tray */}
                  {showEmojiPicker && (
                    <div className="px-3 py-2.5 bg-slate-950/95 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                      {EMOJI_PICKER_GROUPS.map((group) => (
                        <div key={group.title}>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            {group.title}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {group.emojis.map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => handleInsertEmoji(em)}
                                className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-base transition-transform hover:scale-110 active:scale-95"
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chat Input Form */}
                  <form
                    onSubmit={(e) => handleSendClubChat(e)}
                    className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                        showEmojiPicker
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                      }`}
                      title="Apri tastiera Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <input
                      ref={chatInputRef}
                      type="text"
                      maxLength={400}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value.slice(0, 400))}
                      placeholder="Scrivi un messaggio o inserisci emoji ai tuoi compagni..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-white font-medium focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || chatInput.trim().length === 0}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Invia</span>
                    </button>
                  </form>
                </div>
              )}

              {/* SUB-TAB 3: PAGINA INVITI MANDATI (Accessible by Fondatore & Semifondatore) */}
              {clubSubTab === 'invites' && canManageInvites && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                    <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
                      <MailCheck className="w-4 h-4" /> Pagina Gestione Inviti (Fondatore & Semifondatore)
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Qui il <strong>Fondatore</strong> e il <strong>Semifondatore</strong> vedono tutti gli inviti mandati e scelgono se introdurre i giocatori nel club, oppure mandano un invito diretto a un player.
                    </p>

                    <form onSubmit={handleSendDirectInvite} className="flex gap-2">
                      <input
                        type="text"
                        value={inviteTargetName}
                        onChange={(e) => setInviteTargetName(e.target.value)}
                        placeholder="Nome del giocatore da invitare nel club..."
                        className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl"
                      >
                        Manda Invito
                      </button>
                    </form>
                  </div>

                  {/* Pending Invites List */}
                  {myClub.invites.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-xs text-slate-400">
                      Nessun invito o richiesta in sospeso in questo momento.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myClub.invites.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-white">{inv.playerName}</span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {inv.type === 'request_to_join' ? 'Richiesta ricevuta' : 'Invito mandato dal Club'}
                              </span>
                            </div>
                            {inv.message && (
                              <p className="text-xs text-slate-400 mt-1">"{inv.message}"</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRespondInvite(inv.id, 'accept')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1 shadow-md"
                            >
                              <Check className="w-4 h-4" /> Introduci nel Club
                            </button>
                            <button
                              onClick={() => handleRespondInvite(inv.id, 'reject')}
                              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1"
                            >
                              <X className="w-4 h-4" /> Rifiuta
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 4: CONSIGLI DELL'AIUTANTE PER IL FONDATORE */}
              {clubSubTab === 'advice' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                    <h4 className="text-sm font-black uppercase tracking-wider text-sky-400 mb-1 flex items-center gap-2">
                      <MessageSquarePlus className="w-4 h-4" /> Sala dell'Aiutante (Consiglia il Fondatore)
                    </h4>
                    <p className="text-xs text-slate-400">
                      L'<strong>Aiutante</strong> può inviare consigli strategici al Fondatore su chi introdurre, chi promuovere a Calciatore Anziano o come impostare il club.
                    </p>

                    {canSendAdvice ? (
                      <form onSubmit={handleSendAdvice} className="flex gap-2 mt-3">
                        <input
                          type="text"
                          maxLength={200}
                          value={adviceInput}
                          onChange={(e) => setAdviceInput(e.target.value)}
                          placeholder="Scrivi un consiglio per il Fondatore..."
                          className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-sky-400"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase rounded-xl"
                        >
                          Invia Consiglio
                        </button>
                      </form>
                    ) : (
                      <div className="mt-2 text-[11px] text-amber-300 font-semibold">
                        Solo i membri con il ruolo di Aiutante (o Fondatore/Semifondatore) possono scrivere nuovi consigli.
                      </div>
                    )}
                  </div>

                  {myClub.adviceList.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-xs text-slate-400">
                      Nessun consiglio ancora inviato dagli Aiutanti.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myClub.adviceList.map((adv) => (
                        <div
                          key={adv.id}
                          className="p-3.5 rounded-2xl bg-slate-800/80 border border-sky-500/30 flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between text-[11px] text-sky-400 font-bold">
                            <span>📜 Aiutante: {adv.authorName}</span>
                            <span className="text-slate-500">
                              {new Date(adv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-white font-medium">{adv.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* SUB-TAB 4: GUERRA TRA CLUB (1 Settimana + Potenziamento Coppe + Classifica) */}
              {clubSubTab === 'war' && (
                <div className="space-y-4">
                  {/* Cup Boost Banner showing how pre-earned Coppe boost War score */}
                  {(() => {
                    const trophies = myClub.trophies || 0;
                    const boost = getCupBoostInfo(trophies);
                    const pct = boost.next ? Math.min(100, Math.round((trophies / boost.next) * 100)) : 100;
                    return (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/15 border border-amber-500/40 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-400" />
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                                Potenziamento Coppe Guerra: {boost.tier} (x{boost.multiplier.toFixed(2)})
                              </div>
                              <div className="text-[11px] text-slate-300">
                                Le <strong className="text-white">{trophies} Coppe</strong> accumulate dal club prima della guerra danno{' '}
                                <strong className="text-emerald-300">+{boost.bonusPct}% Coppe extra</strong> ad ogni vittoria in Guerra!
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs font-black px-3 py-1 rounded-full border ${boost.badge}`}>
                            {boost.bonusPct > 0 ? `+${boost.bonusPct}% BONUS` : '50 Coppe → +20%'}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                          <span>50🏆 Bronzo (+20%) • 150🏆 Argento (+40%) • 350🏆 Oro (+65%) • 700🏆 Leggenda (+100%)</span>
                          {boost.next && <span className="text-amber-300">{trophies}/{boost.next} Coppe</span>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active War Card */}
                  {myActiveWar ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/60 via-slate-900 to-amber-950/40 border-2 border-rose-500/60 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/40">
                          <Swords className="w-3.5 h-3.5" /> Guerra Settimanale in Corso
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                          <Clock className="w-3.5 h-3.5" /> {formatTimeRemaining(myActiveWar.endsAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 items-center text-center gap-2 py-2">
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                          <div className="text-xs font-black text-white truncate">{myActiveWar.challengerClubName}</div>
                          <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                            {myActiveWar.challengerPoints}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Coppe Guerra</div>
                        </div>

                        <div className="text-xl font-black text-rose-400">VS</div>

                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                          <div className="text-xs font-black text-white truncate">{myActiveWar.defenderClubName}</div>
                          <div className="text-3xl font-black font-mono text-sky-400 mt-1">
                            {myActiveWar.defenderPoints}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Coppe Guerra</div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 text-center">
                        Ogni partita vinta invia Coppe al club e (moltiplicate dal tuo Potenziamento Coppe!) le aggiunge alla Guerra settimanale!
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                      <h4 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                        <Swords className="w-4 h-4" /> Dichiara Guerra a un Club (Durata: 1 Settimana)
                      </h4>

                      {myRole === 'presidente' ? (
                        <>
                          <p className="text-xs text-slate-300">
                            Come <strong>Fondatore</strong>, scegli un club avversario qui sotto per iniziare una guerra di 7 giorni. Le Coppe vinte prima potenzieranno le vostre vittorie in Guerra!
                          </p>
                          {clubsList.filter((c) => c.id !== myClub.id).length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 text-center">
                              Non ci sono ancora altri club fondati da altri giocatori da sfidare.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {clubsList
                                .filter((c) => c.id !== myClub.id)
                                .map((otherClub) => {
                                  const otherBusy = activeWars.some(
                                    (w) => w.challengerClubId === otherClub.id || w.defenderClubId === otherClub.id
                                  );
                                  const otherPres = otherClub.members.find((m) => m.role === 'presidente');
                                  return (
                                    <div
                                      key={otherClub.id}
                                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-3"
                                    >
                                      <div>
                                        <div className="font-black text-sm text-white">{otherClub.name}</div>
                                        <div className="text-[11px] text-slate-400">
                                          Fondatore: {otherPres?.playerName || 'N/D'} • {otherClub.members.length} Membri • Punti Rank: {otherClub.rankScore || 0}
                                        </div>
                                      </div>
                                      <button
                                        disabled={otherBusy}
                                        onClick={() => handleDeclareWar(otherClub.id)}
                                        className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-black text-xs uppercase flex items-center gap-1.5 shrink-0"
                                      >
                                        <Swords className="w-3.5 h-3.5" />
                                        {otherBusy ? 'In Guerra' : 'Dichiara Guerra'}
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-amber-300 font-semibold">
                          Solo il Fondatore del club può scegliere un club avversario e dichiarare una guerra settimanale.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Recent Finished Wars Winner Announcements */}
                  {finishedWars.filter(
                    (w) => w.challengerClubId === myClub.id || w.defenderClubId === myClub.id
                  ).length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">
                        Risultati Guerre Settimanali Passate
                      </h5>
                      {finishedWars
                        .filter((w) => w.challengerClubId === myClub.id || w.defenderClubId === myClub.id)
                        .map((w) => (
                          <div
                            key={w.id}
                            className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between text-xs"
                          >
                            <span>
                              <strong>{w.challengerClubName}</strong> ({w.challengerPoints}) vs{' '}
                              <strong>{w.defenderClubName}</strong> ({w.defenderPoints})
                            </span>
                            <span className="font-black text-amber-300">
                              🏆 Vincitore: {w.winnerClubName || 'Pareggio'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLASSIFICA CLUB (WAR LEADERBOARD) */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" /> Classifica Ufficiale dei Club
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Vinci partite durante le Guerre Settimanali del tuo club per accumulare punti e scalare la classifica!
                  </p>
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-800">
                  Nessun club presente in classifica. Crea un club, accumula Coppe e dichiara guerra!
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((club, index) => {
                    const pres = club.members.find((m) => m.role === 'presidente');
                    const isMine = myClub?.id === club.id;
                    return (
                      <div
                        key={club.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                          isMine
                            ? 'bg-emerald-500/15 border-emerald-400/60'
                            : 'bg-slate-800/75 border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                              index === 0
                                ? 'bg-amber-400 text-slate-950'
                                : index === 1
                                ? 'bg-slate-300 text-slate-950'
                                : index === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                            }`}
                          >
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-black text-sm text-white flex items-center gap-2">
                              {club.name}
                              {isMine && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                                  Tuo Club
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              👑 Fondatore: {pres?.playerName || 'N/D'} • {club.members.length} Membri
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Coppe</div>
                            <div className="text-sm font-black text-amber-300">🏆 {club.trophies || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Guerre Vinte</div>
                            <div className="text-sm font-black text-emerald-400">{club.warWins || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Punti Classifica</div>
                            <div className="text-lg font-black font-mono text-white">{club.rankScore || 0}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
