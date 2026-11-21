import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { VirtualJoystick } from './components/VirtualJoystick';
import { MatchHUD } from './components/MatchHUD';
import { LobbyModal } from './components/LobbyModal';
import { AdminModal } from './components/AdminModal';
import { AdminOverlay } from './components/AdminOverlay';
import { SquadManagementModal } from './components/SquadManagementModal';
import {
  AdminState,
  BallState,
  BotDifficulty,
  Club,
  GoalEventData,
  InputState,
  MapId,
  PlayerAnim,
  PlayerState,
  RefereeDecisionEvent,
  SquadReserve,
  WarAwardInfo,
} from './types/game';
import { PhysicsEngine, BALL_RADIUS } from './game/physics';
import { BotAI } from './game/botAI';
import { voiceChat } from './game/voiceChat';
import { sound } from './game/audio';
import { PITCH_LENGTH, MAP_CONFIGS, getMapWindVector } from './game/stadiums';

const DEFAULT_ADMIN_STATE: AdminState = {
  powers: {
    trophyMultiplier: 1,
    slowBots: false,
    freezeBots: false,
    superSpeedPlayers: false,
    infiniteEnergy: false,
    superPowerShot: false,
    lowGravity: false,
    giantBall: false,
    zeroCooldown: false,
  },
  announcement: null,
  activeVote: null,
  lastVoteResult: null,
  serverNow: Date.now(),
};

function createInitialReserves(): SquadReserve[] {
  return [
    { id: 'res_gk_1', name: 'Marco Rossi', role: 'gk', jerseyNumber: 12, fatigue: 0, yellowCards: 0 },
    { id: 'res_gk_2', name: 'Luca Bianchi', role: 'gk', jerseyNumber: 22, fatigue: 0, yellowCards: 0 },
    { id: 'res_def_1', name: 'Matteo Conti', role: 'def', jerseyNumber: 2, fatigue: 0, yellowCards: 0 },
    { id: 'res_def_2', name: 'Davide Serra', role: 'def', jerseyNumber: 15, fatigue: 0, yellowCards: 0 },
    { id: 'res_mid_1', name: 'Andrea Greco', role: 'mid', jerseyNumber: 6, fatigue: 0, yellowCards: 0 },
    { id: 'res_mid_2', name: 'Lorenzo Moretti', role: 'mid', jerseyNumber: 14, fatigue: 0, yellowCards: 0 },
    { id: 'res_fwd_1', name: 'Federico Esposito', role: 'fwd', jerseyNumber: 11, fatigue: 0, yellowCards: 0 },
    { id: 'res_fwd_2', name: 'Simone Gallo', role: 'fwd', jerseyNumber: 19, fatigue: 0, yellowCards: 0 },
  ];
}

export default function App() {
  // Persistent Player ID & Permanent Name ("quando scegli il tuo nome te lo salva per sempre")
  const [persistentPlayerId] = useState<string>(() => {
    const savedId = localStorage.getItem('chaos_goal_player_id');
    if (savedId) return savedId;
    const newId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('chaos_goal_player_id', newId);
    return newId;
  });

  const [savedPlayerName, setSavedPlayerName] = useState<string>(() => {
    return localStorage.getItem('chaos_goal_permanent_name') || '';
  });
  const isNameSaved = savedPlayerName.length > 0;

  // Game Session State
  const [inGame, setInGame] = useState(false);
  const [isBotMatch, setIsBotMatch] = useState(true);
  const [playerName, setPlayerName] = useState(() => {
    const savedPermanent = localStorage.getItem('chaos_goal_permanent_name');
    if (savedPermanent) return savedPermanent;
    return 'Bomber ' + Math.floor(10 + Math.random() * 89);
  });
  const [myClub, setMyClub] = useState<Club | null>(() => {
    try {
      const saved = localStorage.getItem('chaos_goal_my_club');
      return saved ? (JSON.parse(saved) as Club) : null;
    } catch {
      return null;
    }
  });
  const updateMyClub = useCallback((club: Club | null, explicitLeave: boolean = false) => {
    setMyClub(club);
    try {
      if (club) {
        localStorage.setItem('chaos_goal_my_club', JSON.stringify(club));
      } else if (explicitLeave) {
        localStorage.removeItem('chaos_goal_my_club');
      }
    } catch {
      // Ignore storage quota errors
    }
  }, []);
  const [selectedMap, setSelectedMap] = useState<MapId>('stadium');
  const selectedMapRef = useRef<MapId>(selectedMap);
  selectedMapRef.current = selectedMap;
  const playerVelRef = useRef<{ vx: number; vz: number }>({ vx: 0, vz: 0 });
  const mapClockRef = useRef<number>(0);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('esperto');
  const [roomCode, setRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [selfId, setSelfId] = useState<string>(persistentPlayerId);

  // Match State
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [ball, setBall] = useState<BallState>({ x: 0, y: BALL_RADIUS, z: 0, vx: 0, vy: 0, vz: 0 });
  const [scores, setScores] = useState<{ red: number; blue: number }>({ red: 0, blue: 0 });
  const [goalEvent, setGoalEvent] = useState<GoalEventData | null>(null);
  const [matchTimer, setMatchTimer] = useState<number>(120);
  const [matchEnded, setMatchEnded] = useState<boolean>(false);
  const [energy, setEnergy] = useState<number>(100);
  const [tackleNotice, setTackleNotice] = useState<string | null>(null);
  const [warAwardInfo, setWarAwardInfo] = useState<WarAwardInfo | null>(null);

  // Admin System State (Code 241017)
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminCode, setAdminCode] = useState<string>(() => sessionStorage.getItem('chaos_goal_admin_code') || '');
  const isAdminUnlocked = adminCode === '241017';
  const [adminState, setAdminState] = useState<AdminState>(DEFAULT_ADMIN_STATE);
  const adminStateRef = useRef<AdminState>(adminState);
  adminStateRef.current = adminState;
  const adminWsRef = useRef<WebSocket | null>(null);

  // Squad Management (Tab) & Referee Card System State
  const [showSquadModal, setShowSquadModal] = useState<boolean>(false);
  const showSquadModalRef = useRef<boolean>(false);
  showSquadModalRef.current = showSquadModal;
  const showAdminModalRef = useRef<boolean>(false);
  showAdminModalRef.current = showAdminModal;
  const [reserves, setReserves] = useState<SquadReserve[]>(createInitialReserves);
  const [expelledNames, setExpelledNames] = useState<string[]>([]);
  const [refereeEvent, setRefereeEvent] = useState<RefereeDecisionEvent | null>(null);
  const refereeTimeoutRef = useRef<number | null>(null);
  const fatigueMapRef = useRef<Record<string, number>>({});
  const yellowCardsMapRef = useRef<Record<string, number>>({});

  // Voice Chat State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [quickChatMessages, setQuickChatMessages] = useState<Array<{ id: string; sender: string; text: string }>>([]);

  // Input State
  const [inputState, setInputState] = useState<InputState>({
    moveX: 0,
    moveZ: 0,
    rotateX: 0,
    isKicking: false,
    isPassing: false,
    isSprinting: false,
    isTackling: false,
    isLobbing: false,
    isPowerShooting: false,
    isSkillMoving: false,
    isBicycleKicking: false,
  });

  // Local Physics, Stamina, Stun & Multi-Bot AI Refs
  const physicsRef = useRef<PhysicsEngine>(new PhysicsEngine('stadium'));
  const botsRef = useRef<BotAI[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const inGameRef = useRef<boolean>(false);
  inGameRef.current = inGame;
  const matchEndedRef = useRef<boolean>(false);
  matchEndedRef.current = matchEnded;
  const playersRef = useRef<PlayerState[]>(players);
  playersRef.current = players;
  const inputStateRef = useRef<InputState>(inputState);
  inputStateRef.current = inputState;
  const goalEventRef = useRef<GoalEventData | null>(goalEvent);
  goalEventRef.current = goalEvent;
  const scoresRef = useRef<{ red: number; blue: number }>(scores);
  scoresRef.current = scores;
  const playerNameRef = useRef<string>(playerName);
  playerNameRef.current = playerName;
  const lastTouchRef = useRef<{ name: string; team: 'red' | 'blue' } | null>(null);
  const passCooldownRef = useRef<number>(0);
  const energyRef = useRef<number>(100);
  const sprintExhaustedRef = useRef<boolean>(false);
  const slideCooldownRef = useRef<number>(0);
  const slideActiveTimerRef = useRef<number>(0);
  const skillCooldownRef = useRef<number>(0);
  const skillActiveTimerRef = useRef<number>(0);
  const skillSideRef = useRef<number>(1);
  const specialCooldownRef = useRef<number>(0);
  const specialAnimRef = useRef<{ anim: PlayerAnim; timer: number } | null>(null);
  const selfStunTimerRef = useRef<number>(0);
  const noticeTimeoutRef = useRef<number | null>(null);
  const warReportedRef = useRef<boolean>(false);
  const goalResetTimerRef = useRef<number | null>(null);

  const showTackleNotice = useCallback((msg: string) => {
    setTackleNotice(msg);
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => setTackleNotice(null), 1900);
  }, []);

  // Sync Admin physics modifiers whenever global powers change
  useEffect(() => {
    physicsRef.current.setAdminModifiers({
      lowGravity: adminState.powers.lowGravity,
      superPowerShot: adminState.powers.superPowerShot,
      giantBall: adminState.powers.giantBall,
    });
  }, [adminState.powers]);

  // Keep PhysicsEngine map synchronized even when switched live via Admin Panel
  useEffect(() => {
    physicsRef.current.setMap(selectedMap);
  }, [selectedMap]);

  // Persistent Global Admin Sync (REST bootstrap + real-time WebSocket push)
  useEffect(() => {
    let closed = false;
    let reconnectTimer: number | null = null;

    fetch('/api/admin/state')
      .then((r) => r.json())
      .then((d) => {
        if (!closed && d?.state) setAdminState(d.state);
      })
      .catch(() => {});

    const openAdminWs = () => {
      if (closed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      adminWsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'admin_state_sync' && msg.state) {
            setAdminState(msg.state);
          }
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onclose = () => {
        if (!closed) {
          reconnectTimer = window.setTimeout(openAdminWs, 3500);
        }
      };
    };

    openAdminWs();

    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (adminWsRef.current) {
        adminWsRef.current.close();
        adminWsRef.current = null;
      }
    };
  }, []);

  const handleUnlockAdmin = useCallback((code: string, nextState: AdminState) => {
    setAdminCode(code);
    sessionStorage.setItem('chaos_goal_admin_code', code);
    setAdminState(nextState);
  }, []);

  const handleLockAdmin = useCallback(() => {
    setAdminCode('');
    sessionStorage.removeItem('chaos_goal_admin_code');
    setShowAdminModal(false);
  }, []);

  const handleCastAdminVote = useCallback(
    async (voteId: string, optionId: string) => {
      try {
        const res = await fetch(`/api/admin/votes/${voteId}/cast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: persistentPlayerId, optionId }),
        });
        const data = await res.json();
        if (res.ok && data.state) {
          setAdminState(data.state);
        }
      } catch {
        // Ignore network errors
      }
    },
    [persistentPlayerId]
  );

  const handleLocalAdminAction = useCallback(
    (
      action: 'score_red' | 'score_blue' | 'reset_score' | 'reset_ball' | 'teleport_ball' | 'change_map',
      mapId?: MapId
    ) => {
      if (action === 'score_red') {
        setScores((prev) => {
          const next = { ...prev, red: prev.red + 50 };
          scoresRef.current = next;
          return next;
        });
      } else if (action === 'score_blue') {
        setScores((prev) => {
          const next = { ...prev, blue: prev.blue + 50 };
          scoresRef.current = next;
          return next;
        });
      } else if (action === 'reset_score') {
        const next = { red: 0, blue: 0 };
        scoresRef.current = next;
        setScores(next);
      } else if (action === 'reset_ball') {
        physicsRef.current.resetBall();
        setBall({ ...physicsRef.current.ball });
      } else if (action === 'teleport_ball') {
        const me = playersRef.current.find((p) => p.id === selfId);
        if (me) {
          const tx = me.x + Math.sin(me.rotY) * 1.4;
          const tz = me.z + Math.cos(me.rotY) * 1.4;
          physicsRef.current.teleportBall(tx, tz);
          setBall({ ...physicsRef.current.ball });
        }
      } else if (action === 'change_map' && mapId) {
        setSelectedMap(mapId);
        physicsRef.current.setMap(mapId);
      }
    },
    [selfId]
  );

  // Referee Decision on Bicycle Kick ("se qualche giocatore fa la rovesciata è possibile che l'arbitro fischia...")
  const triggerRefereeCheckForBicycle = useCallback(
    (actor: PlayerState, nearestOppDist: number) => {
      const whistleChance = nearestOppDist < 5.0 ? 0.62 : 0.42;
      if (Math.random() > whistleChance) return;

      sound.playWhistle(true);
      const roll = Math.random();
      const prevYellows = yellowCardsMapRef.current[actor.id] || 0;

      let card: 'none' | 'yellow' | 'red' = 'none';
      let secondYellow = false;
      let reason = 'Gioco pericoloso in rovesciata: richiamo verbale, nessun cartellino.';

      if (roll < 0.36) {
        card = 'none';
        reason = 'Rovesciata al limite! L’arbitro fischia ma decide: nessun cartellino.';
      } else if (roll < 0.78) {
        if (prevYellows >= 1) {
          card = 'red';
          secondYellow = true;
          yellowCardsMapRef.current[actor.id] = 2;
          reason = 'Seconda ammonizione per rovesciata pericolosa: ESPULSO!';
        } else {
          card = 'yellow';
          yellowCardsMapRef.current[actor.id] = 1;
          reason = 'Ammonizione! Cartellino Giallo per gioco pericoloso in rovesciata.';
        }
      } else {
        card = 'red';
        reason = 'Intervento acrobatico troppo pericoloso! Cartellino Rosso diretto!';
      }

      const evt: RefereeDecisionEvent = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        playerName: actor.name,
        team: actor.team,
        card,
        reason,
        secondYellow,
      };
      setRefereeEvent(evt);
      if (refereeTimeoutRef.current) window.clearTimeout(refereeTimeoutRef.current);
      refereeTimeoutRef.current = window.setTimeout(() => setRefereeEvent(null), 4200);

      // Update yellow card badge on player state
      if (card === 'yellow') {
        const botMatch = botsRef.current.find((b) => b.state.id === actor.id);
        if (botMatch) botMatch.state.yellowCards = 1;
      }

      // Apply Red Card Expulsion!
      if (card === 'red') {
        if (actor.team === selfPlayerTeamRef.current) {
          setExpelledNames((prev) => (prev.includes(actor.name) ? prev : [...prev, actor.name]));
        }

        if (actor.isBot) {
          botsRef.current = botsRef.current.filter((b) => b.state.id !== actor.id);
          playersRef.current = playersRef.current.filter((p) => p.id !== actor.id);
          setPlayers([...playersRef.current]);
        } else if (isBotMatch) {
          // Human player was expelled: team plays 1 down & user smoothly takes over an active teammate so play continues!
          const teammateBotIdx = botsRef.current.findIndex(
            (b) => b.state.team === actor.team && b.role !== 'gk'
          );
          if (teammateBotIdx !== -1) {
            const promotedBot = botsRef.current[teammateBotIdx];
            botsRef.current.splice(teammateBotIdx, 1);
            fatigueMapRef.current[selfId] = fatigueMapRef.current[promotedBot.state.id] || 10;
            yellowCardsMapRef.current[selfId] = promotedBot.state.yellowCards || 0;
            energyRef.current = 100;
            playersRef.current = playersRef.current
              .filter((p) => p.id !== promotedBot.state.id)
              .map((p) =>
                p.id === selfId
                  ? {
                      ...p,
                      name: promotedBot.state.name,
                      jerseyNumber: promotedBot.state.jerseyNumber,
                      aiRole: promotedBot.state.aiRole,
                      yellowCards: promotedBot.state.yellowCards || 0,
                      x: promotedBot.state.x,
                      z: promotedBot.state.z,
                    }
                  : p
              );
            setPlayers([...playersRef.current]);
          } else {
            // Brief stun penalty if no outfield teammate left
            selfStunTimerRef.current = 2.0;
          }
        }
      }
    },
    [isBotMatch, selfId]
  );

  // Live Substitution from Gestione Squadra (Tab)
  const handleSubstitutePlayer = useCallback(
    (starterId: string, reserveId: string) => {
      const targetReserve = reserves.find((r) => r.id === reserveId);
      const starterPlayer = playersRef.current.find((p) => p.id === starterId);
      if (!targetReserve || !starterPlayer) return;

      const outgoingReserve: SquadReserve = {
        id: `sub_out_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        name: starterPlayer.name,
        role: starterPlayer.aiRole || 'fwd',
        jerseyNumber: starterPlayer.jerseyNumber || 10,
        fatigue: Math.round(fatigueMapRef.current[starterId] ?? starterPlayer.fatigue ?? 0),
        yellowCards: yellowCardsMapRef.current[starterId] ?? starterPlayer.yellowCards ?? 0,
      };

      setReserves((prev) => [...prev.filter((r) => r.id !== reserveId), outgoingReserve]);

      // Apply fresh reserve stats onto the active starter slot
      fatigueMapRef.current[starterId] = targetReserve.fatigue;
      yellowCardsMapRef.current[starterId] = targetReserve.yellowCards;

      if (starterId === selfId) {
        energyRef.current = Math.max(40, 100 - targetReserve.fatigue);
        setEnergy(Math.round(energyRef.current));
        sprintExhaustedRef.current = false;
      } else {
        const botInst = botsRef.current.find((b) => b.state.id === starterId);
        if (botInst) {
          botInst.state.name = targetReserve.name;
          botInst.state.jerseyNumber = targetReserve.jerseyNumber;
          botInst.state.yellowCards = targetReserve.yellowCards;
          botInst.state.fatigue = targetReserve.fatigue;
          botInst.state.energy = 100;
        }
      }

      const updated = playersRef.current.map((p) =>
        p.id === starterId
          ? {
              ...p,
              name: targetReserve.name,
              jerseyNumber: targetReserve.jerseyNumber,
              yellowCards: targetReserve.yellowCards,
              fatigue: targetReserve.fatigue,
              energy: 100,
            }
          : p
      );
      playersRef.current = updated;
      setPlayers(updated);
      showTackleNotice(`Cambio: entra ${targetReserve.name} (#${targetReserve.jerseyNumber})!`);
    },
    [reserves, selfId, showTackleNotice]
  );

  // Detect mobile device
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isTouch || /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase()));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save or update player profile name (persisted, always editable, supports spaces)
  const savePermanentName = useCallback(
    async (nameToSave: string) => {
      const clean = nameToSave.trim().replace(/\s+/g, ' ').slice(0, 24);
      if (!clean) return;
      setPlayerName(clean);
      setSavedPlayerName(clean);
      localStorage.setItem('chaos_goal_permanent_name', clean);

      try {
        const res = await fetch('/api/players/save-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: persistentPlayerId, name: clean }),
        });
        const data = await res.json();
        if (data.profile?.name) {
          setPlayerName(data.profile.name);
          setSavedPlayerName(data.profile.name);
          localStorage.setItem('chaos_goal_permanent_name', data.profile.name);
        }
        if (data.club) {
          updateMyClub(data.club);
        }
      } catch (err) {
        console.warn('Could not sync saved name to server:', err);
      }
    },
    [persistentPlayerId, updateMyClub]
  );

  useEffect(() => {
    const fetchProfileAndClub = async () => {
      try {
        const res = await fetch(`/api/players/${encodeURIComponent(persistentPlayerId)}`);
        const data = await res.json();
        const localSaved = localStorage.getItem('chaos_goal_permanent_name');
        const resolvedName = data.profile?.name || localSaved || playerNameRef.current;

        if (data.profile?.name) {
          setPlayerName(data.profile.name);
          setSavedPlayerName(data.profile.name);
          localStorage.setItem('chaos_goal_permanent_name', data.profile.name);
        } else if (localSaved) {
          savePermanentName(localSaved);
        }

        if (data.club) {
          updateMyClub(data.club);
        } else {
          // If server restarted and lost club disk state, automatically restore player's saved club so they stay in it!
          const savedClubRaw = localStorage.getItem('chaos_goal_my_club');
          if (savedClubRaw) {
            try {
              const savedClub = JSON.parse(savedClubRaw) as Club;
              if (savedClub && savedClub.name) {
                const restoreRes = await fetch('/api/clubs/restore', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    playerId: persistentPlayerId,
                    playerName: resolvedName,
                    savedClub,
                  }),
                });
                const restoreData = await restoreRes.json();
                if (restoreData.club) {
                  updateMyClub(restoreData.club);
                }
              }
            } catch (restoreErr) {
              console.warn('Could not restore saved club:', restoreErr);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading player profile:', err);
      }
    };
    fetchProfileAndClub();
  }, [persistentPlayerId, savePermanentName, updateMyClub]);

  // Team orientation ref for controls
  const selfPlayerTeamRef = useRef<'red' | 'blue'>('red');
  selfPlayerTeamRef.current = players.find((p) => p.id === selfId)?.team || 'red';

  // Keyboard input listener for Computer (Screen-aligned WASD: W=avanti/su, A=sinistra, S=indietro/giù, D=destra)
  useEffect(() => {
    const keysPressed = new Set<string>();

    const isTypingInField = (target: EventTarget | null) => {
      const el = (target as HTMLElement) || (document.activeElement as HTMLElement);
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const updateFromKeys = () => {
      if (!inGameRef.current) return;
      let moveX = 0;
      let moveZ = 0;
      let rotateX = 0;

      // Exact screen-aligned WASD: W avanti (-Z), S indietro (+Z), A sinistra (-X), D destra (+X)
      if (keysPressed.has('KeyW')) moveZ -= 1;
      if (keysPressed.has('KeyS')) moveZ += 1;
      if (keysPressed.has('KeyA')) moveX -= 1;
      if (keysPressed.has('KeyD')) moveX += 1;

      if (moveX !== 0 && moveZ !== 0) {
        moveX *= 0.7071;
        moveZ *= 0.7071;
      }

      if (keysPressed.has('ArrowLeft')) rotateX -= 1;
      if (keysPressed.has('ArrowRight')) rotateX += 1;

      const isTackling = keysPressed.has('Space');
      // Easy WASD-clustered controls! E/Click/J = Tiro, Q = Passa, R/1 = Mega Tiro, F/2 = Rovesciata, C/3 = Finta, V/4 = Lob
      const isKicking =
        keysPressed.has('KeyE') ||
        keysPressed.has('KeyJ') ||
        keysPressed.has('Enter') ||
        keysPressed.has('KeyX') ||
        keysPressed.has('MouseLeft');
      const isPassing = keysPressed.has('KeyQ');
      const isSprinting = keysPressed.has('ShiftLeft') || keysPressed.has('ShiftRight') || keysPressed.has('KeyK');
      const isPowerShooting = keysPressed.has('KeyR') || keysPressed.has('Digit1') || keysPressed.has('KeyO');
      const isBicycleKicking =
        keysPressed.has('KeyF') || keysPressed.has('Digit2') || keysPressed.has('KeyH') || keysPressed.has('KeyI');
      const isSkillMoving = keysPressed.has('KeyC') || keysPressed.has('Digit3');
      const isLobbing =
        keysPressed.has('KeyV') || keysPressed.has('Digit4') || keysPressed.has('KeyL') || keysPressed.has('KeyU');

      setInputState((prev) => ({
        ...prev,
        moveX,
        moveZ,
        rotateX,
        isKicking,
        isPassing,
        isSprinting,
        isTackling,
        isLobbing,
        isPowerShooting,
        isSkillMoving,
        isBicycleKicking,
      }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (showAdminModalRef.current) {
          setShowAdminModal(false);
          return;
        }
        if (showSquadModalRef.current) {
          setShowSquadModal(false);
          return;
        }
      }

      // TAB toggles Gestione Squadra during match!
      if (e.code === 'Tab' && inGameRef.current && !showAdminModalRef.current && !isTypingInField(e.target)) {
        e.preventDefault();
        keysPressed.clear();
        setShowSquadModal((prev) => !prev);
        return;
      }

      // Never intercept Space/Keys when user is in menu, modal, or typing in an input
      if (!inGameRef.current || showAdminModalRef.current || showSquadModalRef.current || isTypingInField(e.target)) {
        return;
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.add(e.code);

      if (e.code === 'KeyM') {
        toggleVoiceMute();
      }

      updateFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
      if (!inGameRef.current || isTypingInField(e.target)) {
        return;
      }
      updateFromKeys();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!inGameRef.current || showAdminModalRef.current || showSquadModalRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, input, textarea, select, [role="dialog"]')) return;
      keysPressed.add('MouseLeft');
      updateFromKeys();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (keysPressed.has('MouseLeft')) {
        keysPressed.delete('MouseLeft');
        updateFromKeys();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Chaotic score roll calculation
  const rollLocalChaosScore = useCallback((currentScore: number, otherScore: number): { newScore: number; note: string } => {
    const rollType = Math.random();
    let newScore = currentScore;
    let note = '';

    if (currentScore === 0) {
      const picks = [15, 25, 42, 50, 77, 88, 100];
      newScore = picks[Math.floor(Math.random() * picks.length)];
      note = `Primo Gol! Estratto: ${newScore} Punti!`;
    } else if (rollType < 0.35) {
      const add = Math.floor(Math.random() * 50) + 15;
      newScore = currentScore + add;
      note = `Super Salita! +${add} pt (Totale: ${newScore})`;
    } else if (rollType < 0.6) {
      const drop = Math.floor(Math.random() * Math.min(35, currentScore - 5)) + 5;
      newScore = Math.max(5, currentScore - drop);
      note = `Colpo di Scena! -${drop} pt (Nuovo: ${newScore})`;
    } else if (rollType < 0.8) {
      const wild = Math.floor(Math.random() * 110) + 10;
      const diff = wild - currentScore;
      newScore = wild;
      note = diff >= 0 ? `Punteggio Impazzito! Vola a ${wild} pt (+${diff})` : `Scivolone Caotico! Calato a ${wild} pt (${diff})`;
    } else if (rollType < 0.92) {
      newScore = Math.min(250, Math.round(currentScore * 1.5));
      note = `MOLTIPLICATORE x1.5! Punteggio a ${newScore} pt!`;
    } else {
      newScore = Math.max(10, otherScore + (Math.random() > 0.5 ? 5 : -5));
      note = `Effetto Thriller! Agganciato a ${newScore} pt!`;
    }

    return { newScore, note };
  }, []);

  // WebRTC Voice Chat initialization
  const enableVoice = async () => {
    const res = await voiceChat.enableVoice();
    if (res.success) {
      setIsVoiceEnabled(true);
      setIsMuted(false);

      voiceChat.init(
        selfId,
        (targetId, signal) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'voice_signal', targetId, signal }));
          }
        },
        (isTalking) => {
          setPlayers((prev) =>
            prev.map((p) => (p.id === selfId ? { ...p, isTalking } : p))
          );
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'voice_speaking', isTalking }));
          }
        }
      );
    } else {
      alert(res.error || 'Impossibile attivare il microfono.');
    }
  };

  const toggleVoiceMute = () => {
    if (!isVoiceEnabled) {
      enableVoice();
      return;
    }
    const muted = voiceChat.toggleMute();
    setIsMuted(muted);
    if (muted && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'voice_speaking', isTalking: false }));
    }
  };

  // Launch Bot Team Match (4v4: You + 3 AI Teammates vs 4 AI Opponents!)
  const startBotMatch = () => {
    const cleanName = playerName.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (cleanName && cleanName !== savedPlayerName) {
      savePermanentName(cleanName);
    }
    setIsBotMatch(true);
    setIsHost(false);
    setRoomCode('');
    setSelfId('human_player');

    energyRef.current = 100;
    setEnergy(100);
    sprintExhaustedRef.current = false;
    slideCooldownRef.current = 0;
    slideActiveTimerRef.current = 0;
    skillCooldownRef.current = 0;
    skillActiveTimerRef.current = 0;
    specialCooldownRef.current = 0;
    specialAnimRef.current = null;
    passCooldownRef.current = 0;
    selfStunTimerRef.current = 0;
    lastTouchRef.current = null;
    warReportedRef.current = false;
    setWarAwardInfo(null);
    setMatchEnded(false);
    setTackleNotice(null);
    setShowSquadModal(false);
    setRefereeEvent(null);
    setExpelledNames([]);
    setReserves(createInitialReserves());
    fatigueMapRef.current = {};
    yellowCardsMapRef.current = {};

    if (goalResetTimerRef.current) {
      window.clearTimeout(goalResetTimerRef.current);
      goalResetTimerRef.current = null;
    }

    physicsRef.current.setMap(selectedMap);
    physicsRef.current.resetBall();
    playerVelRef.current = { vx: 0, vz: 0 };
    mapClockRef.current = 0;

    // 3 AI Teammates on Red team (to pass to & play alongside) + 4 AI Opponents on Blue team
    const squadBots: BotAI[] = [
      // Red Teammates
      new BotAI({
        id: 'red_gk',
        name: 'Portiere Rosso',
        team: 'red',
        role: 'gk',
        difficulty: botDifficulty,
        homeX: -30.5,
        homeZ: 0,
        jerseyNumber: 1,
      }),
      new BotAI({
        id: 'red_def',
        name: 'Difensore Rosso',
        team: 'red',
        role: 'def',
        difficulty: botDifficulty,
        homeX: -19,
        homeZ: -9,
        jerseyNumber: 4,
      }),
      new BotAI({
        id: 'red_fwd',
        name: 'Ala Rossa',
        team: 'red',
        role: 'fwd',
        difficulty: botDifficulty,
        homeX: -7,
        homeZ: 10,
        jerseyNumber: 7,
      }),
      // Blue Opponents
      new BotAI({
        id: 'blue_gk',
        name: 'Portiere Blu',
        team: 'blue',
        role: 'gk',
        difficulty: botDifficulty,
        homeX: 30.5,
        homeZ: 0,
        jerseyNumber: 1,
      }),
      new BotAI({
        id: 'blue_def',
        name: 'Difensore Blu',
        team: 'blue',
        role: 'def',
        difficulty: botDifficulty,
        homeX: 19,
        homeZ: 8,
        jerseyNumber: 5,
      }),
      new BotAI({
        id: 'blue_mid',
        name: 'Regista Blu',
        team: 'blue',
        role: 'mid',
        difficulty: botDifficulty,
        homeX: 11,
        homeZ: -9.5,
        jerseyNumber: 8,
      }),
      new BotAI({
        id: 'blue_fwd',
        name: 'Bomber Blu',
        team: 'blue',
        role: 'fwd',
        difficulty: botDifficulty,
        homeX: 6.5,
        homeZ: 1.5,
        jerseyNumber: 9,
      }),
    ];
    botsRef.current = squadBots;

    const human: PlayerState = {
      id: 'human_player',
      name: cleanName || playerName || 'Giocatore 1',
      team: 'red',
      x: -7.5,
      y: 0,
      z: -1.5,
      rotY: Math.PI / 2,
      anim: 'idle',
      isHost: false,
      jerseyNumber: 10,
      aiRole: 'fwd',
      fatigue: 0,
      yellowCards: 0,
    };

    const initialPlayers = [human, ...squadBots.map((b) => ({ ...b.state, fatigue: 0, yellowCards: 0 }))];
    playersRef.current = initialPlayers;
    setPlayers(initialPlayers);
    setScores({ red: 0, blue: 0 });
    setMatchTimer(120);
    setGoalEvent(null);
    setInGame(true);

    sound.playWhistle(true);
  };

  // Setup WebSocket connection for multiplayer
  const connectWebSocket = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        reject(err);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'room_joined': {
              const room = msg.room;
              setRoomCode(room.code);
              setIsHost(room.isHost);
              setSelfId(msg.selfId);
              setSelectedMap(room.map);
              physicsRef.current.setMap(room.map);
              setPlayers(room.players);
              setScores(room.scores);
              setMatchTimer(room.matchTimer || 120);
              energyRef.current = 100;
              setEnergy(100);
              sprintExhaustedRef.current = false;
              warReportedRef.current = false;
              setWarAwardInfo(null);
              setMatchEnded(false);
              setInGame(true);
              sound.playWhistle(true);
              break;
            }

            case 'player_joined': {
              setPlayers((prev) => {
                if (prev.some((p) => p.id === msg.player.id)) return prev;
                return [...prev, msg.player];
              });
              if (isVoiceEnabled) {
                voiceChat.connectToPeer(msg.player.id, true);
              }
              break;
            }

            case 'player_moved': {
              setPlayers((prev) =>
                prev.map((p) =>
                  p.id === msg.playerId
                    ? { ...p, x: msg.x, y: msg.y, z: msg.z, rotY: msg.rotY, anim: msg.anim }
                    : p
                )
              );
              break;
            }

            case 'ball_sync': {
              setBall({
                x: msg.x,
                y: msg.y,
                z: msg.z,
                vx: msg.vx,
                vy: msg.vy,
                vz: msg.vz,
              });
              physicsRef.current.ball = {
                x: msg.x,
                y: msg.y,
                z: msg.z,
                vx: msg.vx,
                vy: msg.vy,
                vz: msg.vz,
              };
              break;
            }

            case 'goal_celebration': {
              sound.playWhistle(true);
              setScores(msg.scores);
              setGoalEvent({
                scoringTeam: msg.scoringTeam,
                scorerName: msg.scorerName,
                prevScore: msg.prevScore,
                newScore: msg.newScore,
                note: msg.note,
                scores: msg.scores,
              });
              setTimeout(() => {
                setGoalEvent(null);
              }, 4500);
              break;
            }

            case 'kickoff_reset': {
              setBall(msg.ball);
              physicsRef.current.ball = msg.ball;
              setScores(msg.scores);
              break;
            }

            case 'voice_signal': {
              voiceChat.handleSignal(msg.fromId, msg.signal);
              break;
            }

            case 'voice_speaking': {
              setPlayers((prev) =>
                prev.map((p) => (p.id === msg.playerId ? { ...p, isTalking: msg.isTalking } : p))
              );
              break;
            }

            case 'quick_chat': {
              setQuickChatMessages((prev) => [
                ...prev.slice(-6),
                { id: `${Date.now()}_${Math.random()}`, sender: msg.playerName, text: msg.text },
              ]);
              break;
            }

            case 'player_left': {
              setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
              voiceChat.removePeer(msg.playerId);
              if (msg.newHostId === selfId) {
                setIsHost(true);
              }
              break;
            }

            case 'error': {
              alert(msg.message);
              break;
            }
          }
        } catch (err) {
          console.error('Error handling WS event:', err);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    });
  };

  // Create Room
  const handleCreateRoom = async (roomName: string, isPublic: boolean) => {
    const cleanName = playerName.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (cleanName && cleanName !== savedPlayerName) {
      savePermanentName(cleanName);
    }
    try {
      setIsBotMatch(false);
      const ws = await connectWebSocket();
      ws.send(
        JSON.stringify({
          type: 'create_room',
          playerId: persistentPlayerId,
          playerName: cleanName || 'Host',
          roomName,
          isPublic,
          map: selectedMap,
        })
      );
    } catch (err) {
      alert('Impossibile connettersi al server per creare la stanza.');
    }
  };

  // Join Room by Code
  const handleJoinByCode = async (code: string) => {
    const cleanName = playerName.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (cleanName && cleanName !== savedPlayerName) {
      savePermanentName(cleanName);
    }
    try {
      setIsBotMatch(false);
      const ws = await connectWebSocket();
      ws.send(
        JSON.stringify({
          type: 'join_room',
          playerId: persistentPlayerId,
          code,
          playerName: playerName || 'Giocatore',
        })
      );
    } catch (err) {
      alert('Impossibile connettersi alla stanza.');
    }
  };

  // Quick Match
  const handleQuickMatch = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.rooms && data.rooms.length > 0) {
        handleJoinByCode(data.rooms[0].code);
      } else {
        handleCreateRoom(`Partita Rapida di ${playerName}`, true);
      }
    } catch (err) {
      handleCreateRoom(`Partita Rapida di ${playerName}`, true);
    }
  };

  // Leave Match
  const handleLeaveMatch = () => {
    if (goalResetTimerRef.current) {
      window.clearTimeout(goalResetTimerRef.current);
      goalResetTimerRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    voiceChat.dispose();
    setIsVoiceEnabled(false);
    setInGame(false);
    setMatchEnded(false);
    playerVelRef.current = { vx: 0, vz: 0 };
    mapClockRef.current = 0;
    goalEventRef.current = null;
    setGoalEvent(null);
    setInputState({
      moveX: 0,
      moveZ: 0,
      rotateX: 0,
      isKicking: false,
      isPassing: false,
      isSprinting: false,
      isTackling: false,
      isLobbing: false,
      isPowerShooting: false,
      isSkillMoving: false,
      isBicycleKicking: false,
    });
  };

  // Send Quick Chat
  const handleSendQuickChat = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'quick_chat',
          playerName: playerName || 'Io',
          text,
        })
      );
    } else {
      setQuickChatMessages((prev) => [
        ...prev.slice(-6),
        { id: `${Date.now()}_${Math.random()}`, sender: playerName || 'Io', text },
      ]);
    }
  };

  // Send earned Coppe to Club (& boosted Coppe Guerra if in an active war!) on match victory
  useEffect(() => {
    if (!inGame || !matchEnded || warReportedRef.current) return;
    warReportedRef.current = true;
    sound.playWhistle(true);

    const selfTeam = selfPlayerTeamRef.current;
    const myScore = scores[selfTeam];
    const oppScore = scores[selfTeam === 'red' ? 'blue' : 'red'];

    if (myScore > oppScore && myClub) {
      fetch(`/api/clubs/${myClub.id}/war/report-win`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: persistentPlayerId,
          points: Math.max(10, myScore),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.club) updateMyClub(data.club);
          if (data.trophiesAdded > 0 || data.pointsAdded > 0) {
            setWarAwardInfo({
              clubName: myClub.name,
              trophiesAdded: data.trophiesAdded || 0,
              totalTrophies: data.totalTrophies || data.club?.trophies || 0,
              pointsAdded: data.pointsAdded || 0,
              boostMultiplier: data.boostMultiplier || 1,
              boostTier: data.boostTier || 'Base',
              message: data.message,
            });
          }
        })
        .catch((err) => console.warn('Could not report win trophies to club:', err));
    }
  }, [inGame, matchEnded, scores, myClub, persistentPlayerId, updateMyClub]);

  // GAME LOOP (Stable 60fps physical update, Stamina, Tactical Bot AI, Player Input integration)
  useEffect(() => {
    if (!inGame) return;

    let animId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (matchEndedRef.current) return;
      if (isBotMatch && (showSquadModalRef.current || showAdminModalRef.current)) return;

      const curInput = inputStateRef.current;
      const powers = adminStateRef.current.powers;
      const activeMapId = selectedMapRef.current;
      const mapCfg = MAP_CONFIGS[activeMapId] || MAP_CONFIGS.stadium;
      mapClockRef.current += delta;
      const windVec = getMapWindVector(activeMapId, mapClockRef.current);

      // Match timer countdown (paused briefly during goal celebration)
      if (!goalEventRef.current) {
        setMatchTimer((prev) => {
          const next = Math.max(0, prev - delta);
          if (next === 0 && !matchEndedRef.current) {
            setMatchEnded(true);
          }
          return next;
        });
      }

      // Cooldowns & Stun timers
      slideCooldownRef.current = Math.max(0, slideCooldownRef.current - delta);
      skillCooldownRef.current = Math.max(0, skillCooldownRef.current - delta);
      specialCooldownRef.current = Math.max(0, specialCooldownRef.current - delta);
      passCooldownRef.current = Math.max(0, passCooldownRef.current - delta);
      selfStunTimerRef.current = Math.max(0, selfStunTimerRef.current - delta);

      if (specialAnimRef.current) {
        specialAnimRef.current.timer -= delta;
        if (specialAnimRef.current.timer <= 0) {
          specialAnimRef.current = null;
        }
      }

      const cdScale = powers.zeroCooldown ? 0.18 : 1.0;

      // Initiate slide tackle burst if energy >= 18 (or infiniteEnergy) and off cooldown
      if (
        curInput.isTackling &&
        slideCooldownRef.current <= 0 &&
        (powers.infiniteEnergy || energyRef.current >= 18) &&
        selfStunTimerRef.current <= 0
      ) {
        slideActiveTimerRef.current = 0.36;
        slideCooldownRef.current = 0.72 * cdScale;
        if (!powers.infiniteEnergy) energyRef.current = Math.max(0, energyRef.current - 24);
        sound.playSlide();
      }
      const isCurrentlySliding = slideActiveTimerRef.current > 0;
      if (slideActiveTimerRef.current > 0) {
        slideActiveTimerRef.current = Math.max(0, slideActiveTimerRef.current - delta);
      }

      // Initiate Elastico / Ruleta Skill Move burst (C / 3 / Mobile FINTA)
      if (
        curInput.isSkillMoving &&
        skillCooldownRef.current <= 0 &&
        (powers.infiniteEnergy || energyRef.current >= 14) &&
        selfStunTimerRef.current <= 0 &&
        !isCurrentlySliding
      ) {
        skillActiveTimerRef.current = 0.32;
        skillCooldownRef.current = 0.85 * cdScale;
        skillSideRef.current *= -1;
        if (!powers.infiniteEnergy) energyRef.current = Math.max(0, energyRef.current - 16);
        sound.playSkillMove();
      }
      const isCurrentlySkilling = skillActiveTimerRef.current > 0;
      if (skillActiveTimerRef.current > 0) {
        skillActiveTimerRef.current = Math.max(0, skillActiveTimerRef.current - delta);
      }

      // Stamina / Energy drain & regeneration + Cumulative Match Fatigue (affected by Mud/Sand/Volcano terrain!)
      const isMoving = curInput.moveX !== 0 || curInput.moveZ !== 0;
      const canSprint =
        curInput.isSprinting && (powers.infiniteEnergy || (!sprintExhaustedRef.current && energyRef.current > 0));
      const staminaDrainMult = mapCfg.staminaDrainMultiplier ?? 1.0;

      if (powers.infiniteEnergy) {
        energyRef.current = 100;
        sprintExhaustedRef.current = false;
      } else if (canSprint && isMoving && !isCurrentlySliding && !isCurrentlySkilling) {
        energyRef.current = Math.max(0, energyRef.current - 24 * staminaDrainMult * delta);
        if (energyRef.current <= 1) {
          sprintExhaustedRef.current = true;
        }
      } else if (!isCurrentlySliding && !isCurrentlySkilling) {
        const regenRate = isMoving ? 15 : 24;
        energyRef.current = Math.min(100, energyRef.current + regenRate * delta);
        if (energyRef.current >= 16) {
          sprintExhaustedRef.current = false;
        }
      }

      // Accumulate realistic match fatigue when running/sprinting (visible in Tab -> Gestione Squadra)
      if (!powers.infiniteEnergy && !goalEventRef.current) {
        const selfFatigueDelta = isCurrentlySliding
          ? 7.5 * staminaDrainMult * delta
          : canSprint && isMoving
          ? 5.2 * staminaDrainMult * delta
          : isMoving
          ? 1.9 * staminaDrainMult * delta
          : -0.35 * delta;
        fatigueMapRef.current[selfId] = Math.max(
          0,
          Math.min(100, (fatigueMapRef.current[selfId] ?? 0) + selfFatigueDelta)
        );
      } else if (powers.infiniteEnergy) {
        fatigueMapRef.current[selfId] = 0;
      }

      const roundedEnergy = Math.round(energyRef.current);
      setEnergy((prev) => (prev === roundedEnergy ? prev : roundedEnergy));

      // 1. Compute Self Player + Multi-Bot Squad updates in one synchronized frame step
      const prevPlayers = playersRef.current;
      const selfP = prevPlayers.find((p) => p.id === selfId);
      if (selfP) {
        // Find closest opponent to human for tackle/skill/referee detection
        let closestOpp: PlayerState | undefined;
        let closestOppDist = Infinity;
        for (const p of prevPlayers) {
          if (p.team !== selfP.team) {
            const d = Math.hypot(p.x - selfP.x, p.z - selfP.z);
            if (d < closestOppDist) {
              closestOppDist = d;
              closestOpp = p;
            }
          }
        }

        const adminSpeedBoost = powers.superSpeedPlayers ? 1.55 : 1.0;
        const fatigueSpeedFactor = powers.infiniteEnergy
          ? 1.0
          : 1.0 - Math.min(0.18, ((fatigueMapRef.current[selfId] ?? 0) / 100) * 0.18);
        const mapSpeedMult = mapCfg.playerSpeedMultiplier ?? 1.0;
        const mapTraction = mapCfg.traction ?? 1.0;
        const maxMoveSpeedPerSec = (canSprint ? 12.2 : 8.5) * adminSpeedBoost * fatigueSpeedFactor * mapSpeedMult;

        let newX = selfP.x;
        let newZ = selfP.z;
        let newRot = selfP.rotY;
        let anim: PlayerAnim = 'idle';

        if (selfStunTimerRef.current > 0) {
          anim = 'idle';
          playerVelRef.current.vx *= Math.max(0, 1 - 10 * delta);
          playerVelRef.current.vz *= Math.max(0, 1 - 10 * delta);
          newX += playerVelRef.current.vx * delta;
          newZ += playerVelRef.current.vz * delta;
        } else if (isCurrentlySliding) {
          anim = 'slide';
          const slideSpeedPerSec = (canSprint ? 21.5 : 17.5) * adminSpeedBoost * Math.max(0.82, mapSpeedMult);
          playerVelRef.current.vx = Math.sin(newRot) * slideSpeedPerSec;
          playerVelRef.current.vz = Math.cos(newRot) * slideSpeedPerSec;
          newX += playerVelRef.current.vx * delta;
          newZ += playerVelRef.current.vz * delta;
        } else if (isCurrentlySkilling) {
          anim = 'skill';
          const burstSpdPerSec = 16.8 * adminSpeedBoost * Math.max(0.85, mapSpeedMult);
          const burstAngle = newRot + skillSideRef.current * 0.42;
          playerVelRef.current.vx = Math.sin(burstAngle) * burstSpdPerSec;
          playerVelRef.current.vz = Math.cos(burstAngle) * burstSpdPerSec;
          newX += playerVelRef.current.vx * delta;
          newZ += playerVelRef.current.vz * delta;
        } else {
          // Map-Influenced Velocity Physics:
          // - Ice / Snow / Lunar: low traction creates genuine inertia gliding & wide carving drifts
          // - Mud / Sand / Underwater: reduced top speed & heavier stamina drain
          // - Wind Canyon: shifting gusts push the player sideways across the pitch
          // - Speedway Turbo: ultra-snappy grip & +36% top speed!
          const specialSlowdown = specialAnimRef.current ? 0.45 : curInput.isKicking || curInput.isPassing ? 0.35 : 1.0;
          const targetVx = isMoving ? curInput.moveX * maxMoveSpeedPerSec * specialSlowdown : 0;
          const targetVz = isMoving ? curInput.moveZ * maxMoveSpeedPerSec * specialSlowdown : 0;

          // Higher traction = instant crisp response; low traction (ice=0.16) = smooth slippery slide
          const accelRate = isMoving
            ? 2.4 + mapTraction * 28.0
            : 1.45 + mapTraction * 26.0;
          const blend = Math.min(1, accelRate * delta);

          playerVelRef.current.vx += (targetVx - playerVelRef.current.vx) * blend;
          playerVelRef.current.vz += (targetVz - playerVelRef.current.vz) * blend;

          // Apply Canyon Wind Gust push to player movement
          if (windVec.wx !== 0 || windVec.wz !== 0) {
            playerVelRef.current.vx += windVec.wx * 0.68 * delta;
            playerVelRef.current.vz += windVec.wz * 0.68 * delta;
          }

          newX += playerVelRef.current.vx * delta;
          newZ += playerVelRef.current.vz * delta;

          if (specialAnimRef.current) {
            anim = specialAnimRef.current.anim;
          } else if (curInput.isKicking || curInput.isPassing) {
            anim = 'kick';
          } else if (isMoving) {
            anim = 'run';
            newRot = Math.atan2(curInput.moveX, curInput.moveZ);
          } else if (Math.hypot(playerVelRef.current.vx, playerVelRef.current.vz) > 1.8) {
            anim = 'run';
          }
        }

        newX = Math.max(-PITCH_LENGTH / 2 + 0.8, Math.min(PITCH_LENGTH / 2 - 0.8, newX));
        newZ = Math.max(-23.5, Math.min(23.5, newZ));

        if (selfStunTimerRef.current <= 0 && !goalEventRef.current) {
          let didSpecialMove = false;
          const oppGoalX = selfP.team === 'red' ? PITCH_LENGTH / 2 : -PITCH_LENGTH / 2;

          // A. Rovesciata / Colpo Acrobatico (F / 2 / H / I / Touch ROV.)
          if (curInput.isBicycleKicking && specialCooldownRef.current <= 0) {
            if (powers.infiniteEnergy || energyRef.current >= 20) {
              const goalAngle = Math.atan2(oppGoalX - newX, -newZ * 0.35);
              const res = physicsRef.current.handlePlayerInteraction(
                newX,
                newZ,
                goalAngle,
                true,
                true,
                false,
                closestOpp ? { x: closestOpp.x, z: closestOpp.z } : undefined,
                { playerId: selfId, isHuman: true, moveType: 'bicycle', aimRotY: goalAngle, shotPowerScale: 1.05 }
              );
              if (res.interacted) {
                didSpecialMove = true;
                newRot = goalAngle;
                anim = 'bicycle';
                specialAnimRef.current = { anim: 'bicycle', timer: 0.44 };
                specialCooldownRef.current = 1.25 * cdScale;
                if (!powers.infiniteEnergy) energyRef.current = Math.max(0, energyRef.current - 22);
                lastTouchRef.current = { name: selfP.name, team: selfP.team };
                showTackleNotice('ROVESCIATA SPETTACOLARE!');
                triggerRefereeCheckForBicycle(selfP, closestOppDist);
              }
            } else {
              specialCooldownRef.current = 0.5;
              showTackleNotice('Energia insufficiente per la Rovesciata!');
            }
          }

          // B. Mega Tiro / Super Tiro a Giro (R / 1 / O / Touch SUPER)
          if (!didSpecialMove && curInput.isPowerShooting && specialCooldownRef.current <= 0) {
            if (powers.infiniteEnergy || energyRef.current >= 24) {
              const res = physicsRef.current.handlePlayerInteraction(
                newX,
                newZ,
                newRot,
                true,
                true,
                false,
                closestOpp ? { x: closestOpp.x, z: closestOpp.z } : undefined,
                { playerId: selfId, isHuman: true, moveType: 'power', aimRotY: newRot, shotPowerScale: 1.05 }
              );
              if (res.interacted) {
                didSpecialMove = true;
                anim = 'power';
                specialAnimRef.current = { anim: 'power', timer: 0.34 };
                specialCooldownRef.current = 1.45 * cdScale;
                if (!powers.infiniteEnergy) energyRef.current = Math.max(0, energyRef.current - 26);
                lastTouchRef.current = { name: selfP.name, team: selfP.team };
                showTackleNotice('MEGA TIRO A GIRO!');
              }
            } else {
              specialCooldownRef.current = 0.5;
              showTackleNotice('Energia insufficiente per il Mega Tiro!');
            }
          }

          // C. Pallonetto / Lob (V / 4 / L / U / Touch LOB)
          if (!didSpecialMove && curInput.isLobbing && specialCooldownRef.current <= 0) {
            const res = physicsRef.current.handlePlayerInteraction(
              newX,
              newZ,
              newRot,
              true,
              false,
              false,
              undefined,
              { playerId: selfId, isHuman: true, moveType: 'lob', aimRotY: newRot }
            );
            if (res.interacted) {
              didSpecialMove = true;
              anim = 'lob';
              specialAnimRef.current = { anim: 'lob', timer: 0.3 };
              specialCooldownRef.current = 0.55 * cdScale;
              lastTouchRef.current = { name: selfP.name, team: selfP.team };
              showTackleNotice('PALLONETTO MORBIDO!');
            }
          }

          // D. Finta Elastico / Ruleta (C / 3 / Touch FINTA)
          if (!didSpecialMove && isCurrentlySkilling) {
            const burstAngle = newRot + skillSideRef.current * 0.42;
            const res = physicsRef.current.handlePlayerInteraction(
              newX,
              newZ,
              burstAngle,
              false,
              true,
              false,
              closestOpp ? { x: closestOpp.x, z: closestOpp.z } : undefined,
              { playerId: selfId, isHuman: true, moveType: 'skill', aimRotY: burstAngle }
            );
            if (res.interacted) {
              didSpecialMove = true;
              lastTouchRef.current = { name: selfP.name, team: selfP.team };
              if (res.stunnedOpponent && closestOpp) {
                const hitBot = botsRef.current.find((b) => b.state.id === closestOpp!.id);
                if (hitBot) hitBot.applyStun(0.6);
                showTackleNotice('FINTA ELASTICO! Avversario saltato!');
              } else {
                showTackleNotice('FINTA RULETA!');
              }
            }
          }

          // E. Passaggio al compagno (Q / Touch PASSA)
          if (!didSpecialMove && curInput.isPassing && passCooldownRef.current <= 0) {
            const mates = prevPlayers.filter((p) => p.team === selfP.team && p.id !== selfId);
            if (mates.length > 0) {
              const fwdX = Math.sin(newRot);
              const fwdZ = Math.cos(newRot);
              let bestMate: PlayerState | null = null;
              let bestScore = -Infinity;

              for (const m of mates) {
                const mdx = m.x - newX;
                const mdz = m.z - newZ;
                const md = Math.hypot(mdx, mdz);
                if (md < 2.5 || md > 45) continue;
                const align = (mdx / md) * fwdX + (mdz / md) * fwdZ;
                const gkPenalty = m.aiRole === 'gk' ? -1.4 : 0;
                const score = align * 2.4 - md * 0.04 + gkPenalty;
                if (score > bestScore) {
                  bestScore = score;
                  bestMate = m;
                }
              }

              if (bestMate) {
                const leadDir = selfP.team === 'red' ? 1 : -1;
                const targetPassX = bestMate.x + leadDir * 2.2;
                const targetPassZ = bestMate.z;
                const passAngle = Math.atan2(targetPassX - newX, targetPassZ - newZ);
                const passDist = Math.hypot(targetPassX - newX, targetPassZ - newZ);
                const passPowerScale = Math.max(0.55, Math.min(1.05, passDist / 24));

                const passRes = physicsRef.current.handlePlayerInteraction(
                  newX,
                  newZ,
                  passAngle,
                  true,
                  false,
                  false,
                  undefined,
                  {
                    playerId: selfId,
                    isHuman: true,
                    aimRotY: passAngle,
                    shotPowerScale: passPowerScale,
                    isPass: true,
                    moveType: 'pass',
                    accuracyJitter: 0.25,
                  }
                );
                if (passRes.interacted) {
                  didSpecialMove = true;
                  newRot = passAngle;
                  anim = 'kick';
                  passCooldownRef.current = 0.42 * cdScale;
                  lastTouchRef.current = { name: selfP.name, team: selfP.team };
                  showTackleNotice(`Passaggio a ${bestMate.name}!`);
                }
              }
            }
          }

          // F. Standard Kick, Sticky Turning Dribble, or Slide Tackle
          if (!didSpecialMove) {
            const interaction = physicsRef.current.handlePlayerInteraction(
              newX,
              newZ,
              newRot,
              curInput.isKicking,
              canSprint,
              isCurrentlySliding,
              closestOpp ? { x: closestOpp.x, z: closestOpp.z } : undefined,
              { playerId: selfId, isHuman: true }
            );

            if (interaction.outcome !== 'none') {
              lastTouchRef.current = { name: selfP.name, team: selfP.team };
            }

            if (interaction.stunnedOpponent && closestOpp) {
              const hitBot = botsRef.current.find((b) => b.state.id === closestOpp!.id);
              if (hitBot) hitBot.applyStun(0.95);
            }

            if (interaction.outcome === 'tackle_steal') {
              showTackleNotice('Scivolata Perfetta! Hai preso la palla!');
            } else if (interaction.outcome === 'tackle_loose') {
              showTackleNotice("Scivolata! L'avversario perde palla e schizza via!");
            } else if (interaction.stunnedOpponent) {
              showTackleNotice('Avversario steso in scivolata!');
            }

            if (interaction.outcome === 'kick' && curInput.isKicking) {
              anim = 'kick';
            }
          }
        }

        const updatedSelf: PlayerState = {
          ...selfP,
          x: newX,
          z: newZ,
          rotY: newRot,
          anim,
          energy: roundedEnergy,
          fatigue: Math.round(fatigueMapRef.current[selfId] ?? 0),
          yellowCards: yellowCardsMapRef.current[selfId] ?? selfP.yellowCards ?? 0,
        };

        if (!isBotMatch && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'player_update',
              x: newX,
              y: selfP.y,
              z: newZ,
              rotY: newRot,
              anim,
            })
          );
        }

        // 2. Multi-Bot Squad AI Update (Red Teammates + Blue Opponents!)
        if (isBotMatch && botsRef.current.length > 0 && !goalEventRef.current) {
          const snapshotAll: PlayerState[] = [
            updatedSelf,
            ...botsRef.current.map((b) => b.state),
          ];

          for (const bot of [...botsRef.current]) {
            const botActions = bot.update(
              delta,
              physicsRef.current.ball,
              snapshotAll,
              {
                slowBots: powers.slowBots,
                freezeBots: powers.freezeBots,
              },
              {
                speedMult: mapCfg.playerSpeedMultiplier,
                traction: mapCfg.traction,
                windX: windVec.wx,
                windZ: windVec.wz,
                staminaDrainMult: mapCfg.staminaDrainMultiplier,
              }
            );

            // Accumulate realistic match fatigue for teammate bots (visible in Tab -> Gestione Squadra)
            if (bot.state.team === selfP.team) {
              const botFatigueDelta = powers.infiniteEnergy
                ? -100
                : botActions.isSprinting
                ? 4.4 * delta
                : bot.state.anim === 'run'
                ? 1.8 * delta
                : -0.25 * delta;
              fatigueMapRef.current[bot.state.id] = Math.max(
                0,
                Math.min(100, (fatigueMapRef.current[bot.state.id] ?? 0) + botFatigueDelta)
              );
              bot.state.fatigue = Math.round(fatigueMapRef.current[bot.state.id] ?? 0);
            }
            bot.state.yellowCards = yellowCardsMapRef.current[bot.state.id] ?? bot.state.yellowCards ?? 0;

            let botOpp: PlayerState | undefined;
            let botOppDist = Infinity;
            for (const cand of snapshotAll) {
              if (cand.team !== bot.state.team) {
                const d = Math.hypot(cand.x - bot.state.x, cand.z - bot.state.z);
                if (d < botOppDist) {
                  botOppDist = d;
                  botOpp = cand;
                }
              }
            }

            const botInteraction = physicsRef.current.handlePlayerInteraction(
              bot.state.x,
              bot.state.z,
              bot.state.rotY,
              botActions.isKicking,
              botActions.isSprinting,
              botActions.isTackling,
              botOpp ? { x: botOpp.x, z: botOpp.z } : undefined,
              {
                playerId: bot.state.id,
                isHuman: false,
                aimRotY: botActions.aimRotY,
                shotPowerScale: botActions.shotPowerScale,
                dribbleSpeed: botActions.dribbleSpeed,
                accuracyJitter: botActions.accuracyJitter,
                isPass: botActions.isPassing,
                moveType: botActions.moveType,
              }
            );

            if (botInteraction.outcome !== 'none') {
              lastTouchRef.current = { name: bot.state.name, team: bot.state.team };
            }

            if (botInteraction.outcome === 'bicycle') {
              showTackleNotice(`Rovesciata di ${bot.state.name}!`);
              triggerRefereeCheckForBicycle(bot.state, botOppDist);
            } else if (botInteraction.stunnedOpponent && botOpp) {
              if (botOpp.id === selfId && selfStunTimerRef.current <= 0) {
                selfStunTimerRef.current = 0.72;
                showTackleNotice(
                  botInteraction.outcome === 'skill'
                    ? `Finta di ${bot.state.name}! Ti ha saltato!`
                    : `Scivolata di ${bot.state.name}! Hai perso la palla!`
                );
              } else {
                const hitOtherBot = botsRef.current.find((b) => b.state.id === botOpp!.id);
                if (hitOtherBot) hitOtherBot.applyStun(0.85);
              }
            } else if (botInteraction.outcome === 'power') {
              showTackleNotice(`Super Tiro di ${bot.state.name}!`);
            } else if (botActions.tacticalMode === 'pass' && botInteraction.interacted && bot.state.team === selfP.team) {
              showTackleNotice(`${bot.state.name} passa a ${botActions.passTargetName || 'te'}!`);
            } else if (botActions.tacticalMode === 'save' && botInteraction.outcome !== 'none') {
              showTackleNotice(`Parata di ${bot.state.name}!`);
            }
          }
        }

        const nextPlayers = isBotMatch
          ? [updatedSelf, ...botsRef.current.map((b) => ({ ...b.state }))]
          : prevPlayers.map((p) => (p.id === selfId ? updatedSelf : p));

        playersRef.current = nextPlayers;
        setPlayers(nextPlayers);
      }

      // 3. Physics update (Ball integration & Goal detection)
      if (isBotMatch || isHost) {
        const { goalScored } = physicsRef.current.update(delta);
        const currentBall = physicsRef.current.ball;
        setBall({ ...currentBall });

        if (goalScored && !goalEventRef.current) {
          sound.playWhistle(true);

          if (isBotMatch) {
            const scoringTeam = goalScored;
            const otherTeam = scoringTeam === 'red' ? 'blue' : 'red';
            const curScores = scoresRef.current;
            const { newScore, note } = rollLocalChaosScore(curScores[scoringTeam], curScores[otherTeam]);

            const updatedScores = {
              ...curScores,
              [scoringTeam]: newScore,
            };

            scoresRef.current = updatedScores;
            setScores(updatedScores);

            const creditedScorer =
              lastTouchRef.current && lastTouchRef.current.team === scoringTeam
                ? lastTouchRef.current.name
                : scoringTeam === 'red'
                ? playerNameRef.current
                : 'Squadra Blu AI';

            const nextGoalEvent: GoalEventData = {
              scoringTeam,
              scorerName: creditedScorer,
              prevScore: curScores[scoringTeam],
              newScore,
              note,
              scores: updatedScores,
            };
            goalEventRef.current = nextGoalEvent;
            setGoalEvent(nextGoalEvent);

            goalResetTimerRef.current = window.setTimeout(() => {
              physicsRef.current.resetBall();
              setBall({ ...physicsRef.current.ball });

              // Clean kickoff reset for human & entire 4v4 squad!
              botsRef.current.forEach((b) => b.resetForKickoff());
              energyRef.current = 100;
              setEnergy(100);
              sprintExhaustedRef.current = false;
              selfStunTimerRef.current = 0;
              slideActiveTimerRef.current = 0;
              playerVelRef.current = { vx: 0, vz: 0 };
              lastTouchRef.current = null;

              const humanP = playersRef.current.find((p) => p.id === selfId);
              const resetHuman: PlayerState = humanP
                ? { ...humanP, x: -7.5, y: 0, z: -1.5, rotY: Math.PI / 2, anim: 'idle' }
                : {
                    id: 'human_player',
                    name: playerNameRef.current,
                    team: 'red',
                    x: -7.5,
                    y: 0,
                    z: -1.5,
                    rotY: Math.PI / 2,
                    anim: 'idle',
                    isHost: false,
                    jerseyNumber: 10,
                  };
              const resetPlayers = [resetHuman, ...botsRef.current.map((b) => ({ ...b.state }))];
              playersRef.current = resetPlayers;
              setPlayers(resetPlayers);

              goalEventRef.current = null;
              setGoalEvent(null);
            }, 4200);
          } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'trigger_goal',
                team: goalScored,
                scorerName: playerNameRef.current,
              })
            );
          }
        }

        if (!isBotMatch && isHost && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'ball_update',
              ...currentBall,
            })
          );
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [inGame, isBotMatch, isHost, selfId, rollLocalChaosScore, showTackleNotice, triggerRefereeCheckForBicycle]);

  const selfPlayer = players.find((p) => p.id === selfId) || null;
  const myTeamKey: 'red' | 'blue' = selfPlayer?.team || 'red';
  const myTeamPlayers = players.filter((p) => p.team === myTeamKey);
  const teamAvgFatigue =
    myTeamPlayers.length > 0
      ? Math.round(myTeamPlayers.reduce((sum, p) => sum + (p.fatigue ?? 0), 0) / myTeamPlayers.length)
      : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Football Canvas */}
      <GameCanvas
        mapId={selectedMap}
        selfId={selfId}
        players={players}
        ball={ball}
        inputState={inputState}
        giantBall={adminState.powers.giantBall}
      />

      {/* In-Game Match HUD: Scoreboard, Energy Bar, Squad Tab, Top-Right ADMIN, Referee Card Overlay */}
      {inGame && (
        <MatchHUD
          roomCode={roomCode}
          isHost={isHost}
          mapId={selectedMap}
          scores={scores}
          goalEvent={goalEvent}
          matchTimer={matchTimer}
          matchEnded={matchEnded}
          energy={energy}
          tackleNotice={tackleNotice}
          warAwardInfo={warAwardInfo}
          players={players}
          selfPlayer={selfPlayer}
          isVoiceEnabled={isVoiceEnabled}
          isMuted={isMuted}
          onToggleMic={toggleVoiceMute}
          onEnableVoice={enableVoice}
          onLeaveMatch={handleLeaveMatch}
          onPlayAgain={isBotMatch ? startBotMatch : undefined}
          onFinishNow={() => setMatchEnded(true)}
          onSendQuickChat={handleSendQuickChat}
          quickChatMessages={quickChatMessages}
          isAdminUnlocked={isAdminUnlocked}
          onOpenAdmin={() => setShowAdminModal(true)}
          onOpenSquad={() => setShowSquadModal(true)}
          teamAvgFatigue={teamAvgFatigue}
          refereeEvent={refereeEvent}
        />
      )}

      {/* Dynamic Virtual Joystick & Touch HUD for Phone / Mobile / Touch Devices */}
      {inGame && isMobile && !showSquadModal && !showAdminModal && (
        <VirtualJoystick
          onMove={(joyX, joyZ) => {
            setInputState((prev) => ({ ...prev, moveX: joyX, moveZ: joyZ }));
          }}
          onCameraRotate={(deltaX) => {
            setInputState((prev) => ({ ...prev, rotateX: deltaX }));
          }}
          onKick={(isKicking) => {
            setInputState((prev) => ({ ...prev, isKicking }));
          }}
          onPass={(isPassing) => {
            setInputState((prev) => ({ ...prev, isPassing }));
          }}
          onSprint={(isSprinting) => {
            setInputState((prev) => ({ ...prev, isSprinting }));
          }}
          onTackle={(isTackling) => {
            setInputState((prev) => ({ ...prev, isTackling }));
          }}
          onLob={(isLobbing) => {
            setInputState((prev) => ({ ...prev, isLobbing }));
          }}
          onPowerShot={(isPowerShooting) => {
            setInputState((prev) => ({ ...prev, isPowerShooting }));
          }}
          onSkillMove={(isSkillMoving) => {
            setInputState((prev) => ({ ...prev, isSkillMoving }));
          }}
          onBicycleKick={(isBicycleKicking) => {
            setInputState((prev) => ({ ...prev, isBicycleKicking }));
          }}
        />
      )}

      {/* Lobby Modal: 4 cards + Small square CLUB button + Top-Right ADMIN rectangle */}
      {!inGame && (
        <LobbyModal
          playerId={persistentPlayerId}
          playerName={playerName}
          setPlayerName={setPlayerName}
          savedPlayerName={savedPlayerName}
          isNameSaved={isNameSaved}
          onSavePermanentName={savePermanentName}
          myClub={myClub}
          onClubUpdated={updateMyClub}
          selectedMap={selectedMap}
          setSelectedMap={setSelectedMap}
          botDifficulty={botDifficulty}
          setBotDifficulty={setBotDifficulty}
          onPlayBot={startBotMatch}
          onCreateRoom={handleCreateRoom}
          onJoinByCode={handleJoinByCode}
          onQuickMatch={handleQuickMatch}
          isAdminUnlocked={isAdminUnlocked}
          onOpenAdmin={() => setShowAdminModal(true)}
        />
      )}

      {/* Real-Time Global Admin Overlay (Custom Messages, Active Global Powers, Live Vote Card) */}
      <AdminOverlay
        adminState={adminState}
        playerId={persistentPlayerId}
        onCastVote={handleCastAdminVote}
      />

      {/* Admin Panel Modal (Code 241017) */}
      {showAdminModal && (
        <AdminModal
          isUnlocked={isAdminUnlocked}
          adminCode={adminCode}
          adminState={adminState}
          playerName={playerName}
          myClub={myClub}
          inGame={inGame}
          selectedMap={selectedMap}
          onUnlockSuccess={handleUnlockAdmin}
          onLockAdmin={handleLockAdmin}
          onAdminStateUpdate={setAdminState}
          onClubUpdated={(club) => updateMyClub(club)}
          onLocalMatchAction={handleLocalAdminAction}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {/* Gestione Squadra Modal (Opened with TAB during match) */}
      {inGame && showSquadModal && (
        <SquadManagementModal
          team={myTeamKey}
          teamPlayers={myTeamPlayers}
          reserves={reserves}
          expelledNames={expelledNames}
          selfId={selfId}
          onSubstitute={handleSubstitutePlayer}
          onClose={() => setShowSquadModal(false)}
        />
      )}
    </div>
  );
}
