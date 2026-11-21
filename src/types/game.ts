export type MapId =
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

export type BotDifficulty =
  | 'principiante'
  | 'dilettante'
  | 'esperto'
  | 'campione'
  | 'leggenda'
  | 'impossibile';

export type PlayerAnim =
  | 'idle'
  | 'run'
  | 'kick'
  | 'slide'
  | 'skill'
  | 'lob'
  | 'power'
  | 'bicycle';

export interface MapConfig {
  id: MapId;
  name: string;
  theme: string;
  description: string;
  accentHex: string;
  skyColor: number;
  pitchColor: number;
  pitchStripeColor: number;
  ambientLight: number;
  keyLight: number;
  bounceMultiplier: number;
  frictionMultiplier: number;
  gravityMultiplier?: number;
  playerSpeedMultiplier: number;
  traction: number; // 0.16 (icy drift) to 1.0 (crisp pro turf grip)
  staminaDrainMultiplier: number;
  windStrength?: number; // Lateral gust acceleration pushing ball & players
  hasMovementEffect?: boolean;
  movementLabel: string;
  specialEffect?:
    | 'confetti'
    | 'bubbles'
    | 'dust'
    | 'lasers'
    | 'snow'
    | 'embers'
    | 'city'
    | 'stars'
    | 'ice'
    | 'fireflies'
    | 'wind'
    | 'turbo';
}

export interface PlayerState {
  id: string;
  name: string;
  team: 'red' | 'blue';
  x: number;
  y: number;
  z: number;
  rotY: number;
  anim: PlayerAnim;
  isHost: boolean;
  isBot?: boolean;
  isTalking?: boolean;
  clubName?: string;
  energy?: number;
  fatigue?: number; // 0 (fresh) to 100 (exhausted) cumulative match fatigue
  yellowCards?: number;
  isExpelled?: boolean;
  stunTimer?: number;
  jerseyNumber?: number;
  aiRole?: 'gk' | 'def' | 'mid' | 'fwd';
}

export interface SquadReserve {
  id: string;
  name: string;
  role: 'gk' | 'def' | 'mid' | 'fwd';
  jerseyNumber: number;
  fatigue: number;
  yellowCards: number;
  isExpelled?: boolean;
}

export interface RefereeDecisionEvent {
  id: string;
  playerName: string;
  team: 'red' | 'blue';
  card: 'none' | 'yellow' | 'red';
  reason: string;
  secondYellow?: boolean;
}

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isSuperShot?: boolean;
}

export interface GoalEventData {
  scoringTeam: 'red' | 'blue';
  scorerName: string;
  prevScore: number;
  newScore: number;
  note: string;
  scores: { red: number; blue: number };
}

export interface RoomMeta {
  code: string;
  name: string;
  map: MapId;
  hostId: string;
  isHost: boolean;
  scores: { red: number; blue: number };
  players: PlayerState[];
  state: 'waiting' | 'playing' | 'goal_scored' | 'ended';
  matchTimer: number;
}

export interface InputState {
  moveX: number; // -1 to 1
  moveZ: number; // -1 to 1
  rotateX: number; // camera horizontal rotation delta
  isKicking: boolean;
  isPassing: boolean;
  isSprinting: boolean;
  isTackling: boolean;
  isLobbing: boolean;
  isPowerShooting: boolean;
  isSkillMoving: boolean;
  isBicycleKicking: boolean;
}

export interface WarAwardInfo {
  clubName: string;
  trophiesAdded: number;
  totalTrophies: number;
  pointsAdded: number;
  boostMultiplier: number;
  boostTier: string;
  message: string;
}

// Club System Types
export type ClubAccessType = 'aperto' | 'solo_invito' | 'chiuso';

export type ClubRole =
  | 'presidente'
  | 'vicepresidente'
  | 'consigliere'
  | 'socio_saggio'
  | 'socio';

export interface ClubMember {
  playerId: string;
  playerName: string;
  role: ClubRole;
  joinedAt: number;
}

export interface ClubInvite {
  id: string;
  playerId: string;
  playerName: string;
  type: 'request_to_join' | 'invited_by_club';
  invitedByName?: string;
  message?: string;
  createdAt: number;
}

export interface ClubAdvice {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface ClubChatMessage {
  id: string;
  clubId: string;
  authorId: string;
  authorName: string;
  authorRole: ClubRole;
  text: string;
  createdAt: number;
}

export interface ClubWar {
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

export interface Club {
  id: string;
  name: string; // 1 to 50 chars (including spaces)
  cityOrCountry?: string; // Paese o città della squadra (es. Palermo, São Paulo, Italia...)
  accessType: ClubAccessType;
  maxMembers: number;
  createdAt: number;
  members: ClubMember[];
  invites: ClubInvite[]; // Pending invites / join requests visible to Fondatore & Semifondatore
  adviceList: ClubAdvice[]; // Advice notes from Aiutante to Fondatore
  chatMessages?: ClubChatMessage[]; // Live club chat messages (text & emoji)
  trophies?: number;
  warWins?: number;
  warLosses?: number;
  warPointsTotal?: number;
  rankScore?: number;
}

// Admin System Types
export type AdminAnnouncementTheme = 'gold' | 'epic' | 'alert' | 'party';

export type AdminVoteEffect =
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

export interface AdminPowers {
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

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  theme: AdminAnnouncementTheme;
  authorName: string;
  createdAt: number;
}

export interface AdminVoteOption {
  id: string;
  label: string;
  effect: AdminVoteEffect;
  votes: number;
}

export interface AdminVote {
  id: string;
  question: string;
  authorName: string;
  options: AdminVoteOption[];
  voters: Record<string, string>;
  createdAt: number;
  endsAt: number;
  status: 'active' | 'finished';
  winnerOptionId: string | null;
  winnerLabel: string | null;
  appliedEffectLabel: string | null;
}

export interface AdminState {
  powers: AdminPowers;
  announcement: AdminAnnouncement | null;
  activeVote: AdminVote | null;
  lastVoteResult: AdminVote | null;
  serverNow: number;
}

