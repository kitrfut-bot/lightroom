/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhotoAdjustments } from '../../../types/darkroom';
import { RotateCcw } from 'lucide-react';

interface BasicPanelProps {
  adjustments: PhotoAdjustments;
  onChange: (updates: Partial<PhotoAdjustments>, label: string) => void;
}

export const BasicPanel: React.FC<BasicPanelProps> = ({ adjustments, onChange }) => {
  const handleWbPreset = (temp: number, tint: number, name: string) => {
    onChange({ temp, tint }, `WB: ${name}`);
  };

  const resetBasicTone = () => {
    onChange(
      {
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
        temp: 5500,
        tint: 0,
        vibrance: 0,
        saturation: 0
      },
      'Reset Basic'
    );
  };

  return (
    <div className="space-y-5 text-xs select-none">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          Basic Tone & Color
        </span>
        <button
          onClick={resetBasicTone}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Reset Basic Tone"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* White Balance Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">White Balance</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleWbPreset(5500, 0, 'Daylight')}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white bg-[#1a1b24] hover:bg-[#252736]"
            >
              Daylight
            </button>
            <button
              onClick={() => handleWbPreset(6500, 6, 'Cloudy')}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white bg-[#1a1b24] hover:bg-[#252736]"
            >
              Cloudy
            </button>
            <button
              onClick={() => handleWbPreset(3200, -8, 'Tungsten')}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white bg-[#1a1b24] hover:bg-[#252736]"
            >
              Tungsten
            </button>
          </div>
        </div>

        {/* Temperature (Kelvin) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ temp: 5500 }, 'Reset Temp')}
              title="Double click to reset to 5500K"
            >
              Temp
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {Math.round(adjustments.temp)} K
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min={2000}
              max={10000}
              step={50}
              value={adjustments.temp}
              onChange={(e) => onChange({ temp: Number(e.target.value) }, 'Temp')}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-500 via-amber-100 to-amber-600"
            />
          </div>
        </div>

        {/* Tint */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ tint: 0 }, 'Reset Tint')}
              title="Double click to reset to 0"
            >
              Tint
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.tint > 0 ? `+${adjustments.tint}` : adjustments.tint}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.tint}
            onChange={(e) => onChange({ tint: Number(e.target.value) }, 'Tint')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-emerald-500 via-slate-500 to-fuchsia-500"
          />
        </div>
      </div>

      {/* Tone Section */}
      <div className="space-y-3 pt-2 border-t border-[#1f212a]">
        <span className="text-slate-400 font-medium block">Tone</span>

        {/* Exposure */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ exposure: 0 }, 'Reset Exposure')}
            >
              Exposure
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.exposure > 0
                ? `+${adjustments.exposure.toFixed(2)} EV`
                : `${adjustments.exposure.toFixed(2)} EV`}
            </span>
          </div>
          <input
            type="range"
            min={-5.0}
            max={5.0}
            step={0.05}
            value={adjustments.exposure}
            onChange={(e) => onChange({ exposure: Number(e.target.value) }, 'Exposure')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ contrast: 0 }, 'Reset Contrast')}
            >
              Contrast
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.contrast}
            onChange={(e) => onChange({ contrast: Number(e.target.value) }, 'Contrast')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Highlights */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ highlights: 0 }, 'Reset Highlights')}
            >
              Highlights
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.highlights > 0 ? `+${adjustments.highlights}` : adjustments.highlights}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.highlights}
            onChange={(e) => onChange({ highlights: Number(e.target.value) }, 'Highlights')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Shadows */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ shadows: 0 }, 'Reset Shadows')}
            >
              Shadows
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.shadows > 0 ? `+${adjustments.shadows}` : adjustments.shadows}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.shadows}
            onChange={(e) => onChange({ shadows: Number(e.target.value) }, 'Shadows')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Whites */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ whites: 0 }, 'Reset Whites')}
            >
              Whites
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.whites > 0 ? `+${adjustments.whites}` : adjustments.whites}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.whites}
            onChange={(e) => onChange({ whites: Number(e.target.value) }, 'Whites')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Blacks */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ blacks: 0 }, 'Reset Blacks')}
            >
              Blacks
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.blacks > 0 ? `+${adjustments.blacks}` : adjustments.blacks}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.blacks}
            onChange={(e) => onChange({ blacks: Number(e.target.value) }, 'Blacks')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>
      </div>

      {/* Presence Section */}
      <div className="space-y-3 pt-2 border-t border-[#1f212a]">
        <span className="text-slate-400 font-medium block">Presence</span>

        {/* Vibrance */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ vibrance: 0 }, 'Reset Vibrance')}
            >
              Vibrance
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.vibrance > 0 ? `+${adjustments.vibrance}` : adjustments.vibrance}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.vibrance}
            onChange={(e) => onChange({ vibrance: Number(e.target.value) }, 'Vibrance')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ saturation: 0 }, 'Reset Saturation')}
            >
              Saturation
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={adjustments.saturation}
            onChange={(e) => onChange({ saturation: Number(e.target.value) }, 'Saturation')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>
      </div>
    </div>
  );
};
