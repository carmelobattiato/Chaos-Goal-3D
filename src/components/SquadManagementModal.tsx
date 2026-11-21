import React, { useState } from 'react';
import { Users, X, ArrowLeftRight, ShieldAlert, HeartPulse, Check } from 'lucide-react';
import { PlayerState, SquadReserve } from '../types/game';

interface SquadManagementModalProps {
  team: 'red' | 'blue';
  teamPlayers: PlayerState[];
  reserves: SquadReserve[];
  expelledNames: string[];
  selfId: string;
  onSubstitute: (starterId: string, reserveId: string) => void;
  onClose: () => void;
}

const ROLE_META: Record<'gk' | 'def' | 'mid' | 'fwd', { code: string; label: string; groupTitle: string; badge: string }> = {
  gk: {
    code: 'POR',
    label: 'Portiere',
    groupTitle: 'Portieri di Riserva',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  def: {
    code: 'DIF',
    label: 'Difensore',
    groupTitle: 'Difensori di Riserva',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  mid: {
    code: 'CEN',
    label: 'Centrocampista',
    groupTitle: 'Centrocampisti di Riserva',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  fwd: {
    code: 'ATT',
    label: 'Attaccante',
    groupTitle: 'Attaccanti di Riserva',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

export const SquadManagementModal: React.FC<SquadManagementModalProps> = ({
  team,
  teamPlayers,
  reserves,
  expelledNames,
  selfId,
  onSubstitute,
  onClose,
}) => {
  const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);
  const [subMessage, setSubMessage] = useState<string | null>(null);

  // Calculate Overall Team Fatigue ("stanchezza generale dei giocatori della tua squadra")
  const avgFatigue =
    teamPlayers.length > 0
      ? Math.round(teamPlayers.reduce((sum, p) => sum + (p.fatigue ?? 0), 0) / teamPlayers.length)
      : 0;
  const avgFreshness = Math.max(0, 100 - avgFatigue);

  const freshnessColor =
    avgFreshness >= 70
      ? 'from-emerald-400 to-teal-400'
      : avgFreshness >= 40
      ? 'from-amber-400 to-orange-400'
      : 'from-rose-500 to-red-500';

  const handlePickReserve = (reserve: SquadReserve) => {
    if (!selectedStarterId) {
      setSubMessage('Seleziona prima un titolare in campo da sostituire!');
      return;
    }
    const starter = teamPlayers.find((p) => p.id === selectedStarterId);
    onSubstitute(selectedStarterId, reserve.id);
    setSubMessage(
      `Cambio effettuato: entra ${reserve.name} (#${reserve.jerseyNumber}) al posto di ${starter?.name || 'Titolare'}!`
    );
    setSelectedStarterId(null);
    window.setTimeout(() => setSubMessage(null), 3000);
  };

  const rolesOrder: Array<'gk' | 'def' | 'mid' | 'fwd'> = ['gk', 'def', 'mid', 'fwd'];

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/85 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
                team === 'red' ? 'bg-rose-600' : 'bg-sky-600'
              }`}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">
                GESTIONE SQUADRA • {team === 'red' ? 'SQUADRA ROSSA' : 'SQUADRA BLU'}
              </h2>
              <p className="text-xs text-slate-400">
                Controlla la stanchezza generale dei tuoi giocatori ed effettua cambi dalla panchina (Premi TAB per chiudere)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase flex items-center gap-1.5"
          >
            <span>Riprendi</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Team Fatigue Bar */}
        <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-black uppercase tracking-wider text-white">
                Stanchezza Generale della Tua Squadra
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-black">
              <span className="text-emerald-300">Condizione Fisica: {avgFreshness}%</span>
              <span className={avgFatigue > 50 ? 'text-rose-400' : 'text-amber-300'}>
                Stanchezza Media: {avgFatigue}%
              </span>
            </div>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${freshnessColor} transition-all duration-300`}
              style={{ width: `${avgFreshness}%` }}
            />
          </div>
          {expelledNames.length > 0 && (
            <div className="mt-2.5 text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Espulsi (Cartellino Rosso): {expelledNames.join(', ')}
            </div>
          )}
        </div>

        {subMessage && (
          <div className="mx-5 mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{subMessage}</span>
          </div>
        )}

        {/* Main 2-Column Body */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: Active Starters on Pitch */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center justify-between">
              <span>Titolari in Campo ({teamPlayers.length})</span>
              <span className="text-[10px] text-slate-400 font-semibold">Clicca per sostituire</span>
            </div>

            {teamPlayers.map((p) => {
              const roleKey = p.aiRole || 'fwd';
              const meta = ROLE_META[roleKey];
              const fatigue = Math.round(p.fatigue ?? 0);
              const condition = Math.max(0, 100 - fatigue);
              const isSelected = selectedStarterId === p.id;
              const isSelf = p.id === selfId;

              const barCls =
                condition >= 70
                  ? 'bg-emerald-400'
                  : condition >= 40
                  ? 'bg-amber-400'
                  : 'bg-rose-500';

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedStarterId(isSelected ? null : p.id)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-lg'
                      : 'bg-slate-800/75 border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center font-mono font-black text-xs text-white">
                        #{p.jerseyNumber || 10}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm text-white">
                            {p.name} {isSelf ? '(TU)' : ''}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${meta.badge}`}>
                            {meta.code}
                          </span>
                          {(p.yellowCards || 0) > 0 && (
                            <span
                              className="inline-block w-3 h-4 rounded-[2px] bg-yellow-400 border border-yellow-200"
                              title="Ammonito (Cartellino Giallo)"
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Energia: {Math.round(p.energy ?? 100)}% • Stanchezza: {fatigue}%
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-black text-white">{condition}%</span>
                      <div className="text-[9px] text-amber-300 font-bold">
                        {isSelected ? 'Selezionato' : 'Cambia'}
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-950 mt-2.5 overflow-hidden">
                    <div className={`h-full rounded-full ${barCls} transition-all`} style={{ width: `${condition}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT: Reserves grouped by Role (Portieri, Difensori, Centrocampisti, Attaccanti) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span>Panchina & Riserve della Tua Squadra ({reserves.length})</span>
              {selectedStarterId && (
                <span className="text-[11px] text-amber-300 flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Clicca una riserva per farla entrare!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {rolesOrder.map((roleKey) => {
                const meta = ROLE_META[roleKey];
                const group = reserves.filter((r) => r.role === roleKey);
                return (
                  <div
                    key={roleKey}
                    className="p-3.5 rounded-2xl bg-slate-950/65 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {meta.groupTitle}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${meta.badge}`}>
                        {meta.code}
                      </span>
                    </div>

                    {group.length === 0 ? (
                      <div className="text-[11px] text-slate-500 py-2">Nessuna riserva rimasta</div>
                    ) : (
                      <div className="space-y-1.5">
                        {group.map((res) => {
                          const fresh = Math.max(0, 100 - Math.round(res.fatigue));
                          return (
                            <button
                              key={res.id}
                              onClick={() => handlePickReserve(res)}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                selectedStarterId
                                  ? 'bg-slate-800/90 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/15'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-black text-white truncate">
                                  #{res.jerseyNumber} {res.name}
                                </div>
                                <div className="text-[10px] text-emerald-300 font-bold">
                                  Condizione {fresh}% • Riposato
                                </div>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                                  selectedStarterId
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                Entra
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
