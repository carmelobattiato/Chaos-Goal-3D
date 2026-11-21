import React, { useState, useEffect } from 'react';
import { Bot, PlusCircle, Globe, KeyRound, Sparkles, Trophy, Users, ShieldCheck, Shield, Check, Pencil, X } from 'lucide-react';
import { BotDifficulty, Club, MapId } from '../types/game';
import { MAP_CONFIGS } from '../game/stadiums';
import { BOT_DIFFICULTY_PROFILES } from '../game/botAI';
import { ClubModal } from './ClubModal';

interface PublicRoomItem {
  code: string;
  name: string;
  map: MapId;
  playerCount: number;
  maxPlayers: number;
  state: string;
}

interface LobbyModalProps {
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  savedPlayerName: string;
  isNameSaved: boolean;
  onSavePermanentName: (nameToSave: string) => void;
  myClub: Club | null;
  onClubUpdated: (club: Club | null, explicitLeave?: boolean) => void;
  selectedMap: MapId;
  setSelectedMap: (map: MapId) => void;
  botDifficulty: BotDifficulty;
  setBotDifficulty: (diff: BotDifficulty) => void;
  onPlayBot: () => void;
  onCreateRoom: (roomName: string, isPublic: boolean) => void;
  onJoinByCode: (code: string) => void;
  onQuickMatch: () => void;
  isAdminUnlocked: boolean;
  onOpenAdmin: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  playerId,
  playerName,
  setPlayerName,
  savedPlayerName,
  isNameSaved,
  onSavePermanentName,
  myClub,
  onClubUpdated,
  selectedMap,
  setSelectedMap,
  botDifficulty,
  setBotDifficulty,
  onPlayBot,
  onCreateRoom,
  onJoinByCode,
  isAdminUnlocked,
  onOpenAdmin,
}) => {
  const [activeModal, setActiveModal] = useState<'none' | 'create' | 'public' | 'code' | 'club'>('none');
  const [isEditingName, setIsEditingName] = useState<boolean>(!isNameSaved);
  const [inputCode, setInputCode] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [isPublicCheckbox, setIsPublicCheckbox] = useState(true);
  const [publicRooms, setPublicRooms] = useState<PublicRoomItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (isNameSaved) {
      setIsEditingName(false);
    }
  }, [isNameSaved, savedPlayerName]);

  useEffect(() => {
    if (activeModal === 'public') {
      fetchRooms();
    }
  }, [activeModal]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setPublicRooms(data.rooms || []);
    } catch (err) {
      console.warn('Failed to fetch rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const pendingInvitesCount = myClub
    ? myClub.members.some(
        (m) => m.playerId === playerId && (m.role === 'presidente' || m.role === 'vicepresidente')
      )
      ? myClub.invites.length
      : 0
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Top-Right ADMIN Rectangular Button */}
      <button
        onClick={onOpenAdmin}
        className={`fixed top-4 right-4 z-[65] px-5 py-2.5 rounded-xl border-2 font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
          isAdminUnlocked
            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-amber-200 text-slate-950 shadow-amber-500/30'
            : 'bg-slate-900/95 border-amber-400/75 text-amber-300 hover:bg-slate-800 shadow-black/50'
        }`}
        title="Apri Tabella Admin"
      >
        <ShieldCheck className="w-4 h-4" />
        <span>ADMIN</span>
      </button>

      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative">
        {/* Header with Title, Small Square CLUB Button, and Permanent Nickname */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold tracking-wider uppercase border border-rose-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Punteggio Casuale Ad Ogni Gol
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              CHAOS GOAL <span className="text-rose-500">3D</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Calcio multiplayer arcade con regole imprevedibili: ogni gol estrae un punteggio misterioso!
            </p>
          </div>

          {/* Right side: Piccolo Quadrato CLUB + Nome Giocatore Salvato Per Sempre */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Piccolo quadrato nel menu principale con scritto CLUB */}
            <button
              onClick={() => setActiveModal('club')}
              className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/25 via-slate-800 to-rose-500/20 border-2 border-amber-400/70 hover:border-amber-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-500/15 transition-all shrink-0"
              title="Apri Club Ufficiali"
            >
              <Shield className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-black tracking-widest uppercase text-white">CLUB</span>
              {myClub && (
                <span className="text-[9px] font-bold text-emerald-400 max-w-[68px] truncate">
                  {myClub.name}
                </span>
              )}
              {pendingInvitesCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
                  {pendingInvitesCount}
                </span>
              )}
            </button>

            {/* Nickname Input / Saved Editable Name Display */}
            <div className="flex flex-col sm:items-end">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                {isNameSaved && !isEditingName ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Nome Salvato (Puoi sempre cambiarlo)</span>
                  </>
                ) : (
                  <span>Scegli Nome (Spazi consentiti)</span>
                )}
              </label>

              {isNameSaved && !isEditingName ? (
                <div className="w-full sm:w-64 px-3.5 py-2 bg-slate-950/90 border-2 border-emerald-500/50 rounded-xl text-white font-black text-sm flex items-center justify-between gap-2 shadow-inner">
                  <span className="truncate">{savedPlayerName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerName(savedPlayerName);
                      setIsEditingName(true);
                    }}
                    className="shrink-0 text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-colors"
                    title="Cambia il tuo nome giocatore"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Cambia</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={playerName}
                    maxLength={24}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 24))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && playerName.trim().length >= 1) {
                        e.preventDefault();
                        onSavePermanentName(playerName);
                        setIsEditingName(false);
                      }
                    }}
                    placeholder="Es. Marco Rossi..."
                    className="w-40 sm:w-48 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (playerName.trim().length >= 1) {
                        onSavePermanentName(playerName);
                        setIsEditingName(false);
                      }
                    }}
                    disabled={playerName.trim().length < 1}
                    className="px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase flex items-center gap-1 shadow-md"
                    title="Salva il tuo nome"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salva</span>
                  </button>
                  {isNameSaved && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerName(savedPlayerName);
                        setIsEditingName(false);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                      title="Annulla modifica"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Selection Strip (12 Unique 3D Maps with Movement Effects) */}
        <div className="py-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Scegli il Campo di Gioco (12 Arene 3D):
            </span>
            <span className="text-[11px] font-semibold text-amber-300 normal-case">
              {MAP_CONFIGS[selectedMap]?.name} · {MAP_CONFIGS[selectedMap]?.movementLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[268px] overflow-y-auto pr-1">
            {(Object.keys(MAP_CONFIGS) as MapId[]).map((mapId) => {
              const cfg = MAP_CONFIGS[mapId];
              const isSelected = selectedMap === mapId;
              const hasSpecialMovement = Boolean(cfg.hasMovementEffect);
              return (
                <button
                  key={mapId}
                  onClick={() => setSelectedMap(mapId)}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: cfg.accentHex }}
                      />
                      <div className="font-bold text-xs sm:text-sm text-white truncate">{cfg.name}</div>
                    </div>
                    <div className="text-[10px] text-rose-300 font-semibold mt-0.5 truncate">{cfg.theme}</div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                      {cfg.description}
                    </p>
                  </div>
                  <div
                    className={`mt-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide w-fit border ${
                      hasSpecialMovement
                        ? 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                        : 'bg-slate-900/70 text-slate-400 border-slate-700/70'
                    }`}
                  >
                    {cfg.movementLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* The 4 Game Mode Cards specified by User:
            "gioca con bot, crea stanza, trova stanza pubblica, inserisci codice" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* 1. Gioca con Bot */}
          <div
            onClick={onPlayBot}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPlayBot();
              }
            }}
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/10 text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                Gioca con Bot
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Partita a squadre 4v4: compagni a cui passare la palla e avversari IA con parate, finte e scivolate!
              </p>

              {/* 6 Livelli di difficoltà Bot */}
              <div
                className="mt-3 bg-slate-950/75 p-1.5 rounded-xl border border-slate-700/80 space-y-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'principiante', label: 'Princip.', active: 'bg-teal-400 text-slate-950' },
                      { id: 'dilettante', label: 'Dilett.', active: 'bg-sky-400 text-slate-950' },
                      { id: 'esperto', label: 'Pro', active: 'bg-emerald-500 text-slate-950' },
                      { id: 'campione', label: 'Campione', active: 'bg-amber-400 text-slate-950' },
                      { id: 'leggenda', label: 'Leggenda', active: 'bg-rose-500 text-white' },
                      { id: 'impossibile', label: 'Divino', active: 'bg-fuchsia-500 text-white' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setBotDifficulty(lvl.id)}
                      className={`py-1 px-1 rounded-lg text-[9px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${
                        botDifficulty === lvl.id
                          ? `${lvl.active} shadow`
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-300 font-medium px-1 truncate">
                  {BOT_DIFFICULTY_PROFILES[botDifficulty]?.label}:{' '}
                  <span className="text-slate-400">{BOT_DIFFICULTY_PROFILES[botDifficulty]?.tagline}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Avvia Subito →
            </div>
          </div>

          {/* 2. Crea Stanza */}
          <button
            onClick={() => {
              setRoomNameInput(`Stanza di ${playerName || 'Campione'}`);
              setActiveModal('create');
            }}
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 hover:border-rose-500/80 hover:shadow-lg hover:shadow-rose-500/10 text-left transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="text-lg font-black text-white group-hover:text-rose-400 transition-colors">
              Crea Stanza
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Crea una sfida fino a 10 vs 10 giocatori! Riceverai un codice segreto visibile solo a te per invitare amici.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
              Configura Stanza →
            </div>
          </button>

          {/* 3. Trova Stanza Pubblica */}
          <button
            onClick={() => setActiveModal('public')}
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 hover:border-sky-500/80 hover:shadow-lg hover:shadow-sky-500/10 text-left transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <div className="text-lg font-black text-white group-hover:text-sky-400 transition-colors">
              Trova Stanza Pubblica
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Esplora le stanze aperte della community o entra al volo in una partita multiplayer attiva.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
              Sfoglia Stanze →
            </div>
          </button>

          {/* 4. Inserisci Codice */}
          <button
            onClick={() => setActiveModal('code')}
            className="group p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 hover:border-amber-500/80 hover:shadow-lg hover:shadow-amber-500/10 text-left transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
              Inserisci Codice
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Hai un codice stanza ricevuto da un amico? Inseriscilo qui per entrare direttamente nel match.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              Digita Codice →
            </div>
          </button>
        </div>

        {/* Modal: Inserisci Codice */}
        {activeModal === 'code' && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white">
              <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-amber-400">
                <KeyRound className="w-5 h-5" /> Inserisci Codice Stanza
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Inserisci il codice di 6 caratteri condiviso dal creatore della stanza.
              </p>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="ES. AB3X9Z"
                className="w-full text-center tracking-widest text-2xl font-mono font-black py-3 px-4 bg-slate-800 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-white uppercase focus:outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Annulla
                </button>
                <button
                  disabled={inputCode.trim().length < 3}
                  onClick={() => {
                    onJoinByCode(inputCode.trim());
                    setActiveModal('none');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Entra
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Crea Stanza */}
        {activeModal === 'create' && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white">
              <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-rose-400">
                <PlusCircle className="w-5 h-5" /> Configura Nuova Stanza
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Il codice di accesso apparirà in basso a sinistra durante la partita e sarà visibile esclusivamente a te per invitare amici!
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Titolo Stanza
                  </label>
                  <input
                    type="text"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-rose-500 rounded-xl text-white text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                  <input
                    type="checkbox"
                    id="isPublicCheck"
                    checked={isPublicCheckbox}
                    onChange={(e) => setIsPublicCheckbox(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded"
                  />
                  <label htmlFor="isPublicCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Stanza Pubblica (visibile nell'elenco pubblico)
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    onCreateRoom(roomNameInput.trim() || `Stanza di ${playerName}`, isPublicCheckbox);
                    setActiveModal('none');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20"
                >
                  Crea e Avvia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Trova Stanza Pubblica */}
        {activeModal === 'public' && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black flex items-center gap-2 text-sky-400">
                  <Globe className="w-5 h-5" /> Stanze Pubbliche
                </h3>
                <button
                  onClick={fetchRooms}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold underline"
                >
                  Aggiorna
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 mb-6 pr-1">
                {loadingRooms ? (
                  <div className="text-center py-8 text-sm text-slate-400">Caricamento stanze...</div>
                ) : publicRooms.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-850 rounded-2xl border border-slate-800">
                    <p className="text-sm font-semibold text-slate-300 mb-1">Nessuna stanza pubblica aperta al momento.</p>
                    <p className="text-xs text-slate-500">Crea tu una nuova stanza oppure gioca con il bot!</p>
                  </div>
                ) : (
                  publicRooms.map((r) => (
                    <div
                      key={r.code}
                      className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{r.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{MAP_CONFIGS[r.map]?.name || r.map}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" /> {r.playerCount}/{r.maxPlayers}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onJoinByCode(r.code);
                          setActiveModal('none');
                        }}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider"
                      >
                        Unisciti
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveModal('none')}
                  className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Club Ufficiali */}
        {activeModal === 'club' && (
          <ClubModal
            playerId={playerId}
            playerName={playerName}
            myClub={myClub}
            onClubUpdated={onClubUpdated}
            onClose={() => setActiveModal('none')}
          />
        )}

        {/* Footer info banner */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>WASD Muovi · E Tiro · Q Passa · R/1 Mega Tiro · F/2 Rovesciata · C/3 Finta · V/4 Lob · Spazio Scivolata · TAB Squadra</span>
          </div>
          <div className="text-slate-400 font-mono">12 Mappe · 6 Livelli IA · 10 vs 10</div>
        </div>
      </div>
    </div>
  );
};
