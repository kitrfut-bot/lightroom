/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HistogramData } from '../../engine/webglEngine';
import { ExifMetadata } from '../../types/darkroom';

interface HistogramProps {
  histogramData: HistogramData | null;
  exif: ExifMetadata;
}

export const Histogram: React.FC<HistogramProps> = ({ histogramData, exif }) => {
  const width = 280;
  const height = 90;

  // Build SVG polygon points for channels
  const generatePath = (bins: Uint32Array, maxCount: number) => {
    if (!bins || maxCount <= 0) return '';
    let path = `M 0 ${height}`;
    for (let i = 0; i < 256; i += 2) {
      const x = (i / 255) * width;
      const count = bins[i] || 0;
      // Logarithmic scaling for visually pleasing histogram curve
      const normalized = Math.min(1, Math.log10(count + 1) / Math.log10(maxCount + 1));
      const y = height - normalized * (height - 6);
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    path += ` L ${width} ${height} Z`;
    return path;
  };

  const maxVal = histogramData?.maxCount || 100;
  const redPath = histogramData ? generatePath(histogramData.r, maxVal) : '';
  const greenPath = histogramData ? generatePath(histogramData.g, maxVal) : '';
  const bluePath = histogramData ? generatePath(histogramData.b, maxVal) : '';
  const lumPath = histogramData ? generatePath(histogramData.lum, maxVal) : '';

  const hasClippedShadows = (histogramData?.clippedShadows || 0) > 10;
  const hasClippedHighlights = (histogramData?.clippedHighlights || 0) > 10;

  return (
    <div className="bg-[#15161c] border-b border-[#232530] p-3 select-none">
      <div className="relative w-full h-[90px] bg-[#0c0d11] rounded border border-[#1f212a] overflow-hidden">
        {/* Shadow clipping flag (top-left) */}
        <div
          title={hasClippedShadows ? 'Shadow Clipping Active' : 'No Shadow Clipping'}
          className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-sm transition-colors z-10 ${
            hasClippedShadows ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]' : 'bg-[#262833]'
          }`}
        />

        {/* Highlight clipping flag (top-right) */}
        <div
          title={hasClippedHighlights ? 'Highlight Clipping Active' : 'No Highlight Clipping'}
          className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-sm transition-colors z-10 ${
            hasClippedHighlights ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]' : 'bg-[#262833]'
          }`}
        />

        {/* Grid lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-15">
          <div className="w-[1px] h-full bg-slate-400" />
          <div className="w-[1px] h-full bg-slate-400" />
          <div className="w-[1px] h-full bg-slate-400" />
          <div className="w-[1px] h-full bg-slate-400" />
        </div>

        {/* Histogram SVG Curves */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full mix-blend-screen"
        >
          {/* Red Channel */}
          {redPath && (
            <path
              d={redPath}
              fill="rgba(239, 68, 68, 0.35)"
              stroke="rgba(239, 68, 68, 0.85)"
              strokeWidth="1"
            />
          )}
          {/* Green Channel */}
          {greenPath && (
            <path
              d={greenPath}
              fill="rgba(34, 197, 94, 0.35)"
              stroke="rgba(34, 197, 94, 0.85)"
              strokeWidth="1"
            />
          )}
          {/* Blue Channel */}
          {bluePath && (
            <path
              d={bluePath}
              fill="rgba(59, 130, 246, 0.35)"
              stroke="rgba(59, 130, 246, 0.85)"
              strokeWidth="1"
            />
          )}
          {/* Luminance overlay */}
          {lumPath && (
            <path
              d={lumPath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
            />
          )}
        </svg>
      </div>

      {/* EXIF Metadata Strip (Anti-slop zero-pill discipline with typographic separators) */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 px-1">
        <span>ISO {exif.iso || 100}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>{exif.focalLength || '50mm'}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>{exif.aperture || 'f/2.8'}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>{exif.shutter || '1/250s'}</span>
      </div>
    </div>
  );
};
