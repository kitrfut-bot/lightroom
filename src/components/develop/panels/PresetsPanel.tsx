/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PhotoAdjustments, Preset } from '../../../types/darkroom';
import { BUILTIN_PRESETS } from '../../../data/presets';
import { Plus, Check, Download, Upload } from 'lucide-react';

interface PresetsPanelProps {
  adjustments: PhotoAdjustments;
  onApplyPreset: (preset: Preset) => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({ adjustments, onApplyPreset }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  const allPresets = [...BUILTIN_PRESETS, ...customPresets];
  const categories = ['All', 'Film', 'Monochrome', 'Creative', 'Landscape', 'Custom'];

  const filteredPresets =
    activeCategory === 'All'
      ? allPresets
      : allPresets.filter((p) => p.category === activeCategory);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: Preset = {
      id: 'custom_' + Date.now(),
      name: newPresetName.trim(),
      category: 'Custom',
      description: 'Custom photographer look',
      adjustments: { ...adjustments }
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('lumina_custom_presets', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save preset to storage:', err);
    }

    setNewPresetName('');
    setShowSaveModal(false);
    onApplyPreset(newPreset);
    setAppliedPresetId(newPreset.id);
  };

  const handleExportPresets = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPresets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'lumina_presets.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header & Save Action */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          Darkroom Presets
        </span>
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
        >
          <Plus className="w-3 h-3" />
          <span>Save Current</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
              activeCategory === cat
                ? 'bg-[#2b2e40] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-[#161720]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Presets List */}
      <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => {
              onApplyPreset(preset);
              setAppliedPresetId(preset.id);
            }}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              appliedPresetId === preset.id
                ? 'bg-[#1e2233] border-blue-500/60 text-white shadow-sm'
                : 'bg-[#14151c] border-[#1e202c] text-slate-300 hover:bg-[#1a1c26] hover:border-[#2a2d3d]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-100">{preset.name}</span>
              {appliedPresetId === preset.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.description}</p>
          </div>
        ))}
      </div>

      {/* Export / Backup Action */}
      <div className="pt-2 border-t border-[#1f212a] flex items-center justify-between">
        <button
          onClick={handleExportPresets}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
        >
          <Download className="w-3 h-3" />
          <span>Export Presets (JSON)</span>
        </button>
      </div>

      {/* Save Preset Dialog Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#181922] border border-[#2e3142] rounded-xl p-4 w-full max-w-sm space-y-3 shadow-2xl">
            <h3 className="font-semibold text-sm text-white">Save Look as Preset</h3>
            <p className="text-xs text-slate-400">
              Captures all current exposure, color grading, tone curve, and optical adjustments.
            </p>
            <form onSubmit={handleSaveCustom} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Preset Name (e.g. Moody Autumn Tone)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#101117] border border-[#2a2d3c] rounded-md text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
