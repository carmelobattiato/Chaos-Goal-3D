import React, { useRef, useState, useEffect } from 'react';
import { Zap, ShieldAlert, Disc, Send, Flame, ArrowUpRight, Sparkles, RefreshCw } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (x: number, z: number) => void;
  onCameraRotate: (deltaX: number) => void;
  onKick: (isKicking: boolean) => void;
  onPass: (isPassing: boolean) => void;
  onSprint: (isSprinting: boolean) => void;
  onTackle: (isTackling: boolean) => void;
  onLob: (isLobbing: boolean) => void;
  onPowerShot: (isPowerShooting: boolean) => void;
  onSkillMove: (isSkillMoving: boolean) => void;
  onBicycleKick: (isBicycleKicking: boolean) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onCameraRotate,
  onKick,
  onPass,
  onSprint,
  onTackle,
  onLob,
  onPowerShot,
  onSkillMove,
  onBicycleKick,
}) => {
  const leftZoneRef = useRef<HTMLDivElement>(null);
  const rightZoneRef = useRef<HTMLDivElement>(null);

  const [joystickActive, setJoystickActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const activeTouchId = useRef<number | null>(null);
  const cameraTouchId = useRef<number | null>(null);
  const lastCameraX = useRef<number>(0);

  const handleLeftTouchStart = (e: React.TouchEvent) => {
    if (activeTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;

    const rect = leftZoneRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setOrigin({ x, y });
    setKnob({ x: 0, y: 0 });
    setJoystickActive(true);
    onMove(0, 0);

    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleLeftTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        const rect = leftZoneRef.current?.getBoundingClientRect();
        if (!rect) return;

        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        const deltaX = currentX - origin.x;
        const deltaY = currentY - origin.y;
        const distance = Math.hypot(deltaX, deltaY);
        const maxRadius = 55;

        let normalizedX = deltaX / maxRadius;
        let normalizedZ = deltaY / maxRadius;

        if (distance > maxRadius) {
          normalizedX = deltaX / distance;
          normalizedZ = deltaY / distance;
          setKnob({
            x: normalizedX * maxRadius,
            y: normalizedZ * maxRadius,
          });
        } else {
          setKnob({ x: deltaX, y: deltaY });
        }

        onMove(normalizedX, normalizedZ);
        break;
      }
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setJoystickActive(false);
        setKnob({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const handleRightTouchStart = (e: React.TouchEvent) => {
    if (cameraTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    cameraTouchId.current = touch.identifier;
    lastCameraX.current = touch.clientX;
  };

  const handleRightTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchId.current) {
        const deltaX = touch.clientX - lastCameraX.current;
        lastCameraX.current = touch.clientX;
        onCameraRotate(deltaX * 0.008);
        break;
      }
    }
  };

  const handleRightTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchId.current) {
        cameraTouchId.current = null;
        break;
      }
    }
  };

  useEffect(() => {
    return () => {
      onMove(0, 0);
      onKick(false);
      onPass(false);
      onSprint(false);
      onTackle(false);
      onLob(false);
      onPowerShot(false);
      onSkillMove(false);
      onBicycleKick(false);
    };
  }, [onMove, onKick, onPass, onSprint, onTackle, onLob, onPowerShot, onSkillMove, onBicycleKick]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden touch-none z-20">
      {/* Left Touch Area: Dynamic Floating Joystick */}
      <div
        ref={leftZoneRef}
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onTouchCancel={handleLeftTouchEnd}
        className="absolute top-0 bottom-0 left-0 w-1/2 pointer-events-auto"
      >
        {joystickActive ? (
          <div
            className="absolute rounded-full border-2 border-white/40 bg-black/35 transition-opacity"
            style={{
              width: 120,
              height: 120,
              left: origin.x - 60,
              top: origin.y - 60,
            }}
          >
            <div
              className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-white shadow-lg shadow-emerald-500/40"
              style={{
                left: 60 - 24 + knob.x,
                top: 60 - 24 + knob.y,
              }}
            />
          </div>
        ) : (
          <div className="absolute bottom-12 left-10 w-24 h-24 rounded-full border border-white/20 bg-black/20 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-bold text-white/55 tracking-wider text-center uppercase">
              Tocca e trascina <br />
              <span className="text-emerald-400">Levetta</span>
            </span>
          </div>
        )}
      </div>

      {/* Right Touch Area: Camera Pan & Action Buttons */}
      <div
        ref={rightZoneRef}
        onTouchStart={handleRightTouchStart}
        onTouchMove={handleRightTouchMove}
        onTouchEnd={handleRightTouchEnd}
        onTouchCancel={handleRightTouchEnd}
        className="absolute top-0 bottom-0 right-0 w-1/2 pointer-events-auto"
      >
        <div className="absolute bottom-5 right-4 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Special Moves Strip: Finta, Lob, Super Tiro, Rovesciata */}
          <div className="flex items-center gap-1.5">
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                onSkillMove(true);
                if (navigator.vibrate) navigator.vibrate(15);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onSkillMove(false);
              }}
              className="w-11 h-11 rounded-full bg-violet-600/90 active:scale-90 border-2 border-violet-300 text-white flex flex-col items-center justify-center shadow-lg transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[7px] font-black uppercase">Finta</span>
            </button>

            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                onLob(true);
                if (navigator.vibrate) navigator.vibrate(15);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onLob(false);
              }}
              className="w-11 h-11 rounded-full bg-cyan-600/90 active:scale-90 border-2 border-cyan-200 text-white flex flex-col items-center justify-center shadow-lg transition-transform"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-100" />
              <span className="text-[7px] font-black uppercase">Lob</span>
            </button>

            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                onPowerShot(true);
                if (navigator.vibrate) navigator.vibrate(30);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onPowerShot(false);
              }}
              className="w-11 h-11 rounded-full bg-orange-600/95 active:scale-90 border-2 border-amber-300 text-white flex flex-col items-center justify-center shadow-lg transition-transform"
            >
              <Flame className="w-3.5 h-3.5 text-amber-200" />
              <span className="text-[7px] font-black uppercase">Super</span>
            </button>

            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                onBicycleKick(true);
                if (navigator.vibrate) navigator.vibrate(30);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onBicycleKick(false);
              }}
              className="w-11 h-11 rounded-full bg-yellow-500/95 active:scale-90 border-2 border-white text-slate-950 flex flex-col items-center justify-center shadow-lg transition-transform"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
              <span className="text-[7px] font-black uppercase">Rov.</span>
            </button>
          </div>

          {/* Core Row: Scatto, Passa & Tiro */}
          <div className="flex items-center gap-2">
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                onSprint(true);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onSprint(false);
              }}
              className="w-12 h-12 rounded-full bg-sky-600/90 active:scale-90 border-2 border-sky-300 text-white flex flex-col items-center justify-center shadow-lg transition-transform"
            >
              <Zap className="w-4 h-4 text-sky-200" />
              <span className="text-[8px] font-black uppercase tracking-tight">Scatto</span>
            </button>

            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                onPass(true);
                if (navigator.vibrate) navigator.vibrate(15);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onPass(false);
              }}
              className="w-13 h-13 rounded-full bg-emerald-500/95 active:scale-90 border-2 border-emerald-200 text-slate-950 flex flex-col items-center justify-center shadow-lg transition-transform"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span className="text-[8px] font-black uppercase tracking-tight">PASSA</span>
            </button>

            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                onKick(true);
                if (navigator.vibrate) navigator.vibrate(25);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onKick(false);
              }}
              className="w-15 h-15 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 active:scale-90 border-2 border-white text-white flex flex-col items-center justify-center shadow-xl transition-transform"
            >
              <Disc className="w-5 h-5 text-white drop-shadow-sm" />
              <span className="text-[9px] font-black uppercase tracking-wider">TIRO</span>
            </button>
          </div>

          {/* Dedicated large SCIVOLATA button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onTackle(true);
              if (navigator.vibrate) navigator.vibrate(20);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onTackle(false);
            }}
            className="w-36 h-13 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 active:scale-95 border-2 border-amber-200 text-slate-950 flex items-center justify-center gap-2 shadow-xl transition-transform"
          >
            <ShieldAlert className="w-5 h-5 text-slate-950" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950">SCIVOLATA</span>
              <span className="text-[8px] font-extrabold uppercase text-amber-950 opacity-80">Prendi Palla</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
