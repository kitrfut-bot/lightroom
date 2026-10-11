/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhotoAdjustments, LocalMask } from '../../../types/darkroom';
import { Paintbrush, AlignJustify, CircleDot, Eye, EyeOff, Trash2, Plus } from 'lucide-react';

interface MaskingPanelProps {
  adjustments: PhotoAdjustments;
  activeMaskId: string | null;
  onSelectMask: (id: string | null) => void;
  onChange: (updates: Partial<PhotoAdjustments>, label: string) => void;
  showMaskOverlay: boolean;
  onToggleOverlay: () => void;
}

export const MaskingPanel: React.FC<MaskingPanelProps> = ({
  adjustments,
  activeMaskId,
  onSelectMask,
  onChange,
  showMaskOverlay,
  onToggleOverlay
}) => {
  const masks = adjustments.masks || [];
  const activeMask = masks.find((m) => m.id === activeMaskId) || null;

  const handleAddMask = (type: LocalMask['type']) => {
    const id = 'mask_' + Math.random().toString(36).substring(2, 9);
    const newMask: LocalMask = {
      id,
      name:
        type === 'brush'
          ? `Brush Mask ${masks.length + 1}`
          : type === 'linear_gradient'
          ? `Linear Gradient ${masks.length + 1}`
          : `Radial Gradient ${masks.length + 1}`,
      type,
      enabled: true,
      inverted: false,
      adjustments: {
        exposure: 0.5,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        temp: 0,
        saturation: 0,
        clarity: 0
      },
      linearGradient:
        type === 'linear_gradient'
          ? { startX: 0.5, startY: 0.1, endX: 0.5, endY: 0.7 }
          : undefined,
      radialGradient:
        type === 'radial_gradient'
          ? {
              centerX: 0.5,
              centerY: 0.5,
              radiusX: 0.35,
              radiusY: 0.35,
              rotation: 0,
              feather: 0.5
            }
          : undefined
    };

    const updated = [...masks, newMask];
    onChange({ masks: updated }, `Add ${newMask.name}`);
    onSelectMask(id);
  };

  const handleToggleMaskEnabled = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = masks.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    onChange({ masks: updated }, 'Toggle Mask Visibility');
  };

  const handleDeleteMask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = masks.filter((m) => m.id !== id);
    onChange({ masks: updated }, 'Delete Mask');
    if (activeMaskId === id) {
      onSelectMask(updated[0]?.id || null);
    }
  };

  const handleToggleInvert = (id: string) => {
    const updated = masks.map((m) => (m.id === id ? { ...m, inverted: !m.inverted } : m));
    onChange({ masks: updated }, 'Invert Mask');
  };

  const handleUpdateActiveAdjustments = (
    updates: Partial<LocalMask['adjustments']>,
    label: string
  ) => {
    if (!activeMask) return;
    const updatedMask: LocalMask = {
      ...activeMask,
      adjustments: { ...activeMask.adjustments, ...updates }
    };
    const updatedList = masks.map((m) => (m.id === activeMask.id ? updatedMask : m));
    onChange({ masks: updatedList }, label);
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          Local Masking
        </span>
        <button
          onClick={onToggleOverlay}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            showMaskOverlay
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'text-slate-400 hover:text-white bg-[#1a1b24]'
          }`}
          title="Toggle Red Ruby Mask Overlay (O)"
        >
          Ruby Overlay (O)
        </button>
      </div>

      {/* Add New Mask Buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => handleAddMask('brush')}
          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#161720] hover:bg-[#222432] border border-[#232534] text-slate-300 hover:text-white transition-colors"
        >
          <Paintbrush className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-medium">Brush</span>
        </button>

        <button
          onClick={() => handleAddMask('linear_gradient')}
          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#161720] hover:bg-[#222432] border border-[#232534] text-slate-300 hover:text-white transition-colors"
        >
          <AlignJustify className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-medium">Linear Grad</span>
        </button>

        <button
          onClick={() => handleAddMask('radial_gradient')}
          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#161720] hover:bg-[#222432] border border-[#232534] text-slate-300 hover:text-white transition-colors"
        >
          <CircleDot className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-medium">Radial Grad</span>
        </button>
      </div>

      {/* Mask Layers List */}
      {masks.length > 0 && (
        <div className="space-y-1">
          <span className="text-slate-400 font-medium text-[11px] block">Mask Layers</span>
          <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
            {masks.map((mask) => (
              <div
                key={mask.id}
                onClick={() => onSelectMask(mask.id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                  activeMaskId === mask.id
                    ? 'bg-[#222533] border-blue-500/50 text-white'
                    : 'bg-[#14151c] border-[#1f212c] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {mask.type === 'brush' && <Paintbrush className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  {mask.type === 'linear_gradient' && <AlignJustify className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {mask.type === 'radial_gradient' && <CircleDot className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  <span className="text-xs truncate">{mask.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleToggleMaskEnabled(mask.id, e)}
                    className="p-1 hover:text-white text-slate-500"
                    title={mask.enabled ? 'Hide Mask' : 'Show Mask'}
                  >
                    {mask.enabled ? <Eye className="w-3 h-3 text-slate-300" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                  </button>
                  <button
                    onClick={(e) => handleDeleteMask(mask.id, e)}
                    className="p-1 hover:text-red-400 text-slate-500"
                    title="Delete Mask"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Mask Adjustments */}
      {activeMask ? (
        <div className="space-y-3 pt-3 border-t border-[#1f212a]">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium text-[11px] truncate">
              Adjust: {activeMask.name}
            </span>
            <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={activeMask.inverted}
                onChange={() => handleToggleInvert(activeMask.id)}
                className="rounded border-[#2e3140] bg-[#1a1b24] text-blue-500"
              />
              <span>Invert</span>
            </label>
          </div>

          {/* Local Exposure */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Exposure</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {activeMask.adjustments.exposure > 0
                  ? `+${activeMask.adjustments.exposure.toFixed(2)} EV`
                  : `${activeMask.adjustments.exposure.toFixed(2)} EV`}
              </span>
            </div>
            <input
              type="range"
              min={-3.0}
              max={3.0}
              step={0.05}
              value={activeMask.adjustments.exposure}
              onChange={(e) =>
                handleUpdateActiveAdjustments(
                  { exposure: Number(e.target.value) },
                  'Mask Exposure'
                )
              }
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
            />
          </div>

          {/* Local Contrast */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Contrast</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {activeMask.adjustments.contrast > 0
                  ? `+${activeMask.adjustments.contrast}`
                  : activeMask.adjustments.contrast}
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={activeMask.adjustments.contrast}
              onChange={(e) =>
                handleUpdateActiveAdjustments(
                  { contrast: Number(e.target.value) },
                  'Mask Contrast'
                )
              }
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
            />
          </div>

          {/* Local Saturation */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Saturation</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {activeMask.adjustments.saturation > 0
                  ? `+${activeMask.adjustments.saturation}`
                  : activeMask.adjustments.saturation}
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={activeMask.adjustments.saturation}
              onChange={(e) =>
                handleUpdateActiveAdjustments(
                  { saturation: Number(e.target.value) },
                  'Mask Saturation'
                )
              }
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
            />
          </div>

          {/* Local Temperature */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Warmth</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {activeMask.adjustments.temp > 0
                  ? `+${activeMask.adjustments.temp}`
                  : activeMask.adjustments.temp}
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={activeMask.adjustments.temp}
              onChange={(e) =>
                handleUpdateActiveAdjustments(
                  { temp: Number(e.target.value) },
                  'Mask Warmth'
                )
              }
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
            />
          </div>
        </div>
      ) : (
        <div className="p-3 text-center rounded-lg bg-[#121319] border border-[#1d1f2a] text-slate-500 text-[11px]">
          Create a brush, linear, or radial gradient mask to apply localized adjustments.
        </div>
      )}
    </div>
  );
};
