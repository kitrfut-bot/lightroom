/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewMode } from '../types/darkroom';
import { PWAInstallButton } from './common/PWAInstallButton';
import { Sliders, Grid, Upload, Download } from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  photoCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenImport,
  onOpenExport,
  photoCount
}) => {
  return (
    <header className="h-12 bg-[#121317] border-b border-[#22242c] px-4 flex items-center justify-between gap-8 select-none shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full border border-white/80" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap">
          Lumina Darkroom
        </span>
      </div>

      {/* Zone 2: Navigation tabs with keyboard hints */}
      <nav className="flex items-center gap-2">
        <div className="flex items-center bg-[#181920] p-0.5 rounded-lg border border-[#272935]">
          <button
            onClick={() => onViewModeChange('library')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'library'
                ? 'bg-[#2b2d3a] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Library Grid (G)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Library</span>
            <span className="text-[10px] text-slate-500 font-mono ml-0.5">G</span>
          </button>

          <button
            onClick={() => onViewModeChange('develop')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'develop'
                ? 'bg-[#2b2d3a] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Develop Darkroom Studio (D)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Develop</span>
            <span className="text-[10px] text-slate-500 font-mono ml-0.5">D</span>
          </button>
        </div>

        <PWAInstallButton />
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1c1d24] hover:bg-[#252732] border border-[#2e303d] rounded-md transition-colors whitespace-nowrap"
          title="Import RAW / DNG / TIFF / JPEG photos"
        >
          <Upload className="w-3.5 h-3.5 text-slate-300" />
          <span>Import</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm transition-colors whitespace-nowrap"
          title="Export processed photo to disk (JPEG / PNG / TIFF)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
