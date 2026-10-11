/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhotoAdjustments } from '../../../types/darkroom';
import { RotateCcw } from 'lucide-react';

interface DetailPanelProps {
  adjustments: PhotoAdjustments;
  onChange: (updates: Partial<PhotoAdjustments>, label: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ adjustments, onChange }) => {
  const resetDetail = () => {
    onChange(
      {
        sharpness: 25,
        noiseReduction: 10,
        vignette: { amount: 0, midpoint: 50, feather: 50 }
      },
      'Reset Detail & Optics'
    );
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          Detail & Optics
        </span>
        <button
          onClick={resetDetail}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Reset Detail"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Sharpening & Noise Reduction */}
      <div className="space-y-3">
        <span className="text-slate-400 font-medium block">Detail</span>

        {/* Sharpness */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ sharpness: 25 }, 'Reset Sharpness')}
            >
              Sharpening
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.sharpness}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={adjustments.sharpness}
            onChange={(e) => onChange({ sharpness: Number(e.target.value) }, 'Sharpness')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Noise Reduction */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() => onChange({ noiseReduction: 0 }, 'Reset Noise Reduction')}
            >
              Luminance Noise Reduction
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.noiseReduction}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={adjustments.noiseReduction}
            onChange={(e) => onChange({ noiseReduction: Number(e.target.value) }, 'Noise Reduction')}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>
      </div>

      {/* Vignette */}
      <div className="space-y-3 pt-2 border-t border-[#1f212a]">
        <span className="text-slate-400 font-medium block">Post-Crop Vignette</span>

        {/* Vignette Amount */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className="text-slate-400 cursor-pointer hover:text-white"
              onDoubleClick={() =>
                onChange(
                  { vignette: { ...adjustments.vignette, amount: 0 } },
                  'Reset Vignette'
                )
              }
            >
              Amount
            </span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.vignette.amount > 0
                ? `+${adjustments.vignette.amount}`
                : adjustments.vignette.amount}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjustments.vignette.amount}
            onChange={(e) =>
              onChange(
                {
                  vignette: {
                    ...adjustments.vignette,
                    amount: Number(e.target.value)
                  }
                },
                'Vignette Amount'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Midpoint */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Midpoint</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.vignette.midpoint}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={adjustments.vignette.midpoint}
            onChange={(e) =>
              onChange(
                {
                  vignette: {
                    ...adjustments.vignette,
                    midpoint: Number(e.target.value)
                  }
                },
                'Vignette Midpoint'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Feather */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Feather</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.vignette.feather}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={adjustments.vignette.feather}
            onChange={(e) =>
              onChange(
                {
                  vignette: {
                    ...adjustments.vignette,
                    feather: Number(e.target.value)
                  }
                },
                'Vignette Feather'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>
      </div>
    </div>
  );
};
