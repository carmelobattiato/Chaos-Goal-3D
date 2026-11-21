import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Crown,
  Share2,
  Sparkles,
  Trophy,
  LogOut,
  MessageSquare,
  Zap,
  Swords,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { GoalEventData, MapId, PlayerState, RefereeDecisionEvent, WarAwardInfo } from '../types/game';
import { MAP_CONFIGS } from '../game/stadiums';
import { sound } from '../game/audio';
import confetti from 'canvas-confetti';

interface MatchHUDProps {
  roomCode?: string;
  isHost: boolean;
  mapId: MapId;
  scores: { red: number; blue: number };
  goalEvent: GoalEventData | null;
  matchTimer: number;
  matchEnded: boolean;
  energy: number;
  tackleNotice: string | null;
  warAwardInfo: WarAwardInfo | null;
  players: PlayerState[];
  selfPlayer: PlayerState | null;
  isVoiceEnabled: boolean;
  isMuted: boolean;
  onToggleMic: () => void;
  onEnableVoice: () => void;
  onLeaveMatch: () => void;
  onPlayAgain?: () => void;
  onFinishNow?: () => void;
  onSendQuickChat: (text: string) => void;
  quickChatMessages: Array<{ id: string; sender: string; text: string }>;
  isAdminUnlocked: boolean;
  onOpenAdmin: () => void;
  onOpenSquad: () => void;
  teamAvgFatigue: number;
  refereeEvent: RefereeDecisionEvent | null;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  roomCode,
  isHost,
  mapId,
  scores,
  goalEvent,
  matchTimer,
  matchEnded,
  energy,
  tackleNotice,
  warAwardInfo,
  players,
  selfPlayer,
  isVoiceEnabled,
  isMuted,
  onToggleMic,
  onEnableVoice,
  onLeaveMatch,
  onPlayAgain,
  onFinishNow,
  onSendQuickChat,
  quickChatMessages,
  isAdminUnlocked,
  onOpenAdmin,
  onOpenSquad,
  teamAvgFatigue,
  refereeEvent,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);

  // Trigger confetti burst on goal
  useEffect(() => {
    if (goalEvent) {
      sound.playCrowdCheer();
      sound.playGoalFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: goalEvent.scoringTeam === 'red' ? ['#ef4444', '#f59e0b', '#ffffff'] : ['#0284c7', '#38bdf8', '#ffffff'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [goalEvent]);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const mapConfig = MAP_CONFIGS[mapId];
  const clampedEnergy = Math.max(0, Math.min(100, energy));
  const energyBarColor =
    clampedEnergy > 55
      ? 'from-emerald-400 to-cyan-400'
      : clampedEnergy > 25
      ? 'from-amber-400 to-orange-400'
      : 'from-rose-500 to-red-500';

  const selfTeam = selfPlayer?.team || 'red';
  const myScore = scores[selfTeam];
  const oppScore = scores[selfTeam === 'red' ? 'blue' : 'red'];
  const matchOutcome = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-3 sm:p-5 overflow-hidden">
      {/* TOP BAR: Scoreboard, Energy Bar, Map Badge, Voice Chat Status */}
      <div className="flex items-start justify-between w-full gap-2 sm:gap-4">
        {/* Left: Map Info, Match Timer & Barra Energetica */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/80 flex items-center gap-2 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider leading-tight">
                {mapConfig.name}
              </span>
              {mapConfig.hasMovementEffect && (
                <span className="text-[9px] font-black uppercase tracking-wide text-amber-300 leading-tight">
                  {mapConfig.movementLabel}
                </span>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-white">
                  ⏱ {formatTime(matchTimer)}
                </span>
                {onFinishNow && !matchEnded && (
                  <button
                    onClick={onFinishNow}
                    className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                    title="Termina partita ora"
                  >
                    Fine
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BARRA ENERGETICA */}
          <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700/90 shadow-lg w-40 sm:w-48">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1 text-emerald-300">
                <Zap className="w-3 h-3 text-amber-400" /> Energia
              </span>
              <span className={`font-mono ${clampedEnergy < 22 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                {clampedEnergy}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/80">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${energyBarColor} transition-all duration-100`}
                style={{ width: `${clampedEnergy}%` }}
              />
            </div>
            {clampedEnergy < 18 && (
              <span className="text-[9px] text-rose-400 font-bold block mt-0.5">
                Energia bassa per scivolata/scatto
              </span>
            )}
          </div>

          {/* GESTIONE SQUADRA (TAB) BUTTON */}
          <button
            onClick={onOpenSquad}
            className="px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-left shadow-lg flex items-center justify-between gap-2 w-40 sm:w-48 transition-colors"
            title="Apri Gestione Squadra (Tasto TAB)"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-black text-white">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Squadra</span>
            </span>
            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
              TAB • {Math.max(0, 100 - teamAvgFatigue)}%
            </span>
          </button>
        </div>

        {/* Center: CHAOTIC SCOREBOARD */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="flex items-center rounded-2xl bg-slate-950/90 border-2 border-slate-800 shadow-2xl px-4 py-2">
            {/* RED TEAM */}
            <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                  ROSSI
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {scores.red}
                </span>
              </div>
            </div>

            {/* VS BADGE */}
            <div className="px-3 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-slate-500">VS</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            {/* BLUE TEAM */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                  BLU
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {scores.blue}
                </span>
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-md shadow-sky-500/50" />
            </div>
          </div>

          <div className="mt-1 px-3 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>
              {players.filter((p) => p.team === 'red').length}v{players.filter((p) => p.team === 'blue').length} • Punteggi Imprevedibili
            </span>
          </div>

          {tackleNotice && !goalEvent && (
            <div className="mt-2 px-4 py-1.5 rounded-xl bg-amber-500/95 text-slate-950 font-black text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150">
              {tackleNotice}
            </div>
          )}
        </div>

        {/* Right: Voice Chat & Sound Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {isVoiceEnabled ? (
            <button
              onClick={onToggleMic}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 border font-bold text-xs shadow-lg transition-all ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Mutato</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-0.5 h-4">
                    <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-bounce delay-75" />
                    <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150" />
                  </div>
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Voce Attiva</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onEnableVoice}
              className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Mic className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Attiva Voce</span>
            </button>
          )}

          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setIsSoundMuted(muted);
            }}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onLeaveMatch}
            className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
            title="Esci dalla partita"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Top-Right ADMIN Rectangular Button */}
          <button
            onClick={onOpenAdmin}
            className={`px-3.5 py-2 rounded-xl border-2 font-black text-xs uppercase tracking-[0.16em] flex items-center gap-1.5 shadow-lg transition-all ${
              isAdminUnlocked
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-amber-200 text-slate-950'
                : 'bg-slate-950/95 border-amber-400/75 text-amber-300 hover:bg-slate-800'
            }`}
            title="Apri Tabella Admin"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ADMIN</span>
          </button>
        </div>
      </div>

      {/* REFEREE DECISION OVERLAY (Cartellino Giallo / Rosso / Nessun Cartellino su Rovesciata) */}
      {refereeEvent && !matchEnded && (
        <div className="self-center mt-2 pointer-events-none z-40">
          <div
            className={`px-5 py-3.5 rounded-2xl border-2 shadow-2xl flex items-center gap-4 max-w-lg ${
              refereeEvent.card === 'red'
                ? 'bg-slate-950/95 border-rose-500 text-rose-100'
                : refereeEvent.card === 'yellow'
                ? 'bg-slate-950/95 border-yellow-400 text-yellow-100'
                : 'bg-slate-950/95 border-sky-400 text-sky-100'
            }`}
          >
            {refereeEvent.card === 'red' ? (
              <div className="w-9 h-12 rounded-md bg-gradient-to-br from-rose-500 to-red-700 border-2 border-white shadow-lg shrink-0" />
            ) : refereeEvent.card === 'yellow' ? (
              <div className="w-9 h-12 rounded-md bg-gradient-to-br from-yellow-300 to-amber-500 border-2 border-white shadow-lg shrink-0" />
            ) : (
              <div className="w-9 h-12 rounded-md bg-slate-800 border-2 border-sky-400 flex items-center justify-center text-sky-300 font-black text-xs shrink-0">
                OK
              </div>
            )}
            <div>
              <div
                className={`text-xs font-black uppercase tracking-wider ${
                  refereeEvent.card === 'red'
                    ? 'text-rose-400'
                    : refereeEvent.card === 'yellow'
                    ? 'text-yellow-300'
                    : 'text-sky-300'
                }`}
              >
                {refereeEvent.card === 'red'
                  ? refereeEvent.secondYellow
                    ? 'DOPPIA AMMONIZIONE • CARTELLINO ROSSO!'
                    : 'ESPULSIONE • CARTELLINO ROSSO!'
                  : refereeEvent.card === 'yellow'
                  ? 'AMMONIZIONE • CARTELLINO GIALLO!'
                  : 'FISCHIO ARBITRO • NESSUN CARTELLINO'}
              </div>
              <div className="text-sm font-black text-white mt-0.5">{refereeEvent.playerName}</div>
              <div className="text-xs text-slate-300">{refereeEvent.reason}</div>
            </div>
          </div>
        </div>
      )}

      {/* MID SCREEN: GOAL CELEBRATION ROULETTE OVERLAY */}
      {goalEvent && !matchEnded && (
        <div className="self-center my-auto flex flex-col items-center text-center pointer-events-auto animate-in fade-in zoom-in-90 duration-300">
          <div className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-sm tracking-widest uppercase mb-3 shadow-xl">
            GOOOOOL!
          </div>

          <div className="bg-slate-950/95 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {goalEvent.scorerName} ha segnato per i {goalEvent.scoringTeam === 'red' ? 'Rossi' : 'Blu'}!
            </div>

            <div className="py-4">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                ESTRAZIONE PUNTEGGIO CAOTICO:
              </div>

              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl font-mono text-slate-500 line-through">
                  {goalEvent.prevScore} pt
                </span>
                <span className="text-2xl text-amber-400">➜</span>
                <span className="text-5xl font-black font-mono text-white tracking-tight drop-shadow-lg">
                  {goalEvent.newScore} <span className="text-xl text-rose-400 font-bold">pt</span>
                </span>
              </div>
            </div>

            <div className="mt-2 p-3 bg-slate-900 border border-amber-400/40 rounded-2xl text-amber-300 font-black text-sm">
              ✨ {goalEvent.note}
            </div>

            <div className="mt-4 text-[11px] text-slate-500">
              Ogni gol può far salire o scendere il punteggio in modo del tutto imprevedibile!
            </div>
          </div>
        </div>
      )}

      {/* MATCH ENDED OVERLAY */}
      {matchEnded && (
        <div className="self-center my-auto flex flex-col items-center text-center pointer-events-auto z-50">
          <div className="bg-slate-950/95 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-4">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                matchOutcome === 'win'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : matchOutcome === 'loss'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              {matchOutcome === 'win' ? 'VITTORIA!' : matchOutcome === 'loss' ? 'SCONFITTA' : 'PAREGGIO'}
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight">FINE PARTITA</h2>

            <div className="flex items-center justify-center gap-6 py-3 bg-slate-900 rounded-2xl border border-slate-800">
              <div>
                <div className="text-[10px] font-black text-rose-400 uppercase">ROSSI</div>
                <div className="text-4xl font-black font-mono text-white">{scores.red}</div>
              </div>
              <span className="text-slate-600 font-black text-xl">-</span>
              <div>
                <div className="text-[10px] font-black text-sky-400 uppercase">BLU</div>
                <div className="text-4xl font-black font-mono text-white">{scores.blue}</div>
              </div>
            </div>

            {warAwardInfo && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/50 text-left flex items-start gap-3">
                <Trophy className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                    <span>Club: {warAwardInfo.clubName}</span>
                    {warAwardInfo.boostMultiplier > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 text-[10px]">
                        x{warAwardInfo.boostMultiplier.toFixed(2)} {warAwardInfo.boostTier}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white font-semibold">
                    🏆 +{warAwardInfo.trophiesAdded} Coppe inviate al Club (Totale: {warAwardInfo.totalTrophies})
                  </div>
                  {warAwardInfo.pointsAdded > 0 && (
                    <div className="text-[11px] text-rose-300 font-bold flex items-center gap-1">
                      <Swords className="w-3.5 h-3.5" /> +{warAwardInfo.pointsAdded} Coppe Guerra aggiunte!
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {onPlayAgain && (
                <button
                  onClick={onPlayAgain}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Gioca Ancora
                </button>
              )}
              <button
                onClick={onLeaveMatch}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider border border-slate-700"
              >
                Torna al Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CHAT BUBBLES */}
      <div className="absolute top-36 left-4 max-w-xs space-y-1.5 pointer-events-none">
        {quickChatMessages.slice(-4).map((msg) => (
          <div
            key={msg.id}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs shadow-md"
          >
            <span className="font-bold text-rose-400 mr-1.5">{msg.sender}:</span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* BOTTOM BAR */}
      <div className="flex items-end justify-between w-full pointer-events-none">
        {/* BOTTOM LEFT: ROOM CODE DISPLAY ONLY FOR CREATOR */}
        <div className="pointer-events-auto">
          {isHost && roomCode ? (
            <div className="p-3 rounded-2xl bg-slate-950/90 border-2 border-emerald-500/70 shadow-2xl flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Codice Stanza (Solo Creatore)
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-black tracking-widest text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {roomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                  title="Copia codice da condividere"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                Invia questo codice agli amici per farli entrare!
              </span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/75 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Share2 className="w-3 h-3 text-slate-500" />
              <span>
                Squadra:{' '}
                <strong className={selfPlayer?.team === 'red' ? 'text-rose-400' : 'text-sky-400'}>
                  {selfPlayer?.team === 'red' ? 'Rossi' : 'Blu'}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* CENTER BOTTOM: Simplified WASD-Clustered Desktop Controls Guide */}
        <div className="pointer-events-auto hidden md:flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 max-w-3xl px-4 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-[11px] text-slate-300 shadow-lg">
          <span className="font-bold text-amber-300 whitespace-nowrap">[WASD] Muovi</span>
          <span className="text-slate-600">·</span>
          <span className="font-bold text-rose-400 whitespace-nowrap">[E / Click] Tiro</span>
          <span className="text-slate-600">·</span>
          <span className="font-bold text-sky-400 whitespace-nowrap">[Q] Passa</span>
          <span className="text-slate-600">·</span>
          <span className="font-bold text-orange-400 whitespace-nowrap">[R / 1] Mega Tiro</span>
          <span className="text-slate-600">·</span>
          <span className="font-bold text-yellow-300 whitespace-nowrap">[F / 2] Rovesciata</span>
          <span className="text-slate-600">·</span>
          <span className="font-bold text-violet-300 whitespace-nowrap">[C / 3] Finta</span>
          <span className="text-slate-600">·</span>
          <span className="font-bold text-cyan-300 whitespace-nowrap">[V / 4] Lob</span>
          <span className="text-slate-600">·</span>
          <span className="font-bold text-emerald-400 whitespace-nowrap">[Spazio] Scivolata</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 whitespace-nowrap">[TAB] Squadra</span>
        </div>

        {/* BOTTOM RIGHT: Quick Chat Opener */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2">
          {showChatOptions && (
            <div className="flex gap-1.5 bg-slate-900/95 p-2 rounded-2xl border border-slate-700 shadow-xl">
              {['Che gol!', 'Passa qui!', 'Grande giocata!', 'GG!', 'Punteggio pazzo!'].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => {
                    onSendQuickChat(phrase);
                    setShowChatOptions(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowChatOptions(!showChatOptions)}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-slate-700 text-white hover:bg-slate-800 shadow-lg flex items-center gap-2 text-xs font-bold"
          >
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <span>Chat Rapida</span>
          </button>
        </div>
      </div>
    </div>
  );
};
