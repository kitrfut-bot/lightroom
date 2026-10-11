/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { PhotoAdjustments, ColorWheelState } from '../../../types/darkroom';
import { RotateCcw } from 'lucide-react';

interface ColorGradingPanelProps {
  adjustments: PhotoAdjustments;
  onChange: (updates: Partial<PhotoAdjustments>, label: string) => void;
}

interface ColorWheelProps {
  label: string;
  state: ColorWheelState;
  onChange: (state: ColorWheelState) => void;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ label, state, onChange }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate puck position from hue & sat
  const radius = 38; // px
  const angleRad = (state.hue * Math.PI) / 180;
  const dist = (state.sat / 100) * radius;
  const puckX = radius + Math.cos(angleRad) * dist;
  const puckY = radius + Math.sin(angleRad) * dist;

  const handlePointer = (e: React.PointerEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;

    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    const currentDist = Math.hypot(dx, dy);
    const sat = Math.min(100, Math.round((currentDist / radius) * 100));

    onChange({
      ...state,
      hue: Math.round(angleDeg),
      sat
    });
  };

  const handleDoubleClick = () => {
    onChange({ ...state, hue: 0, sat: 0, lum: 0 });
  };

  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-[#14151b] border border-[#20222d] space-y-2">
      <div className="flex items-center justify-between w-full text-[11px] font-medium text-slate-300">
        <span>{label}</span>
        <span className="font-mono text-[10px] text-slate-500">
          {state.sat > 0 ? `${state.hue}° · ${state.sat}%` : 'Neutral'}
        </span>
      </div>

      {/* Wheel Circle */}
      <div
        ref={wheelRef}
        onPointerDown={(e) => {
          setIsDragging(true);
          handlePointer(e);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (isDragging) handlePointer(e);
        }}
        onPointerUp={() => setIsDragging(false)}
        onDoubleClick={handleDoubleClick}
        title="Drag puck to set tint. Double-click to reset."
        className="relative w-[76px] h-[76px] rounded-full cursor-crosshair shadow-inner select-none overflow-hidden border border-[#2e3140]"
        style={{
          background:
            'radial-gradient(circle at center, #64748b 0%, transparent 70%), conic-gradient(from 0deg, #f87171, #fbbf24, #34d399, #22d3ee, #818cf8, #c084fc, #f87171)'
        }}
      >
        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400/40 pointer-events-none" />

        {/* Puck Handle */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-900 shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform"
          style={{
            left: `${puckX}px`,
            top: `${puckY}px`,
            backgroundColor:
              state.sat > 0 ? `hsl(${state.hue}, ${state.sat}%, 50%)` : '#1e293b'
          }}
        />
      </div>

      {/* Luminance slider for this wheel */}
      <div className="w-full space-y-0.5">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Lum</span>
          <span className="font-mono tabular-nums text-slate-300">
            {state.lum > 0 ? `+${state.lum}` : state.lum}
          </span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          value={state.lum}
          onChange={(e) => onChange({ ...state, lum: Number(e.target.value) })}
          className="w-full h-1 rounded appearance-none cursor-pointer bg-[#262836]"
        />
      </div>
    </div>
  );
};

export const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({
  adjustments,
  onChange
}) => {
  const cg = adjustments.colorGrading;

  const resetAllGrading = () => {
    onChange(
      {
        colorGrading: {
          shadows: { hue: 0, sat: 0, lum: 0 },
          midtones: { hue: 0, sat: 0, lum: 0 },
          highlights: { hue: 0, sat: 0, lum: 0 },
          blending: 50,
          balance: 0
        }
      },
      'Reset Color Grading'
    );
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          Color Grading (3-Way)
        </span>
        <button
          onClick={resetAllGrading}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Reset Color Grading"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* 3 Wheels: Shadows, Midtones, Highlights */}
      <div className="grid grid-cols-3 gap-2">
        <ColorWheel
          label="Shadows"
          state={cg.shadows}
          onChange={(shadows) =>
            onChange(
              { colorGrading: { ...cg, shadows } },
              'Grade: Shadows'
            )
          }
        />
        <ColorWheel
          label="Midtones"
          state={cg.midtones}
          onChange={(midtones) =>
            onChange(
              { colorGrading: { ...cg, midtones } },
              'Grade: Midtones'
            )
          }
        />
        <ColorWheel
          label="Highlights"
          state={cg.highlights}
          onChange={(highlights) =>
            onChange(
              { colorGrading: { ...cg, highlights } },
              'Grade: Highlights'
            )
          }
        />
      </div>

      {/* Blending & Balance */}
      <div className="space-y-3 pt-2 border-t border-[#1f212a]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Blending</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {cg.blending}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cg.blending}
            onChange={(e) =>
              onChange(
                { colorGrading: { ...cg, blending: Number(e.target.value) } },
                'Grading Blending'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Balance</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {cg.balance > 0 ? `+${cg.balance}` : cg.balance}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={cg.balance}
            onChange={(e) =>
              onChange(
                { colorGrading: { ...cg, balance: Number(e.target.value) } },
                'Grading Balance'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>
      </div>
    </div>
  );
};
