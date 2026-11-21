import * as THREE from 'three';
import { BallState, MapId } from '../types/game';
import { PITCH_LENGTH, PITCH_WIDTH, GOAL_WIDTH, GOAL_HEIGHT, GOAL_DEPTH, MAP_CONFIGS, getMapWindVector } from './stadiums';
import { sound } from './audio';

export const BALL_RADIUS = 0.55;

export type MoveKickType = 'normal' | 'pass' | 'lob' | 'power' | 'bicycle' | 'skill';

export interface InteractionResult {
  interacted: boolean;
  outcome: 'none' | 'kick' | 'lob' | 'power' | 'bicycle' | 'skill' | 'dribble' | 'tackle_steal' | 'tackle_loose';
  stunnedOpponent: boolean;
}

export function createBallMesh(mapId: MapId): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  if (mapId === 'cyber') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 22;
    for (let y = 0; y < 1024; y += 256) {
      ctx.strokeRect(20, y + 20, 984, 216);
    }
    ctx.fillStyle = '#ff007f';
    [256, 768].forEach((cx) => {
      [256, 768].forEach((cy) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 95, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  } else if (mapId === 'underwater') {
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#003554';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) {
          ctx.beginPath();
          ctx.arc(128 + i * 256, 128 + j * 256, 92, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 1000, 1000);
  } else if (mapId === 'snow') {
    // High-visibility Winter Orange Pro Match Ball
    const grad = ctx.createRadialGradient(512, 512, 90, 512, 512, 700);
    grad.addColorStop(0, '#ff8c00');
    grad.addColorStop(1, '#ea580c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#0f172a';
    [
      [256, 256],
      [768, 256],
      [512, 512],
      [256, 768],
      [768, 768],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 86, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 8;
      ctx.stroke();
    });
  } else if (mapId === 'volcano') {
    // Obsidian & Glowing Magma Cracks Ball
    ctx.fillStyle = '#181014';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = '#ff5722';
    ctx.lineWidth = 18;
    for (let i = 0; i <= 1024; i += 196) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(1024 - i, 1024);
      ctx.stroke();
    }
    ctx.fillStyle = '#fbbf24';
    [
      [256, 512],
      [768, 512],
      [512, 256],
      [512, 768],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 62, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (mapId === 'space') {
    // Orbital Gold & Titanium Lunar Ball
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.5, '#cbd5e1');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 16;
    for (let y = 128; y < 1024; y += 256) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#1e1b4b';
    [
      [256, 256],
      [768, 256],
      [512, 512],
      [256, 768],
      [768, 768],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (mapId === 'ice') {
    // Glacial Crystal Ice Ball (High-contrast navy & electric cyan facets)
    const grad = ctx.createRadialGradient(512, 512, 80, 512, 512, 700);
    grad.addColorStop(0, '#e0f7ff');
    grad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    for (let i = 0; i <= 1024; i += 256) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(1024 - i, 1024);
      ctx.stroke();
    }
    ctx.fillStyle = '#0c4a6e';
    [
      [256, 256],
      [768, 256],
      [512, 512],
      [256, 768],
      [768, 768],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 82, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 8;
      ctx.stroke();
    });
  } else if (mapId === 'swamp') {
    // Bioluminescent Marsh Lime & Mud Ball
    const grad = ctx.createRadialGradient(512, 512, 80, 512, 512, 700);
    grad.addColorStop(0, '#d9f99d');
    grad.addColorStop(1, '#65a30d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#3f2e1c';
    [
      [220, 260, 92],
      [780, 240, 86],
      [512, 512, 98],
      [260, 770, 88],
      [770, 750, 94],
    ].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bef264';
      ctx.lineWidth = 8;
      ctx.stroke();
    });
  } else if (mapId === 'wind') {
    // Canyon Desert Sandstone & Cyan Wind-Swirl Ball
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#fef3c7');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#c2410c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 22;
    for (let y = 160; y < 1024; y += 220) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(512, y - 95, 1024, y);
      ctx.stroke();
    }
  } else if (mapId === 'speedway') {
    // F1 Carbon Fiber & Checkered Turbo Neon Ball
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#f8fafc';
    const sq = 128;
    for (let gx = 0; gx < 8; gx++) {
      for (let gy = 0; gy < 8; gy++) {
        if ((gx + gy) % 2 === 0 && (gy === 3 || gy === 4)) {
          ctx.fillRect(gx * sq, gy * sq, sq, sq);
        }
      }
    }
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(0, 384);
    ctx.lineTo(1024, 384);
    ctx.moveTo(0, 640);
    ctx.lineTo(1024, 640);
    ctx.stroke();
    ctx.fillStyle = '#22d3ee';
    [
      [256, 192],
      [768, 192],
      [256, 832],
      [768, 832],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 74, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // FIFA 26 Pro Match Ball: Pearl white leather with aerodynamic crimson/gold/obsidian panels
    const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 700);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle seam lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.lineWidth = 6;
    for (let i = 0; i <= 1024; i += 256) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    const panelCenters = [
      [256, 256],
      [768, 256],
      [512, 512],
      [256, 768],
      [768, 768],
      [128, 512],
      [896, 512],
    ];
    panelCenters.forEach(([hx, hy], idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#0f172a' : mapId === 'rooftop' ? '#6366f1' : '#e11d48';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x = hx + 76 * Math.cos(angle);
        const y = hy + 76 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 5;
      ctx.stroke();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
  const mat = new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.28,
    metalness: mapId === 'cyber' || mapId === 'space' ? 0.55 : 0.08,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
    emissive: mapId === 'volcano' ? new THREE.Color(0x4a1004) : new THREE.Color(0x000000),
    emissiveIntensity: mapId === 'volcano' ? 0.45 : 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'soccer_ball';
  return mesh;
}

export class PhysicsEngine {
  public ball: BallState = { x: 0, y: BALL_RADIUS, z: 0, vx: 0, vy: 0, vz: 0, isSuperShot: false };
  public mapId: MapId = 'stadium';
  private baseGravity: number = -22.0;
  private curveSpin: number = 0; // Lateral Magnus swerve acceleration on Z for power/bicycle shots
  public adminMods: { lowGravity: boolean; superPowerShot: boolean; giantBall: boolean } = {
    lowGravity: false,
    superPowerShot: false,
    giantBall: false,
  };
  public carrierId: string | null = null;
  private kickReleaseTimer: number = 0;
  private kickReleasePlayerId: string | null = null;
  private elapsedSec: number = 0;

  constructor(mapId: MapId = 'stadium') {
    this.mapId = mapId;
  }

  public setAdminModifiers(mods: { lowGravity?: boolean; superPowerShot?: boolean; giantBall?: boolean }) {
    this.adminMods = {
      lowGravity: Boolean(mods.lowGravity),
      superPowerShot: Boolean(mods.superPowerShot),
      giantBall: Boolean(mods.giantBall),
    };
  }

  public getBallRadius(): number {
    return this.adminMods.giantBall ? BALL_RADIUS * 2.1 : BALL_RADIUS;
  }

  public setMap(mapId: MapId) {
    this.mapId = mapId;
  }

  public resetBall() {
    this.ball = { x: 0, y: this.getBallRadius(), z: 0, vx: 0, vy: 0, vz: 0, isSuperShot: false };
    this.curveSpin = 0;
    this.carrierId = null;
    this.kickReleaseTimer = 0;
    this.kickReleasePlayerId = null;
  }

  public releaseCarrier(byPlayerId?: string, lockDuration: number = 0.22) {
    this.carrierId = null;
    if (byPlayerId) {
      this.kickReleasePlayerId = byPlayerId;
      this.kickReleaseTimer = lockDuration;
    }
  }

  public teleportBall(x: number, z: number) {
    this.ball.x = x;
    this.ball.y = this.getBallRadius() + 0.1;
    this.ball.z = z;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.isSuperShot = false;
    this.curveSpin = 0;
    this.carrierId = null;
  }

  public update(delta: number): { goalScored: 'red' | 'blue' | null } {
    const config = MAP_CONFIGS[this.mapId];
    const dt = Math.min(delta, 0.05);
    if (this.kickReleaseTimer > 0) {
      this.kickReleaseTimer = Math.max(0, this.kickReleaseTimer - dt);
      if (this.kickReleaseTimer === 0) {
        this.kickReleasePlayerId = null;
      }
    }
    this.elapsedSec += dt;
    const baseGravMult = config.gravityMultiplier ?? 1.0;
    const gravMult = this.adminMods.lowGravity ? Math.min(baseGravMult, 0.4) : baseGravMult;
    const radius = this.getBallRadius();

    // Apply gravity
    this.ball.vy += this.baseGravity * gravMult * dt;

    // Apply Map Wind Gusts (Canyon del Vento / Rooftop breeze push the ball physically!)
    const wind = getMapWindVector(this.mapId, this.elapsedSec);
    if (wind.wx !== 0 || wind.wz !== 0) {
      const airFactor = this.ball.y > radius + 0.15 ? 1.45 : 0.95;
      this.ball.vx += wind.wx * airFactor * dt;
      this.ball.vz += wind.wz * airFactor * dt;
    }

    // Apply subtle Magnus swerve during fast curved super-shots
    if (Math.abs(this.curveSpin) > 0.05) {
      this.ball.vz += this.curveSpin * dt;
      this.curveSpin *= Math.max(0, 1 - 1.7 * dt);
    }

    // Apply position integration
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.z += this.ball.vz * dt;

    const horizSpeed = Math.hypot(this.ball.vx, this.ball.vz);
    if (horizSpeed < 22) {
      this.ball.isSuperShot = false;
    }

    // Ground collision & bouncing
    if (this.ball.y < radius) {
      this.ball.y = radius;
      if (this.ball.vy < -0.8) {
        this.ball.vy = -this.ball.vy * 0.62 * config.bounceMultiplier;
        sound.playKick(0.35);
      } else {
        this.ball.vy = 0;
      }
      // Friction along ground
      const friction = config.frictionMultiplier;
      this.ball.vx *= friction;
      this.ball.vz *= friction;
    } else {
      // Air resistance
      this.ball.vx *= 0.997;
      this.ball.vz *= 0.997;
    }

    // Check Goal Volumes
    const leftGoalLine = -PITCH_LENGTH / 2;
    const rightGoalLine = PITCH_LENGTH / 2;

    if (
      this.ball.x < leftGoalLine &&
      this.ball.x > leftGoalLine - GOAL_DEPTH &&
      Math.abs(this.ball.z) < GOAL_WIDTH / 2 &&
      this.ball.y < GOAL_HEIGHT
    ) {
      return { goalScored: 'blue' };
    }

    if (
      this.ball.x > rightGoalLine &&
      this.ball.x < rightGoalLine + GOAL_DEPTH &&
      Math.abs(this.ball.z) < GOAL_WIDTH / 2 &&
      this.ball.y < GOAL_HEIGHT
    ) {
      return { goalScored: 'red' };
    }

    // Boundary Rebound / Wall Collisions
    const halfLen = PITCH_LENGTH / 2;
    const halfWid = PITCH_WIDTH / 2;

    if (Math.abs(this.ball.z) > halfWid - radius) {
      this.ball.z = Math.sign(this.ball.z) * (halfWid - radius);
      this.ball.vz = -this.ball.vz * 0.7;
      this.curveSpin *= -0.4;
      sound.playKick(0.4);
    }

    if (Math.abs(this.ball.x) > halfLen - radius) {
      const inGoalMouth = Math.abs(this.ball.z) < GOAL_WIDTH / 2 && this.ball.y < GOAL_HEIGHT;
      if (!inGoalMouth) {
        this.ball.x = Math.sign(this.ball.x) * (halfLen - radius);
        this.ball.vx = -this.ball.vx * 0.7;
        sound.playKick(0.4);
      }
    }

    return { goalScored: null };
  }

  // Handle interaction between player and ball (normal kick, pass, lob, power shot, bicycle kick, skill dribble, slide tackle)
  public handlePlayerInteraction(
    playerX: number,
    playerZ: number,
    playerRotY: number,
    isKicking: boolean,
    isSprinting: boolean,
    isTackling: boolean,
    opponentPos?: { x: number; z: number },
    options?: {
      playerId?: string;
      isHuman?: boolean;
      aimRotY?: number;
      shotPowerScale?: number;
      dribbleSpeed?: number;
      accuracyJitter?: number;
      isPass?: boolean;
      moveType?: MoveKickType;
      curveBias?: number;
    }
  ): InteractionResult {
    const dx = this.ball.x - playerX;
    const dz = this.ball.z - playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const oppToTacklerDist = opponentPos ? Math.hypot(opponentPos.x - playerX, opponentPos.z - playerZ) : Infinity;
    const oppToBallDist = opponentPos ? Math.hypot(this.ball.x - opponentPos.x, this.ball.z - opponentPos.z) : Infinity;

    const pid = options?.playerId;
    const isHuman = Boolean(options?.isHuman);
    const isCurrentCarrier = Boolean(pid && this.carrierId === pid);
    const blockedBySelfKick = Boolean(pid && this.kickReleaseTimer > 0 && this.kickReleasePlayerId === pid);

    const moveType: MoveKickType = options?.moveType ?? (options?.isPass ? 'pass' : 'normal');
    const radiusBonus = this.getBallRadius() - BALL_RADIUS;
    const adminShotBoost = this.adminMods.superPowerShot ? 1.55 : 1.0;

    // Much more generous pickup & sticky control radius for human players!
    const baseDribbleDist = isCurrentCarrier ? 3.25 : isHuman ? 2.75 : 2.05;
    const touchDist =
      (isTackling
        ? isHuman
          ? 3.8
          : 3.35
        : moveType === 'bicycle'
        ? 3.45
        : moveType === 'power' || moveType === 'lob' || moveType === 'pass'
        ? 2.95
        : moveType === 'skill'
        ? 2.85
        : isKicking
        ? isHuman
          ? 2.85
          : 2.25
        : baseDribbleDist) + radiusBonus;

    let stunnedOpponent = false;

    // Slide tackle disarms opponent near the ball; Skill Move also fakes out a very close marker
    if (isTackling && (oppToTacklerDist < 3.55 || (dist < touchDist && oppToBallDist < 4.1))) {
      stunnedOpponent = true;
    } else if (moveType === 'skill' && dist < touchDist && oppToTacklerDist < 3.5) {
      stunnedOpponent = true;
    }

    if (dist < touchDist) {
      const effectiveRot = options?.aimRotY !== undefined ? options.aimRotY : playerRotY;
      const fwdX = Math.sin(effectiveRot);
      const fwdZ = Math.cos(effectiveRot);

      if (moveType === 'lob') {
        // High arcing chip shot to clear the goalkeeper
        const lobHoriz = 20.5 * (options?.shotPowerScale ?? 1.0) * (this.adminMods.superPowerShot ? 1.25 : 1.0);
        const jitter = options?.accuracyJitter ?? 0.9;
        this.ball.vx = fwdX * lobHoriz + (Math.random() - 0.5) * jitter;
        this.ball.vy = 13.8 + Math.random() * 1.6;
        this.ball.vz = fwdZ * lobHoriz + (Math.random() - 0.5) * jitter;
        this.curveSpin = 0;
        this.ball.isSuperShot = this.adminMods.superPowerShot;
        this.releaseCarrier(pid, 0.28);
        sound.playLob();
        return { interacted: true, outcome: 'lob', stunnedOpponent: false };
      } else if (moveType === 'power') {
        // Blistering Super Shot with fiery speed & subtle curling swerve
        const powerSpeed = 47.5 * (options?.shotPowerScale ?? 1.0) * (this.adminMods.superPowerShot ? 1.32 : 1.0);
        const jitter = options?.accuracyJitter ?? 1.1;
        this.ball.vx = fwdX * powerSpeed + (Math.random() - 0.5) * jitter;
        this.ball.vy = 5.4 + Math.random() * 2.4;
        this.ball.vz = fwdZ * powerSpeed + (Math.random() - 0.5) * jitter;
        this.curveSpin = (options?.curveBias ?? (this.ball.z > 0 ? -7.5 : 7.5));
        this.ball.isSuperShot = true;
        this.releaseCarrier(pid, 0.3);
        sound.playPowerShot(false);
        return { interacted: true, outcome: 'power', stunnedOpponent: false };
      } else if (moveType === 'bicycle') {
        // Acrobatic overhead bicycle kick — extra lethal if ball is already airborne!
        const airborneBonus = this.ball.y > this.getBallRadius() + 0.5 ? 1.16 : 1.04;
        const speed = 43.0 * airborneBonus * (options?.shotPowerScale ?? 1.0) * (this.adminMods.superPowerShot ? 1.32 : 1.0);
        const jitter = options?.accuracyJitter ?? 0.95;
        this.ball.vx = fwdX * speed + (Math.random() - 0.5) * jitter;
        this.ball.vy = this.ball.y > 1.8 ? 4.2 : 8.4;
        this.ball.vz = fwdZ * speed + (Math.random() - 0.5) * jitter;
        this.curveSpin = (options?.curveBias ?? (this.ball.z > 0 ? -5.5 : 5.5));
        this.ball.isSuperShot = true;
        this.releaseCarrier(pid, 0.32);
        sound.playPowerShot(true);
        return { interacted: true, outcome: 'bicycle', stunnedOpponent: false };
      } else if (moveType === 'skill') {
        // Elastico / Ruleta burst: keeps ball magnetized to a crisp lateral burst past defenders
        const burstSpeed = 14.5;
        this.ball.x = playerX + fwdX * (1.3 + radiusBonus);
        this.ball.z = playerZ + fwdZ * (1.3 + radiusBonus);
        this.ball.vx = fwdX * burstSpeed;
        this.ball.vz = fwdZ * burstSpeed;
        this.ball.vy = 1.45;
        this.curveSpin = 0;
        this.ball.isSuperShot = false;
        if (pid) this.carrierId = pid;
        sound.playSkillMove();
        return { interacted: true, outcome: 'skill', stunnedOpponent };
      } else if (isKicking) {
        const basePower = options?.isPass ? 27.5 : isSprinting ? 36.5 : 29.0;
        const shotPower = basePower * (options?.shotPowerScale ?? 1.0) * (options?.isPass ? 1.0 : adminShotBoost);
        const jitter = options?.accuracyJitter ?? (options?.isPass ? 0.35 : 1.8);
        this.ball.vx = fwdX * shotPower + (Math.random() - 0.5) * jitter;
        this.ball.vy = options?.isPass ? 1.55 : 6.2 + Math.random() * 3.6;
        this.ball.vz = fwdZ * shotPower + (Math.random() - 0.5) * jitter;
        this.curveSpin = 0;
        this.ball.isSuperShot = !options?.isPass && this.adminMods.superPowerShot;
        this.releaseCarrier(pid, 0.25);

        sound.playKick(options?.isPass ? 0.72 : 1.0);
        return { interacted: true, outcome: 'kick', stunnedOpponent };
      } else if (isTackling) {
        const cleanSteal = Math.random() < (isHuman ? 0.72 : 0.52);
        this.curveSpin = 0;
        this.ball.isSuperShot = false;

        if (cleanSteal) {
          this.ball.vx = fwdX * 12.5;
          this.ball.vy = 1.2;
          this.ball.vz = fwdZ * 12.5;
          this.carrierId = pid || null;
          sound.playSlide();
          sound.playKick(0.75);
          return { interacted: true, outcome: 'tackle_steal', stunnedOpponent };
        } else {
          const scatterSign = Math.random() > 0.5 ? 1 : -1;
          const scatterAngle = effectiveRot + scatterSign * (0.9 + Math.random() * 1.4);
          const deflectSpeed = 16 + Math.random() * 9;
          this.ball.vx = Math.sin(scatterAngle) * deflectSpeed;
          this.ball.vy = 3.5 + Math.random() * 4.5;
          this.ball.vz = Math.cos(scatterAngle) * deflectSpeed;
          this.releaseCarrier(pid, 0.24);
          sound.playSlide();
          sound.playKick(0.85);
          return { interacted: true, outcome: 'tackle_loose', stunnedOpponent };
        }
      } else if (!blockedBySelfKick) {
        // Magnetic Sticky Ball Possession & Turning Dribble!
        // If another player already cleanly holds the ball, a non-tackling bot needs to get very close (<1.3m) to contest it,
        // whereas the human player can easily win the ball at generous range!
        const ballHeightOk = this.ball.y <= this.getBallRadius() + 2.4;
        if (!ballHeightOk) {
          return { interacted: false, outcome: 'none', stunnedOpponent: false };
        }

        const someoneElseCarries = Boolean(this.carrierId && pid && this.carrierId !== pid);
        if (someoneElseCarries && !isHuman && dist > 1.35) {
          return { interacted: false, outcome: 'none', stunnedOpponent: false };
        }

        if (pid) {
          this.carrierId = pid;
        }

        const carryDist = (isHuman ? 1.2 : 1.25) + radiusBonus;
        const targetBallX = playerX + fwdX * carryDist;
        const targetBallZ = playerZ + fwdZ * carryDist;

        if (isHuman) {
          // Smoothly orbit & stick the ball directly in front of the player's boots as they turn in any direction!
          this.ball.x += (targetBallX - this.ball.x) * 0.48;
          this.ball.z += (targetBallZ - this.ball.z) * 0.48;
          const dribbleSpd = options?.dribbleSpeed ?? (isSprinting ? 11.5 : 7.8);
          this.ball.vx = this.ball.vx * 0.15 + fwdX * dribbleSpd * 0.85;
          this.ball.vz = this.ball.vz * 0.15 + fwdZ * dribbleSpd * 0.85;
          if (this.ball.y <= this.getBallRadius() + 0.15) {
            this.ball.y = this.getBallRadius();
            this.ball.vy = 0;
          } else {
            this.ball.vy *= 0.6;
          }
        } else {
          const pushPower = options?.dribbleSpeed ?? (isSprinting ? 13.5 : 8.5);
          this.ball.vx = this.ball.vx * 0.25 + fwdX * pushPower * 0.75;
          this.ball.vz = this.ball.vz * 0.25 + fwdZ * pushPower * 0.75;
          if (dist < 1.25 + radiusBonus) {
            this.ball.x = targetBallX;
            this.ball.z = targetBallZ;
          }
          if (this.ball.y <= this.getBallRadius() + 0.1) {
            this.ball.vy = 0.65;
          }
        }

        return { interacted: false, outcome: 'dribble', stunnedOpponent: false };
      }
    } else if (isCurrentCarrier && dist > 4.2 + radiusBonus) {
      // Lost possession if ball got knocked far away
      this.carrierId = null;
    }

    return { interacted: false, outcome: 'none', stunnedOpponent };
  }
}
