import React, { useState, useEffect } from 'react';
import { Megaphone, X, Vote, Sparkles, Check, Clock, Trophy } from 'lucide-react';
import { AdminState } from '../types/game';

interface AdminOverlayProps {
  adminState: AdminState;
  playerId: string;
  onCastVote: (voteId: string, optionId: string) => void;
}

export const AdminOverlay: React.FC<AdminOverlayProps> = ({
  adminState,
  playerId,
  onCastVote,
}) => {
  const [dismissedAnnId, setDismissedAnnId] = useState<string | null>(null);
  const [dismissedResultId, setDismissedResultId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!adminState.activeVote) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [adminState.activeVote?.id]);

  // Auto-hide last vote result after 12 seconds
  useEffect(() => {
    if (!adminState.lastVoteResult) return;
    const resultId = adminState.lastVoteResult.id;
    const t = window.setTimeout(() => setDismissedResultId(resultId), 12000);
    return () => window.clearTimeout(t);
  }, [adminState.lastVoteResult?.id]);

  const p = adminState.powers;
  const activePowerTags: string[] = [];
  if (p.trophyMultiplier > 1) activePowerTags.push(`${p.trophyMultiplier}x Coppe`);
  if (p.slowBots) activePowerTags.push('Bot Lenti');
  if (p.freezeBots) activePowerTags.push('Bot Congelati');
  if (p.superSpeedPlayers) activePowerTags.push('Super Velocità');
  if (p.infiniteEnergy) activePowerTags.push('Energia Infinita');
  if (p.superPowerShot) activePowerTags.push('Super Tiro 2x');
  if (p.lowGravity) activePowerTags.push('Gravità Lunare');
  if (p.giantBall) activePowerTags.push('Pallone Gigante');
  if (p.zeroCooldown) activePowerTags.push('Zero Cooldown');

  const ann = adminState.announcement;
  const showAnnouncement = Boolean(ann && ann.id !== dismissedAnnId);

  const themeClasses = {
    gold: 'bg-slate-950/95 border-amber-400 text-amber-100',
    epic: 'bg-slate-950/95 border-purple-400 text-purple-100',
    alert: 'bg-slate-950/95 border-rose-500 text-rose-100',
    party: 'bg-slate-950/95 border-emerald-400 text-emerald-100',
  };

  const titleClasses = {
    gold: 'text-amber-400',
    epic: 'text-purple-400',
    alert: 'text-rose-400',
    party: 'text-emerald-400',
  };

  const vote = adminState.activeVote;
  const myChoice = vote ? vote.voters[playerId] : undefined;
  const totalVotes = vote ? vote.options.reduce((sum, o) => sum + o.votes, 0) : 0;
  const secsLeft = vote ? Math.max(0, Math.ceil((vote.endsAt - nowMs) / 1000)) : 0;

  const lastRes = adminState.lastVoteResult;
  const showResultToast = Boolean(
    lastRes && !vote && lastRes.id !== dismissedResultId && Date.now() - lastRes.endsAt < 18000
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[55] flex flex-col justify-between p-3 sm:p-4">
      {/* Top-Center: Announcement Banner & Active Powers Strip */}
      <div className="flex flex-col items-center gap-2 mt-14 sm:mt-16">
        {showAnnouncement && ann && (
          <div
            className={`pointer-events-auto max-w-xl w-full rounded-2xl border-2 px-4 py-3 shadow-2xl flex items-start justify-between gap-3 ${
              themeClasses[ann.theme]
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Megaphone className={`w-5 h-5 mt-0.5 shrink-0 ${titleClasses[ann.theme]}`} />
              <div>
                <div className={`text-[11px] font-black uppercase tracking-wider ${titleClasses[ann.theme]}`}>
                  {ann.title} • da {ann.authorName}
                </div>
                <div className="text-sm font-bold text-white leading-snug mt-0.5">{ann.message}</div>
              </div>
            </div>
            <button
              onClick={() => setDismissedAnnId(ann.id)}
              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 shrink-0"
              title="Chiudi messaggio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activePowerTags.length > 0 && (
          <div className="pointer-events-auto px-3 py-1 rounded-xl bg-slate-950/90 border border-amber-400/50 text-[11px] font-black text-amber-200 flex flex-wrap items-center justify-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase tracking-wider text-amber-400">Poteri Admin:</span>
            {activePowerTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right Side Floating Card: Active Live Vote OR Vote Winner Toast */}
      <div className="self-end mb-24 sm:mb-14 max-w-xs w-full space-y-2">
        {vote && (
          <div className="pointer-events-auto rounded-2xl bg-slate-950/95 border-2 border-emerald-400/75 p-3.5 shadow-2xl text-white">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Vote className="w-3.5 h-3.5" /> Voto Admin Live
              </span>
              <span className="text-xs font-mono font-black text-amber-300 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {secsLeft}s
              </span>
            </div>

            <div className="text-xs font-black text-white mb-2.5 leading-snug">{vote.question}</div>

            <div className="space-y-1.5">
              {vote.options.map((opt) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                const chosen = myChoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onCastVote(vote.id, opt.id)}
                    className={`relative w-full text-left px-3 py-2 rounded-xl border overflow-hidden transition-all ${
                      chosen
                        ? 'border-emerald-400 bg-emerald-500/20'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500/25 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-2 text-xs font-bold">
                      <span className="flex items-center gap-1.5 truncate">
                        {chosen && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        <span className="truncate">{opt.label}</span>
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300 shrink-0">
                        {opt.votes} ({pct}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-400 mt-2 text-center">
              {myChoice ? 'Voto registrato! Puoi cambiarlo prima dello scadere.' : 'Clicca un’opzione per votare!'}
            </div>
          </div>
        )}

        {showResultToast && lastRes && (
          <div className="pointer-events-auto rounded-2xl bg-slate-950/95 border-2 border-amber-400 p-3.5 shadow-2xl text-white">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Risultato Voto Admin
              </span>
              <button
                onClick={() => setDismissedResultId(lastRes.id)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-sm font-black text-white mt-1">
              Ha vinto: <span className="text-emerald-300">{lastRes.winnerLabel}</span>
            </div>
            {lastRes.appliedEffectLabel && (
              <div className="text-xs font-bold text-amber-300 mt-0.5">{lastRes.appliedEffectLabel}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
