process.env.DISABLE_HMR = 'true';

import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// Persistent storage for permanent player names and real player-created clubs (zero bot/pre-made clubs)
export type ClubAccessType = 'aperto' | 'solo_invito' | 'chiuso';
export type ClubRole = 'presidente' | 'vicepresidente' | 'consigliere' | 'socio_saggio' | 'socio';

interface ClubMember {
  playerId: string;
  playerName: string;
  role: ClubRole;
  joinedAt: number;
}

interface ClubInvite {
  id: string;
  playerId: string;
  playerName: string;
  type: 'request_to_join' | 'invited_by_club';
  invitedByName?: string;
  message?: string;
  createdAt: number;
}

interface ClubAdvice {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

interface ClubChatMessage {
  id: string;
  clubId: string;
  authorId: string;
  authorName: string;
  authorRole: ClubRole;
  text: string;
  createdAt: number;
}

interface ClubWar {
  id: string;
  challengerClubId: string;
  challengerClubName: string;
  defenderClubId: string;
  defenderClubName: string;
  challengerPoints: number;
  defenderPoints: number;
  startedAt: number;
  endsAt: number;
  status: 'active' | 'finished';
  winnerClubId: string | null;
  winnerClubName: string | null;
}

interface ClubRecord {
  id: string;
  name: string;
  cityOrCountry: string;
  accessType: ClubAccessType;
  maxMembers: number;
  createdAt: number;
  members: ClubMember[];
  invites: ClubInvite[];
  adviceList: ClubAdvice[];
  chatMessages: ClubChatMessage[];
  trophies: number;
  warWins: number;
  warLosses: number;
  warPointsTotal: number;
  rankScore: number;
}

interface PersistentStore {
  players: Record<string, { playerId: string; name: string; lockedAt: number }>;
  clubs: ClubRecord[];
  wars: ClubWar[];
}

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const ROLE_LIMITS: Partial<Record<ClubRole, number>> = {
  presidente: 1,
  vicepresidente: 2,
  consigliere: 5,
};

function getClubCupBoost(trophies: number): { tier: string; multiplier: number; bonusPct: number } {
  if (trophies >= 700) return { tier: 'Leggenda', multiplier: 2.0, bonusPct: 100 };
  if (trophies >= 350) return { tier: 'Oro', multiplier: 1.65, bonusPct: 65 };
  if (trophies >= 150) return { tier: 'Argento', multiplier: 1.4, bonusPct: 40 };
  if (trophies >= 50) return { tier: 'Bronzo', multiplier: 1.2, bonusPct: 20 };
  return { tier: 'Base', multiplier: 1.0, bonusPct: 0 };
}

function normalizeClubRecord(c: Partial<ClubRecord>): ClubRecord {
  return {
    id: c.id || `club_${Date.now()}`,
    name: c.name || 'Club',
    cityOrCountry: typeof c.cityOrCountry === 'string' ? c.cityOrCountry.trim().slice(0, 40) : '',
    accessType: c.accessType || 'aperto',
    maxMembers: c.maxMembers || 30,
    createdAt: c.createdAt || Date.now(),
    members: Array.isArray(c.members) ? c.members : [],
    invites: Array.isArray(c.invites) ? c.invites : [],
    adviceList: Array.isArray(c.adviceList) ? c.adviceList : [],
    chatMessages: Array.isArray(c.chatMessages) ? c.chatMessages.slice(-120) : [],
    trophies: typeof c.trophies === 'number' ? c.trophies : 0,
    warWins: typeof c.warWins === 'number' ? c.warWins : 0,
    warLosses: typeof c.warLosses === 'number' ? c.warLosses : 0,
    warPointsTotal: typeof c.warPointsTotal === 'number' ? c.warPointsTotal : 0,
    rankScore: typeof c.rankScore === 'number' ? c.rankScore : 0,
  };
}

function loadStore(): PersistentStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        players: parsed.players || {},
        clubs: Array.isArray(parsed.clubs) ? parsed.clubs.map(normalizeClubRecord) : [],
        wars: Array.isArray(parsed.wars) ? parsed.wars : [],
      };
    }
  } catch (err) {
    console.warn('Could not load store.json, starting fresh:', err);
  }
  return { players: {}, clubs: [], wars: [] };
}

const store: PersistentStore = loadStore();

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = STORE_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (err) {
    console.error('Error saving store.json:', err);
  }
}

// Auto-upgrade long-standing "socio" members to "socio_saggio" if they've been in the club for >= 7 days
function checkVeteranPromotions(club: ClubRecord) {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let changed = false;
  for (const m of club.members) {
    if (m.role === 'socio' && now - m.joinedAt >= SEVEN_DAYS_MS) {
      m.role = 'socio_saggio';
      changed = true;
    }
  }
  if (changed) saveStore();
}

// Resolve any 1-week Club Wars whose duration has elapsed
function resolveExpiredWars() {
  const now = Date.now();
  let changed = false;

  for (const war of store.wars) {
    if (war.status === 'active' && now >= war.endsAt) {
      war.status = 'finished';
      const challenger = store.clubs.find((c) => c.id === war.challengerClubId);
      const defender = store.clubs.find((c) => c.id === war.defenderClubId);

      if (war.challengerPoints > war.defenderPoints) {
        war.winnerClubId = war.challengerClubId;
        war.winnerClubName = war.challengerClubName;
        if (challenger) {
          challenger.warWins = (challenger.warWins || 0) + 1;
          challenger.rankScore = (challenger.rankScore || 0) + 150 + war.challengerPoints;
        }
        if (defender) {
          defender.warLosses = (defender.warLosses || 0) + 1;
          defender.rankScore = (defender.rankScore || 0) + Math.floor(war.defenderPoints * 0.25);
        }
      } else if (war.defenderPoints > war.challengerPoints) {
        war.winnerClubId = war.defenderClubId;
        war.winnerClubName = war.defenderClubName;
        if (defender) {
          defender.warWins = (defender.warWins || 0) + 1;
          defender.rankScore = (defender.rankScore || 0) + 150 + war.defenderPoints;
        }
        if (challenger) {
          challenger.warLosses = (challenger.warLosses || 0) + 1;
          challenger.rankScore = (challenger.rankScore || 0) + Math.floor(war.challengerPoints * 0.25);
        }
      } else {
        war.winnerClubId = null;
        war.winnerClubName = 'Pareggio';
        if (challenger) challenger.rankScore = (challenger.rankScore || 0) + 50;
        if (defender) defender.rankScore = (defender.rankScore || 0) + 50;
      }
      changed = true;
    }
  }

  if (changed) saveStore();
}

function getSortedLeaderboard(): ClubRecord[] {
  return [...store.clubs].sort((a, b) => {
    const scoreDiff = (b.rankScore || 0) - (a.rankScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const winsDiff = (b.warWins || 0) - (a.warWins || 0);
    if (winsDiff !== 0) return winsDiff;
    return (b.warPointsTotal || 0) - (a.warPointsTotal || 0);
  });
}

interface PlayerData {
  id: string;
  name: string;
  team: 'red' | 'blue';
  x: number;
  y: number;
  z: number;
  rotY: number;
  anim: 'idle' | 'run' | 'kick' | 'slide' | 'skill' | 'lob' | 'power' | 'bicycle';
  isHost: boolean;
  isTalking?: boolean;
}

interface Room {
  code: string;
  name: string;
  hostId: string;
  isPublic: boolean;
  map:
    | 'stadium'
    | 'sand'
    | 'underwater'
    | 'cyber'
    | 'snow'
    | 'volcano'
    | 'rooftop'
    | 'space'
    | 'ice'
    | 'swamp'
    | 'wind'
    | 'speedway';
  players: Map<string, PlayerData>;
  sockets: Map<string, WebSocket>;
  ball: {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
  };
  scores: {
    red: number;
    blue: number;
  };
  scoreLog: Array<{ team: 'red' | 'blue'; points: number; prevScore: number; newScore: number; note: string; timestamp: number }>;
  state: 'waiting' | 'playing' | 'goal_scored' | 'ended';
  goalTimer: number;
  matchTimer: number;
  lastBallOwner: string | null;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(room: Room, message: Record<string, unknown>, excludeSocket?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const socket of room.sockets.values()) {
    if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

// Generate a chaotic score when a goal is scored
function rollChaosScore(currentScore: number, otherScore: number): { newScore: number; note: string } {
  const rollType = Math.random();
  let newScore = currentScore;
  let note = '';

  if (currentScore === 0) {
    const initialRolls = [10, 25, 42, 50, 77, 88, 100, 15, 33];
    const picked = initialRolls[Math.floor(Math.random() * initialRolls.length)];
    newScore = picked;
    note = `Primo Gol! Estratto: ${picked} Punti!`;
  } else if (rollType < 0.35) {
    const add = Math.floor(Math.random() * 60) + 15;
    newScore = currentScore + add;
    note = `Super Salita! +${add} pt (Tot: ${newScore})`;
  } else if (rollType < 0.6) {
    const drop = Math.floor(Math.random() * Math.min(40, currentScore - 5)) + 5;
    newScore = Math.max(5, currentScore - drop);
    note = `Imprevisto Caotico! -${drop} pt (Nuovo: ${newScore})`;
  } else if (rollType < 0.8) {
    const wild = Math.floor(Math.random() * 120) + 10;
    const diff = wild - currentScore;
    newScore = wild;
    if (diff > 0) {
      note = `Punteggio Impazzito! Vola a ${wild} pt (+${diff})`;
    } else {
      note = `Scivolone Caotico! Calato a ${wild} pt (${diff})`;
    }
  } else if (rollType < 0.92) {
    if (Math.random() > 0.5) {
      newScore = Math.min(250, Math.round(currentScore * 1.5));
      note = `MOLTIPLICATORE x1.5! Punteggio a ${newScore} pt!`;
    } else {
      newScore = currentScore + 100;
      note = `JACKPOT BOMBER! +100 Punti Bonus! (Tot: ${newScore})`;
    }
  } else {
    newScore = Math.max(10, otherScore + (Math.random() > 0.5 ? 5 : -5));
    note = `Effetto Thriller! Agganciato a ${newScore} pt!`;
  }

  return { newScore, note };
}

// ==========================================
// PERMANENT PLAYER NAME & CLUBS REST API
// ==========================================

// Get player permanent profile and current club
app.get('/api/players/:playerId', (req, res) => {
  resolveExpiredWars();
  const { playerId } = req.params;
  const profile = store.players[playerId] || null;
  const myClub = store.clubs.find((c) => c.members.some((m) => m.playerId === playerId)) || null;
  if (myClub) checkVeteranPromotions(myClub);
  res.json({ profile, club: myClub });
});

// Save or update player name (persisted across sessions, always editable, spaces allowed)
app.post('/api/players/save-name', (req, res) => {
  const { playerId, name } = req.body;
  if (!playerId || typeof name !== 'string' || name.trim().length < 1) {
    res.status(400).json({ error: 'Inserisci un nome valido.' });
    return;
  }

  const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 24);
  const existing = store.players[playerId];
  store.players[playerId] = {
    playerId,
    name: cleanName,
    lockedAt: existing?.lockedAt || Date.now(),
  };

  // Update name in any club membership/invites/advice if present
  store.clubs.forEach((c) => {
    c.members.forEach((m) => {
      if (m.playerId === playerId) m.playerName = cleanName;
    });
    c.invites.forEach((inv) => {
      if (inv.playerId === playerId) inv.playerName = cleanName;
    });
    c.adviceList.forEach((adv) => {
      if (adv.authorId === playerId) adv.authorName = cleanName;
    });
  });

  saveStore();
  const myClub = store.clubs.find((c) => c.members.some((m) => m.playerId === playerId)) || null;
  res.json({ profile: store.players[playerId], club: myClub, alreadyLocked: false });
});

// Search & list real player-created clubs ("non ci sono club fatti da te ma solo da veri player")
app.get('/api/clubs', (req, res) => {
  resolveExpiredWars();
  const query = String(req.query.q || '').trim().toLowerCase();
  store.clubs.forEach(checkVeteranPromotions);

  const results = store.clubs.filter((c) => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      (c.cityOrCountry || '').toLowerCase().includes(query)
    );
  });

  res.json({ clubs: results });
});

// Create a new club (name from 1 to 50 chars including spaces)
app.post('/api/clubs', (req, res) => {
  const { playerId, playerName, clubName, accessType, cityOrCountry } = req.body;

  if (!playerId) {
    res.status(400).json({ error: 'ID giocatore mancante.' });
    return;
  }

  const rawClubName = typeof clubName === 'string' ? clubName : '';
  if (rawClubName.length < 1 || rawClubName.length > 50 || rawClubName.trim().length < 1) {
    res.status(400).json({
      error: 'Il nome del club deve avere da 1 a 50 lettere (compresi gli spazi).',
    });
    return;
  }

  const validAccess: ClubAccessType[] = ['aperto', 'solo_invito', 'chiuso'];
  const chosenAccess: ClubAccessType = validAccess.includes(accessType) ? accessType : 'aperto';

  // Check if player is already in a club
  const existingClub = store.clubs.find((c) => c.members.some((m) => m.playerId === playerId));
  if (existingClub) {
    res.status(400).json({ error: `Fai già parte del club "${existingClub.name}". Esci prima dal tuo club attuale.` });
    return;
  }

  // Check duplicate club name
  if (store.clubs.some((c) => c.name.toLowerCase() === rawClubName.toLowerCase())) {
    res.status(400).json({ error: 'Esiste già un club con questo nome!' });
    return;
  }

  const resolvedPlayerName = store.players[playerId]?.name || String(playerName || 'Giocatore').trim();
  const cleanLocation = typeof cityOrCountry === 'string' ? cityOrCountry.trim().replace(/\s+/g, ' ').slice(0, 40) : '';

  const newClub: ClubRecord = {
    id: `club_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: rawClubName,
    cityOrCountry: cleanLocation,
    accessType: chosenAccess,
    maxMembers: 30,
    createdAt: Date.now(),
    members: [
      {
        playerId,
        playerName: resolvedPlayerName,
        role: 'presidente',
        joinedAt: Date.now(),
      },
    ],
    invites: [],
    adviceList: [],
    chatMessages: [],
    trophies: 0,
    warWins: 0,
    warLosses: 0,
    warPointsTotal: 0,
    rankScore: 0,
  };

  store.clubs.push(newClub);
  saveStore();

  res.json({ club: newClub });
});

// Fondatore can choose/change the club's city or country (e.g. Palermo, São Paulo, Italia...) at any time
app.post('/api/clubs/:clubId/location', (req, res) => {
  const { clubId } = req.params;
  const { actorId, cityOrCountry } = req.body || {};

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  if (!actor || actor.role !== 'presidente') {
    res.status(403).json({ error: 'Solo il Fondatore può scegliere il paese o la città della squadra!' });
    return;
  }

  const cleanLocation = String(cityOrCountry || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  if (!cleanLocation) {
    res.status(400).json({ error: 'Inserisci un paese o una città valida (es. Palermo, São Paulo).' });
    return;
  }

  club.cityOrCountry = cleanLocation;
  saveStore();
  res.json({
    club,
    message: `Squadra del club impostata su "${cleanLocation}"!`,
  });
});

// Restore saved club membership if the server restarted and lost local disk state
app.post('/api/clubs/restore', (req, res) => {
  resolveExpiredWars();
  const { playerId, playerName, savedClub } = req.body;
  if (!playerId || !savedClub || typeof savedClub.name !== 'string') {
    res.status(400).json({ error: 'Dati club salvati non validi.' });
    return;
  }

  // If player is already in a club on the server, return the live server record
  const currentClub = store.clubs.find((c) => c.members.some((m) => m.playerId === playerId));
  if (currentClub) {
    res.json({ club: currentClub, restored: false });
    return;
  }

  // If the club still exists on server by ID or name, check whether player was in it
  const existingById = store.clubs.find(
    (c) => c.id === savedClub.id || c.name.toLowerCase() === savedClub.name.toLowerCase()
  );
  if (existingById) {
    // Re-attach member safely if club isn't full
    if (existingById.members.length < existingById.maxMembers) {
      const savedMember = Array.isArray(savedClub.members)
        ? savedClub.members.find((m: ClubMember) => m.playerId === playerId)
        : null;
      existingById.members.push({
        playerId,
        playerName: store.players[playerId]?.name || String(playerName || savedMember?.playerName || 'Giocatore'),
        role: existingById.members.some((m) => m.role === 'presidente')
          ? savedMember?.role === 'presidente'
            ? 'socio_saggio'
            : savedMember?.role || 'socio'
          : 'presidente',
        joinedAt: savedMember?.joinedAt || Date.now(),
      });
      saveStore();
    }
    res.json({ club: existingById, restored: true });
    return;
  }

  // Server didn't have this club (e.g. restarted fresh) -> restore it cleanly!
  const restoredClub = normalizeClubRecord(savedClub);
  const resolvedName = store.players[playerId]?.name || String(playerName || 'Giocatore').trim();
  if (!restoredClub.members.some((m) => m.playerId === playerId)) {
    restoredClub.members.push({
      playerId,
      playerName: resolvedName,
      role: restoredClub.members.length === 0 ? 'presidente' : 'socio',
      joinedAt: Date.now(),
    });
  } else {
    restoredClub.members.forEach((m) => {
      if (m.playerId === playerId) m.playerName = resolvedName;
    });
  }

  store.clubs.push(restoredClub);
  saveStore();
  res.json({ club: restoredClub, restored: true });
});

// Join a club or send an invite/join request
app.post('/api/clubs/:clubId/join', (req, res) => {
  const { clubId } = req.params;
  const { playerId, playerName, message } = req.body;

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const alreadyInClub = store.clubs.find((c) => c.members.some((m) => m.playerId === playerId));
  if (alreadyInClub) {
    res.status(400).json({ error: `Fai già parte del club "${alreadyInClub.name}".` });
    return;
  }

  if (club.members.length >= club.maxMembers) {
    res.status(400).json({ error: 'Questo club è pieno!' });
    return;
  }

  const resolvedName = store.players[playerId]?.name || String(playerName || 'Giocatore').trim();

  // Check if player was already invited by the club
  const existingClubInviteIdx = club.invites.findIndex(
    (inv) => inv.playerId === playerId && inv.type === 'invited_by_club'
  );
  if (existingClubInviteIdx !== -1) {
    club.invites.splice(existingClubInviteIdx, 1);
    club.members.push({
      playerId,
      playerName: resolvedName,
      role: 'socio',
      joinedAt: Date.now(),
    });
    saveStore();
    res.json({ status: 'joined', club, message: `Sei entrato nel club "${club.name}" tramite invito!` });
    return;
  }

  if (club.accessType === 'chiuso') {
    res.status(403).json({ error: 'Questo club è CHIUSO: nessun giocatore può entrare.' });
    return;
  }

  if (club.accessType === 'aperto') {
    club.members.push({
      playerId,
      playerName: resolvedName,
      role: 'socio',
      joinedAt: Date.now(),
    });
    // Remove any pending request from this player
    club.invites = club.invites.filter((i) => i.playerId !== playerId);
    saveStore();
    res.json({ status: 'joined', club, message: `Sei entrato nel club "${club.name}"!` });
    return;
  }

  // club.accessType === 'solo_invito'
  if (club.invites.some((i) => i.playerId === playerId)) {
    res.status(400).json({ error: 'Hai già mandato un invito/richiesta a questo club. Attendi la scelta del Fondatore o Semifondatore.' });
    return;
  }

  const newInvite: ClubInvite = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playerId,
    playerName: resolvedName,
    type: 'request_to_join',
    message: typeof message === 'string' ? message.trim().slice(0, 120) : 'Vorrei entrare nel club!',
    createdAt: Date.now(),
  };

  club.invites.push(newInvite);
  saveStore();
  res.json({
    status: 'invite_sent',
    club,
    message: 'Invito mandato al club! Il Fondatore o il Semifondatore possono ora scegliere se introdurti.',
  });
});

// Fondatore or Semifondatore sends a direct invite to a player name
app.post('/api/clubs/:clubId/send-invite', (req, res) => {
  const { clubId } = req.params;
  const { actorId, targetPlayerName } = req.body;

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  if (!actor || (actor.role !== 'presidente' && actor.role !== 'vicepresidente')) {
    res.status(403).json({ error: 'Solo il Fondatore e il Semifondatore possono gestire gli inviti.' });
    return;
  }

  const cleanTargetName = String(targetPlayerName || '').trim();
  if (!cleanTargetName) {
    res.status(400).json({ error: 'Inserisci il nome del giocatore da invitare.' });
    return;
  }

  // Find player in registered players if exists
  const matchedPlayer = Object.values(store.players).find(
    (p) => p.name.toLowerCase() === cleanTargetName.toLowerCase()
  );
  const targetId = matchedPlayer ? matchedPlayer.playerId : `invited_${cleanTargetName.toLowerCase()}`;

  if (club.members.some((m) => m.playerId === targetId || m.playerName.toLowerCase() === cleanTargetName.toLowerCase())) {
    res.status(400).json({ error: 'Questo giocatore è già nel club.' });
    return;
  }

  const invite: ClubInvite = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playerId: targetId,
    playerName: matchedPlayer ? matchedPlayer.name : cleanTargetName,
    type: 'invited_by_club',
    invitedByName: actor.playerName,
    message: `Invitato da ${actor.playerName} (${actor.role === 'presidente' ? 'Fondatore' : 'Semifondatore'})`,
    createdAt: Date.now(),
  };

  club.invites.push(invite);
  saveStore();
  res.json({ club, message: `Invito mandato a ${invite.playerName}!` });
});

// Fondatore or Semifondatore chooses whether to introduce/accept or reject an invite
app.post('/api/clubs/:clubId/invites/:inviteId/respond', (req, res) => {
  const { clubId, inviteId } = req.params;
  const { actorId, decision } = req.body; // decision: 'accept' | 'reject'

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  if (!actor || (actor.role !== 'presidente' && actor.role !== 'vicepresidente')) {
    res.status(403).json({
      error: 'Solo il Fondatore e il Semifondatore possono scegliere se introdurre i giocatori dagli inviti!',
    });
    return;
  }

  const invIndex = club.invites.findIndex((i) => i.id === inviteId);
  if (invIndex === -1) {
    res.status(404).json({ error: 'Invito non trovato o già gestito.' });
    return;
  }

  const invite = club.invites[invIndex];

  if (decision === 'accept') {
    if (club.members.length >= club.maxMembers) {
      res.status(400).json({ error: 'Il club è pieno!' });
      return;
    }

    // Remove player from any other club just in case
    const alreadyInClub = store.clubs.find((c) => c.members.some((m) => m.playerId === invite.playerId));
    if (!alreadyInClub) {
      club.members.push({
        playerId: invite.playerId,
        playerName: invite.playerName,
        role: 'socio',
        joinedAt: Date.now(),
      });
    }
    club.invites.splice(invIndex, 1);
    saveStore();
    res.json({ club, message: `${invite.playerName} è stato introdotto nel club come Calciatore!` });
  } else {
    club.invites.splice(invIndex, 1);
    saveStore();
    res.json({ club, message: `Invito di ${invite.playerName} rifiutato.` });
  }
});

// Change club access type ('aperto' | 'solo_invito' | 'chiuso') - Fondatore & Semifondatore
app.post('/api/clubs/:clubId/settings', (req, res) => {
  const { clubId } = req.params;
  const { actorId, accessType } = req.body;

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  if (!actor || (actor.role !== 'presidente' && actor.role !== 'vicepresidente')) {
    res.status(403).json({ error: 'Solo il Fondatore o il Semifondatore possono cambiare il tipo di accesso del club.' });
    return;
  }

  const validAccess: ClubAccessType[] = ['aperto', 'solo_invito', 'chiuso'];
  if (!validAccess.includes(accessType)) {
    res.status(400).json({ error: 'Tipo di accesso non valido.' });
    return;
  }

  club.accessType = accessType;
  saveStore();
  res.json({ club });
});

// Change member role (Presidente has full power; Vicepresidente has less power than Presidente)
// Strict limits: 1 Presidente, max 2 Vicepresidenti, max 5 Consiglieri, infinite Soci Saggi & Soci
app.post('/api/clubs/:clubId/members/:targetPlayerId/role', (req, res) => {
  const { clubId, targetPlayerId } = req.params;
  const { actorId, newRole } = req.body;

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  const target = club.members.find((m) => m.playerId === targetPlayerId);

  if (!actor || !target) {
    res.status(404).json({ error: 'Membro non trovato nel club.' });
    return;
  }

  const validRoles: ClubRole[] = ['presidente', 'vicepresidente', 'consigliere', 'socio_saggio', 'socio'];
  if (!validRoles.includes(newRole)) {
    res.status(400).json({ error: 'Ruolo non valido.' });
    return;
  }

  // Enforce role caps (5 Aiutanti, 2 Semifondatori, 1 Fondatore, infiniti Calciatori Anziani & Calciatori)
  const cap = ROLE_LIMITS[newRole as ClubRole];
  if (cap !== undefined && newRole !== 'presidente' && target.role !== newRole) {
    const currentCount = club.members.filter((m) => m.role === newRole).length;
    if (currentCount >= cap) {
      const roleItalian = newRole === 'vicepresidente' ? 'Semifondatori' : 'Aiutanti';
      res.status(400).json({
        error: `Limite raggiunto: un club può avere al massimo ${cap} ${roleItalian}!`,
      });
      return;
    }
  }

  if (actor.role === 'presidente') {
    if (newRole === 'presidente') {
      // Transfer founder role: keep Semifondatori cap <= 2
      const currentVices = club.members.filter((m) => m.role === 'vicepresidente' && m.playerId !== target.playerId).length;
      actor.role = currentVices < 2 ? 'vicepresidente' : 'socio_saggio';
      target.role = 'presidente';
    } else if (target.role !== 'presidente') {
      target.role = newRole;
    }
  } else if (actor.role === 'vicepresidente') {
    // Semifondatore has less power than Fondatore: cannot change Fondatore or other Semifondatori
    if (target.role === 'presidente' || target.role === 'vicepresidente') {
      res.status(403).json({ error: 'Il Semifondatore ha meno potenza del Fondatore: non può modificare il Fondatore o un altro Semifondatore.' });
      return;
    }
    if (newRole === 'presidente' || newRole === 'vicepresidente') {
      res.status(403).json({ error: 'Solo il Fondatore può nominare un Semifondatore o cedere il ruolo di Fondatore.' });
      return;
    }
    target.role = newRole;
  } else {
    res.status(403).json({ error: 'Non hai i permessi per modificare i ruoli.' });
    return;
  }

  saveStore();
  res.json({ club });
});

// Kick member from club
app.post('/api/clubs/:clubId/members/:targetPlayerId/kick', (req, res) => {
  const { clubId, targetPlayerId } = req.params;
  const { actorId } = req.body;

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  const target = club.members.find((m) => m.playerId === targetPlayerId);

  if (!actor || !target || actor.playerId === target.playerId) {
    res.status(400).json({ error: 'Operazione non valida.' });
    return;
  }

  if (actor.role === 'presidente') {
    club.members = club.members.filter((m) => m.playerId !== targetPlayerId);
  } else if (actor.role === 'vicepresidente') {
    if (target.role === 'presidente' || target.role === 'vicepresidente') {
      res.status(403).json({ error: 'Il Semifondatore non può espellere il Fondatore o un altro Semifondatore.' });
      return;
    }
    club.members = club.members.filter((m) => m.playerId !== targetPlayerId);
  } else {
    res.status(403).json({ error: 'Non hai i permessi per espellere membri.' });
    return;
  }

  saveStore();
  res.json({ club });
});

// Aiutante sends advice to the Fondatore
app.post('/api/clubs/:clubId/advice', (req, res) => {
  const { clubId } = req.params;
  const { actorId, text } = req.body;

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  if (!actor || (actor.role !== 'consigliere' && actor.role !== 'presidente' && actor.role !== 'vicepresidente')) {
    res.status(403).json({ error: "Solo l'Aiutante (o la dirigenza) può inviare consigli ufficiali al Fondatore." });
    return;
  }

  const cleanText = String(text || '').trim().slice(0, 200);
  if (!cleanText) {
    res.status(400).json({ error: 'Scrivi un consiglio valido.' });
    return;
  }

  const advice: ClubAdvice = {
    id: `adv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorId: actor.playerId,
    authorName: actor.playerName,
    text: cleanText,
    createdAt: Date.now(),
  };

  club.adviceList.unshift(advice);
  if (club.adviceList.length > 30) {
    club.adviceList = club.adviceList.slice(0, 30);
  }

  saveStore();
  res.json({ club });
});

// ==========================================
// REAL-TIME CLUB CHAT (Text + Emoji, All Members)
// ==========================================
const clubChatSubscribers = new Map<string, Set<WebSocket>>();

function subscribeSocketToClubChat(clubId: string, ws: WebSocket) {
  let set = clubChatSubscribers.get(clubId);
  if (!set) {
    set = new Set();
    clubChatSubscribers.set(clubId, set);
  }
  set.add(ws);
}

function unsubscribeSocketFromAllClubChats(ws: WebSocket) {
  for (const [cid, set] of clubChatSubscribers.entries()) {
    set.delete(ws);
    if (set.size === 0) {
      clubChatSubscribers.delete(cid);
    }
  }
}

function broadcastClubChatMessage(clubId: string, message: ClubChatMessage) {
  const subscribers = clubChatSubscribers.get(clubId);
  if (!subscribers || subscribers.size === 0) return;
  const payload = JSON.stringify({
    type: 'club_chat_message',
    clubId,
    message,
  });
  subscribers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

app.get('/api/clubs/:clubId/chat', (req, res) => {
  const { clubId } = req.params;
  const playerId = String(req.query.playerId || '');
  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }
  if (playerId && !club.members.some((m) => m.playerId === playerId)) {
    res.status(403).json({ error: 'Solo i membri del club possono leggere la chat del club.' });
    return;
  }
  res.json({ messages: club.chatMessages || [] });
});

app.post('/api/clubs/:clubId/chat', (req, res) => {
  const { clubId } = req.params;
  const { actorId, text } = req.body || {};

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const actor = club.members.find((m) => m.playerId === actorId);
  if (!actor) {
    res.status(403).json({ error: 'Devi far parte del club per scrivere nella chat!' });
    return;
  }

  const cleanText = String(text || '').trim().slice(0, 400);
  if (!cleanText) {
    res.status(400).json({ error: 'Scrivi un messaggio o scegli un emoji!' });
    return;
  }

  if (!Array.isArray(club.chatMessages)) {
    club.chatMessages = [];
  }

  const chatMsg: ClubChatMessage = {
    id: `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    clubId: club.id,
    authorId: actor.playerId,
    authorName: store.players[actor.playerId]?.name || actor.playerName,
    authorRole: actor.role,
    text: cleanText,
    createdAt: Date.now(),
  };

  club.chatMessages.push(chatMsg);
  if (club.chatMessages.length > 120) {
    club.chatMessages = club.chatMessages.slice(-120);
  }

  saveStore();
  broadcastClubChatMessage(club.id, chatMsg);
  res.json({ message: chatMsg, club });
});

// Leave club
app.post('/api/clubs/:clubId/leave', (req, res) => {
  const { clubId } = req.params;
  const { playerId } = req.body;

  const clubIdx = store.clubs.findIndex((c) => c.id === clubId);
  if (clubIdx === -1) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const club = store.clubs[clubIdx];
  const member = club.members.find((m) => m.playerId === playerId);
  if (!member) {
    res.status(400).json({ error: 'Non fai parte di questo club.' });
    return;
  }

  club.members = club.members.filter((m) => m.playerId !== playerId);

  if (club.members.length === 0) {
    // Cancel any active war involving deleted club
    store.wars.forEach((w) => {
      if (w.status === 'active' && (w.challengerClubId === clubId || w.defenderClubId === clubId)) {
        w.status = 'finished';
        const otherId = w.challengerClubId === clubId ? w.defenderClubId : w.challengerClubId;
        const otherName = w.challengerClubId === clubId ? w.defenderClubName : w.challengerClubName;
        w.winnerClubId = otherId;
        w.winnerClubName = otherName;
        const otherClub = store.clubs.find((c) => c.id === otherId);
        if (otherClub) {
          otherClub.warWins = (otherClub.warWins || 0) + 1;
          otherClub.rankScore = (otherClub.rankScore || 0) + 100;
        }
      }
    });
    // Delete club if no real players remain
    store.clubs.splice(clubIdx, 1);
    saveStore();
    res.json({ club: null });
    return;
  }

  // If Presidente left, promote highest ranking member
  if (member.role === 'presidente') {
    const rankOrder: Record<ClubRole, number> = {
      presidente: 5,
      vicepresidente: 4,
      consigliere: 3,
      socio_saggio: 2,
      socio: 1,
    };
    club.members.sort((a, b) => rankOrder[b.role] - rankOrder[a.role] || a.joinedAt - b.joinedAt);
    club.members[0].role = 'presidente';
  }

  saveStore();
  res.json({ club: null });
});

// ==========================================
// CLUB WARS ("GUERRA") & LEADERBOARD ("CLASSIFICA")
// ==========================================

app.get('/api/wars', (_req, res) => {
  resolveExpiredWars();
  const activeWars = store.wars.filter((w) => w.status === 'active');
  const finishedWars = [...store.wars]
    .filter((w) => w.status === 'finished')
    .sort((a, b) => b.endsAt - a.endsAt)
    .slice(0, 30);
  const leaderboard = getSortedLeaderboard();

  res.json({ activeWars, finishedWars, leaderboard });
});

// Presidente declares a 1-week war against another real players' club
app.post('/api/clubs/:clubId/war/declare', (req, res) => {
  resolveExpiredWars();
  const { clubId } = req.params;
  const { actorId, targetClubId } = req.body;

  const challenger = store.clubs.find((c) => c.id === clubId);
  if (!challenger) {
    res.status(404).json({ error: 'Il tuo club non è stato trovato.' });
    return;
  }

  const actor = challenger.members.find((m) => m.playerId === actorId);
  if (!actor || actor.role !== 'presidente') {
    res.status(403).json({ error: 'Solo il Fondatore può dichiarare guerra a un altro club!' });
    return;
  }

  if (!targetClubId || targetClubId === clubId) {
    res.status(400).json({ error: 'Scegli un altro club di veri giocatori da sfidare.' });
    return;
  }

  const defender = store.clubs.find((c) => c.id === targetClubId);
  if (!defender) {
    res.status(404).json({ error: 'Club avversario non trovato.' });
    return;
  }

  // Ensure neither club is already in an active war
  const challengerBusy = store.wars.find(
    (w) => w.status === 'active' && (w.challengerClubId === clubId || w.defenderClubId === clubId)
  );
  if (challengerBusy) {
    res.status(400).json({ error: 'Il tuo club è già impegnato in una guerra attiva questa settimana!' });
    return;
  }

  const defenderBusy = store.wars.find(
    (w) => w.status === 'active' && (w.challengerClubId === targetClubId || w.defenderClubId === targetClubId)
  );
  if (defenderBusy) {
    res.status(400).json({ error: `Il club "${defender.name}" è già impegnato in un'altra guerra.` });
    return;
  }

  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const newWar: ClubWar = {
    id: `war_${now}_${Math.random().toString(36).substring(2, 7)}`,
    challengerClubId: challenger.id,
    challengerClubName: challenger.name,
    defenderClubId: defender.id,
    defenderClubName: defender.name,
    challengerPoints: 0,
    defenderPoints: 0,
    startedAt: now,
    endsAt: now + ONE_WEEK_MS,
    status: 'active',
    winnerClubId: null,
    winnerClubName: null,
  };

  store.wars.push(newWar);
  saveStore();
  res.json({
    war: newWar,
    message: `Guerra dichiarata contro "${defender.name}" per 1 settimana! Ogni vittoria assegnerà i punteggi alla guerra.`,
  });
});

// Report a match victory: ALWAYS sends earned Coppe to the club, AND applies Cup War Boosts if a war is active!
app.post('/api/clubs/:clubId/war/report-win', (req, res) => {
  resolveExpiredWars();
  const { clubId } = req.params;
  const { playerId, points } = req.body;

  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }

  const member = club.members.find((m) => m.playerId === playerId);
  if (!member) {
    res.status(403).json({ error: 'Non sei un membro di questo club.' });
    return;
  }

  const scoreVal = Math.max(10, Math.min(500, Math.round(Number(points) || 15)));
  const trophiesBefore = club.trophies || 0;
  const boost = getClubCupBoost(trophiesBefore);

  // Base trophies awarded to the club on every match victory (12..40 Coppe) × Admin Trophy Multiplier!
  const baseTrophiesAdded = Math.max(12, Math.min(40, Math.round(12 + scoreVal / 10)));
  const adminMult = adminState.powers.trophyMultiplier || 1;
  const trophiesAdded = baseTrophiesAdded * adminMult;
  club.trophies = trophiesBefore + trophiesAdded;
  club.rankScore = (club.rankScore || 0) + trophiesAdded;

  const activeWar = store.wars.find(
    (w) => w.status === 'active' && (w.challengerClubId === clubId || w.defenderClubId === clubId)
  );

  let warPointsAdded = 0;
  if (activeWar) {
    // Previously accumulated Coppe boost war points!
    warPointsAdded = Math.round(trophiesAdded * boost.multiplier);
    if (activeWar.challengerClubId === clubId) {
      activeWar.challengerPoints += warPointsAdded;
    } else {
      activeWar.defenderPoints += warPointsAdded;
    }
    club.warPointsTotal = (club.warPointsTotal || 0) + warPointsAdded;
    club.rankScore = (club.rankScore || 0) + warPointsAdded;
  }

  saveStore();

  const adminTag = adminMult > 1 ? ` (EVENTO ADMIN ${adminMult}x!)` : '';
  const message = activeWar
    ? boost.bonusPct > 0
      ? `+${trophiesAdded} Coppe al Club${adminTag}! Potenziamento ${boost.tier} (+${boost.bonusPct}%) attivo: +${warPointsAdded} Coppe Guerra!`
      : `+${trophiesAdded} Coppe al Club${adminTag} e +${warPointsAdded} Coppe Guerra!`
    : `+${trophiesAdded} Coppe inviate al tuo Club${adminTag}! Accumulale per potenziare le Guerre!`;

  res.json({
    war: activeWar || null,
    club,
    trophiesAdded,
    totalTrophies: club.trophies,
    pointsAdded: warPointsAdded,
    boostMultiplier: boost.multiplier,
    boostTier: boost.tier,
    adminMultiplier: adminMult,
    message,
  });
});

// =========================================================================
// ADMIN SYSTEM (Secret Code: 241017) — Global Powers, Custom Messages, Live Polls
// =========================================================================
const ADMIN_SECRET_CODE = '241017';

type ServerAdminVoteEffect =
  | 'none'
  | 'trophy_2x'
  | 'trophy_5x'
  | 'trophy_10x'
  | 'slow_bots'
  | 'freeze_bots'
  | 'super_speed'
  | 'infinite_energy'
  | 'super_shot'
  | 'low_gravity'
  | 'giant_ball'
  | 'zero_cooldown';

interface ServerAdminPowers {
  trophyMultiplier: 1 | 2 | 5 | 10;
  slowBots: boolean;
  freezeBots: boolean;
  superSpeedPlayers: boolean;
  infiniteEnergy: boolean;
  superPowerShot: boolean;
  lowGravity: boolean;
  giantBall: boolean;
  zeroCooldown: boolean;
}

interface ServerAdminAnnouncement {
  id: string;
  title: string;
  message: string;
  theme: 'gold' | 'epic' | 'alert' | 'party';
  authorName: string;
  createdAt: number;
}

interface ServerAdminVoteOption {
  id: string;
  label: string;
  effect: ServerAdminVoteEffect;
  votes: number;
}

interface ServerAdminVote {
  id: string;
  question: string;
  authorName: string;
  options: ServerAdminVoteOption[];
  voters: Record<string, string>;
  createdAt: number;
  endsAt: number;
  status: 'active' | 'finished';
  winnerOptionId: string | null;
  winnerLabel: string | null;
  appliedEffectLabel: string | null;
}

const DEFAULT_ADMIN_POWERS: ServerAdminPowers = {
  trophyMultiplier: 1,
  slowBots: false,
  freezeBots: false,
  superSpeedPlayers: false,
  infiniteEnergy: false,
  superPowerShot: false,
  lowGravity: false,
  giantBall: false,
  zeroCooldown: false,
};

const adminState: {
  powers: ServerAdminPowers;
  announcement: ServerAdminAnnouncement | null;
  activeVote: ServerAdminVote | null;
  lastVoteResult: ServerAdminVote | null;
} = {
  powers: { ...DEFAULT_ADMIN_POWERS },
  announcement: null,
  activeVote: null,
  lastVoteResult: null,
};

let activeVoteTimeout: NodeJS.Timeout | null = null;

function isValidAdminCode(code: unknown): boolean {
  return String(code ?? '').trim() === ADMIN_SECRET_CODE;
}

function getPublicAdminState() {
  return {
    powers: { ...adminState.powers },
    announcement: adminState.announcement ? { ...adminState.announcement } : null,
    activeVote: adminState.activeVote
      ? {
          ...adminState.activeVote,
          options: adminState.activeVote.options.map((o) => ({ ...o })),
          voters: { ...adminState.activeVote.voters },
        }
      : null,
    lastVoteResult: adminState.lastVoteResult
      ? {
          ...adminState.lastVoteResult,
          options: adminState.lastVoteResult.options.map((o) => ({ ...o })),
          voters: { ...adminState.lastVoteResult.voters },
        }
      : null,
    serverNow: Date.now(),
  };
}

function broadcastAdminState() {
  const payload = JSON.stringify({
    type: 'admin_state_sync',
    state: getPublicAdminState(),
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function applyVoteEffectToPowers(effect: ServerAdminVoteEffect): string | null {
  switch (effect) {
    case 'trophy_2x':
      adminState.powers.trophyMultiplier = 2;
      return '2x Coppe attivato per tutti!';
    case 'trophy_5x':
      adminState.powers.trophyMultiplier = 5;
      return '5x Coppe attivato per tutti!';
    case 'trophy_10x':
      adminState.powers.trophyMultiplier = 10;
      return '10x Coppe attivato per tutti!';
    case 'slow_bots':
      adminState.powers.slowBots = true;
      adminState.powers.freezeBots = false;
      return 'Bot Lenti attivato!';
    case 'freeze_bots':
      adminState.powers.freezeBots = true;
      adminState.powers.slowBots = false;
      return 'Bot Congelati attivato!';
    case 'super_speed':
      adminState.powers.superSpeedPlayers = true;
      return 'Super Velocità attivata per tutti i giocatori!';
    case 'infinite_energy':
      adminState.powers.infiniteEnergy = true;
      return 'Energia Infinita attivata per tutti!';
    case 'super_shot':
      adminState.powers.superPowerShot = true;
      return 'Super Tiro 2x attivato per tutti!';
    case 'low_gravity':
      adminState.powers.lowGravity = true;
      return 'Gravità Lunare attivata!';
    case 'giant_ball':
      adminState.powers.giantBall = true;
      return 'Pallone Gigante attivato!';
    case 'zero_cooldown':
      adminState.powers.zeroCooldown = true;
      return 'Zero Cooldown Mosse attivato!';
    default:
      return null;
  }
}

function finalizeActiveVote() {
  if (activeVoteTimeout) {
    clearTimeout(activeVoteTimeout);
    activeVoteTimeout = null;
  }
  const vote = adminState.activeVote;
  if (!vote || vote.status !== 'active') return;

  // Tally votes cleanly from authoritative voters map
  const tally = new Map<string, number>();
  vote.options.forEach((o) => tally.set(o.id, 0));
  Object.values(vote.voters).forEach((optId) => {
    if (tally.has(optId)) {
      tally.set(optId, (tally.get(optId) || 0) + 1);
    }
  });
  vote.options.forEach((o) => {
    o.votes = tally.get(o.id) || 0;
  });

  // Highest vote wins (first option breaks ties)
  let winner = vote.options[0];
  for (const opt of vote.options) {
    if (opt.votes > winner.votes) {
      winner = opt;
    }
  }

  vote.status = 'finished';
  vote.endsAt = Date.now();
  vote.winnerOptionId = winner ? winner.id : null;
  vote.winnerLabel = winner ? winner.label : null;
  vote.appliedEffectLabel = winner ? applyVoteEffectToPowers(winner.effect) : null;

  adminState.lastVoteResult = {
    ...vote,
    options: vote.options.map((o) => ({ ...o })),
    voters: { ...vote.voters },
  };
  adminState.activeVote = null;

  broadcastAdminState();
}

app.get('/api/admin/state', (_req, res) => {
  if (adminState.activeVote && Date.now() >= adminState.activeVote.endsAt) {
    finalizeActiveVote();
  }
  res.json({ state: getPublicAdminState() });
});

app.post('/api/admin/verify', (req, res) => {
  const { code } = req.body || {};
  if (!isValidAdminCode(code)) {
    res.status(403).json({ ok: false, error: 'Codice Admin errato! Riprova.' });
    return;
  }
  res.json({ ok: true, state: getPublicAdminState() });
});

app.post('/api/admin/powers', (req, res) => {
  const { code, powers, reset } = req.body || {};
  if (!isValidAdminCode(code)) {
    res.status(403).json({ error: 'Accesso Admin non autorizzato.' });
    return;
  }

  if (reset) {
    adminState.powers = { ...DEFAULT_ADMIN_POWERS };
  } else if (powers && typeof powers === 'object') {
    const p = powers as Partial<ServerAdminPowers>;
    if (p.trophyMultiplier === 1 || p.trophyMultiplier === 2 || p.trophyMultiplier === 5 || p.trophyMultiplier === 10) {
      adminState.powers.trophyMultiplier = p.trophyMultiplier;
    }
    if (typeof p.slowBots === 'boolean') {
      adminState.powers.slowBots = p.slowBots;
      if (p.slowBots) adminState.powers.freezeBots = false;
    }
    if (typeof p.freezeBots === 'boolean') {
      adminState.powers.freezeBots = p.freezeBots;
      if (p.freezeBots) adminState.powers.slowBots = false;
    }
    if (typeof p.superSpeedPlayers === 'boolean') adminState.powers.superSpeedPlayers = p.superSpeedPlayers;
    if (typeof p.infiniteEnergy === 'boolean') adminState.powers.infiniteEnergy = p.infiniteEnergy;
    if (typeof p.superPowerShot === 'boolean') adminState.powers.superPowerShot = p.superPowerShot;
    if (typeof p.lowGravity === 'boolean') adminState.powers.lowGravity = p.lowGravity;
    if (typeof p.giantBall === 'boolean') adminState.powers.giantBall = p.giantBall;
    if (typeof p.zeroCooldown === 'boolean') adminState.powers.zeroCooldown = p.zeroCooldown;
  }

  broadcastAdminState();
  res.json({ ok: true, state: getPublicAdminState() });
});

app.post('/api/admin/announce', (req, res) => {
  const { code, title, message, theme, authorName, clear } = req.body || {};
  if (!isValidAdminCode(code)) {
    res.status(403).json({ error: 'Accesso Admin non autorizzato.' });
    return;
  }

  if (clear) {
    adminState.announcement = null;
    broadcastAdminState();
    res.json({ ok: true, state: getPublicAdminState() });
    return;
  }

  const cleanMsg = String(message || '').trim().slice(0, 220);
  if (!cleanMsg) {
    res.status(400).json({ error: 'Scrivi un messaggio personalizzato prima di inviare.' });
    return;
  }
  const cleanTitle = String(title || 'ANNUNCIO ADMIN').trim().slice(0, 48) || 'ANNUNCIO ADMIN';
  const validThemes = ['gold', 'epic', 'alert', 'party'] as const;
  const resolvedTheme = validThemes.includes(theme) ? theme : 'gold';

  adminState.announcement = {
    id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: cleanTitle,
    message: cleanMsg,
    theme: resolvedTheme,
    authorName: String(authorName || 'Admin').trim().slice(0, 24) || 'Admin',
    createdAt: Date.now(),
  };

  broadcastAdminState();
  res.json({ ok: true, state: getPublicAdminState() });
});

app.post('/api/admin/votes', (req, res) => {
  const { code, question, options, durationSec, authorName } = req.body || {};
  if (!isValidAdminCode(code)) {
    res.status(403).json({ error: 'Accesso Admin non autorizzato.' });
    return;
  }

  const cleanQuestion = String(question || '').trim().slice(0, 100);
  if (!cleanQuestion) {
    res.status(400).json({ error: 'Inserisci una domanda per il voto.' });
    return;
  }

  const rawOptions = Array.isArray(options) ? options : [];
  const validEffects = new Set<ServerAdminVoteEffect>([
    'none',
    'trophy_2x',
    'trophy_5x',
    'trophy_10x',
    'slow_bots',
    'freeze_bots',
    'super_speed',
    'infinite_energy',
    'super_shot',
    'low_gravity',
    'giant_ball',
    'zero_cooldown',
  ]);

  const parsedOptions: ServerAdminVoteOption[] = rawOptions
    .slice(0, 4)
    .map((o: { label?: string; effect?: string }, idx: number) => ({
      id: `opt_${idx + 1}`,
      label: String(o?.label || '').trim().slice(0, 44),
      effect: validEffects.has(o?.effect as ServerAdminVoteEffect)
        ? (o.effect as ServerAdminVoteEffect)
        : 'none',
      votes: 0,
    }))
    .filter((o) => o.label.length > 0);

  if (parsedOptions.length < 2) {
    res.status(400).json({ error: 'Servono almeno 2 opzioni valide per avviare un voto.' });
    return;
  }

  if (activeVoteTimeout) {
    clearTimeout(activeVoteTimeout);
    activeVoteTimeout = null;
  }

  const dur = Math.max(10, Math.min(120, Math.round(Number(durationSec) || 25)));
  const now = Date.now();

  adminState.activeVote = {
    id: `vote_${now}_${Math.random().toString(36).substring(2, 6)}`,
    question: cleanQuestion,
    authorName: String(authorName || 'Admin').trim().slice(0, 24) || 'Admin',
    options: parsedOptions,
    voters: {},
    createdAt: now,
    endsAt: now + dur * 1000,
    status: 'active',
    winnerOptionId: null,
    winnerLabel: null,
    appliedEffectLabel: null,
  };

  activeVoteTimeout = setTimeout(() => {
    finalizeActiveVote();
  }, dur * 1000 + 80);

  broadcastAdminState();
  res.json({ ok: true, state: getPublicAdminState() });
});

app.post('/api/admin/votes/:voteId/cast', (req, res) => {
  const { voteId } = req.params;
  const { playerId: voterId, optionId } = req.body || {};

  if (adminState.activeVote && Date.now() >= adminState.activeVote.endsAt) {
    finalizeActiveVote();
  }

  const vote = adminState.activeVote;
  if (!vote || vote.id !== voteId || vote.status !== 'active') {
    res.status(404).json({ error: 'Questo voto non è più attivo.' });
    return;
  }

  const cleanVoter = String(voterId || '').trim();
  const validOpt = vote.options.find((o) => o.id === optionId);
  if (!cleanVoter || !validOpt) {
    res.status(400).json({ error: 'Opzione di voto non valida.' });
    return;
  }

  // Idempotent per player: changing vote updates counts accurately without double-counting
  vote.voters[cleanVoter] = validOpt.id;
  const tally = new Map<string, number>();
  vote.options.forEach((o) => tally.set(o.id, 0));
  Object.values(vote.voters).forEach((chosen) => {
    if (tally.has(chosen)) tally.set(chosen, (tally.get(chosen) || 0) + 1);
  });
  vote.options.forEach((o) => {
    o.votes = tally.get(o.id) || 0;
  });

  broadcastAdminState();
  res.json({ ok: true, state: getPublicAdminState() });
});

app.post('/api/admin/votes/:voteId/close', (req, res) => {
  const { code } = req.body || {};
  if (!isValidAdminCode(code)) {
    res.status(403).json({ error: 'Accesso Admin non autorizzato.' });
    return;
  }
  finalizeActiveVote();
  res.json({ ok: true, state: getPublicAdminState() });
});

app.post('/api/admin/gift-trophies', (req, res) => {
  const { code, clubId, amount } = req.body || {};
  if (!isValidAdminCode(code)) {
    res.status(403).json({ error: 'Accesso Admin non autorizzato.' });
    return;
  }
  const club = store.clubs.find((c) => c.id === clubId);
  if (!club) {
    res.status(404).json({ error: 'Club non trovato.' });
    return;
  }
  const gift = Math.max(10, Math.min(5000, Math.round(Number(amount) || 250)));
  club.trophies = (club.trophies || 0) + gift;
  club.rankScore = (club.rankScore || 0) + gift;
  saveStore();
  res.json({ ok: true, club, message: `Regalate +${gift} Coppe al club "${club.name}"!` });
});

// REST API for public rooms (10v10 -> max 20 players)
app.get('/api/rooms', (_req, res) => {
  const publicRooms = Array.from(rooms.values())
    .filter((r) => r.isPublic && r.state !== 'ended')
    .map((r) => ({
      code: r.code,
      name: r.name,
      map: r.map,
      playerCount: r.players.size,
      maxPlayers: 20,
      state: r.state,
    }));
  res.json({ rooms: publicRooms });
});

// WebSocket real-time handling
wss.on('connection', (socket: WebSocket) => {
  let currentRoom: Room | null = null;
  let playerId: string | null = null;

  // Push current global Admin state (powers, announcement, live vote) immediately upon connect
  if (adminState.activeVote && Date.now() >= adminState.activeVote.endsAt) {
    finalizeActiveVote();
  }
  socket.send(
    JSON.stringify({
      type: 'admin_state_sync',
      state: getPublicAdminState(),
    })
  );

  socket.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'create_room': {
          let code = generateRoomCode();
          while (rooms.has(code)) {
            code = generateRoomCode();
          }

          const pid: string = String(msg.playerId || '') || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          playerId = pid;
          const playerName = msg.playerName || 'Giocatore 1';
          const mapChoice = msg.map || 'stadium';

          const newRoom: Room = {
            code,
            name: msg.roomName || `Stanza di ${playerName}`,
            hostId: pid,
            isPublic: msg.isPublic ?? true,
            map: mapChoice,
            players: new Map(),
            sockets: new Map(),
            ball: { x: 0, y: 0.6, z: 0, vx: 0, vy: 0, vz: 0 },
            scores: { red: 0, blue: 0 },
            scoreLog: [],
            state: 'waiting',
            goalTimer: 0,
            matchTimer: 180,
            lastBallOwner: null,
          };

          const hostPlayer: PlayerData = {
            id: pid,
            name: playerName,
            team: 'red',
            x: -8,
            y: 0,
            z: 0,
            rotY: Math.PI / 2,
            anim: 'idle',
            isHost: true,
          };

          newRoom.players.set(pid, hostPlayer);
          newRoom.sockets.set(pid, socket);
          rooms.set(code, newRoom);
          currentRoom = newRoom;

          socket.send(
            JSON.stringify({
              type: 'room_joined',
              room: {
                code: newRoom.code,
                name: newRoom.name,
                map: newRoom.map,
                hostId: newRoom.hostId,
                isHost: true,
                scores: newRoom.scores,
                players: Array.from(newRoom.players.values()),
                state: newRoom.state,
                matchTimer: newRoom.matchTimer,
              },
              selfId: pid,
            })
          );
          break;
        }

        case 'join_room': {
          const targetCode = String(msg.code || '').trim().toUpperCase();
          const room = rooms.get(targetCode);

          if (!room) {
            socket.send(JSON.stringify({ type: 'error', message: 'Stanza non trovata! Verifica il codice.' }));
            return;
          }

          if (room.players.size >= 20) {
            socket.send(JSON.stringify({ type: 'error', message: 'Stanza piena (max 20 giocatori: 10 vs 10).' }));
            return;
          }

          const pid: string = String(msg.playerId || '') || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          playerId = pid;
          const playerName = msg.playerName || `Giocatore ${room.players.size + 1}`;

          // Assign balanced team up to 10 Red vs 10 Blue
          const redCount = Array.from(room.players.values()).filter((p) => p.team === 'red').length;
          const blueCount = Array.from(room.players.values()).filter((p) => p.team === 'blue').length;
          const assignedTeam: 'red' | 'blue' = redCount < 10 && (redCount <= blueCount || blueCount >= 10) ? 'red' : 'blue';
          const slotIdx = assignedTeam === 'red' ? redCount : blueCount;

          // Tactical 10-player formation slots per half (FWD, MID, DEF, GK)
          const formationOffsets: Array<[number, number]> = [
            [8, 0],
            [10, -8],
            [10, 8],
            [16, -12],
            [16, 0],
            [16, 12],
            [23, -10],
            [23, 0],
            [23, 10],
            [30, 0],
          ];
          const [distFromCenter, slotZ] = formationOffsets[slotIdx % formationOffsets.length];
          const spawnX = assignedTeam === 'red' ? -distFromCenter : distFromCenter;
          const spawnRot = assignedTeam === 'red' ? Math.PI / 2 : -Math.PI / 2;

          const newPlayer: PlayerData = {
            id: pid,
            name: playerName,
            team: assignedTeam,
            x: spawnX,
            y: 0,
            z: slotZ,
            rotY: spawnRot,
            anim: 'idle',
            isHost: false,
          };

          room.players.set(pid, newPlayer);
          room.sockets.set(pid, socket);
          currentRoom = room;

          // If 2+ players and waiting, auto start match
          if (room.state === 'waiting' && room.players.size >= 2) {
            room.state = 'playing';
          }

          socket.send(
            JSON.stringify({
              type: 'room_joined',
              room: {
                code: room.code,
                name: room.name,
                map: room.map,
                hostId: room.hostId,
                isHost: room.hostId === pid,
                scores: room.scores,
                players: Array.from(room.players.values()),
                state: room.state,
                matchTimer: room.matchTimer,
              },
              selfId: pid,
            })
          );

          broadcastToRoom(
            room,
            {
              type: 'player_joined',
              player: newPlayer,
              state: room.state,
            },
            socket
          );
          break;
        }

        case 'player_update': {
          if (!currentRoom || !playerId) return;
          const player = currentRoom.players.get(playerId);
          if (player) {
            player.x = msg.x ?? player.x;
            player.y = msg.y ?? player.y;
            player.z = msg.z ?? player.z;
            player.rotY = msg.rotY ?? player.rotY;
            player.anim = msg.anim ?? player.anim;

            broadcastToRoom(
              currentRoom,
              {
                type: 'player_moved',
                playerId,
                x: player.x,
                y: player.y,
                z: player.z,
                rotY: player.rotY,
                anim: player.anim,
              },
              socket
            );
          }
          break;
        }

        case 'ball_update': {
          if (!currentRoom) return;
          currentRoom.ball.x = msg.x;
          currentRoom.ball.y = msg.y;
          currentRoom.ball.z = msg.z;
          currentRoom.ball.vx = msg.vx;
          currentRoom.ball.vy = msg.vy;
          currentRoom.ball.vz = msg.vz;

          broadcastToRoom(
            currentRoom,
            {
              type: 'ball_sync',
              x: msg.x,
              y: msg.y,
              z: msg.z,
              vx: msg.vx,
              vy: msg.vy,
              vz: msg.vz,
            },
            socket
          );
          break;
        }

        case 'trigger_goal': {
          if (!currentRoom || currentRoom.state === 'goal_scored') return;
          const scoringTeam: 'red' | 'blue' = msg.team;
          const otherTeam: 'red' | 'blue' = scoringTeam === 'red' ? 'blue' : 'red';

          const currentTeamScore = currentRoom.scores[scoringTeam];
          const otherTeamScore = currentRoom.scores[otherTeam];

          // Compute unpredictable random roll
          const { newScore, note } = rollChaosScore(currentTeamScore, otherTeamScore);
          const prevScore = currentTeamScore;
          currentRoom.scores[scoringTeam] = newScore;
          currentRoom.state = 'goal_scored';

          const scoreEntry = {
            team: scoringTeam,
            points: newScore,
            prevScore,
            newScore,
            note,
            timestamp: Date.now(),
          };
          currentRoom.scoreLog.push(scoreEntry);

          broadcastToRoom(currentRoom, {
            type: 'goal_celebration',
            scoringTeam,
            scorerName: msg.scorerName || 'Giocatore',
            prevScore,
            newScore,
            note,
            scores: currentRoom.scores,
          });

          // Reset after celebration
          setTimeout(() => {
            if (!currentRoom) return;
            currentRoom.state = 'playing';
            currentRoom.ball = { x: 0, y: 0.6, z: 0, vx: 0, vy: 0, vz: 0 };

            broadcastToRoom(currentRoom, {
              type: 'kickoff_reset',
              ball: currentRoom.ball,
              scores: currentRoom.scores,
            });
          }, 4500);
          break;
        }

        case 'voice_signal': {
          if (!currentRoom) return;
          // Forward WebRTC SDP / ICE signals between peer players
          const targetSocket = currentRoom.sockets.get(msg.targetId);
          if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
            targetSocket.send(
              JSON.stringify({
                type: 'voice_signal',
                fromId: playerId,
                signal: msg.signal,
              })
            );
          }
          break;
        }

        case 'voice_speaking': {
          if (!currentRoom || !playerId) return;
          const player = currentRoom.players.get(playerId);
          if (player) {
            player.isTalking = Boolean(msg.isTalking);
            broadcastToRoom(
              currentRoom,
              {
                type: 'voice_speaking',
                playerId,
                isTalking: player.isTalking,
              },
              socket
            );
          }
          break;
        }

        case 'quick_chat': {
          if (!currentRoom || !playerId) return;
          broadcastToRoom(currentRoom, {
            type: 'quick_chat',
            playerId,
            playerName: msg.playerName || 'Giocatore',
            text: msg.text,
          });
          break;
        }

        case 'subscribe_club_chat': {
          const targetClubId = String(msg.clubId || '');
          const subscriberId = String(msg.playerId || '');
          unsubscribeSocketFromAllClubChats(socket);
          const club = store.clubs.find((c) => c.id === targetClubId);
          if (club && club.members.some((m) => m.playerId === subscriberId)) {
            subscribeSocketToClubChat(club.id, socket);
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  type: 'club_chat_history',
                  clubId: club.id,
                  messages: club.chatMessages || [],
                })
              );
            }
          }
          break;
        }

        case 'leave_room': {
          handleDisconnect();
          break;
        }
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });

  const handleDisconnect = () => {
    unsubscribeSocketFromAllClubChats(socket);
    if (currentRoom && playerId) {
      currentRoom.players.delete(playerId);
      currentRoom.sockets.delete(playerId);

      if (currentRoom.players.size === 0) {
        rooms.delete(currentRoom.code);
      } else {
        // If host disconnected, transfer host to next player
        if (currentRoom.hostId === playerId) {
          const nextHost = currentRoom.players.values().next().value;
          if (nextHost) {
            currentRoom.hostId = nextHost.id;
            nextHost.isHost = true;
          }
        }

        broadcastToRoom(currentRoom, {
          type: 'player_left',
          playerId,
          newHostId: currentRoom.hostId,
        });
      }
      currentRoom = null;
      playerId = null;
    }
  };

  socket.on('close', handleDisconnect);
  socket.on('error', handleDisconnect);
});

// Vite middleware in dev or static serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Dev server must always bind to port 3000 as required by the AI Studio environment
  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Chaos Goal 3D Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
