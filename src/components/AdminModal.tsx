import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  X,
  Zap,
  MessageSquare,
  Vote,
  Trophy,
  Snowflake,
  Gauge,
  Flame,
  Sparkles,
  Orbit,
  CircleDot,
  RotateCcw,
  Send,
  Plus,
  Trash2,
  Map as MapIcon,
  LogOut,
  Check,
  Clock,
  Crosshair,
} from 'lucide-react';
import {
  AdminAnnouncementTheme,
  AdminPowers,
  AdminState,
  AdminVoteEffect,
  Club,
  MapId,
} from '../types/game';
import { MAP_CONFIGS } from '../game/stadiums';

interface AdminModalProps {
  isUnlocked: boolean;
  adminCode: string;
  adminState: AdminState;
  playerName: string;
  myClub: Club | null;
  inGame: boolean;
  selectedMap: MapId;
  onUnlockSuccess: (code: string, state: AdminState) => void;
  onLockAdmin: () => void;
  onAdminStateUpdate: (state: AdminState) => void;
  onClubUpdated: (club: Club) => void;
  onLocalMatchAction: (
    action: 'score_red' | 'score_blue' | 'reset_score' | 'reset_ball' | 'teleport_ball' | 'change_map',
    mapId?: MapId
  ) => void;
  onClose: () => void;
}

const EFFECT_LABELS: Record<AdminVoteEffect, string> = {
  none: 'Solo Sondaggio (nessun potere)',
  trophy_2x: '2x Coppe per tutti',
  trophy_5x: '5x Coppe per tutti',
  trophy_10x: '10x Coppe per tutti',
  slow_bots: 'Bot Lenti',
  freeze_bots: 'Bot Congelati',
  super_speed: 'Super Velocità Giocatori',
  infinite_energy: 'Energia Infinita',
  super_shot: 'Super Tiro 2x',
  low_gravity: 'Gravità Lunare',
  giant_ball: 'Pallone Gigante',
  zero_cooldown: 'Zero Cooldown Mosse',
};

const QUICK_VOTE_PRESETS: Array<{
  title: string;
  question: string;
  durationSec: number;
  options: Array<{ label: string; effect: AdminVoteEffect }>;
}> = [
  {
    title: '5x Coppe vs Bot Lenti',
    question: 'Quale super evento vuoi attivare adesso?',
    durationSec: 25,
    options: [
      { label: '5x Coppe per Tutti', effect: 'trophy_5x' },
      { label: 'Bot Lenti (Slow-Mo)', effect: 'slow_bots' },
    ],
  },
  {
    title: 'Energia Infinita vs Super Velocità',
    question: 'Scegli il potenziamento per i giocatori!',
    durationSec: 25,
    options: [
      { label: 'Energia Infinita 100%', effect: 'infinite_energy' },
      { label: 'Super Velocità Turbo', effect: 'super_speed' },
    ],
  },
  {
    title: 'Pallone Gigante vs Gravità Lunare',
    question: 'Modalità Caos! Cosa preferisci?',
    durationSec: 25,
    options: [
      { label: 'Pallone Gigante 2x', effect: 'giant_ball' },
      { label: 'Gravità Bassa Lunare', effect: 'low_gravity' },
    ],
  },
  {
    title: 'Super Tiro 2x vs 10x Coppe vs Bot Congelati',
    question: 'Evento Leggendario: vota il vincitore!',
    durationSec: 30,
    options: [
      { label: 'Super Tiro Infuocato', effect: 'super_shot' },
      { label: '10x Coppe Mega Boost', effect: 'trophy_10x' },
      { label: 'Bot Congelati', effect: 'freeze_bots' },
    ],
  },
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isUnlocked,
  adminCode,
  adminState,
  playerName,
  myClub,
  inGame,
  selectedMap,
  onUnlockSuccess,
  onLockAdmin,
  onAdminStateUpdate,
  onClubUpdated,
  onLocalMatchAction,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<'powers' | 'messages' | 'votes'>('powers');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Custom Message Form
  const [msgTitle, setMsgTitle] = useState('EVENTO SPECIALE ADMIN');
  const [msgBody, setMsgBody] = useState('');
  const [msgTheme, setMsgTheme] = useState<AdminAnnouncementTheme>('gold');

  // Custom Poll Form
  const [voteQuestion, setVoteQuestion] = useState('Quale evento Admin attiviamo ora?');
  const [voteDuration, setVoteDuration] = useState<number>(25);
  const [voteOptions, setVoteOptions] = useState<Array<{ label: string; effect: AdminVoteEffect }>>([
    { label: '5x Coppe', effect: 'trophy_5x' },
    { label: 'Bot Lenti', effect: 'slow_bots' },
  ]);

  const flashFeedback = (ok: boolean, text: string) => {
    setFeedback({ ok, text });
    window.setTimeout(() => setFeedback(null), 3200);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setVerifying(true);
    setPinError(null);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pinInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPinError(data.error || 'Codice errato!');
        return;
      }
      onUnlockSuccess(pinInput.trim(), data.state);
      setPinInput('');
    } catch {
      setPinError('Errore di connessione al server.');
    } finally {
      setVerifying(false);
    }
  };

  const updatePowers = async (patch: Partial<AdminPowers>, reset = false) => {
    try {
      const res = await fetch('/api/admin/powers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode, powers: patch, reset }),
      });
      const data = await res.json();
      if (!res.ok) {
        flashFeedback(false, data.error || 'Errore aggiornamento poteri.');
        return;
      }
      onAdminStateUpdate(data.state);
      flashFeedback(true, reset ? 'Tutti i poteri resettati a standard!' : 'Potere aggiornato per tutti i giocatori!');
    } catch {
      flashFeedback(false, 'Errore di rete.');
    }
  };

  const sendAnnouncement = async (clear = false) => {
    try {
      const res = await fetch('/api/admin/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: adminCode,
          title: msgTitle,
          message: msgBody,
          theme: msgTheme,
          authorName: playerName || 'Admin',
          clear,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        flashFeedback(false, data.error || 'Impossibile inviare il messaggio.');
        return;
      }
      onAdminStateUpdate(data.state);
      if (clear) {
        flashFeedback(true, 'Annuncio rimosso.');
      } else {
        setMsgBody('');
        flashFeedback(true, 'Messaggio personalizzato inviato a tutti i giocatori!');
      }
    } catch {
      flashFeedback(false, 'Errore di rete.');
    }
  };

  const launchVote = async (
    question: string,
    options: Array<{ label: string; effect: AdminVoteEffect }>,
    durationSec: number
  ) => {
    try {
      const res = await fetch('/api/admin/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: adminCode,
          question,
          options,
          durationSec,
          authorName: playerName || 'Admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        flashFeedback(false, data.error || 'Errore nella creazione del voto.');
        return;
      }
      onAdminStateUpdate(data.state);
      flashFeedback(true, 'Voto Live avviato per tutti i giocatori!');
    } catch {
      flashFeedback(false, 'Errore di rete.');
    }
  };

  const closeActiveVote = async () => {
    if (!adminState.activeVote) return;
    try {
      const res = await fetch(`/api/admin/votes/${adminState.activeVote.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode }),
      });
      const data = await res.json();
      if (res.ok && data.state) {
        onAdminStateUpdate(data.state);
        flashFeedback(true, 'Voto chiuso e potere vincente attivato!');
      }
    } catch {
      flashFeedback(false, 'Errore di rete.');
    }
  };

  const giftClubTrophies = async (amount: number) => {
    if (!myClub) {
      flashFeedback(false, 'Entra prima in un Club per regalare Coppe!');
      return;
    }
    try {
      const res = await fetch('/api/admin/gift-trophies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode, clubId: myClub.id, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        flashFeedback(false, data.error || 'Errore regalo Coppe.');
        return;
      }
      if (data.club) onClubUpdated(data.club);
      flashFeedback(true, data.message);
    } catch {
      flashFeedback(false, 'Errore di rete.');
    }
  };

  // LOCKED STATE: PIN ENTRY
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-950/85 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">ACCESSO ADMIN</h2>
                <p className="text-xs text-slate-400">Inserisci il codice segreto per sbloccare i poteri</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-amber-300 block mb-1.5">
                Codice Segreto Admin
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="Inserisci codice..."
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-center text-2xl font-mono font-black tracking-[0.35em] text-amber-300 focus:outline-none"
              />
            </div>

            {pinError && (
              <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold text-center">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || pinInput.trim().length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg"
            >
              {verifying ? 'Verifica in corso...' : 'Sblocca Poteri Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const p = adminState.powers;

  const powerCards: Array<{
    key: keyof Omit<AdminPowers, 'trophyMultiplier'>;
    label: string;
    desc: string;
    icon: React.ReactNode;
    activeClass: string;
  }> = [
    {
      key: 'slowBots',
      label: 'Bot Lenti',
      desc: 'Rallenta tutti i bot del 58%',
      icon: <Gauge className="w-5 h-5" />,
      activeClass: 'bg-sky-500/20 border-sky-400 text-sky-200',
    },
    {
      key: 'freezeBots',
      label: 'Bot Congelati',
      desc: 'Blocca completamente tutti i bot',
      icon: <Snowflake className="w-5 h-5" />,
      activeClass: 'bg-cyan-500/25 border-cyan-300 text-cyan-100',
    },
    {
      key: 'superSpeedPlayers',
      label: 'Super Velocità',
      desc: 'Velocità 1.6x per i giocatori',
      icon: <Zap className="w-5 h-5" />,
      activeClass: 'bg-amber-500/25 border-amber-400 text-amber-200',
    },
    {
      key: 'infiniteEnergy',
      label: 'Energia Infinita',
      desc: '100% stamina sempre attiva',
      icon: <Sparkles className="w-5 h-5" />,
      activeClass: 'bg-emerald-500/25 border-emerald-400 text-emerald-200',
    },
    {
      key: 'superPowerShot',
      label: 'Super Tiro 2x',
      desc: 'Tiri potentissimi infuocati',
      icon: <Flame className="w-5 h-5" />,
      activeClass: 'bg-orange-500/25 border-orange-400 text-orange-200',
    },
    {
      key: 'lowGravity',
      label: 'Gravità Lunare',
      desc: 'Palla leggerissima in aria',
      icon: <Orbit className="w-5 h-5" />,
      activeClass: 'bg-indigo-500/25 border-indigo-400 text-indigo-200',
    },
    {
      key: 'giantBall',
      label: 'Pallone Gigante',
      desc: 'Pallone 2.1x gigante in campo',
      icon: <CircleDot className="w-5 h-5" />,
      activeClass: 'bg-pink-500/25 border-pink-400 text-pink-200',
    },
    {
      key: 'zeroCooldown',
      label: 'Zero Cooldown',
      desc: 'Mosse speciali e scivolate continue',
      icon: <Crosshair className="w-5 h-5" />,
      activeClass: 'bg-violet-500/25 border-violet-400 text-violet-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-400/70 rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-amber-300">TABELLA ADMIN SUPREMO</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                  Attivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Attiva poteri per tutti i giocatori, invia messaggi globali e lancia voti live!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLockAdmin}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
              title="Blocca pannello Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Blocca</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 px-5 pt-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('powers')}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'powers'
                ? 'border-amber-400 text-amber-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" /> Poteri Giocatori
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'messages'
                ? 'border-sky-400 text-sky-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Messaggi Personalizzati
          </button>
          <button
            onClick={() => setActiveTab('votes')}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'votes'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Vote className="w-4 h-4" /> Voti Live ({adminState.activeVote ? '1 Attivo' : 'Crea'})
          </button>
        </div>

        {feedback && (
          <div
            className={`mx-5 mt-3 px-4 py-2 rounded-xl text-xs font-bold border flex items-center justify-between ${
              feedback.ok
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="underline ml-3">
              OK
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: POTERI GIOCATORI */}
          {activeTab === 'powers' && (
            <>
              {/* Moltiplicatore Coppe */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-black uppercase tracking-wider text-amber-300">
                      Moltiplicatore Coppe Club (Tutti i Giocatori)
                    </span>
                  </div>
                  <button
                    onClick={() => updatePowers({}, true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-black uppercase flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Tutto
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 5, 10] as const).map((mult) => (
                    <button
                      key={mult}
                      onClick={() => updatePowers({ trophyMultiplier: mult })}
                      className={`py-2.5 rounded-xl font-black text-sm border-2 transition-all ${
                        p.trophyMultiplier === mult
                          ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-lg'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      {mult === 1 ? '1x Normale' : `${mult}x Coppe`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Global Power Toggles */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  Poteri Globali Attivi per i Giocatori (Clicca per Attivare / Disattivare)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {powerCards.map((card) => {
                    const active = Boolean(p[card.key]);
                    return (
                      <button
                        key={card.key}
                        onClick={() => updatePowers({ [card.key]: !active })}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                          active
                            ? card.activeClass
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {card.icon}
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              active ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {active ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <div>
                          <div className="font-black text-xs text-white">{card.label}</div>
                          <div className="text-[10px] opacity-80 leading-tight mt-0.5">{card.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instant Actions (Match & Club) */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Azioni Istantanee Admin
                </h3>
                <div className="flex flex-wrap gap-2">
                  {myClub && (
                    <>
                      <button
                        onClick={() => giftClubTrophies(250)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-black"
                      >
                        +250 Coppe a "{myClub.name}"
                      </button>
                      <button
                        onClick={() => giftClubTrophies(1000)}
                        className="px-3.5 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 text-yellow-200 text-xs font-black"
                      >
                        +1000 Coppe Mega Regalo
                      </button>
                    </>
                  )}
                  {inGame && (
                    <>
                      <button
                        onClick={() => {
                          onLocalMatchAction('score_red');
                          flashFeedback(true, '+50 punti assegnati ai Rossi!');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 text-xs font-black"
                      >
                        +50 Punti Rossi
                      </button>
                      <button
                        onClick={() => {
                          onLocalMatchAction('score_blue');
                          flashFeedback(true, '+50 punti assegnati ai Blu!');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 text-xs font-black"
                      >
                        +50 Punti Blu
                      </button>
                      <button
                        onClick={() => {
                          onLocalMatchAction('reset_score');
                          flashFeedback(true, 'Punteggio azzerato (0 - 0)!');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-black"
                      >
                        Reset 0 - 0
                      </button>
                      <button
                        onClick={() => {
                          onLocalMatchAction('reset_ball');
                          flashFeedback(true, 'Palla riportata a centrocampo!');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-black"
                      >
                        Palla al Centro
                      </button>
                      <button
                        onClick={() => {
                          onLocalMatchAction('teleport_ball');
                          flashFeedback(true, 'Palla teletrasportata ai tuoi piedi!');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-black"
                      >
                        Chiama Palla a Me
                      </button>
                    </>
                  )}
                </div>

                {/* Quick Map Switch */}
                <div className="pt-2 border-t border-slate-700/70">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                    <MapIcon className="w-3.5 h-3.5 text-amber-400" /> Cambia Mappa Istantaneamente:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(MAP_CONFIGS) as MapId[]).map((mId) => (
                      <button
                        key={mId}
                        onClick={() => {
                          onLocalMatchAction('change_map', mId);
                          flashFeedback(true, `Mappa cambiata in: ${MAP_CONFIGS[mId].name}`);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border transition-colors ${
                          selectedMap === mId
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {MAP_CONFIGS[mId].name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MESSAGGI PERSONALIZZATI */}
          {activeTab === 'messages' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-sky-300 block">
                  Titolo Annuncio
                </label>
                <input
                  type="text"
                  maxLength={48}
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  placeholder="Es. EVENTO SPECIALE ADMIN"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-sky-400 text-white font-bold text-sm focus:outline-none"
                />

                <label className="text-xs font-black uppercase tracking-wider text-sky-300 block">
                  Messaggio Personalizzato per Tutti i Giocatori
                </label>
                <textarea
                  rows={3}
                  maxLength={220}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Scrivi qui il tuo messaggio globale (es. Sta per partire l'evento 5x Coppe! Preparatevi!)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-sky-400 text-white text-sm font-semibold focus:outline-none resize-none"
                />

                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Stile Banner
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'gold', label: 'Annuncio Oro', cls: 'border-amber-400 bg-amber-500/20 text-amber-200' },
                        { id: 'epic', label: 'Epico Viola', cls: 'border-purple-400 bg-purple-500/20 text-purple-200' },
                        { id: 'alert', label: 'Avviso Rosso', cls: 'border-rose-400 bg-rose-500/20 text-rose-200' },
                        { id: 'party', label: 'Festa Verde', cls: 'border-emerald-400 bg-emerald-500/20 text-emerald-200' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMsgTheme(t.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all ${
                          msgTheme === t.id ? t.cls : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick templates */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'EVENTO 5X COPPE ATTIVO! Vincete partite ora!',
                    'ATTENZIONE: Sta per iniziare un Voto Live, votate subito!',
                    'MODALITÀ CAOS ATTIVA: Pallone Gigante e Super Tiro!',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setMsgBody(tpl)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      + {tpl.slice(0, 38)}...
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => sendAnnouncement(false)}
                    disabled={!msgBody.trim()}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Invia Messaggio a Tutti
                  </button>
                  {adminState.announcement && (
                    <button
                      type="button"
                      onClick={() => sendAnnouncement(true)}
                      className="px-4 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-black text-xs uppercase"
                    >
                      Rimuovi Attivo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VOTI LIVE */}
          {activeTab === 'votes' && (
            <div className="space-y-5">
              {/* Active Vote Control */}
              {adminState.activeVote && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-400/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase text-emerald-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Voto Attualmente in Corso
                    </div>
                    <div className="text-base font-black text-white mt-0.5">{adminState.activeVote.question}</div>
                    <div className="text-xs text-slate-300 mt-1">
                      {adminState.activeVote.options.map((o) => `${o.label}: ${o.votes}`).join('  •  ')}
                    </div>
                  </div>
                  <button
                    onClick={closeActiveVote}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase shrink-0"
                  >
                    Chiudi Voto e Applica Ora
                  </button>
                </div>
              )}

              {/* Quick 1-Click Vote Presets */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 mb-2.5">
                  Lancia Subito un Voto Rapido (Il vincitore attiva il potere automaticamente!)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {QUICK_VOTE_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      onClick={() => launchVote(preset.question, preset.options, preset.durationSec)}
                      className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-left transition-all"
                    >
                      <div className="font-black text-sm text-white flex items-center justify-between">
                        <span>{preset.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black">
                          AVVIA
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {preset.options.map((o) => o.label).join(' vs ')} ({preset.durationSec}s)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Poll Builder */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Oppure Crea un Voto Personalizzato
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Domanda del Voto</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={voteQuestion}
                      onChange={(e) => setVoteQuestion(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-400 text-sm text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Durata (sec)</label>
                    <select
                      value={voteDuration}
                      onChange={(e) => setVoteDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-bold focus:outline-none"
                    >
                      <option value={15}>15 secondi</option>
                      <option value={25}>25 secondi</option>
                      <option value={45}>45 secondi</option>
                      <option value={60}>60 secondi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {voteOptions.map((opt, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        maxLength={44}
                        value={opt.label}
                        onChange={(e) =>
                          setVoteOptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item))
                          )
                        }
                        placeholder={`Opzione ${idx + 1} (es. 5x Coppe)`}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                      />
                      <select
                        value={opt.effect}
                        onChange={(e) =>
                          setVoteOptions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, effect: e.target.value as AdminVoteEffect } : item
                            )
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-amber-300 focus:outline-none"
                      >
                        {(Object.keys(EFFECT_LABELS) as AdminVoteEffect[]).map((eff) => (
                          <option key={eff} value={eff}>
                            {EFFECT_LABELS[eff]}
                          </option>
                        ))}
                      </select>
                      {voteOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setVoteOptions((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {voteOptions.length < 4 ? (
                    <button
                      type="button"
                      onClick={() => setVoteOptions((prev) => [...prev, { label: '', effect: 'none' }])}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Aggiungi Opzione
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => launchVote(voteQuestion, voteOptions, voteDuration)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                  >
                    <Check className="w-4 h-4" /> Avvia Voto Personalizzato
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
