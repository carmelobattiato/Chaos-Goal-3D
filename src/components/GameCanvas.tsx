import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BallState, InputState, MapId, PlayerAnim, PlayerState } from '../types/game';
import { buildStadiumScene, getMapWindVector } from '../game/stadiums';
import { PlayerMesh } from '../game/playerModel';
import { createBallMesh } from '../game/physics';

// Pre-allocated math helpers outside render loop (zero GC)
const _fxMat = new THREE.Matrix4();
const _fxPos = new THREE.Vector3();
const _fxQuat = new THREE.Quaternion();
const _fxScale = new THREE.Vector3();

interface GameCanvasProps {
  mapId: MapId;
  selfId: string;
  players: PlayerState[];
  ball: BallState;
  inputState: InputState;
  giantBall?: boolean;
  onGoalScored?: (team: 'red' | 'blue') => void;
  onPlayerPositionChanged?: (x: number, y: number, z: number, rotY: number, anim: PlayerAnim) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mapId,
  selfId,
  players,
  ball,
  inputState,
  giantBall = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to preserve objects across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const playerMeshesRef = useRef<Map<string, PlayerMesh>>(new Map());

  // Mutable state mirrors for the 60fps render loop
  const playersRef = useRef<PlayerState[]>(players);
  playersRef.current = players;

  const ballRef = useRef<BallState>(ball);
  ballRef.current = ball;

  const inputRef = useRef<InputState>(inputState);
  inputRef.current = inputState;

  const selfIdRef = useRef<string>(selfId);
  selfIdRef.current = selfId;

  const giantBallRef = useRef<boolean>(giantBall);
  giantBallRef.current = giantBall;

  const mapIdRef = useRef<MapId>(mapId);

  // Camera angle
  const cameraYaw = useRef<number>(0);
  const cameraPitch = useRef<number>(0.38);

  // Mount Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 400);
    camera.position.set(0, 14, 24);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // RoomEnvironment procedural studio reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Build Stadium
    buildStadiumScene(scene, mapId, isSoftwareGl);
    mapIdRef.current = mapId;

    // Build Ball
    const ballMesh = createBallMesh(mapId);
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // Fiery Super Shot / Bicycle Kick Aura Shell around the ball
    const auraGeo = new THREE.SphereGeometry(0.82, 18, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ballAura = new THREE.Mesh(auraGeo, auraMat);
    ballAura.name = 'ball_super_aura';
    scene.add(ballAura);

    // Handle Window Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Continuous Animation & Physics sync loop
    let animId = 0;
    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.08);

      // 1. Update Ball Mesh + Giant Ball Admin Scale + Fiery Super Shot Aura
      if (ballMeshRef.current) {
        const b = ballRef.current;
        ballMeshRef.current.position.set(b.x, b.y, b.z);
        const targetBallScale = giantBallRef.current ? 2.1 : 1.0;
        const nextBallScale = THREE.MathUtils.damp(ballMeshRef.current.scale.x, targetBallScale, 10, delta);
        ballMeshRef.current.scale.setScalar(nextBallScale);

        const speed = Math.hypot(b.vx, b.vz);
        if (speed > 0.1) {
          ballMeshRef.current.rotation.x += (b.vz * delta * 2) / nextBallScale;
          ballMeshRef.current.rotation.z -= (b.vx * delta * 2) / nextBallScale;
        }
        ballAura.position.set(b.x, b.y, b.z);
        const targetAuraOpacity = b.isSuperShot && speed > 22 ? 0.48 : 0;
        auraMat.opacity = THREE.MathUtils.damp(auraMat.opacity, targetAuraOpacity, 14, delta);
        if (auraMat.opacity > 0.02) {
          const pulse = (1.0 + Math.sin(clock.elapsedTime * 28) * 0.14) * nextBallScale;
          ballAura.scale.setScalar(pulse);
        }
      }

      // 1b. Animate map ambient FX (snowfall, volcanic embers, underwater bubbles, ice mist, fireflies, wind streaks & turbines)
      const fxObj =
        scene.getObjectByName('fx_snow') ||
        scene.getObjectByName('fx_embers') ||
        scene.getObjectByName('fx_bubbles') ||
        scene.getObjectByName('fx_ice') ||
        scene.getObjectByName('fx_fireflies') ||
        scene.getObjectByName('fx_wind');
      if (fxObj && fxObj instanceof THREE.InstancedMesh) {
        const fxName = fxObj.name;
        const windVec = fxName === 'fx_wind' ? getMapWindVector(mapIdRef.current, clock.elapsedTime) : null;
        const windAngle = windVec ? Math.atan2(-windVec.wz, windVec.wx) : 0;
        for (let i = 0; i < fxObj.count; i++) {
          fxObj.getMatrixAt(i, _fxMat);
          _fxMat.decompose(_fxPos, _fxQuat, _fxScale);

          if (fxName === 'fx_snow') {
            _fxPos.y -= 4.2 * delta;
            _fxPos.x += Math.sin(clock.elapsedTime + i) * 0.8 * delta;
            if (_fxPos.y < 0.2) _fxPos.y = 26 + (i % 4);
          } else if (fxName === 'fx_ice') {
            _fxPos.y -= 1.4 * delta;
            _fxPos.x += Math.cos(clock.elapsedTime * 0.9 + i) * 1.4 * delta;
            if (_fxPos.y < 0.4) _fxPos.y = 22 + (i % 4);
          } else if (fxName === 'fx_fireflies') {
            _fxPos.y += Math.sin(clock.elapsedTime * 2.1 + i * 1.7) * 0.8 * delta;
            _fxPos.x += Math.cos(clock.elapsedTime * 1.3 + i) * 0.65 * delta;
            _fxPos.z += Math.sin(clock.elapsedTime * 1.1 + i * 0.6) * 0.65 * delta;
          } else if (fxName === 'fx_wind' && windVec) {
            _fxPos.x += windVec.wx * 4.4 * delta;
            _fxPos.z += windVec.wz * 4.4 * delta;
            if (_fxPos.x > 46) _fxPos.x = -46;
            if (_fxPos.x < -46) _fxPos.x = 46;
            if (_fxPos.z > 32) _fxPos.z = -32;
            if (_fxPos.z < -32) _fxPos.z = 32;
            _fxQuat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, windAngle);
          } else {
            const vSpeed = fxName === 'fx_embers' ? 3.8 : 2.6;
            _fxPos.y += vSpeed * delta;
            if (_fxPos.y > 26) _fxPos.y = 0.4;
          }

          _fxMat.compose(_fxPos, _fxQuat, _fxScale);
          fxObj.setMatrixAt(i, _fxMat);
        }
        fxObj.instanceMatrix.needsUpdate = true;
      }

      // Spin 3D Canyon Wind Turbines smoothly
      if (mapIdRef.current === 'wind') {
        for (let t = 0; t < 5; t++) {
          const hub = scene.getObjectByName(`wind_turbine_${t}`);
          if (hub) hub.rotation.z -= delta * 3.4;
        }
      }

      const earthObj = scene.getObjectByName('stadium_space_earth');
      if (earthObj) {
        earthObj.rotation.y += delta * 0.08;
      }
      const starsObj = scene.getObjectByName('fx_stars');
      if (starsObj) {
        starsObj.rotation.y += delta * 0.015;
      }

      // 2. Synchronize Player Meshes in 3D Scene
      const currentPlayers = playersRef.current;
      const existingMeshMap = playerMeshesRef.current;
      const activeIds = new Set<string>();

      currentPlayers.forEach((p) => {
        activeIds.add(p.id);
        let pMesh = existingMeshMap.get(p.id);

        if (!pMesh) {
          pMesh = new PlayerMesh(p, p.id === selfIdRef.current);
          scene.add(pMesh);
          existingMeshMap.set(p.id, pMesh);
        }

        pMesh.position.x = THREE.MathUtils.damp(pMesh.position.x, p.x, 18, delta);
        pMesh.position.y = THREE.MathUtils.damp(pMesh.position.y, p.y, 18, delta);
        pMesh.position.z = THREE.MathUtils.damp(pMesh.position.z, p.z, 18, delta);

        let diffRot = p.rotY - pMesh.rotation.y;
        while (diffRot < -Math.PI) diffRot += Math.PI * 2;
        while (diffRot > Math.PI) diffRot -= Math.PI * 2;
        pMesh.rotation.y += diffRot * Math.min(1.0, delta * 15);

        pMesh.updateAnimation(p.anim, delta, p.anim === 'run' ? 1.25 : 1.0);
        pMesh.setSpeaking(Boolean(p.isTalking));
      });

      for (const [id, mesh] of existingMeshMap.entries()) {
        if (!activeIds.has(id)) {
          scene.remove(mesh);
          existingMeshMap.delete(id);
        }
      }

      // 3. FIFA Broadcast Lateral Sideline Camera (tracks player + ball AND pans smoothly to bottom touchline!)
      const selfP = currentPlayers.find((p) => p.id === selfIdRef.current) || currentPlayers[0];
      const selfX = selfP ? selfP.x : 0;
      const selfZ = selfP ? selfP.z : 0;
      const b = ballRef.current;

      const focusX = THREE.MathUtils.clamp(selfX * 0.62 + b.x * 0.38, -28, 28);
      // Track Z closely when approaching the bottom sideline (+Z) so the lower touchline is always fully visible
      const weightedZ = selfZ * 0.68 + b.z * 0.32;
      const bottomPush = Math.max(0, Math.max(selfZ, weightedZ) - 2);
      const trackZ = THREE.MathUtils.clamp(weightedZ, -21, 23.5);

      const camElevation = 18.5 + bottomPush * 0.28;
      const camSidelineDist = 27.5 + bottomPush * 1.08 + Math.min(0, trackZ) * 0.25;

      const input = inputRef.current;
      if (input.rotateX !== 0) {
        cameraYaw.current = THREE.MathUtils.clamp(cameraYaw.current + input.rotateX * delta * 1.5, -0.4, 0.4);
      }

      const desiredCamX = focusX + Math.sin(cameraYaw.current) * 6;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamX, 6.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, camElevation, 6.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, camSidelineDist, 6.5, delta);

      // Subtle dynamic broadcast FOV zoom near goalboxes (widens slightly near bottom touchline for full visibility)
      const nearGoalZoom = Math.abs(b.x) > 20 && bottomPush < 10 ? 48 : bottomPush > 12 ? 56 : 53;
      if (Math.abs(camera.fov - nearGoalZoom) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, nearGoalZoom, 4, delta);
        camera.updateProjectionMatrix();
      }

      const desiredLookZ = THREE.MathUtils.clamp(trackZ * 0.82, -16, 20.5);
      lookTarget.set(
        THREE.MathUtils.damp(lookTarget.x, focusX, 8, delta),
        1.3,
        THREE.MathUtils.damp(lookTarget.z, desiredLookZ, 7.5, delta)
      );
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Update map if it changed
  useEffect(() => {
    if (sceneRef.current && mapIdRef.current !== mapId) {
      mapIdRef.current = mapId;
      const gl = rendererRef.current?.getContext();
      const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
      const gpuName = debugInfo && gl ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : '';
      const isSw = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);

      buildStadiumScene(sceneRef.current, mapId, isSw);

      if (ballMeshRef.current) {
        sceneRef.current.remove(ballMeshRef.current);
      }
      const newBall = createBallMesh(mapId);
      sceneRef.current.add(newBall);
      ballMeshRef.current = newBall;
    }
  }, [mapId]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
