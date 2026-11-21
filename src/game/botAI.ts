import { BallState, BotDifficulty, PlayerState } from '../types/game';
import { PITCH_LENGTH, PITCH_WIDTH, GOAL_WIDTH } from './stadiums';
import { MoveKickType } from './physics';

export type BotRole = 'gk' | 'def' | 'mid' | 'fwd';

export interface BotActionOutput {
  isKicking: boolean;
  isPassing: boolean;
  isSprinting: boolean;
  isTackling: boolean;
  moveType?: MoveKickType;
  aimRotY?: number;
  shotPowerScale?: number;
  dribbleSpeed?: number;
  accuracyJitter?: number;
  passTargetName?: string;
  tacticalMode: 'save' | 'defend' | 'clear' | 'wrap' | 'dribble' | 'shoot' | 'slide' | 'intercept' | 'support' | 'pass';
}

export interface DifficultyProfile {
  id: BotDifficulty;
  label: string;
  shortLabel: string;
  tagline: string;
  jogSpeed: number;
  sprintSpeed: number;
  slideSpeed: number;
  accel: number;
  turnRate: number;
  predictHorizon: number;
  shootRange: number;
  shootCooldown: number;
  shotPowerScale: number;
  accuracyJitter: number;
  tackleCooldown: number;
  tackleChance: number;
  jukeStrength: number;
  saveReactionSpeed: number;
  passCooldown: number;
  specialMoveChance: number;
}

export const BOT_DIFFICULTY_PROFILES: Record<BotDifficulty, DifficultyProfile> = {
  principiante: {
    id: 'principiante',
    label: 'Principiante',
    shortLabel: 'Principiante',
    tagline: 'Ritmo lento, tiri morbidi',
    jogSpeed: 6.2,
    sprintSpeed: 8.6,
    slideSpeed: 13.8,
    accel: 18,
    turnRate: 7.2,
    predictHorizon: 0.2,
    shootRange: 21,
    shootCooldown: 1.85,
    shotPowerScale: 0.76,
    accuracyJitter: 4.2,
    tackleCooldown: 5.5,
    tackleChance: 0.12,
    jukeStrength: 0.4,
    saveReactionSpeed: 0.68,
    passCooldown: 1.75,
    specialMoveChance: 0.0,
  },
  dilettante: {
    id: 'dilettante',
    label: 'Dilettante',
    shortLabel: 'Dilettante',
    tagline: 'Sfida accessibile',
    jogSpeed: 7.3,
    sprintSpeed: 10.1,
    slideSpeed: 15.8,
    accel: 24,
    turnRate: 9.2,
    predictHorizon: 0.34,
    shootRange: 25,
    shootCooldown: 1.4,
    shotPowerScale: 0.87,
    accuracyJitter: 2.9,
    tackleCooldown: 4.0,
    tackleChance: 0.25,
    jukeStrength: 0.65,
    saveReactionSpeed: 0.82,
    passCooldown: 1.35,
    specialMoveChance: 0.05,
  },
  esperto: {
    id: 'esperto',
    label: 'Professionista',
    shortLabel: 'Pro',
    tagline: 'Equilibrato e tattico',
    jogSpeed: 8.4,
    sprintSpeed: 11.7,
    slideSpeed: 18.2,
    accel: 32,
    turnRate: 12.8,
    predictHorizon: 0.54,
    shootRange: 31,
    shootCooldown: 0.96,
    shotPowerScale: 0.98,
    accuracyJitter: 1.5,
    tackleCooldown: 2.8,
    tackleChance: 0.52,
    jukeStrength: 0.95,
    saveReactionSpeed: 0.96,
    passCooldown: 1.08,
    specialMoveChance: 0.14,
  },
  campione: {
    id: 'campione',
    label: 'Campione',
    shortLabel: 'Campione',
    tagline: 'Finte, pallonetti e pressing',
    jogSpeed: 8.9,
    sprintSpeed: 12.4,
    slideSpeed: 19.6,
    accel: 38,
    turnRate: 15.0,
    predictHorizon: 0.66,
    shootRange: 35,
    shootCooldown: 0.8,
    shotPowerScale: 1.04,
    accuracyJitter: 1.0,
    tackleCooldown: 2.3,
    tackleChance: 0.68,
    jukeStrength: 1.12,
    saveReactionSpeed: 1.05,
    passCooldown: 0.92,
    specialMoveChance: 0.26,
  },
  leggenda: {
    id: 'leggenda',
    label: 'Leggenda',
    shortLabel: 'Leggenda',
    tagline: 'Precisione letale',
    jogSpeed: 9.4,
    sprintSpeed: 13.0,
    slideSpeed: 20.6,
    accel: 44,
    turnRate: 17.0,
    predictHorizon: 0.78,
    shootRange: 38,
    shootCooldown: 0.65,
    shotPowerScale: 1.1,
    accuracyJitter: 0.62,
    tackleCooldown: 1.9,
    tackleChance: 0.8,
    jukeStrength: 1.24,
    saveReactionSpeed: 1.14,
    passCooldown: 0.78,
    specialMoveChance: 0.36,
  },
  impossibile: {
    id: 'impossibile',
    label: 'Impossibile',
    shortLabel: 'Divino',
    tagline: 'IA estrema + Super Tiri',
    jogSpeed: 10.1,
    sprintSpeed: 13.9,
    slideSpeed: 22.0,
    accel: 52,
    turnRate: 20.0,
    predictHorizon: 0.9,
    shootRange: 42,
    shootCooldown: 0.52,
    shotPowerScale: 1.16,
    accuracyJitter: 0.32,
    tackleCooldown: 1.55,
    tackleChance: 0.9,
    jukeStrength: 1.38,
    saveReactionSpeed: 1.25,
    passCooldown: 0.65,
    specialMoveChance: 0.5,
  },
};

function lerpAngle(current: number, target: number, t: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * Math.min(1, t);
}

export interface BotSpawnConfig {
  id: string;
  name: string;
  team: 'red' | 'blue';
  role: BotRole;
  difficulty: BotDifficulty;
  homeX: number;
  homeZ: number;
  jerseyNumber: number;
}

export class BotAI {
  public state: PlayerState;
  public difficulty: BotDifficulty;
  public role: BotRole;
  private profile: DifficultyProfile;

  private homeX: number;
  private homeZ: number;

  private shootCooldown: number = 0;
  private passCooldown: number = 0;
  private tackleCooldown: number = 0;
  private slideActiveTimer: number = 0;
  private slideDirX: number = -1;
  private slideDirZ: number = 0;
  private stunTimer: number = 0;

  private vx: number = 0;
  private vz: number = 0;
  private energy: number = 100;
  private sprintExhausted: boolean = false;

  private targetGoalX: number; // Opponent's goal
  private ownGoalX: number;    // Bot's own goal
  private attackDir: number;   // -1 for blue (attacks -X), +1 for red (attacks +X)

  private clock: number = Math.random() * 10;
  private jukeSide: number = Math.random() > 0.5 ? 1 : -1;
  private jukeLockTimer: number = 0;

  constructor(configOrId: BotSpawnConfig | string = 'bot_champion', team: 'blue' | 'red' = 'blue', difficulty: BotDifficulty = 'esperto') {
    let cfg: BotSpawnConfig;
    const safeProfile = BOT_DIFFICULTY_PROFILES[difficulty] || BOT_DIFFICULTY_PROFILES.esperto;
    if (typeof configOrId === 'string') {
      cfg = {
        id: configOrId,
        name: `Bot ${safeProfile.label}`,
        team,
        role: 'fwd',
        difficulty,
        homeX: team === 'blue' ? 12 : -12,
        homeZ: 0,
        jerseyNumber: 9,
      };
    } else {
      cfg = configOrId;
    }

    this.difficulty = cfg.difficulty;
    this.role = cfg.role;
    this.profile = BOT_DIFFICULTY_PROFILES[cfg.difficulty] || BOT_DIFFICULTY_PROFILES.esperto;
    this.homeX = cfg.homeX;
    this.homeZ = cfg.homeZ;

    this.targetGoalX = cfg.team === 'blue' ? -PITCH_LENGTH / 2 : PITCH_LENGTH / 2;
    this.ownGoalX = cfg.team === 'blue' ? PITCH_LENGTH / 2 : -PITCH_LENGTH / 2;
    this.attackDir = cfg.team === 'blue' ? -1 : 1;

    this.state = {
      id: cfg.id,
      name: cfg.name,
      team: cfg.team,
      x: cfg.homeX,
      y: 0,
      z: cfg.homeZ,
      rotY: cfg.team === 'blue' ? -Math.PI / 2 : Math.PI / 2,
      anim: 'idle',
      isHost: false,
      isBot: true,
      energy: 100,
      jerseyNumber: cfg.jerseyNumber,
      aiRole: cfg.role,
    };
  }

  public resetForKickoff() {
    this.state.x = this.homeX;
    this.state.y = 0;
    this.state.z = this.homeZ;
    this.state.rotY = this.state.team === 'blue' ? -Math.PI / 2 : Math.PI / 2;
    this.state.anim = 'idle';
    this.vx = 0;
    this.vz = 0;
    this.energy = 100;
    this.sprintExhausted = false;
    this.shootCooldown = 0.25;
    this.passCooldown = 0.3;
    this.tackleCooldown = 0.5;
    this.slideActiveTimer = 0;
    this.stunTimer = 0;
    this.state.energy = 100;
  }

  public applyStun(duration: number = 0.9) {
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.shootCooldown = Math.max(this.shootCooldown, duration);
    this.slideActiveTimer = 0;
    this.vx *= 0.2;
    this.vz *= 0.2;
    this.state.anim = 'idle';
  }

  // Predict future ball position with ground drag & pitch wall bounce reflection
  private predictBallPosition(ball: BallState, lookAheadSec: number): { x: number; z: number } {
    const halfLen = PITCH_LENGTH / 2 - 0.6;
    const halfWid = PITCH_WIDTH / 2 - 0.6;
    const steps = 6;
    const stepDt = lookAheadSec / steps;

    let px = ball.x;
    let pz = ball.z;
    let bvx = ball.vx;
    let bvz = ball.vz;

    for (let i = 0; i < steps; i++) {
      px += bvx * stepDt;
      pz += bvz * stepDt;
      const drag = Math.pow(0.975, stepDt * 60);
      bvx *= drag;
      bvz *= drag;

      if (Math.abs(pz) > halfWid) {
        pz = Math.sign(pz) * halfWid - (pz - Math.sign(pz) * halfWid) * 0.7;
        bvz = -bvz * 0.7;
      }
      if (Math.abs(px) > halfLen && Math.abs(pz) > GOAL_WIDTH / 2) {
        px = Math.sign(px) * halfLen - (px - Math.sign(px) * halfLen) * 0.7;
        bvx = -bvx * 0.7;
      }
    }

    return { x: px, z: pz };
  }

  // Pick the sharpest open corner of the opponent's goal away from the closest opponent near goal
  private chooseOpenGoalCornerZ(opponents: PlayerState[]): number {
    const maxCorner = GOAL_WIDTH / 2 - 1.35;
    let goalieOrDef: PlayerState | null = null;
    let minGoalDist = 24;

    for (const opp of opponents) {
      const d = Math.hypot(opp.x - this.targetGoalX, opp.z);
      if (d < minGoalDist) {
        minGoalDist = d;
        goalieOrDef = opp;
      }
    }

    if (goalieOrDef) {
      const awaySign = goalieOrDef.z >= 0 ? -1 : 1;
      const offset = 2.7 + Math.min(1.8, Math.abs(goalieOrDef.z) * 0.35);
      return awaySign * Math.min(maxCorner, offset);
    }
    return Math.sin(this.clock * 1.35) * (maxCorner * 0.75);
  }

  // Find best open teammate to pass to (strongly favors the human player when open!)
  private findBestPassTarget(teammates: PlayerState[], opponents: PlayerState[]): PlayerState | null {
    let best: PlayerState | null = null;
    let bestScore = -Infinity;

    for (const mate of teammates) {
      if (mate.id === this.state.id || mate.aiRole === 'gk') continue;
      const dist = Math.hypot(mate.x - this.state.x, mate.z - this.state.z);
      if (dist < 6.5 || dist > 32) continue;

      const forwardProgress = (mate.x - this.state.x) * this.attackDir;
      // Don't pass backwards into own box unless clearing
      if (forwardProgress < -6) continue;

      // Measure how closely marked the teammate is
      let nearestOppDist = 30;
      for (const opp of opponents) {
        const od = Math.hypot(opp.x - mate.x, opp.z - mate.z);
        if (od < nearestOppDist) nearestOppDist = od;
      }

      const isHumanBonus = !mate.isBot ? 10.5 : 0;
      const score = forwardProgress * 0.9 + Math.min(12, nearestOppDist) * 1.15 - Math.abs(dist - 15) * 0.35 + isHumanBonus;

      if (score > bestScore && nearestOppDist > 3.2) {
        bestScore = score;
        best = mate;
      }
    }

    return bestScore > 7 ? best : null;
  }

  public update(
    delta: number,
    ball: BallState,
    allPlayersOrOpponent: PlayerState[] | PlayerState,
    adminMods?: { slowBots?: boolean; freezeBots?: boolean },
    mapMods?: { speedMult?: number; traction?: number; windX?: number; windZ?: number; staminaDrainMult?: number }
  ): BotActionOutput {
    const dt = Math.min(delta, 0.06);
    if (adminMods?.freezeBots) {
      this.vx = 0;
      this.vz = 0;
      this.slideActiveTimer = 0;
      this.state.anim = 'idle';
      this.state.energy = Math.round(this.energy);
      return {
        isKicking: false,
        isPassing: false,
        isSprinting: false,
        isTackling: false,
        tacticalMode: 'defend',
      };
    }

    const mapSpeedMult = mapMods?.speedMult ?? 1.0;
    const mapTraction = mapMods?.traction ?? 1.0;
    const mapWindX = mapMods?.windX ?? 0;
    const mapWindZ = mapMods?.windZ ?? 0;
    const mapStaminaDrain = mapMods?.staminaDrainMult ?? 1.0;

    const botSpeedMult = (adminMods?.slowBots ? 0.42 : 1.0) * mapSpeedMult;
    this.clock += dt;
    this.shootCooldown = Math.max(0, this.shootCooldown - dt * (adminMods?.slowBots ? 0.65 : 1));
    this.passCooldown = Math.max(0, this.passCooldown - dt * (adminMods?.slowBots ? 0.65 : 1));
    this.tackleCooldown = Math.max(0, this.tackleCooldown - dt * (adminMods?.slowBots ? 0.65 : 1));
    this.jukeLockTimer = Math.max(0, this.jukeLockTimer - dt);

    const allPlayers = Array.isArray(allPlayersOrOpponent) ? allPlayersOrOpponent : [allPlayersOrOpponent];
    const teammates = allPlayers.filter((p) => p.team === this.state.team && p.id !== this.state.id);
    const opponents = allPlayers.filter((p) => p.team !== this.state.team);

    // Nearest opponent to this bot & nearest opponent to ball
    let nearestOppToBall: PlayerState = opponents[0] || {
      id: 'dummy',
      name: 'Opp',
      team: this.state.team === 'blue' ? 'red' : 'blue',
      x: this.targetGoalX,
      y: 0,
      z: 0,
      rotY: 0,
      anim: 'idle',
      isHost: false,
    };
    let oppDistToBall = Infinity;
    for (const opp of opponents) {
      const d = Math.hypot(ball.x - opp.x, ball.z - opp.z);
      if (d < oppDistToBall) {
        oppDistToBall = d;
        nearestOppToBall = opp;
      }
    }

    let nearestOppToSelf = nearestOppToBall;
    let distToNearestOpp = Infinity;
    for (const opp of opponents) {
      const d = Math.hypot(opp.x - this.state.x, opp.z - this.state.z);
      if (d < distToNearestOpp) {
        distToNearestOpp = d;
        nearestOppToSelf = opp;
      }
    }

    // 1. Stunned state (just got slide-tackled)
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      this.vx *= Math.max(0, 1 - 10 * dt);
      this.vz *= Math.max(0, 1 - 10 * dt);
      this.state.x += this.vx * dt;
      this.state.z += this.vz * dt;
      this.state.anim = 'idle';
      this.energy = Math.min(100, this.energy + 14 * dt);
      this.state.energy = Math.round(this.energy);
      return { isKicking: false, isPassing: false, isSprinting: false, isTackling: false, tacticalMode: 'defend' };
    }

    // 2. Active multi-frame Slide Tackle Lunge
    if (this.slideActiveTimer > 0) {
      this.slideActiveTimer = Math.max(0, this.slideActiveTimer - dt);
      const slideSpd = this.profile.slideSpeed;
      this.vx = this.slideDirX * slideSpd;
      this.vz = this.slideDirZ * slideSpd;
      this.state.x += this.vx * dt;
      this.state.z += this.vz * dt;
      this.state.rotY = Math.atan2(this.slideDirX, this.slideDirZ);
      this.state.anim = 'slide';
      this.clampToPitch();
      this.state.energy = Math.round(this.energy);

      return {
        isKicking: false,
        isPassing: false,
        isSprinting: true,
        isTackling: true,
        aimRotY: this.state.rotY,
        tacticalMode: 'slide',
      };
    }

    const halfLen = PITCH_LENGTH / 2;
    const halfWid = PITCH_WIDTH / 2;

    const dxBall = ball.x - this.state.x;
    const dzBall = ball.z - this.state.z;
    const distToBall = Math.hypot(dxBall, dzBall);

    const interceptTime = Math.min(
      this.profile.predictHorizon,
      Math.max(0.06, distToBall / (this.profile.sprintSpeed * 1.15))
    );
    const predBall = this.predictBallPosition(ball, interceptTime);

    const isProperAttackSide = (ball.x - this.state.x) * this.attackDir >= -0.35;
    const distBallToTargetGoal = Math.hypot(this.targetGoalX - ball.x, -ball.z);
    const distBallToOwnGoal = Math.hypot(this.ownGoalX - ball.x, -ball.z);

    // Determine whether THIS bot is the primary ball-chaser on its team (prevents teammate clumping!)
    let closestTeammateToBallDist = Infinity;
    let humanTeammateNearBall = false;
    for (const mate of teammates) {
      if (mate.aiRole === 'gk') continue;
      const md = Math.hypot(ball.x - mate.x, ball.z - mate.z);
      if (md < closestTeammateToBallDist) closestTeammateToBallDist = md;
      if (!mate.isBot && md < 4.8) humanTeammateNearBall = true;
    }

    const isClosestOutfieldOnTeam = distToBall <= closestTeammateToBallDist + 0.8 && !humanTeammateNearBall;

    // Detect incoming shot toward bot's own goal
    const ballSpeedTowardOwnGoal = ball.vx * -this.attackDir;
    let predictedGoalCrossZ = ball.z;
    let incomingShotDanger = false;
    if (ballSpeedTowardOwnGoal > 4.2 && distBallToOwnGoal < 44) {
      const timeToGoalLine = Math.abs(this.ownGoalX - ball.x) / Math.max(1, ballSpeedTowardOwnGoal);
      if (timeToGoalLine < 2.2) {
        predictedGoalCrossZ = ball.z + ball.vz * timeToGoalLine;
        if (Math.abs(predictedGoalCrossZ) < GOAL_WIDTH / 2 + 2.8) {
          incomingShotDanger = true;
        }
      }
    }

    const oppHasPossession = oppDistToBall < 3.0 && oppDistToBall + 0.45 < distToBall;
    const ballInOwnBox = distBallToOwnGoal < 14.5;
    const ballInCorner = Math.abs(ball.x) > halfLen - 4.5 && Math.abs(ball.z) > halfWid - 5.5;

    let targetX = predBall.x;
    let targetZ = predBall.z;
    let wantSprint = false;
    let isKicking = false;
    let isPassing = false;
    let wantTackle = false;
    let moveType: MoveKickType | undefined = undefined;
    let aimRotY: number | undefined = undefined;
    let shotPowerScale = this.profile.shotPowerScale;
    let dribbleSpeed: number | undefined = undefined;
    let passTargetName: string | undefined = undefined;
    let tacticalMode: BotActionOutput['tacticalMode'] = 'intercept';

    // =========================================================================
    // SPECIALIZED GOALKEEPER ('gk') BRAIN
    // =========================================================================
    if (this.role === 'gk') {
      const goalLineX = this.ownGoalX + this.attackDir * 3.0;

      if (distToBall < 2.4 && distBallToOwnGoal < 16) {
        // Goalkeeper has the ball: distribute cleanly to an open teammate or clear upfield!
        const mate = this.findBestPassTarget(teammates, opponents);
        if (mate && this.passCooldown <= 0) {
          tacticalMode = 'pass';
          aimRotY = Math.atan2(mate.x + this.attackDir * 2.5 - this.state.x, mate.z - this.state.z);
          isPassing = true;
          isKicking = true;
          shotPowerScale = 0.78;
          passTargetName = mate.name;
          this.passCooldown = 1.4;
          this.shootCooldown = 0.9;
        } else if (this.shootCooldown <= 0) {
          tacticalMode = 'clear';
          const clearZ = nearestOppToBall.z >= ball.z ? -9 : 9;
          aimRotY = Math.atan2(this.targetGoalX - this.state.x, clearZ - this.state.z);
          isKicking = true;
          wantSprint = true;
          shotPowerScale = 1.05;
          this.shootCooldown = 0.9;
        }
        targetX = ball.x;
        targetZ = ball.z;
      } else if (incomingShotDanger) {
        tacticalMode = 'save';
        targetX = goalLineX;
        targetZ = Math.max(-(GOAL_WIDTH / 2 - 0.7), Math.min(GOAL_WIDTH / 2 - 0.7, predictedGoalCrossZ));
        wantSprint = true;
      } else if (distBallToOwnGoal < 13 && isProperAttackSide) {
        // Sweep out to claim loose ball in box
        tacticalMode = 'save';
        targetX = predBall.x;
        targetZ = Math.max(-10, Math.min(10, predBall.z));
        wantSprint = true;
      } else {
        // Track ball horizontally across goal mouth like a real keeper
        tacticalMode = 'defend';
        const depthOut = distBallToOwnGoal < 26 ? 4.8 : 3.2;
        targetX = this.ownGoalX + this.attackDir * depthOut;
        targetZ = Math.max(-(GOAL_WIDTH / 2 - 1.0), Math.min(GOAL_WIDTH / 2 - 1.0, ball.z * 0.42));
        wantSprint = Math.abs(targetZ - this.state.z) > 3.0;
      }
    }
    // =========================================================================
    // OUTFIELD PLAYERS ('def', 'mid', 'fwd') TACTICAL BRAIN
    // =========================================================================
    else if (incomingShotDanger && !isProperAttackSide && distToBall > 2.2 && (this.role === 'def' || teammates.length === 0)) {
      tacticalMode = 'save';
      targetX = this.ownGoalX + this.attackDir * 3.0;
      targetZ = Math.max(-(GOAL_WIDTH / 2 - 0.8), Math.min(GOAL_WIDTH / 2 - 0.8, predictedGoalCrossZ));
      wantSprint = true;
    } else if (ballInOwnBox && distToBall < 2.2 && (oppDistToBall < 5.5 || ballSpeedTowardOwnGoal > 1.5)) {
      tacticalMode = 'clear';
      const mate = this.findBestPassTarget(teammates, opponents);
      if (mate && this.passCooldown <= 0) {
        aimRotY = Math.atan2(mate.x + this.attackDir * 2.2 - this.state.x, mate.z - this.state.z);
        isPassing = true;
        isKicking = true;
        shotPowerScale = 0.78;
        passTargetName = mate.name;
        this.passCooldown = this.profile.passCooldown;
        this.shootCooldown = 0.7;
      } else {
        const clearZ = nearestOppToBall.z >= ball.z ? -10 : 10;
        aimRotY = Math.atan2(this.targetGoalX - this.state.x, clearZ - this.state.z);
        if (this.shootCooldown <= 0) {
          isKicking = true;
          wantSprint = true;
          shotPowerScale = 1.05;
          this.shootCooldown = 0.7;
        }
      }
      targetX = ball.x;
      targetZ = ball.z;
    } else if (!isClosestOutfieldOnTeam && distToBall > 4.2) {
      // SUPPORTING POSITIONING: Spread across the pitch so teammates create real passing triangles!
      tacticalMode = 'support';
      const ballXRatio = ball.x / halfLen; // -1..+1

      if (this.role === 'def') {
        // Hold defensive line between midfield and own box
        const defX = this.homeX * 0.55 + ball.x * 0.45 - this.attackDir * 7.5;
        targetX = this.state.team === 'red'
          ? Math.max(-halfLen + 8, Math.min(6, defX))
          : Math.min(halfLen - 8, Math.max(-6, defX));
        targetZ = Math.max(-16, Math.min(16, this.homeZ * 0.5 + ball.z * 0.45));
      } else if (this.role === 'mid') {
        // Box-to-box support on the opposite flank from the ball
        const oppFlankZ = ball.z > 2 ? -10 : ball.z < -2 ? 10 : this.homeZ;
        targetX = Math.max(-halfLen + 10, Math.min(halfLen - 10, ball.x + this.attackDir * 5.5));
        targetZ = Math.max(-18, Math.min(18, oppFlankZ));
      } else {
        // Forward/Winger: push high into open passing lane ahead of the ball carrier!
        const pushX = ball.x + this.attackDir * (11 + Math.abs(ballXRatio) * 3);
        targetX = this.state.team === 'red'
          ? Math.max(-6, Math.min(halfLen - 6.5, pushX))
          : Math.min(6, Math.max(-halfLen + 6.5, pushX));
        const openWingZ = ball.z >= 0 ? -11.5 : 11.5;
        targetZ = Math.max(-18.5, Math.min(18.5, openWingZ + Math.sin(this.clock * 1.4) * 2.2));
      }

      // Gently separate from nearby teammates so bots never stack on top of each other
      for (const mate of teammates) {
        const sdx = targetX - mate.x;
        const sdz = targetZ - mate.z;
        const sd = Math.hypot(sdx, sdz);
        if (sd < 6.0 && sd > 0.01) {
          targetX += (sdx / sd) * (6.0 - sd) * 0.7;
          targetZ += (sdz / sd) * (6.0 - sd) * 0.7;
        }
      }

      wantSprint = Math.hypot(targetX - this.state.x, targetZ - this.state.z) > 10 && this.energy > 40;
    } else if (oppHasPossession && distBallToOwnGoal < 34) {
      tacticalMode = 'defend';
      const toOwnX = this.ownGoalX - predBall.x;
      const toOwnZ = 0 - predBall.z;
      const toOwnLen = Math.max(0.1, Math.hypot(toOwnX, toOwnZ));
      const jockeyDist = distBallToOwnGoal < 16 ? 2.1 : 3.2;

      targetX = predBall.x + (toOwnX / toOwnLen) * jockeyDist;
      targetZ = predBall.z + (toOwnZ / toOwnLen) * jockeyDist;
      wantSprint = distToBall > 4.5 || distBallToOwnGoal < 18;

      const safeToTackle =
        distToBall < 4.1 &&
        distToBall > 1.6 &&
        oppDistToBall < 2.5 &&
        this.tackleCooldown <= 0 &&
        this.energy >= 26 &&
        isProperAttackSide;

      if (safeToTackle && Math.random() < this.profile.tackleChance * dt * 10) {
        wantTackle = true;
      }
    } else if (!isProperAttackSide) {
      tacticalMode = 'wrap';
      const preferCenterSign = Math.abs(ball.z) > 12 ? -Math.sign(ball.z) : this.state.z >= ball.z ? 1 : -1;
      const wrapOffsetZ = preferCenterSign * (distToBall < 4.0 ? 2.8 : 2.3);
      targetX = predBall.x - this.attackDir * 2.5;
      targetZ = Math.max(-(halfWid - 3.5), Math.min(halfWid - 3.5, predBall.z + wrapOffsetZ));
      wantSprint = distToBall > 3.5;
    } else if (ballInCorner && distToBall < 5.0) {
      tacticalMode = 'dribble';
      const inwardZ = -Math.sign(ball.z) * 3.0;
      targetX = ball.x - this.attackDir * 0.9;
      targetZ = ball.z + (distToBall > 1.8 ? 0 : inwardZ);
      aimRotY = Math.atan2(this.targetGoalX - this.state.x, -ball.z * 0.5);
      dribbleSpeed = 9.5;
    } else if (distToBall < 2.35 && isProperAttackSide) {
      // ON THE BALL & ATTACKING! Decide between Shoot, Pass to Open Teammate (especially Human!), or Evasive Dribble
      const cornerZ = this.chooseOpenGoalCornerZ(opponents);
      const goalAimAngle = Math.atan2(this.targetGoalX - this.state.x, cornerZ - this.state.z);

      const oppAhead = (nearestOppToSelf.x - this.state.x) * this.attackDir > 0.4;
      const oppBetweenGoal =
        oppAhead &&
        Math.abs(nearestOppToSelf.x - this.state.x) < Math.abs(this.targetGoalX - this.state.x);
      const laneBlocked =
        oppBetweenGoal &&
        distToNearestOpp < 7.5 &&
        Math.abs(nearestOppToSelf.z - this.state.z) < 2.5;

      const goodShootAngle = Math.abs(ball.z) < 16.5;
      const inShootRange = distBallToTargetGoal < this.profile.shootRange;

      // Check if an open teammate (especially the human player!) is in a great attacking spot
      const openMate = this.passCooldown <= 0 ? this.findBestPassTarget(teammates, opponents) : null;
      const shouldPassToHuman =
        openMate &&
        !openMate.isBot &&
        distBallToTargetGoal > 15 &&
        (laneBlocked || distBallToTargetGoal > 24 || Math.random() < 0.42);
      const shouldPassToBotMate =
        openMate &&
        openMate.isBot &&
        laneBlocked &&
        distBallToTargetGoal > 18;

      if (shouldPassToHuman || shouldPassToBotMate) {
        tacticalMode = 'pass';
        const leadX = openMate!.x + this.attackDir * 2.2;
        const leadZ = openMate!.z;
        aimRotY = Math.atan2(leadX - this.state.x, leadZ - this.state.z);
        isPassing = true;
        isKicking = true;
        const passDist = Math.hypot(leadX - this.state.x, leadZ - this.state.z);
        shotPowerScale = Math.max(0.56, Math.min(0.88, passDist / 26));
        passTargetName = openMate!.name;
        this.passCooldown = this.profile.passCooldown;
        this.shootCooldown = 0.65;
        targetX = ball.x + Math.sin(aimRotY) * 0.6;
        targetZ = ball.z + Math.cos(aimRotY) * 0.6;
      } else if (
        inShootRange &&
        goodShootAngle &&
        this.shootCooldown <= 0 &&
        (!laneBlocked || distBallToTargetGoal < 17)
      ) {
        tacticalMode = 'shoot';
        aimRotY = goalAimAngle;
        isKicking = true;
        wantSprint = distBallToTargetGoal > 16;

        // Higher difficulty bots use Lob chips, Power Shots, and Acrobatic finishes!
        const rollSpecial = Math.random();
        if (rollSpecial < this.profile.specialMoveChance && this.energy >= 28) {
          if (distBallToTargetGoal < 20 && distToNearestOpp < 8) {
            moveType = 'lob';
            shotPowerScale = 0.95;
          } else if (ball.y > 1.25 && distBallToTargetGoal < 24) {
            moveType = 'bicycle';
            shotPowerScale = this.profile.shotPowerScale;
          } else {
            moveType = 'power';
            shotPowerScale = this.profile.shotPowerScale;
          }
          this.energy = Math.max(0, this.energy - 22);
        } else {
          shotPowerScale = distBallToTargetGoal > 22 ? this.profile.shotPowerScale * 1.06 : this.profile.shotPowerScale * 0.94;
        }
        this.shootCooldown = this.profile.shootCooldown;
        targetX = ball.x + this.attackDir * 0.8;
        targetZ = ball.z;
      } else {
        tacticalMode = 'dribble';
        if (laneBlocked) {
          if (this.jukeLockTimer <= 0) {
            const spacePos = halfWid - 3 - nearestOppToSelf.z;
            const spaceNeg = nearestOppToSelf.z - (-halfWid + 3);
            if (Math.abs(nearestOppToSelf.z - this.state.z) < 1.2) {
              this.jukeSide = spacePos >= spaceNeg ? 1 : -1;
            } else {
              this.jukeSide = this.state.z >= nearestOppToSelf.z ? 1 : -1;
            }
            this.jukeLockTimer = 0.75;
            if (Math.random() < this.profile.specialMoveChance * 0.65 && this.energy >= 22) {
              moveType = 'skill';
              this.energy = Math.max(0, this.energy - 14);
            }
          }

          const cutZ = this.jukeSide * 4.8 * this.profile.jukeStrength;
          const evadeTargetX = this.state.x + this.attackDir * 6.5;
          const evadeTargetZ = Math.max(-(halfWid - 4.5), Math.min(halfWid - 4.5, this.state.z + cutZ));
          aimRotY = Math.atan2(evadeTargetX - this.state.x, evadeTargetZ - this.state.z);
          targetX = ball.x + Math.sin(aimRotY) * 1.2;
          targetZ = ball.z + Math.cos(aimRotY) * 1.2;
          wantSprint = this.energy > 30;
          dribbleSpeed = wantSprint ? 12.4 : 9.4;
        } else {
          const idealZ = Math.max(-7.5, Math.min(7.5, ball.z * 0.65));
          const carryX = this.targetGoalX - this.attackDir * 9;
          aimRotY = Math.atan2(carryX - this.state.x, idealZ - this.state.z);
          targetX = ball.x + Math.sin(aimRotY) * 0.9;
          targetZ = ball.z + Math.cos(aimRotY) * 0.9;
          wantSprint = distBallToTargetGoal > 20 && this.energy > 35;
          dribbleSpeed = wantSprint ? 12.0 : 9.2;
        }
      }
    } else {
      tacticalMode = 'intercept';
      const leadBehind = Math.min(1.35, distToBall * 0.25);
      targetX = predBall.x - this.attackDir * leadBehind;
      targetZ = predBall.z;
      if (Math.abs(targetZ) < 14 && distToBall > 5) {
        targetZ += Math.sin(this.clock * 2.4) * 0.45;
      }
      wantSprint = distToBall > 4.2 || oppDistToBall < 5.5;

      if (
        oppDistToBall < 2.2 &&
        distToBall < 3.8 &&
        distToBall > 1.7 &&
        this.tackleCooldown <= 0 &&
        this.energy >= 28 &&
        isProperAttackSide
      ) {
        if (Math.random() < this.profile.tackleChance * dt * 7.0) {
          wantTackle = true;
        }
      }
    }

    // Trigger slide tackle lunge
    if (wantTackle) {
      const tdx = predBall.x - this.state.x;
      const tdz = predBall.z - this.state.z;
      const tLen = Math.max(0.1, Math.hypot(tdx, tdz));
      this.slideDirX = tdx / tLen;
      this.slideDirZ = tdz / tLen;
      this.slideActiveTimer = 0.32;
      this.tackleCooldown = this.profile.tackleCooldown;
      this.energy = Math.max(0, this.energy - 24);
      this.state.rotY = Math.atan2(this.slideDirX, this.slideDirZ);
      this.state.anim = 'slide';
      this.state.energy = Math.round(this.energy);

      return {
        isKicking: false,
        isPassing: false,
        isSprinting: true,
        isTackling: true,
        aimRotY: this.state.rotY,
        tacticalMode: 'slide',
      };
    }

    // Safety guard: NEVER shoot toward own goal (passes are allowed sideways/slightly back outside own box)
    if (isKicking && !isPassing) {
      const checkRot = aimRotY !== undefined ? aimRotY : this.state.rotY;
      const kickDirX = Math.sin(checkRot);
      if (kickDirX * this.attackDir < 0.15) {
        isKicking = false;
      }
    }

    // =========================================================================
    // ENERGY MANAGEMENT & SMOOTH ATHLETIC LOCOMOTION
    // =========================================================================
    const moveDx = targetX - this.state.x;
    const moveDz = targetZ - this.state.z;
    const moveDist = Math.hypot(moveDx, moveDz);
    const isMoving = moveDist > 0.28;

    const canSprint = wantSprint && !this.sprintExhausted && this.energy > 2;
    if (canSprint && isMoving) {
      this.energy = Math.max(0, this.energy - 21 * mapStaminaDrain * dt);
      if (this.energy <= 2) this.sprintExhausted = true;
    } else {
      const regen = isMoving ? 15 : 25;
      this.energy = Math.min(100, this.energy + regen * dt);
      if (this.energy >= 20) this.sprintExhausted = false;
    }

    const speedBoost = tacticalMode === 'save' ? this.profile.saveReactionSpeed : 1.0;
    const desiredMaxSpeed = (canSprint ? this.profile.sprintSpeed : this.profile.jogSpeed) * speedBoost * botSpeedMult;

    let desiredVx = 0;
    let desiredVz = 0;
    if (isMoving) {
      const arrivalScale = Math.min(1, moveDist / 1.1);
      const spd = desiredMaxSpeed * Math.max(0.35, arrivalScale);
      desiredVx = (moveDx / moveDist) * spd;
      desiredVz = (moveDz / moveDist) * spd;
    }

    // Scale bot grip/acceleration by map traction (low traction = authentic ice/snow drift!)
    const effectiveAccel = this.profile.accel * (0.09 + mapTraction * 0.91);
    const blend = Math.min(1, effectiveAccel * dt);
    this.vx += (desiredVx - this.vx) * blend;
    this.vz += (desiredVz - this.vz) * blend;

    // Apply Canyon wind push to bots as well
    if (mapWindX !== 0 || mapWindZ !== 0) {
      this.vx += mapWindX * 0.65 * dt;
      this.vz += mapWindZ * 0.65 * dt;
    }

    this.state.x += this.vx * dt;
    this.state.z += this.vz * dt;
    this.clampToPitch();

    const currentSpeed = Math.hypot(this.vx, this.vz);
    if (isKicking && aimRotY !== undefined) {
      this.state.rotY = lerpAngle(this.state.rotY, aimRotY, 22 * dt);
    } else if (aimRotY !== undefined && distToBall < 2.2) {
      this.state.rotY = lerpAngle(this.state.rotY, aimRotY, this.profile.turnRate * dt);
    } else if (currentSpeed > 0.4) {
      const moveAngle = Math.atan2(this.vx, this.vz);
      this.state.rotY = lerpAngle(this.state.rotY, moveAngle, this.profile.turnRate * dt);
    } else {
      const faceBallAngle = Math.atan2(ball.x - this.state.x, ball.z - this.state.z);
      this.state.rotY = lerpAngle(this.state.rotY, faceBallAngle, 8 * dt);
    }

    this.state.anim =
      moveType === 'bicycle'
        ? 'bicycle'
        : moveType === 'power'
        ? 'power'
        : moveType === 'lob'
        ? 'lob'
        : moveType === 'skill'
        ? 'skill'
        : isKicking
        ? 'kick'
        : currentSpeed > 0.7
        ? 'run'
        : 'idle';
    this.state.energy = Math.round(this.energy);

    return {
      isKicking,
      isPassing,
      isSprinting: canSprint,
      isTackling: false,
      moveType: isPassing ? 'pass' : moveType,
      aimRotY: aimRotY !== undefined ? aimRotY : this.state.rotY,
      shotPowerScale,
      dribbleSpeed,
      accuracyJitter: isPassing ? 0.45 : this.profile.accuracyJitter,
      passTargetName,
      tacticalMode,
    };
  }

  private clampToPitch() {
    this.state.x = Math.max(-PITCH_LENGTH / 2 + 1.0, Math.min(PITCH_LENGTH / 2 - 1.0, this.state.x));
    this.state.z = Math.max(-PITCH_WIDTH / 2 + 1.5, Math.min(PITCH_WIDTH / 2 - 1.5, this.state.z));
  }
}
