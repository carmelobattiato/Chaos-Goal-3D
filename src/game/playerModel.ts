import * as THREE from 'three';
import { PlayerAnim, PlayerState } from '../types/game';

function createJerseyTexture(team: 'red' | 'blue', jerseyNum: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const primary = team === 'red' ? '#dc2626' : '#0284c7';
  const secondary = team === 'red' ? '#991b1b' : '#0369a1';
  const accent = team === 'red' ? '#fbbf24' : '#38bdf8';

  // Fabric base gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, primary);
  grad.addColorStop(1, secondary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Pro vertical kit stripes
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let x = 0; x < 512; x += 64) {
    ctx.fillRect(x, 0, 32, 512);
  }

  // Chest sponsor/accent band
  ctx.fillStyle = accent;
  ctx.fillRect(0, 210, 512, 26);

  // Subtle fabric weave lines
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < 512; y += 8) {
    ctx.fillRect(0, y, 512, 2);
  }

  // Front & Back Jersey Number
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(15,23,42,0.75)';
  ctx.lineWidth = 8;
  ctx.font = '900 130px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Back number (cylinder seam wraps around; place on opposite sides)
  ctx.strokeText(String(jerseyNum), 128, 280);
  ctx.fillText(String(jerseyNum), 128, 280);

  ctx.strokeText(String(jerseyNum), 384, 280);
  ctx.fillText(String(jerseyNum), 384, 280);

  // Club Crest badge on chest
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(384, 130, 24, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.52)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export class PlayerMesh extends THREE.Group {
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public torso: THREE.Mesh;
  public head: THREE.Group;
  public haloRing: THREE.Mesh;
  public selfRing: THREE.Mesh;
  public nameSprite: THREE.Sprite;
  public team: 'red' | 'blue';
  public playerId: string;

  private animTimer: number = 0;

  constructor(state: PlayerState, isSelf: boolean = false) {
    super();
    this.playerId = state.id;
    this.team = state.team;

    const jerseyColor = state.team === 'red' ? 0xdc2626 : 0x0284c7;
    const accentColor = state.team === 'red' ? 0xfbbf24 : 0x38bdf8;
    const jerseyNum = state.jerseyNumber ?? (state.isBot ? 9 : 10);

    // 0. Soft Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.75, 1.75);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.025;
    this.add(contactShadow);

    // Self Player Tactical Ring (FIFA active indicator)
    const selfRingGeo = new THREE.RingGeometry(0.62, 0.78, 32);
    const selfRingMat = new THREE.MeshBasicMaterial({
      color: state.team === 'red' ? 0xfbbf24 : 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isSelf ? 0.85 : 0.0,
    });
    this.selfRing = new THREE.Mesh(selfRingGeo, selfRingMat);
    this.selfRing.rotation.x = -Math.PI / 2;
    this.selfRing.position.y = 0.035;
    this.add(this.selfRing);

    // 1. Athletic Tapered Torso with Pro Kit Texture
    const torsoGeo = new THREE.CylinderGeometry(0.48, 0.37, 1.15, 16);
    const torsoMat = new THREE.MeshStandardMaterial({
      map: createJerseyTexture(state.team, jerseyNum),
      roughness: 0.62,
      metalness: 0.05,
    });
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 1.62;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.add(this.torso);

    // Jersey Collar
    const collarGeo = new THREE.TorusGeometry(0.22, 0.055, 8, 18);
    const collarMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.45 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.56;
    this.torso.add(collar);

    // 2. Two-tone Shorts
    const shortsGeo = new THREE.CylinderGeometry(0.41, 0.46, 0.48, 16);
    const shortsMat = new THREE.MeshStandardMaterial({
      color: state.team === 'red' ? 0x111827 : 0xf8fafc,
      roughness: 0.72,
    });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 1.05;
    shorts.castShadow = true;
    this.add(shorts);

    // 3. Neck, Head, Eyes & Styled Hair
    const skinColor = state.isBot ? 0xe0ac69 : 0xffd1ba;
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });

    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.22, 10);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 2.22;
    this.add(neck);

    this.head = new THREE.Group();
    this.head.position.y = 2.52;

    const headGeo = new THREE.SphereGeometry(0.34, 18, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Hair Sculpt
    const hairGeo = new THREE.SphereGeometry(0.36, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.56);
    const hairMat = new THREE.MeshStandardMaterial({
      color: state.isBot ? 0x0f172a : 0x3b2314,
      roughness: 0.82,
    });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.y = 0.05;
    hairMesh.rotation.x = -0.22;
    this.head.add(hairMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.11, 0.03, 0.3);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.11, 0.03, 0.3);
    this.head.add(leftEye, rightEye);

    this.add(this.head);

    // 4. Arms (Short Sleeve + Forearm + Wristband)
    const sleeveGeo = new THREE.CylinderGeometry(0.14, 0.125, 0.34, 10);
    const forearmGeo = new THREE.CylinderGeometry(0.105, 0.085, 0.48, 10);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.55 });
    const bandMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4 });
    const bandGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.09, 10);

    const buildArm = (side: -1 | 1) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.57, 2.04, 0);
      const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
      sleeve.position.y = -0.16;
      sleeve.castShadow = true;
      const forearm = new THREE.Mesh(forearmGeo, skinMat);
      forearm.position.y = -0.52;
      forearm.castShadow = true;
      const wristBand = new THREE.Mesh(bandGeo, bandMat);
      wristBand.position.y = -0.68;
      armGroup.add(sleeve, forearm, wristBand);
      return armGroup;
    };

    this.leftArm = buildArm(-1);
    this.rightArm = buildArm(1);
    this.add(this.leftArm, this.rightArm);

    // 5. Legs: Thigh + High Team Sock + Sculpted Pro Boot
    const thighGeo = new THREE.CylinderGeometry(0.155, 0.135, 0.42, 10);
    const sockGeo = new THREE.CylinderGeometry(0.13, 0.105, 0.46, 10);
    const sockMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.65 });
    const sockStripeGeo = new THREE.CylinderGeometry(0.134, 0.134, 0.08, 10);
    const sockStripeMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5 });

    const bootBodyGeo = new THREE.BoxGeometry(0.24, 0.17, 0.46);
    const bootSoleGeo = new THREE.BoxGeometry(0.25, 0.04, 0.48);
    const bootMat = new THREE.MeshStandardMaterial({
      color: state.team === 'red' ? 0xf8fafc : 0x0f172a,
      roughness: 0.28,
      metalness: 0.35,
    });
    const soleMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4, metalness: 0.5 });

    const buildLeg = (side: -1 | 1) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.22, 0.9, 0);

      const thigh = new THREE.Mesh(thighGeo, skinMat);
      thigh.position.y = -0.21;
      thigh.castShadow = true;

      const sock = new THREE.Mesh(sockGeo, sockMat);
      sock.position.y = -0.62;
      sock.castShadow = true;

      const sockTrim = new THREE.Mesh(sockStripeGeo, sockStripeMat);
      sockTrim.position.y = -0.44;

      const boot = new THREE.Mesh(bootBodyGeo, bootMat);
      boot.position.set(0, -0.82, 0.09);
      boot.castShadow = true;

      const sole = new THREE.Mesh(bootSoleGeo, soleMat);
      sole.position.set(0, -0.89, 0.09);

      legGroup.add(thigh, sock, sockTrim, boot, sole);
      return legGroup;
    };

    this.leftLeg = buildLeg(-1);
    this.rightLeg = buildLeg(1);
    this.add(this.leftLeg, this.rightLeg);

    // 6. Voice Chat Speaking Halo Indicator
    const ringGeo = new THREE.RingGeometry(0.84, 0.98, 28);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.haloRing = new THREE.Mesh(ringGeo, ringMat);
    this.haloRing.rotation.x = -Math.PI / 2;
    this.haloRing.position.y = 0.045;
    this.add(this.haloRing);

    // 7. Floating Name Sprite
    this.nameSprite = this.createNameSprite(state.name, state.team, state.isBot);
    this.nameSprite.position.y = 3.35;
    this.add(this.nameSprite);

    this.position.set(state.x, state.y, state.z);
    this.rotation.y = state.rotY;
  }

  private createNameSprite(name: string, team: 'red' | 'blue', isBot?: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 68;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
    ctx.roundRect(10, 10, 260, 48, 12);
    ctx.fill();

    ctx.strokeStyle = team === 'red' ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = (isBot ? 'BOT • ' : '') + (name.length > 13 ? name.substring(0, 11) + '..' : name);
    ctx.fillText(label, 140, 35);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.3, 0.8, 1);
    return sprite;
  }

  public updateAnimation(anim: PlayerAnim, delta: number, speed: number = 1.0) {
    this.animTimer += delta * 12 * speed;

    // Reset acrobatic offsets before applying the active pose
    this.torso.rotation.z = 0;
    this.torso.position.y = 1.62;
    this.head.position.y = 2.52;
    this.head.rotation.x = 0;

    if (anim === 'run') {
      const angle = Math.sin(this.animTimer) * 0.78;
      this.leftLeg.rotation.x = angle;
      this.rightLeg.rotation.x = -angle;

      this.leftArm.rotation.x = -angle * 0.85;
      this.rightArm.rotation.x = angle * 0.85;

      this.torso.rotation.x = 0.14;
      this.torso.rotation.y = Math.sin(this.animTimer) * 0.16;
      this.head.position.y = 2.52 + Math.abs(Math.sin(this.animTimer * 2)) * 0.05;
    } else if (anim === 'kick') {
      this.rightLeg.rotation.x = -Math.PI / 2.4;
      this.leftLeg.rotation.x = 0.25;
      this.leftArm.rotation.x = -0.5;
      this.rightArm.rotation.x = 0.5;
      this.torso.rotation.x = -0.18;
      this.torso.rotation.y = 0;
    } else if (anim === 'lob') {
      // Delicate scoop / chip shot: leaned back slightly with high follow-through
      this.rightLeg.rotation.x = -Math.PI / 2.05;
      this.leftLeg.rotation.x = 0.18;
      this.leftArm.rotation.x = -0.75;
      this.rightArm.rotation.x = 0.35;
      this.torso.rotation.x = -0.28;
      this.torso.rotation.y = 0.18;
    } else if (anim === 'power') {
      // Explosive power shot strike with athletic torque
      this.rightLeg.rotation.x = -Math.PI / 1.85;
      this.leftLeg.rotation.x = 0.45;
      this.leftArm.rotation.x = -1.1;
      this.rightArm.rotation.x = 0.95;
      this.torso.rotation.x = -0.32;
      this.torso.rotation.y = -0.38;
      this.torso.rotation.z = 0.14;
    } else if (anim === 'skill') {
      // Dynamic 360° Ruleta / Elastico dribble twist
      const spin = this.animTimer * 2.1;
      this.torso.rotation.y = Math.sin(spin) * 1.15;
      this.torso.rotation.x = 0.22;
      this.torso.rotation.z = Math.cos(spin) * 0.18;
      this.leftLeg.rotation.x = Math.sin(spin) * 0.95;
      this.rightLeg.rotation.x = -Math.sin(spin) * 0.95;
      this.leftArm.rotation.x = -0.55;
      this.rightArm.rotation.x = 0.55;
      this.head.position.y = 2.48;
    } else if (anim === 'bicycle') {
      // Overhead acrobatic bicycle kick (rovesciata) in mid-air
      this.torso.position.y = 1.92;
      this.head.position.y = 2.15;
      this.torso.rotation.x = -1.25;
      this.torso.rotation.y = 0;
      this.rightLeg.rotation.x = -2.15;
      this.leftLeg.rotation.x = -0.65;
      this.leftArm.rotation.x = -1.35;
      this.rightArm.rotation.x = -1.35;
    } else if (anim === 'slide') {
      // Dramatic low lunge slide tackle without sinking legs underground
      this.rightLeg.rotation.x = -Math.PI / 2.2;
      this.leftLeg.rotation.x = 0.55;
      this.leftArm.rotation.x = 0.65;
      this.rightArm.rotation.x = -0.55;
      this.torso.rotation.x = -0.45;
      this.torso.rotation.y = 0;
    } else {
      const breath = Math.sin(this.animTimer * 0.3) * 0.04;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = breath;
      this.rightArm.rotation.x = -breath;
      this.torso.rotation.x = 0;
      this.torso.rotation.y = 0;
      this.torso.position.y = 1.62 + breath * 0.3;
    }
  }

  public setSpeaking(isTalking: boolean) {
    const mat = this.haloRing.material as THREE.MeshBasicMaterial;
    if (isTalking) {
      mat.opacity = 0.85;
      this.haloRing.scale.setScalar(1.0 + Math.sin(Date.now() * 0.015) * 0.18);
    } else {
      mat.opacity = 0;
    }
  }
}
