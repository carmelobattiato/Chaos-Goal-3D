import * as THREE from 'three';
import { MapId, MapConfig } from '../types/game';

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  stadium: {
    id: 'stadium',
    name: 'Stadio Internazionale',
    theme: 'FIFA 26 Night Pro',
    description: 'Manto erboso HD a doppio taglio, tribune a due anelli, maxischermi LED e riflettori volumetrici.',
    accentHex: '#10b981',
    skyColor: 0x0b162a,
    pitchColor: 0x1e6b3a,
    pitchStripeColor: 0x268248,
    ambientLight: 0xdbeafe,
    keyLight: 0xfff7ed,
    bounceMultiplier: 1.0,
    frictionMultiplier: 0.98,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    traction: 1.0,
    staminaDrainMultiplier: 1.0,
    hasMovementEffect: false,
    movementLabel: 'Nessun effetto',
    specialEffect: 'confetti',
  },
  ice: {
    id: 'ice',
    name: 'Pista di Ghiaccio Polare',
    theme: 'Ghiaccio Vivo',
    description: 'Lastra di ghiaccio vivo con iceberg e aurora boreale: derapate lunghe e alta velocità!',
    accentHex: '#00e5ff',
    skyColor: 0x071e36,
    pitchColor: 0x8be9fd,
    pitchStripeColor: 0x67d7f4,
    ambientLight: 0xcffafe,
    keyLight: 0xffffff,
    bounceMultiplier: 1.04,
    frictionMultiplier: 0.996,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.2,
    traction: 0.16,
    staminaDrainMultiplier: 0.88,
    hasMovementEffect: true,
    movementLabel: 'Ghiaccio Scivoloso',
    specialEffect: 'ice',
  },
  swamp: {
    id: 'swamp',
    name: 'Palude Fangosa',
    theme: 'Fango Pesante',
    description: 'Acquitrino muschioso con lucciole e pozze di fango: corsa rallentata e fatica intensa.',
    accentHex: '#84cc16',
    skyColor: 0x0e1c14,
    pitchColor: 0x2e4023,
    pitchStripeColor: 0x3b4d2a,
    ambientLight: 0xbef264,
    keyLight: 0xd9f99d,
    bounceMultiplier: 0.62,
    frictionMultiplier: 0.91,
    gravityMultiplier: 1.05,
    playerSpeedMultiplier: 0.72,
    traction: 0.78,
    staminaDrainMultiplier: 1.38,
    hasMovementEffect: true,
    movementLabel: 'Fango Pesante (-28%)',
    specialEffect: 'fireflies',
  },
  wind: {
    id: 'wind',
    name: 'Canyon del Vento',
    theme: 'Tempesta di Raffiche',
    description: 'Gola desertica con turbine eoliche giganti: raffiche di vento spingono palla e giocatori!',
    accentHex: '#f59e0b',
    skyColor: 0x3b1f14,
    pitchColor: 0xb4532a,
    pitchStripeColor: 0x9c4522,
    ambientLight: 0xfde68a,
    keyLight: 0xffb347,
    bounceMultiplier: 1.05,
    frictionMultiplier: 0.98,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    traction: 0.86,
    staminaDrainMultiplier: 1.12,
    windStrength: 5.2,
    hasMovementEffect: true,
    movementLabel: 'Raffiche di Vento',
    specialEffect: 'wind',
  },
  speedway: {
    id: 'speedway',
    name: 'Circuito Turbo Neon',
    theme: 'Pista F1 Turbo',
    description: 'Asfalto da Formula 1 con cordoli rossi e frecce turbo: scatti folgoranti +36% velocità!',
    accentHex: '#ef4444',
    skyColor: 0x090d1a,
    pitchColor: 0x181f2e,
    pitchStripeColor: 0x212a3d,
    ambientLight: 0xe2e8f0,
    keyLight: 0x38bdf8,
    bounceMultiplier: 1.12,
    frictionMultiplier: 0.991,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.36,
    traction: 1.0,
    staminaDrainMultiplier: 0.82,
    hasMovementEffect: true,
    movementLabel: 'Turbo Velocità (+36%)',
    specialEffect: 'turbo',
  },
  sand: {
    id: 'sand',
    name: 'Calcio su Sabbia',
    theme: 'Copacabana Sunset',
    description: 'Arena sulla costa tropicale con sabbia dorata scolpita, palme e mare cristallino.',
    accentHex: '#f59e0b',
    skyColor: 0xff9f59,
    pitchColor: 0xe0a96d,
    pitchStripeColor: 0xcca05c,
    ambientLight: 0xffedd5,
    keyLight: 0xff8800,
    bounceMultiplier: 1.0,
    frictionMultiplier: 0.98,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    traction: 1.0,
    staminaDrainMultiplier: 1.0,
    hasMovementEffect: false,
    movementLabel: 'Nessun effetto',
    specialEffect: 'dust',
  },
  underwater: {
    id: 'underwater',
    name: "Bolla Sotto l'Acqua",
    theme: 'Cupola Abissale',
    description: 'Biosfera sottomarina illuminata da coralli bioluminescenti, bolle e resistenza fluida.',
    accentHex: '#06b6d4',
    skyColor: 0x021222,
    pitchColor: 0x003554,
    pitchStripeColor: 0x051923,
    ambientLight: 0x22d3ee,
    keyLight: 0x00bbf9,
    bounceMultiplier: 1.15,
    frictionMultiplier: 0.985,
    gravityMultiplier: 0.82,
    playerSpeedMultiplier: 0.82,
    traction: 0.5,
    staminaDrainMultiplier: 0.92,
    hasMovementEffect: true,
    movementLabel: 'Resistenza Acqua',
    specialEffect: 'bubbles',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon Arena',
    theme: 'Synthwave 2099',
    description: 'Campo olografico ad alta tensione con portali laser e archi al neon.',
    accentHex: '#ec4899',
    skyColor: 0x090617,
    pitchColor: 0x120e29,
    pitchStripeColor: 0x1d1842,
    ambientLight: 0xff007f,
    keyLight: 0x00f0ff,
    bounceMultiplier: 1.0,
    frictionMultiplier: 0.98,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    traction: 1.0,
    staminaDrainMultiplier: 1.0,
    hasMovementEffect: false,
    movementLabel: 'Nessun effetto',
    specialEffect: 'lasers',
  },
  snow: {
    id: 'snow',
    name: 'Stadio Artico Innevato',
    theme: 'Alpi Glaciali',
    description: 'Neve soffice, pini alpini e fiocchi che cadono con gameplay classico bilanciato.',
    accentHex: '#38bdf8',
    skyColor: 0x162a45,
    pitchColor: 0xe2eef8,
    pitchStripeColor: 0xcbe0f2,
    ambientLight: 0xe0f2fe,
    keyLight: 0xf8fafc,
    bounceMultiplier: 1.0,
    frictionMultiplier: 0.98,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    traction: 1.0,
    staminaDrainMultiplier: 1.0,
    hasMovementEffect: false,
    movementLabel: 'Nessun effetto',
    specialEffect: 'snow',
  },
  volcano: {
    id: 'volcano',
    name: 'Arena Vulcanica',
    theme: 'Cratere di Magma',
    description: 'Basalto incandescente, fiumi di lava e lapilli luminosi in un cratere spettacolare.',
    accentHex: '#f97316',
    skyColor: 0x1c0806,
    pitchColor: 0x261717,
    pitchStripeColor: 0x361c1a,
    ambientLight: 0xfb923c,
    keyLight: 0xff5722,
    bounceMultiplier: 1.0,
    frictionMultiplier: 0.98,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    traction: 1.0,
    staminaDrainMultiplier: 1.0,
    hasMovementEffect: false,
    movementLabel: 'Nessun effetto',
    specialEffect: 'embers',
  },
  rooftop: {
    id: 'rooftop',
    name: 'Tetto sul Grattacielo',
    theme: 'Tokyo Skyline',
    description: 'Campo sintetico urbano sospeso tra i grattacieli illuminati nella notte metropolitana.',
    accentHex: '#818cf8',
    skyColor: 0x14132b,
    pitchColor: 0x1e293b,
    pitchStripeColor: 0x283548,
    ambientLight: 0xa5b4fc,
    keyLight: 0xfde68a,
    bounceMultiplier: 1.0,
    frictionMultiplier: 0.98,
    gravityMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    traction: 1.0,
    staminaDrainMultiplier: 1.0,
    hasMovementEffect: false,
    movementLabel: 'Nessun effetto',
    specialEffect: 'city',
  },
  space: {
    id: 'space',
    name: 'Stadio Lunare Orbitale',
    theme: 'Gravità Zero',
    description: 'Base lunare con vista sulla Terra, falcata fluttuante e gravità ridotta per rovesciate epiche!',
    accentHex: '#fbbf24',
    skyColor: 0x02040d,
    pitchColor: 0x334155,
    pitchStripeColor: 0x475569,
    ambientLight: 0xfef3c7,
    keyLight: 0xf8fafc,
    bounceMultiplier: 1.22,
    frictionMultiplier: 0.988,
    gravityMultiplier: 0.62,
    playerSpeedMultiplier: 1.12,
    traction: 0.34,
    staminaDrainMultiplier: 0.78,
    hasMovementEffect: true,
    movementLabel: 'Gravità Lunare',
    specialEffect: 'stars',
  },
};

// Dynamic wind gust vector shared by Ball Physics, Human Movement, Bot AI, and 3D Wind Streaks
export function getMapWindVector(mapId: MapId, elapsedSec: number): { wx: number; wz: number } {
  const strength = MAP_CONFIGS[mapId]?.windStrength ?? 0;
  if (strength <= 0) return { wx: 0, wz: 0 };

  // Smoothly rotating & pulsing canyon wind gusts so players clearly feel lateral & diagonal pushes
  const gustWave = 0.72 + 0.42 * Math.sin(elapsedSec * 0.85);
  const angle = Math.sin(elapsedSec * 0.24) * 1.15 + 0.95; // Mostly cross-pitch (Z) with diagonal X sweep
  return {
    wx: Math.cos(angle) * strength * gustWave,
    wz: Math.sin(angle) * strength * gustWave,
  };
}

export const PITCH_WIDTH = 50; // X axis (-25 to 25)
export const PITCH_LENGTH = 70; // Z axis (-35 to 35)
export const GOAL_WIDTH = 12; // Z size of goal
export const GOAL_DEPTH = 5;
export const GOAL_HEIGHT = 4.5;

// High-resolution FIFA 26 procedural pitch texture generator
function createPitchTexture(mapId: MapId, isSoftwareGl: boolean): THREE.CanvasTexture {
  const size = isSoftwareGl ? 1024 : 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const s = size / 1024; // Scale factor relative to 1024 base

  if (mapId === 'stadium') {
    // Rich FIFA-style manicured emerald grass stripes + subtle cross-cut
    ctx.fillStyle = '#1b5e34';
    ctx.fillRect(0, 0, size, size);

    const stripeCount = 16;
    const stripeW = size / stripeCount;
    for (let i = 0; i < stripeCount; i += 2) {
      ctx.fillStyle = '#247542';
      ctx.fillRect(i * stripeW, 0, stripeW, size);
    }

    // Subtle horizontal cross-mow shading
    const rowCount = 12;
    const rowH = size / rowCount;
    for (let j = 0; j < rowCount; j += 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.fillRect(0, j * rowH, size, rowH);
    }

    // Natural grass micro-blade texture
    const bladeCount = isSoftwareGl ? 3500 : 12000;
    for (let i = 0; i < bladeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 2 * s, 4 * s);
    }

    // Subtle penalty box turf wear
    const wearLeft = ctx.createRadialGradient(85 * s, 512 * s, 10 * s, 85 * s, 512 * s, 90 * s);
    wearLeft.addColorStop(0, 'rgba(130, 110, 65, 0.18)');
    wearLeft.addColorStop(1, 'rgba(130, 110, 65, 0)');
    ctx.fillStyle = wearLeft;
    ctx.fillRect(0, 380 * s, 180 * s, 260 * s);

    const wearRight = ctx.createRadialGradient(939 * s, 512 * s, 10 * s, 939 * s, 512 * s, 90 * s);
    wearRight.addColorStop(0, 'rgba(130, 110, 65, 0.18)');
    wearRight.addColorStop(1, 'rgba(130, 110, 65, 0)');
    ctx.fillStyle = wearRight;
    ctx.fillRect(844 * s, 380 * s, 180 * s, 260 * s);

    // Crisp Chalk White Markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.lineWidth = 9 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();

    // Center circle & dot
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 112 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Boxes & 6-yard Boxes (Left & Right)
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(40 * s, 392 * s, 72 * s, 240 * s);

    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(912 * s, 392 * s, 72 * s, 240 * s);

    // Penalty Spots
    ctx.beginPath();
    ctx.arc(170 * s, 512 * s, 7 * s, 0, Math.PI * 2);
    ctx.arc(854 * s, 512 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Arcs ("lunette")
    ctx.beginPath();
    ctx.arc(170 * s, 512 * s, 92 * s, -0.72, 0.72);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(854 * s, 512 * s, 92 * s, Math.PI - 0.72, Math.PI + 0.72);
    ctx.stroke();

    // Corner Arcs
    const corners = [
      [40 * s, 40 * s, 0, Math.PI / 2],
      [984 * s, 40 * s, Math.PI / 2, Math.PI],
      [984 * s, 984 * s, Math.PI, Math.PI * 1.5],
      [40 * s, 984 * s, Math.PI * 1.5, Math.PI * 2],
    ];
    corners.forEach(([cx, cy, a1, a2]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 24 * s, a1, a2);
      ctx.stroke();
    });
  } else if (mapId === 'sand') {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#ecc17f');
    grad.addColorStop(0.5, '#e2b068');
    grad.addColorStop(1, '#d89f54');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 14000; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(130,85,35,0.09)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 3 * s, 2 * s);
    }

    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 14 * s;
    ctx.strokeRect(50 * s, 50 * s, 924 * s, 924 * s);

    ctx.beginPath();
    ctx.moveTo(512 * s, 50 * s);
    ctx.lineTo(512 * s, 974 * s);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 100 * s, 0, Math.PI * 2);
    ctx.stroke();
  } else if (mapId === 'underwater') {
    const grad = ctx.createRadialGradient(512 * s, 512 * s, 80 * s, 512 * s, 512 * s, 600 * s);
    grad.addColorStop(0, '#043852');
    grad.addColorStop(1, '#021826');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(0, 245, 212, 0.14)';
    ctx.lineWidth = 2 * s;
    for (let x = 0; x < size; x += 64 * s) {
      for (let y = 0; y < size; y += 64 * s) {
        ctx.strokeRect(x, y, 64 * s, 64 * s);
      }
    }

    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 16 * s;
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);

    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 110 * s, 0, Math.PI * 2);
    ctx.stroke();
  } else if (mapId === 'snow') {
    // Crisp frosted snow stripes + high-contrast royal/cyan winter lines
    ctx.fillStyle = '#dcebf7';
    ctx.fillRect(0, 0, size, size);

    const stripeW = size / 14;
    for (let i = 0; i < 14; i += 2) {
      ctx.fillStyle = '#cbe0f2';
      ctx.fillRect(i * stripeW, 0, stripeW, size);
    }

    const flakeCount = isSoftwareGl ? 3000 : 9000;
    for (let i = 0; i < flakeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(148,197,235,0.22)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 3 * s, 3 * s);
    }

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 11 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 112 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else if (mapId === 'volcano') {
    // Dark charred basalt with glowing orange-gold magma veins
    ctx.fillStyle = '#1f1212';
    ctx.fillRect(0, 0, size, size);

    const stripeW = size / 12;
    for (let i = 0; i < 12; i += 2) {
      ctx.fillStyle = '#291616';
      ctx.fillRect(i * stripeW, 0, stripeW, size);
    }

    // Glowing volcanic fissure cracks
    ctx.strokeStyle = 'rgba(255, 87, 34, 0.28)';
    ctx.lineWidth = 3 * s;
    for (let i = 0; i < 28; i++) {
      let cx = Math.random() * size;
      let cy = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let k = 0; k < 5; k++) {
        cx += (Math.random() - 0.5) * 90 * s;
        cy += (Math.random() - 0.5) * 90 * s;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    ctx.shadowColor = '#ff5722';
    ctx.shadowBlur = 18 * s;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 11 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 110 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else if (mapId === 'rooftop') {
    // Urban Tokyo rooftop futsal turf with sleek indigo-teal stripes & amber lines
    ctx.fillStyle = '#16253b';
    ctx.fillRect(0, 0, size, size);

    const stripeW = size / 16;
    for (let i = 0; i < 16; i += 2) {
      ctx.fillStyle = '#1e324f';
      ctx.fillRect(i * stripeW, 0, stripeW, size);
    }

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.strokeStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 112 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#f8fafc';
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else if (mapId === 'space') {
    // Lunar regolith surface with craters & gold holographic arena lines
    const grad = ctx.createRadialGradient(512 * s, 512 * s, 60 * s, 512 * s, 512 * s, 660 * s);
    grad.addColorStop(0, '#475569');
    grad.addColorStop(1, '#263042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 36; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = (12 + Math.random() * 34) * s;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.14)';
      ctx.lineWidth = 2 * s;
      ctx.stroke();
    }

    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 16 * s;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 112 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else if (mapId === 'ice') {
    // Polar Glacial Ice Sheet with reflective skate scratches & crisp hockey/soccer blue-white lines
    const grad = ctx.createRadialGradient(512 * s, 512 * s, 60 * s, 512 * s, 512 * s, 680 * s);
    grad.addColorStop(0, '#c7f4ff');
    grad.addColorStop(0.55, '#8ee0fa');
    grad.addColorStop(1, '#58c3ec');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Subtle crystalline ice veins & skate marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.lineWidth = 2 * s;
    for (let i = 0; i < 160; i++) {
      const x1 = Math.random() * size;
      const y1 = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (Math.random() - 0.5) * 130 * s, y1 + (Math.random() - 0.5) * 80 * s);
      ctx.stroke();
    }

    // Crisp Ice Rink Blue & Red Accent Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 11 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 10 * s;
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 114 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else if (mapId === 'swamp') {
    // Mossy Marsh Turf with glossy mud puddles & glowing lime-chartreuse lines
    ctx.fillStyle = '#2b3d20';
    ctx.fillRect(0, 0, size, size);

    const stripeW = size / 12;
    for (let i = 0; i < 12; i += 2) {
      ctx.fillStyle = '#344926';
      ctx.fillRect(i * stripeW, 0, stripeW, size);
    }

    // Organic dark mud puddles scattered across the marsh pitch
    for (let i = 0; i < 48; i++) {
      const px = (80 + Math.random() * 864) * s;
      const py = (80 + Math.random() * 864) * s;
      const rx = (28 + Math.random() * 58) * s;
      const ry = (18 + Math.random() * 38) * s;
      const mudGrad = ctx.createRadialGradient(px, py, 4 * s, px, py, rx);
      mudGrad.addColorStop(0, 'rgba(56, 38, 22, 0.82)');
      mudGrad.addColorStop(0.7, 'rgba(68, 48, 28, 0.55)');
      mudGrad.addColorStop(1, 'rgba(68, 48, 28, 0)');
      ctx.fillStyle = mudGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 110 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else if (mapId === 'wind') {
    // Terracotta Red Canyon Sandstone Turf with wind-carved streaks & bright cream/gold lines
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#c2592d');
    grad.addColorStop(0.5, '#a84722');
    grad.addColorStop(1, '#8c3919');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Wind-carved dust ribbons across the canyon floor
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.16)';
    ctx.lineWidth = 6 * s;
    for (let i = 0; i < 55; i++) {
      const sy = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.quadraticCurveTo(size * 0.5, sy + (Math.random() - 0.5) * 70 * s, size, sy + (Math.random() - 0.5) * 40 * s);
      ctx.stroke();
    }

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 112 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else if (mapId === 'speedway') {
    // Motorsport F1 Carbon Asphalt with red-white apex kerbs & glowing cyan turbo chevrons
    ctx.fillStyle = '#151b28';
    ctx.fillRect(0, 0, size, size);

    // Subtle racing asphalt micro-grain
    const grainCount = isSoftwareGl ? 3000 : 8000;
    for (let i = 0; i < grainCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 3 * s, 3 * s);
    }

    // F1 Red & White Alternating Perimeter Curbs
    const curbSegs = 24;
    const segLen = (944 * s) / curbSegs;
    for (let i = 0; i < curbSegs; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f8fafc';
      ctx.fillRect(40 * s + i * segLen, 22 * s, segLen, 18 * s);
      ctx.fillRect(40 * s + i * segLen, 984 * s, segLen, 18 * s);
    }

    // Glowing Turbo Speed Chevrons along the pitch lanes
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.32)';
    ctx.lineWidth = 10 * s;
    [220, 512, 804].forEach((cy) => {
      for (let cx = 180; cx <= 844; cx += 130) {
        ctx.beginPath();
        ctx.moveTo((cx - 24) * s, (cy - 28) * s);
        ctx.lineTo((cx + 12) * s, cy * s);
        ctx.lineTo((cx - 24) * s, (cy + 28) * s);
        ctx.stroke();
      }
    });

    // Crisp Neon Racing Pitch Lines
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12 * s;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);
    ctx.strokeStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 112 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40 * s, 282 * s, 195 * s, 460 * s);
    ctx.strokeRect(789 * s, 282 * s, 195 * s, 460 * s);
  } else {
    ctx.fillStyle = '#0b091a';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(255, 0, 127, 0.22)';
    ctx.lineWidth = 2 * s;
    for (let i = 0; i < size; i += 48 * s) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20 * s;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 12 * s;
    ctx.strokeRect(40 * s, 40 * s, 944 * s, 944 * s);

    ctx.strokeStyle = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(512 * s, 40 * s);
    ctx.lineTo(512 * s, 984 * s);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(512 * s, 512 * s, 110 * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  if (!isSoftwareGl) {
    texture.anisotropy = 8;
  }
  return texture;
}

function createNetTexture(team: 'red' | 'blue'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  ctx.strokeStyle = team === 'red' ? 'rgba(255, 235, 235, 0.72)' : 'rgba(225, 245, 255, 0.72)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAdBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.3, '#1e3a8a');
  grad.addColorStop(0.6, '#be123c');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 128);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 4, 1024, 120);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHAOS GOAL 26   •   WORLD SERIES   •   CLUB WARS', 512, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

// Build FIFA 26 Goal with rounded corners, stanchions, and woven net
function createGoal(team: 'red' | 'blue', isSand: boolean, isCyber: boolean): THREE.Group {
  const goal = new THREE.Group();
  const postRadius = isSand ? 0.18 : 0.14;
  const postMaterial = isCyber
    ? new THREE.MeshStandardMaterial({
        color: team === 'red' ? 0xff0055 : 0x00e5ff,
        emissive: team === 'red' ? 0xaa0033 : 0x0099bb,
        roughness: 0.2,
        metalness: 0.85,
      })
    : new THREE.MeshStandardMaterial({
        color: isSand ? 0x8b5a2b : 0xf8fafc,
        roughness: isSand ? 0.65 : 0.18,
        metalness: isSand ? 0.1 : 0.7,
      });

  // Vertical posts
  const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, GOAL_HEIGHT, 18);
  const leftPost = new THREE.Mesh(postGeo, postMaterial);
  leftPost.position.set(0, GOAL_HEIGHT / 2, -GOAL_WIDTH / 2);
  leftPost.castShadow = true;
  goal.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, postMaterial);
  rightPost.position.set(0, GOAL_HEIGHT / 2, GOAL_WIDTH / 2);
  rightPost.castShadow = true;
  goal.add(rightPost);

  // Corner spheres for seamless joints
  const jointGeo = new THREE.SphereGeometry(postRadius * 1.05, 14, 14);
  const jL = new THREE.Mesh(jointGeo, postMaterial);
  jL.position.set(0, GOAL_HEIGHT, -GOAL_WIDTH / 2);
  const jR = new THREE.Mesh(jointGeo, postMaterial);
  jR.position.set(0, GOAL_HEIGHT, GOAL_WIDTH / 2);
  goal.add(jL, jR);

  // Crossbar
  const crossGeo = new THREE.CylinderGeometry(postRadius, postRadius, GOAL_WIDTH, 18);
  const crossbar = new THREE.Mesh(crossGeo, postMaterial);
  crossbar.rotation.x = Math.PI / 2;
  crossbar.position.set(0, GOAL_HEIGHT, 0);
  crossbar.castShadow = true;
  goal.add(crossbar);

  // Goal net rear frame stanchions
  const depthDir = team === 'red' ? -1 : 1;
  const strutMat = new THREE.MeshStandardMaterial({
    color: team === 'red' ? 0xef4444 : 0x38bdf8,
    roughness: 0.35,
    metalness: 0.65,
  });

  const backTopBarGeo = new THREE.CylinderGeometry(postRadius * 0.65, postRadius * 0.65, GOAL_DEPTH, 12);
  [-GOAL_WIDTH / 2, GOAL_WIDTH / 2].forEach((zOff) => {
    const topStrut = new THREE.Mesh(backTopBarGeo, strutMat);
    topStrut.rotation.z = Math.PI / 2;
    topStrut.position.set(depthDir * (GOAL_DEPTH / 2), GOAL_HEIGHT, zOff);
    goal.add(topStrut);

    const groundStrut = new THREE.Mesh(backTopBarGeo, strutMat);
    groundStrut.rotation.z = Math.PI / 2;
    groundStrut.position.set(depthDir * (GOAL_DEPTH / 2), 0.1, zOff);
    goal.add(groundStrut);

    const rearPost = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius * 0.65, postRadius * 0.65, GOAL_HEIGHT, 12),
      strutMat
    );
    rearPost.position.set(depthDir * GOAL_DEPTH, GOAL_HEIGHT / 2, zOff);
    goal.add(rearPost);
  });

  // Rear crossbar
  const rearCross = new THREE.Mesh(
    new THREE.CylinderGeometry(postRadius * 0.65, postRadius * 0.65, GOAL_WIDTH, 12),
    strutMat
  );
  rearCross.rotation.x = Math.PI / 2;
  rearCross.position.set(depthDir * GOAL_DEPTH, GOAL_HEIGHT, 0);
  goal.add(rearCross);

  // Woven Mesh Net panels (Back, Top, Left, Right)
  const netMat = new THREE.MeshStandardMaterial({
    map: createNetTexture(team),
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    roughness: 0.8,
  });

  const backNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_WIDTH, GOAL_HEIGHT), netMat);
  backNet.position.set(depthDir * GOAL_DEPTH, GOAL_HEIGHT / 2, 0);
  backNet.rotation.y = Math.PI / 2;
  goal.add(backNet);

  const topNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_WIDTH), netMat);
  topNet.position.set(depthDir * (GOAL_DEPTH / 2), GOAL_HEIGHT, 0);
  topNet.rotation.x = Math.PI / 2;
  goal.add(topNet);

  const leftSideNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_HEIGHT), netMat);
  leftSideNet.position.set(depthDir * (GOAL_DEPTH / 2), GOAL_HEIGHT / 2, -GOAL_WIDTH / 2);
  goal.add(leftSideNet);

  const rightSideNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_HEIGHT), netMat);
  rightSideNet.position.set(depthDir * (GOAL_DEPTH / 2), GOAL_HEIGHT / 2, GOAL_WIDTH / 2);
  goal.add(rightSideNet);

  return goal;
}

// Corner Flag
function createCornerFlag(x: number, z: number): THREE.Group {
  const flagGroup = new THREE.Group();
  flagGroup.position.set(x, 0, z);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  pole.position.y = 1.0;
  pole.castShadow = true;

  const pennant = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, roughness: 0.6 })
  );
  pennant.position.set(0.35, 1.78, 0);
  flagGroup.add(pole, pennant);
  return flagGroup;
}

// Procedural Palm Tree for Beach Soccer
function createPalmTree(): THREE.Group {
  const palm = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c512d, roughness: 0.9 });
  let curY = 0;
  let curX = 0;
  for (let s = 0; s < 5; s++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.45 - s * 0.04, 0.52 - s * 0.04, 1.8, 10), trunkMat);
    curY += 1.65;
    curX += s * 0.14;
    seg.position.set(curX, curY - 0.8, 0);
    seg.rotation.z = -s * 0.07;
    seg.castShadow = true;
    palm.add(seg);
  }

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const leafGeo = new THREE.ConeGeometry(1.1, 5.2, 5);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const angle = (i / 8) * Math.PI * 2;
    leaf.position.set(curX + Math.cos(angle) * 1.6, curY + 0.1, Math.sin(angle) * 1.6);
    leaf.rotation.x = Math.PI / 2.7;
    leaf.rotation.y = angle;
    palm.add(leaf);
  }
  return palm;
}

// Procedural FIFA 26 Floodlight Tower with Volumetric Light Cone
function createFloodlightTower(x: number, z: number): THREE.Group {
  const tower = new THREE.Group();
  tower.position.set(x, 0, z);
  tower.lookAt(0, 0, 0);

  const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.82, roughness: 0.28 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 25, 12), mastMat);
  mast.position.y = 12.5;
  tower.add(mast);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 2.6, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.7 })
  );
  head.position.y = 25;
  tower.add(head);

  // Glowing LED floodlight grid
  const bulbGeo = new THREE.SphereGeometry(0.28, 8, 8);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1.8, -0.6, 0.6, 1.8].forEach((bx) => {
    [-0.65, 0.65].forEach((by) => {
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(bx, 25 + by, 0.58);
      tower.add(bulb);
    });
  });

  // Volumetric light beam cone aiming toward center pitch
  const beamGeo = new THREE.ConeGeometry(11, 32, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.055,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 14, 14);
  beam.rotation.x = -Math.PI / 3.4;
  tower.add(beam);

  return tower;
}

// Multi-tier Stadium Stand + Roof Canopy + Colorful Crowd InstancedMesh
function buildGrandStandsAndCrowd(scene: THREE.Scene) {
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78 });
  const tier2Mat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 });
  const glowStripMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // North & South Sideline Stands
  const addSidelineStand = (zSign: 1 | -1, namePrefix: string) => {
    const group = new THREE.Group();
    group.name = `stadium_${namePrefix}`;
    const baseZ = zSign * (PITCH_WIDTH / 2 + 9);

    // Lower deck
    const lower = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 16, 6, 10), concreteMat);
    lower.position.set(0, 3, baseZ);
    group.add(lower);

    // Upper deck
    const upper = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 18, 9, 9), tier2Mat);
    upper.position.set(0, 8.5, baseZ + zSign * 6.5);
    group.add(upper);

    // Cantilevered Stadium Roof Canopy
    const roof = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 20, 0.9, 15), roofMat);
    roof.position.set(0, 16.5, baseZ + zSign * 3.5);
    roof.rotation.x = zSign * 0.12;
    group.add(roof);

    // LED Roof Edge Trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 19, 0.35, 0.35), glowStripMat);
    trim.position.set(0, 15.6, baseZ - zSign * 3.6);
    group.add(trim);

    scene.add(group);
  };

  // Note: Camera sits at +Z looking across the field, so keep +Z stand lower/farther so it never blocks camera!
  addSidelineStand(-1, 'stand_north');

  // Lower subtle foreground rim on +Z side (behind camera view)
  const southLower = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 16, 3.5, 8), concreteMat);
  southLower.position.set(0, 1.75, PITCH_WIDTH / 2 + 16);
  southLower.name = 'stadium_stand_south';
  scene.add(southLower);

  // Behind-Goal Curved/Box Stands (West & East)
  const addGoalStand = (xSign: 1 | -1, namePrefix: string) => {
    const group = new THREE.Group();
    group.name = `stadium_${namePrefix}`;
    const baseX = xSign * (PITCH_LENGTH / 2 + 12);

    const lower = new THREE.Mesh(new THREE.BoxGeometry(10, 6.5, PITCH_WIDTH + 10), concreteMat);
    lower.position.set(baseX, 3.25, 0);
    group.add(lower);

    const upper = new THREE.Mesh(new THREE.BoxGeometry(9, 9, PITCH_WIDTH + 12), tier2Mat);
    upper.position.set(baseX + xSign * 6.5, 8.5, 0);
    group.add(upper);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, PITCH_WIDTH + 14), roofMat);
    roof.position.set(baseX + xSign * 3.5, 16.2, 0);
    roof.rotation.z = -xSign * 0.12;
    group.add(roof);

    const jumbotron = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 4.2, 14),
      new THREE.MeshBasicMaterial({ color: xSign < 0 ? 0xef4444 : 0x0284c7 })
    );
    jumbotron.position.set(baseX - xSign * 1.2, 13.5, 0);
    group.add(jumbotron);

    scene.add(group);
  };

  addGoalStand(-1, 'stand_west');
  addGoalStand(1, 'stand_east');

  // Spectator Crowd (InstancedMesh for crisp FIFA atmosphere at 60fps)
  const crowdCount = 720;
  const fanGeo = new THREE.BoxGeometry(0.65, 1.15, 0.55);
  const fanMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const crowdMesh = new THREE.InstancedMesh(fanGeo, fanMat, crowdCount);
  crowdMesh.name = 'stadium_crowd';

  const dummy = new THREE.Object3D();
  const palette = [
    new THREE.Color(0xef4444),
    new THREE.Color(0x0284c7),
    new THREE.Color(0xfbbf24),
    new THREE.Color(0xf8fafc),
    new THREE.Color(0x10b981),
    new THREE.Color(0xec4899),
  ];

  let idx = 0;
  // Populate North Stand (400 fans)
  for (let i = 0; i < 400 && idx < crowdCount; i++) {
    const row = Math.floor(i / 40);
    const col = i % 40;
    const fx = -36 + col * 1.85 + (Math.random() - 0.5) * 0.4;
    const fy = 6.5 + (row > 4 ? 3.5 : 0) + (row % 5) * 0.85;
    const fz = -(PITCH_WIDTH / 2 + 5.5 + row * 1.25);
    dummy.position.set(fx, fy, fz);
    dummy.rotation.y = 0;
    dummy.scale.setScalar(0.85 + Math.random() * 0.3);
    dummy.updateMatrix();
    crowdMesh.setMatrixAt(idx, dummy.matrix);
    crowdMesh.setColorAt(idx, palette[i % palette.length]);
    idx++;
  }

  // Populate West & East Stands (160 fans each)
  [-1, 1].forEach((xSign) => {
    for (let i = 0; i < 160 && idx < crowdCount; i++) {
      const row = Math.floor(i / 20);
      const col = i % 20;
      const fx = xSign * (PITCH_LENGTH / 2 + 8.5 + row * 1.3);
      const fy = 6.8 + (row > 3 ? 3.2 : 0) + (row % 4) * 0.85;
      const fz = -24 + col * 2.5 + (Math.random() - 0.5) * 0.4;
      dummy.position.set(fx, fy, fz);
      dummy.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      dummy.scale.setScalar(0.85 + Math.random() * 0.3);
      dummy.updateMatrix();
      crowdMesh.setMatrixAt(idx, dummy.matrix);
      crowdMesh.setColorAt(idx, palette[(i + (xSign > 0 ? 1 : 0)) % palette.length]);
      idx++;
    }
  });

  crowdMesh.instanceMatrix.needsUpdate = true;
  if (crowdMesh.instanceColor) crowdMesh.instanceColor.needsUpdate = true;
  scene.add(crowdMesh);
}

export function buildStadiumScene(scene: THREE.Scene, mapId: MapId, isSoftwareGl: boolean = false) {
  const toRemove: THREE.Object3D[] = [];
  scene.children.forEach((child) => {
    if (child.name.startsWith('stadium_') || child.name.startsWith('light_') || child.name.startsWith('fx_')) {
      toRemove.push(child);
    }
  });
  toRemove.forEach((obj) => scene.remove(obj));

  const config = MAP_CONFIGS[mapId];

  // 1. Atmosphere Fog & Background
  scene.background = new THREE.Color(config.skyColor);
  scene.fog = new THREE.FogExp2(config.skyColor, mapId === 'underwater' ? 0.013 : mapId === 'stadium' ? 0.0045 : 0.006);

  // 2. Pro 3-Point Stadium Lighting Rig
  const hemiLight = new THREE.HemisphereLight(config.ambientLight, 0x0f172a, 0.82);
  hemiLight.name = 'light_hemi';
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(config.keyLight, 1.65);
  dirLight.name = 'light_dir';
  dirLight.position.set(32, 48, 28);
  dirLight.castShadow = !isSoftwareGl;
  dirLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
  dirLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 140;
  const d = 48;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0004;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
  fillLight.name = 'light_fill';
  fillLight.position.set(-34, 24, -26);
  scene.add(fillLight);

  // 3. Playable Pitch Mesh
  const pitchTexture = createPitchTexture(mapId, isSoftwareGl);
  const pitchGeo = new THREE.PlaneGeometry(PITCH_LENGTH, PITCH_WIDTH);
  const pitchMat = new THREE.MeshStandardMaterial({
    map: pitchTexture,
    roughness:
      mapId === 'ice'
        ? 0.08
        : mapId === 'underwater' || mapId === 'snow' || mapId === 'swamp'
        ? 0.3
        : mapId === 'cyber' || mapId === 'rooftop' || mapId === 'speedway'
        ? 0.28
        : 0.78,
    metalness: mapId === 'cyber' || mapId === 'speedway' ? 0.42 : mapId === 'ice' ? 0.28 : mapId === 'space' ? 0.22 : 0.04,
  });
  const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
  pitchMesh.name = 'stadium_pitch';
  pitchMesh.rotation.x = -Math.PI / 2;
  pitchMesh.receiveShadow = true;
  scene.add(pitchMesh);

  // 4. Surrounding Extended Ground
  const groundColorMap: Record<MapId, number> = {
    stadium: 0x133c29,
    sand: 0xd4a373,
    underwater: 0x02131d,
    cyber: 0x05040a,
    snow: 0xcbdcf0,
    volcano: 0x160908,
    rooftop: 0x0f172a,
    space: 0x1e293b,
    ice: 0x0e344d,
    swamp: 0x1a2614,
    wind: 0x7c3318,
    speedway: 0x0c111d,
  };
  const groundGeo = new THREE.PlaneGeometry(260, 260);
  const groundMat = new THREE.MeshStandardMaterial({
    color: groundColorMap[mapId],
    roughness: mapId === 'ice' ? 0.16 : mapId === 'snow' ? 0.55 : 0.92,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.name = 'stadium_ground';
  groundMesh.position.y = -0.025;
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // 5. Goals & Corner Flags
  const isSand = mapId === 'sand' || mapId === 'wind';
  const isCyber = mapId === 'cyber' || mapId === 'volcano' || mapId === 'space' || mapId === 'speedway' || mapId === 'ice';

  const redGoal = createGoal('red', isSand, isCyber);
  redGoal.name = 'stadium_goal_red';
  redGoal.position.set(-PITCH_LENGTH / 2, 0, 0);
  scene.add(redGoal);

  const blueGoal = createGoal('blue', isSand, isCyber);
  blueGoal.name = 'stadium_goal_blue';
  blueGoal.position.set(PITCH_LENGTH / 2, 0, 0);
  blueGoal.rotation.y = Math.PI;
  scene.add(blueGoal);

  // 4 Corner Flags
  [
    [-PITCH_LENGTH / 2 + 2.8, -PITCH_WIDTH / 2 + 2.0],
    [PITCH_LENGTH / 2 - 2.8, -PITCH_WIDTH / 2 + 2.0],
    [-PITCH_LENGTH / 2 + 2.8, PITCH_WIDTH / 2 - 2.0],
    [PITCH_LENGTH / 2 - 2.8, PITCH_WIDTH / 2 - 2.0],
  ].forEach(([fx, fz], idx) => {
    const flag = createCornerFlag(fx, fz);
    flag.name = `stadium_flag_${idx}`;
    scene.add(flag);
  });

  // 6. Map-Specific FIFA 26 Environment Decor
  if (mapId === 'stadium') {
    buildGrandStandsAndCrowd(scene);

    // 4 Corner Floodlight Towers
    const corners = [
      [-PITCH_LENGTH / 2 - 9, -PITCH_WIDTH / 2 - 9],
      [PITCH_LENGTH / 2 + 9, -PITCH_WIDTH / 2 - 9],
      [-PITCH_LENGTH / 2 - 9, PITCH_WIDTH / 2 + 9],
      [PITCH_LENGTH / 2 + 9, PITCH_WIDTH / 2 + 9],
    ];
    corners.forEach(([cx, cz], i) => {
      const tower = createFloodlightTower(cx, cz);
      tower.name = `stadium_tower_${i}`;
      scene.add(tower);
    });

    // Glowing Perimeter LED Advertising Boards
    const adTex = createAdBoardTexture();
    const adMat = new THREE.MeshStandardMaterial({
      map: adTex,
      emissive: 0x1e293b,
      emissiveMap: adTex,
      emissiveIntensity: 0.65,
      roughness: 0.25,
    });

    const adN = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 2, 1.35, 0.45), adMat);
    adN.position.set(0, 0.68, -(PITCH_WIDTH / 2 + 1.5));
    adN.name = 'stadium_ad_n';
    scene.add(adN);

    const adS = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 2, 1.35, 0.45), adMat);
    adS.position.set(0, 0.68, PITCH_WIDTH / 2 + 1.5);
    adS.name = 'stadium_ad_s';
    scene.add(adS);
  } else if (mapId === 'sand') {
    const treePositions = [
      [-36, -28], [-20, -30], [0, -32], [22, -29], [37, -27],
      [-38, 28], [-18, 31], [2, 33], [20, 30], [38, 28],
    ];
    treePositions.forEach(([tx, tz], i) => {
      const palm = createPalmTree();
      palm.name = `stadium_palm_${i}`;
      palm.position.set(tx, 0, tz);
      scene.add(palm);
    });

    const oceanGeo = new THREE.PlaneGeometry(320, 90);
    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x00b4d8,
      roughness: 0.12,
      metalness: 0.35,
      clearcoat: 0.8,
      transparent: true,
      opacity: 0.88,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, -0.35, -65);
    ocean.rotation.x = -Math.PI / 2;
    ocean.name = 'stadium_ocean';
    scene.add(ocean);
  } else if (mapId === 'underwater') {
    const domeGeo = new THREE.SphereGeometry(76, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0x00b4d8,
      transparent: true,
      opacity: 0.14,
      roughness: 0.1,
      metalness: 0.2,
      wireframe: true,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.name = 'stadium_dome';
    scene.add(dome);

    // Bioluminescent coral pillars around pitch
    const coralColors = [0x00f5d4, 0xf72585, 0x7209b7, 0x4cc9f0];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const coral = new THREE.Mesh(
        new THREE.ConeGeometry(1.1, 3.2 + (i % 3), 7),
        new THREE.MeshStandardMaterial({
          color: coralColors[i % coralColors.length],
          emissive: coralColors[i % coralColors.length],
          emissiveIntensity: 0.5,
          roughness: 0.35,
        })
      );
      coral.position.set(Math.cos(angle) * 44, 1.4, Math.sin(angle) * 32);
      coral.name = `stadium_coral_${i}`;
      scene.add(coral);
    }

    const bubbleCount = 80;
    const bubbleGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0x90e0ef, transparent: true, opacity: 0.55 });
    const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, bubbleCount);
    bubbles.name = 'fx_bubbles';
    const dummy = new THREE.Object3D();
    for (let i = 0; i < bubbleCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 26,
        (Math.random() - 0.5) * 60
      );
      dummy.scale.setScalar(0.4 + Math.random() * 1.2);
      dummy.updateMatrix();
      bubbles.setMatrixAt(i, dummy.matrix);
    }
    scene.add(bubbles);
  } else if (mapId === 'cyber') {
    const railGeo = new THREE.BoxGeometry(PITCH_LENGTH + 4, 1.5, 0.25);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xcc0066,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const railN = new THREE.Mesh(railGeo, railMat);
    railN.position.set(0, 0.75, PITCH_WIDTH / 2 + 1);
    railN.name = 'stadium_cyber_n';
    scene.add(railN);

    const railS = new THREE.Mesh(railGeo, railMat);
    railS.position.set(0, 0.75, -(PITCH_WIDTH / 2 + 1));
    railS.name = 'stadium_cyber_s';
    scene.add(railS);

    // Overhead Holographic Neon Arches
    for (let x = -30; x <= 30; x += 20) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(28, 0.35, 8, 32, Math.PI),
        new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00c8ff,
          emissiveIntensity: 0.85,
          roughness: 0.2,
        })
      );
      arch.position.set(x, 0, 0);
      arch.rotation.y = Math.PI / 2;
      arch.name = `stadium_cyber_arch_${x}`;
      scene.add(arch);
    }
  } else if (mapId === 'snow') {
    // Alpine Snow Stadium: Composite layered snow pines, mountain peaks, floodlights & falling snow
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x164e3f, roughness: 0.75 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

    const pineCoords = [
      [-42, -31], [-28, -33], [-14, -34], [0, -35], [14, -34], [28, -33], [42, -31],
      [-44, -15], [44, -15], [-44, 15], [44, 15],
    ];
    pineCoords.forEach(([px, pz], idx) => {
      const pine = new THREE.Group();
      pine.position.set(px, 0, pz);
      const scale = 0.85 + (idx % 3) * 0.22;
      pine.scale.setScalar(scale);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 2.2, 8), trunkMat);
      trunk.position.y = 1.1;
      pine.add(trunk);

      for (let tier = 0; tier < 3; tier++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6 - tier * 0.55, 3.0, 8), pineMat);
        cone.position.y = 3.2 + tier * 1.9;
        cone.castShadow = true;
        pine.add(cone);

        const snowCap = new THREE.Mesh(new THREE.ConeGeometry(1.75 - tier * 0.35, 1.15, 8), capMat);
        snowCap.position.y = 4.35 + tier * 1.9;
        pine.add(snowCap);
      }

      pine.name = `stadium_pine_${idx}`;
      scene.add(pine);
    });

    // Distant Alpine Peaks along North/West/East horizon
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const peakMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 });
    [
      [-55, -58, 22, 34], [-18, -64, 28, 42], [22, -62, 26, 38], [58, -54, 24, 32],
      [-68, -10, 20, 28], [68, -10, 20, 30],
    ].forEach(([mx, mz, rad, h], idx) => {
      const mtn = new THREE.Group();
      mtn.position.set(mx, 0, mz);
      const base = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7), rockMat);
      base.position.y = h / 2;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.48, h * 0.45, 7), peakMat);
      cap.position.y = h * 0.78;
      mtn.add(base, cap);
      mtn.name = `stadium_mountain_${idx}`;
      scene.add(mtn);
    });

    // Low Snow Banks around field perimeter
    const bankMat = new THREE.MeshStandardMaterial({ color: 0xe2eef8, roughness: 0.5 });
    const bankN = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 8, 1.3, 2.2), bankMat);
    bankN.position.set(0, 0.65, -(PITCH_WIDTH / 2 + 2.2));
    bankN.name = 'stadium_snow_bank_n';
    scene.add(bankN);

    // Animated Snowflakes InstancedMesh
    const snowCount = 140;
    const snowGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
    const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, snowCount);
    snowMesh.name = 'fx_snow';
    snowMesh.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < snowCount; i++) {
      dummy.position.set((Math.random() - 0.5) * 90, Math.random() * 28, (Math.random() - 0.5) * 65);
      dummy.scale.setScalar(0.6 + Math.random() * 1.1);
      dummy.updateMatrix();
      snowMesh.setMatrixAt(i, dummy.matrix);
    }
    snowMesh.instanceMatrix.needsUpdate = true;
    scene.add(snowMesh);
  } else if (mapId === 'volcano') {
    // Volcanic Crater: Glowing magma moat, jagged obsidian pillars, lava rings & rising embers
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff3d00,
      emissiveIntensity: 1.35,
      roughness: 0.25,
    });
    const lavaPoolN = new THREE.Mesh(new THREE.PlaneGeometry(160, 32), lavaMat);
    lavaPoolN.rotation.x = -Math.PI / 2;
    lavaPoolN.position.set(0, -0.01, -(PITCH_WIDTH / 2 + 19));
    lavaPoolN.name = 'stadium_lava_n';
    scene.add(lavaPoolN);

    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x1c1417, roughness: 0.72, metalness: 0.28 });
    const glowCapMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      emissive: 0xff5722,
      emissiveIntensity: 1.4,
      roughness: 0.3,
    });

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const rx = Math.cos(angle) * 46;
      const rz = Math.sin(angle) * 34;
      if (rz > 23) continue; // Keep camera sideline clear
      const h = 7 + (i % 4) * 3.5;
      const spire = new THREE.Group();
      spire.position.set(rx, 0, rz);
      const rock = new THREE.Mesh(new THREE.ConeGeometry(3.2, h, 6), obsidianMat);
      rock.position.y = h / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.25, 6, 12), glowCapMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = h * 0.45;
      spire.add(rock, ring);
      spire.name = `stadium_volcano_spire_${i}`;
      scene.add(spire);
    }

    // Perimeter glowing magma curb
    const curbGeo = new THREE.BoxGeometry(PITCH_LENGTH + 4, 1.1, 0.5);
    const curbN = new THREE.Mesh(curbGeo, glowCapMat);
    curbN.position.set(0, 0.55, -(PITCH_WIDTH / 2 + 1.4));
    curbN.name = 'stadium_volcano_curb_n';
    scene.add(curbN);

    // Rising Glowing Embers InstancedMesh
    const emberCount = 110;
    const emberGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
    const embers = new THREE.InstancedMesh(emberGeo, emberMat, emberCount);
    embers.name = 'fx_embers';
    embers.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < emberCount; i++) {
      dummy.position.set((Math.random() - 0.5) * 86, Math.random() * 26, (Math.random() - 0.5) * 62);
      dummy.scale.setScalar(0.5 + Math.random() * 1.1);
      dummy.updateMatrix();
      embers.setMatrixAt(i, dummy.matrix);
    }
    embers.instanceMatrix.needsUpdate = true;
    scene.add(embers);
  } else if (mapId === 'rooftop') {
    // Tokyo Rooftop Arena: Protective metallic deck parapet + illuminated city skyline towers
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.35 });
    const neonTrimMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 14, 1.2, PITCH_WIDTH + 14), parapetMat);
    deck.position.set(0, -0.65, 0);
    deck.name = 'stadium_rooftop_deck';
    scene.add(deck);

    // North protective urban glass/steel railing
    const railN = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 8, 2.2, 0.35), parapetMat);
    railN.position.set(0, 1.1, -(PITCH_WIDTH / 2 + 2.5));
    railN.name = 'stadium_rooftop_rail_n';
    scene.add(railN);

    const trimN = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 8, 0.25, 0.45), neonTrimMat);
    trimN.position.set(0, 2.25, -(PITCH_WIDTH / 2 + 2.5));
    trimN.name = 'stadium_rooftop_trim_n';
    scene.add(trimN);

    // Procedural lit skyline skyscrapers on the North/East/West horizon
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.55 });
    const winPalette = [0xfef08a, 0x38bdf8, 0xf472b6, 0xa5b4fc];
    const skylineSpecs: Array<[number, number, number, number, number]> = [
      [-52, -52, 12, 42, 12], [-34, -58, 14, 58, 14], [-14, -55, 11, 36, 11],
      [6, -60, 16, 68, 14], [28, -54, 13, 46, 12], [48, -56, 15, 54, 14],
      [-58, -16, 12, 34, 14], [58, -14, 12, 38, 14],
    ];
    skylineSpecs.forEach(([bx, bz, bw, bh, bd], idx) => {
      const tower = new THREE.Group();
      tower.position.set(bx, -10, bz);
      const body = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bldgMat);
      body.position.y = bh / 2;
      tower.add(body);

      const bandMat = new THREE.MeshBasicMaterial({ color: winPalette[idx % winPalette.length] });
      for (let wy = 10; wy < bh - 3; wy += 5.5) {
        const winStrip = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.78, 1.3, bd + 0.2), bandMat);
        winStrip.position.y = wy;
        tower.add(winStrip);
      }

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.y = bh + 1.2;
      tower.add(beacon);

      tower.name = `stadium_skyscraper_${idx}`;
      scene.add(tower);
    });

    // 4 Corner Urban Stadium Floodlights
    [
      [-PITCH_LENGTH / 2 - 5, -PITCH_WIDTH / 2 - 5],
      [PITCH_LENGTH / 2 + 5, -PITCH_WIDTH / 2 - 5],
      [-PITCH_LENGTH / 2 - 5, PITCH_WIDTH / 2 + 5],
      [PITCH_LENGTH / 2 + 5, PITCH_WIDTH / 2 + 5],
    ].forEach(([cx, cz], i) => {
      const tower = createFloodlightTower(cx, cz);
      tower.scale.setScalar(0.8);
      tower.name = `stadium_rooftop_light_${i}`;
      scene.add(tower);
    });
  } else if (mapId === 'space') {
    // Lunar Orbital Arena: Giant Earth in sky, metallic lunar base rings, holographic golden pillars & Starfield
    const earthGroup = new THREE.Group();
    earthGroup.position.set(16, 30, -76);
    const earthSphere = new THREE.Mesh(
      new THREE.SphereGeometry(18, 28, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.45,
        roughness: 0.45,
      })
    );
    const earthAtmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(19.2, 24, 20),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
      })
    );
    const orbitalRing = new THREE.Mesh(
      new THREE.TorusGeometry(24, 0.35, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    orbitalRing.rotation.x = Math.PI / 2.6;
    orbitalRing.rotation.y = 0.35;
    earthGroup.add(earthSphere, earthAtmosphere, orbitalRing);
    earthGroup.name = 'stadium_space_earth';
    scene.add(earthGroup);

    // Perimeter Lunar Energy Pylons
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let x = -30; x <= 30; x += 15) {
      const pylon = new THREE.Group();
      pylon.position.set(x, 0, -(PITCH_WIDTH / 2 + 3.5));
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 6.5, 10), pylonMat);
      base.position.y = 3.25;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), orbMat);
      orb.position.y = 7.1;
      pylon.add(base, orb);
      pylon.name = `stadium_space_pylon_${x}`;
      scene.add(pylon);
    }

    // Starfield InstancedMesh
    const starCount = 240;
    const starGeo = new THREE.SphereGeometry(0.24, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    const stars = new THREE.InstancedMesh(starGeo, starMat, starCount);
    stars.name = 'fx_stars';
    stars.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      const r = 95 + Math.random() * 40;
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        12 + r * Math.cos(phi) * 0.65,
        r * Math.sin(phi) * Math.sin(theta)
      );
      dummy.scale.setScalar(0.5 + Math.random() * 1.4);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.instanceMatrix.needsUpdate = true;
    scene.add(stars);
  } else if (mapId === 'ice') {
    // Polar Ice Rink: Translucent hockey-glass perimeter boards, sculpted glacial icebergs, aurora ribbons & ice sparkles
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.15,
      metalness: 0.2,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.26,
      roughness: 0.06,
      metalness: 0.1,
    });
    const boardN = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 4, 1.35, 0.45), boardMat);
    boardN.position.set(0, 0.68, -(PITCH_WIDTH / 2 + 1.4));
    boardN.name = 'stadium_ice_board_n';
    scene.add(boardN);

    const glassN = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 4, 2.2, 0.16), glassMat);
    glassN.position.set(0, 2.45, -(PITCH_WIDTH / 2 + 1.4));
    glassN.name = 'stadium_ice_glass_n';
    scene.add(glassN);

    // Sculpted Crystal Icebergs around the Polar Arena
    const bergMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.32,
      roughness: 0.18,
      metalness: 0.25,
    });
    [
      [-52, -46, 12, 24], [-22, -52, 16, 30], [16, -50, 14, 27], [48, -44, 13, 22],
      [-58, -8, 10, 18], [58, -6, 11, 20],
    ].forEach(([bx, bz, r, h], idx) => {
      const berg = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), bergMat);
      berg.position.set(bx, h / 2 - 1, bz);
      berg.rotation.y = idx * 0.7;
      berg.name = `stadium_iceberg_${idx}`;
      scene.add(berg);
    });

    // Overhead Glowing Aurora Borealis Ribbons
    const auroraColors = [0x22d3ee, 0x34d399, 0x818cf8];
    auroraColors.forEach((col, idx) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(42 + idx * 7, 0.7, 6, 40, Math.PI),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 })
      );
      arc.position.set(0, 8 + idx * 3, -30 - idx * 6);
      arc.rotation.z = (idx - 1) * 0.12;
      arc.name = `stadium_aurora_${idx}`;
      scene.add(arc);
    });

    // Shimmering Ice Mist Particles
    const iceCount = 120;
    const iceGeo = new THREE.OctahedronGeometry(0.22, 0);
    const iceMat = new THREE.MeshBasicMaterial({ color: 0xe0f7ff, transparent: true, opacity: 0.8 });
    const iceMesh = new THREE.InstancedMesh(iceGeo, iceMat, iceCount);
    iceMesh.name = 'fx_ice';
    iceMesh.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < iceCount; i++) {
      dummy.position.set((Math.random() - 0.5) * 90, 0.8 + Math.random() * 22, (Math.random() - 0.5) * 62);
      dummy.scale.setScalar(0.6 + Math.random() * 1.1);
      dummy.updateMatrix();
      iceMesh.setMatrixAt(i, dummy.matrix);
    }
    iceMesh.instanceMatrix.needsUpdate = true;
    scene.add(iceMesh);
  } else if (mapId === 'swamp') {
    // Muddy Marsh Arena: Gnarled swamp cypress trees, glowing marsh mushrooms, lily pads & floating fireflies
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1d, roughness: 0.95 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.85 });
    const shroomGlowMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x84cc16,
      emissiveIntensity: 1.1,
      roughness: 0.3,
    });

    const swampTrees = [
      [-40, -32], [-20, -35], [4, -36], [26, -34], [42, -30],
      [-46, -12], [46, -12], [-46, 12], [46, 12],
    ];
    swampTrees.forEach(([tx, tz], idx) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.35, 9.5, 7), barkMat);
      trunk.position.y = 4.75;
      trunk.rotation.z = (idx % 2 === 0 ? 1 : -1) * 0.08;
      tree.add(trunk);

      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(3.6, 0), mossMat);
      canopy.position.set(0, 10.2, 0);
      canopy.scale.set(1.3, 0.65, 1.1);
      tree.add(canopy);

      // Glowing marsh mushrooms at the tree base
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), shroomGlowMat);
      cap.position.set(1.5, 0.6, 1.1);
      tree.add(cap);

      tree.name = `stadium_swamp_tree_${idx}`;
      scene.add(tree);
    });

    // Marsh Water Lagoon behind North Sideline with Giant Lily Pads
    const bogWater = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 40),
      new THREE.MeshStandardMaterial({ color: 0x1a2e1a, roughness: 0.15, metalness: 0.35 })
    );
    bogWater.rotation.x = -Math.PI / 2;
    bogWater.position.set(0, -0.01, -(PITCH_WIDTH / 2 + 22));
    bogWater.name = 'stadium_swamp_bog';
    scene.add(bogWater);

    const padMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.6 });
    for (let i = 0; i < 14; i++) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.8 + (i % 3) * 0.5, 1.8, 0.12, 12), padMat);
      pad.position.set(-48 + i * 7.5, 0.08, -(PITCH_WIDTH / 2 + 8 + (i % 4) * 4));
      pad.name = `stadium_lilypad_${i}`;
      scene.add(pad);
    }

    // Floating Bioluminescent Fireflies InstancedMesh
    const fireflyCount = 95;
    const ffGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const ffMat = new THREE.MeshBasicMaterial({ color: 0xd9f99d });
    const fireflies = new THREE.InstancedMesh(ffGeo, ffMat, fireflyCount);
    fireflies.name = 'fx_fireflies';
    fireflies.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < fireflyCount; i++) {
      dummy.position.set((Math.random() - 0.5) * 86, 1.0 + Math.random() * 14, (Math.random() - 0.5) * 60);
      dummy.scale.setScalar(0.6 + Math.random() * 0.9);
      dummy.updateMatrix();
      fireflies.setMatrixAt(i, dummy.matrix);
    }
    fireflies.instanceMatrix.needsUpdate = true;
    scene.add(fireflies);
  } else if (mapId === 'wind') {
    // Wind Canyon Arena: Red Sandstone Mesas, Giant Spinning 3D Wind Turbines & Horizontal Wind Streaks
    const mesaMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
    const mesaTopMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.85 });
    [
      [-55, -52, 22, 26], [-18, -58, 28, 34], [24, -56, 26, 30], [56, -48, 20, 24],
      [-62, -12, 16, 22], [62, -12, 16, 22],
    ].forEach(([mx, mz, rad, h], idx) => {
      const mesa = new THREE.Group();
      mesa.position.set(mx, 0, mz);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.72, rad, h, 7), mesaMat);
      body.position.y = h / 2;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.78, rad * 0.74, 2.2, 7), mesaTopMat);
      cap.position.y = h + 1.1;
      mesa.add(body, cap);
      mesa.name = `stadium_mesa_${idx}`;
      scene.add(mesa);
    });

    // Giant 3D Wind Turbines with Animated Rotor Hubs (`wind_turbine_*`)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.4 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 });
    [
      [-34, -34], [0, -37], [34, -34], [-46, -16], [46, -16],
    ].forEach(([tx, tz], idx) => {
      const turbine = new THREE.Group();
      turbine.position.set(tx, 0, tz);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.85, 22, 10), towerMat);
      pole.position.y = 11;
      turbine.add(pole);

      const hub = new THREE.Group();
      hub.position.set(0, 22, 0.8);
      hub.name = `wind_turbine_${idx}`;
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 10), towerMat);
      hub.add(nose);
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.75, 7.2, 0.18), bladeMat);
        const angle = (b / 3) * Math.PI * 2;
        blade.position.set(Math.sin(angle) * 3.6, Math.cos(angle) * 3.6, 0);
        blade.rotation.z = -angle;
        hub.add(blade);
      }
      turbine.add(hub);
      turbine.name = `stadium_turbine_${idx}`;
      scene.add(turbine);
    });

    // Horizontal Flying Wind Streaks InstancedMesh
    const windCount = 110;
    const streakGeo = new THREE.BoxGeometry(2.6, 0.08, 0.1);
    const streakMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.55 });
    const windMesh = new THREE.InstancedMesh(streakGeo, streakMat, windCount);
    windMesh.name = 'fx_wind';
    windMesh.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < windCount; i++) {
      dummy.position.set((Math.random() - 0.5) * 90, 0.8 + Math.random() * 14, (Math.random() - 0.5) * 60);
      dummy.scale.set(0.7 + Math.random() * 1.1, 1, 1);
      dummy.updateMatrix();
      windMesh.setMatrixAt(i, dummy.matrix);
    }
    windMesh.instanceMatrix.needsUpdate = true;
    scene.add(windMesh);
  } else if (mapId === 'speedway') {
    // Motorsport F1 Turbo Arena: Starting Gantry Arch, Neon Speed Pylons, Racing Barriers & Grandstands
    buildGrandStandsAndCrowd(scene);

    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const cyanLightMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    // Iconic F1 Starting Lights Overhead Gantry spanning across midfield
    const gantry = new THREE.Group();
    gantry.name = 'stadium_speedway_gantry';
    const postL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 15, 1.4), gantryMat);
    postL.position.set(0, 7.5, -(PITCH_WIDTH / 2 + 2.2));
    const postR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 15, 1.4), gantryMat);
    postR.position.set(0, 7.5, PITCH_WIDTH / 2 + 2.2);
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, PITCH_WIDTH + 6), gantryMat);
    crossBeam.position.set(0, 14.5, 0);
    gantry.add(postL, postR, crossBeam);

    // 5 Red F1 Start Lights along the overhead gantry
    for (let i = -2; i <= 2; i++) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), i % 2 === 0 ? redLightMat : cyanLightMat);
      lamp.position.set(0, 13.4, i * 3.8);
      gantry.add(lamp);
    }
    scene.add(gantry);

    // Glowing Red/Cyan Perimeter Racing Guardrails
    const railN = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 4, 1.2, 0.5), cyanLightMat);
    railN.position.set(0, 0.6, -(PITCH_WIDTH / 2 + 1.5));
    railN.name = 'stadium_speedway_rail_n';
    scene.add(railN);

    // 4 Corner Stadium Floodlights
    [
      [-PITCH_LENGTH / 2 - 8, -PITCH_WIDTH / 2 - 8],
      [PITCH_LENGTH / 2 + 8, -PITCH_WIDTH / 2 - 8],
      [-PITCH_LENGTH / 2 - 8, PITCH_WIDTH / 2 + 8],
      [PITCH_LENGTH / 2 + 8, PITCH_WIDTH / 2 + 8],
    ].forEach(([cx, cz], i) => {
      const tower = createFloodlightTower(cx, cz);
      tower.name = `stadium_speedway_tower_${i}`;
      scene.add(tower);
    });
  }
}
