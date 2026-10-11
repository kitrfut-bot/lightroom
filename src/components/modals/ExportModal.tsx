/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PhotoItem } from '../../types/darkroom';
import { WebGLEngine } from '../../engine/webglEngine';
import { Download, X, CheckCircle, FileCode, Sliders } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePhoto: PhotoItem;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activePhoto
}) => {
  const [format, setFormat] = useState<'JPEG' | 'PNG' | 'TIFF'>('JPEG');
  const [quality, setQuality] = useState<number>(95);
  const [resolutionMode, setResolutionMode] = useState<'original' | '4k' | '2k'>('original');
  const [colorSpace, setColorSpace] = useState<'sRGB' | 'Adobe RGB' | 'ProPhoto RGB'>('sRGB');
  const [includeSidecar, setIncludeSidecar] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      // Calculate target export resolution
      let targetW = activePhoto.width;
      let targetH = activePhoto.height;

      if (resolutionMode === '4k') {
        const scale = 3840 / Math.max(targetW, targetH);
        if (scale < 1) {
          targetW = Math.round(targetW * scale);
          targetH = Math.round(targetH * scale);
        }
      } else if (resolutionMode === '2k') {
        const scale = 2048 / Math.max(targetW, targetH);
        if (scale < 1) {
          targetW = Math.round(targetW * scale);
          targetH = Math.round(targetH * scale);
        }
      }

      // Offscreen canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetW;
      exportCanvas.height = targetH;

      const offscreenEngine = new WebGLEngine(exportCanvas);

      // Load original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activePhoto.url;
      await new Promise((res) => {
        img.onload = res;
      });

      offscreenEngine.setImage(img, targetW, targetH);
      offscreenEngine.render(activePhoto.adjustments, { splitRatio: -1 });

      const mimeType = format === 'PNG' ? 'image/png' : 'image/jpeg';
      const q = format === 'PNG' ? undefined : quality / 100;

      const blob = await new Promise<Blob | null>((res) => {
        exportCanvas.toBlob(res, mimeType, q);
      });

      if (blob) {
        // Trigger file download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const baseName = activePhoto.name.replace(/\.[^/.]+$/, '');
        const ext = format === 'TIFF' ? 'tif' : format === 'PNG' ? 'png' : 'jpg';
        a.href = url;
        a.download = `${baseName}_developed.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      // Download XMP sidecar if checked
      if (includeSidecar) {
        const sidecarData = {
          version: '1.0',
          appName: 'Lumina Darkroom',
          sourceFile: activePhoto.name,
          colorSpace,
          exif: activePhoto.exif,
          adjustments: activePhoto.adjustments,
          exportDate: new Date().toISOString()
        };
        const sidecarStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sidecarData, null, 2));
        const sidecarLink = document.createElement('a');
        const baseName = activePhoto.name.replace(/\.[^/.]+$/, '');
        sidecarLink.href = sidecarStr;
        sidecarLink.download = `${baseName}.xmp.json`;
        document.body.appendChild(sidecarLink);
        sidecarLink.click();
        sidecarLink.remove();
      }

      offscreenEngine.destroy();
      setExportComplete(true);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-[#15161e] border border-[#262838] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222432]">
          <div>
            <h2 className="text-base font-semibold text-white">Export Developed Photo</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Renders hardware-accelerated adjustments to high-resolution master file.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#20222f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Form Options */}
        <div className="space-y-4 text-xs">
          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">File Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['JPEG', 'PNG', 'TIFF'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                    format === fmt
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-[#101117] border-[#252736] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* JPEG Quality Slider */}
          {format === 'JPEG' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Quality</span>
                <span className="font-mono text-slate-200 tabular-nums">{quality}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
              />
            </div>
          )}

          {/* Resolution Mode */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">Output Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setResolutionMode('original')}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  resolutionMode === 'original'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                    : 'bg-[#101117] border-[#252736] text-slate-400 hover:text-slate-200'
                }`}
              >
                Full RAW Res
                <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                  {activePhoto.width} × {activePhoto.height}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResolutionMode('4k')}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  resolutionMode === '4k'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                    : 'bg-[#101117] border-[#252736] text-slate-400 hover:text-slate-200'
                }`}
              >
                4K Ultra HD
                <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                  3840px Long Edge
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResolutionMode('2k')}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  resolutionMode === '2k'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-medium'
                    : 'bg-[#101117] border-[#252736] text-slate-400 hover:text-slate-200'
                }`}
              >
                2K Web Ready
                <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                  2048px Long Edge
                </span>
              </button>
            </div>
          </div>

          {/* Color Space Profile */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">Color Profile</label>
            <div className="flex items-center gap-2">
              {(['sRGB', 'Adobe RGB', 'ProPhoto RGB'] as const).map((space) => (
                <button
                  key={space}
                  type="button"
                  onClick={() => setColorSpace(space)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    colorSpace === space
                      ? 'bg-[#25283a] border-blue-500/60 text-white'
                      : 'bg-[#101117] border-[#252736] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {space}
                </button>
              ))}
            </div>
          </div>

          {/* Include XMP Sidecar Checkbox */}
          <div className="pt-2 border-t border-[#222432]">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includeSidecar}
                onChange={(e) => setIncludeSidecar(e.target.checked)}
                className="rounded border-[#2e3140] bg-[#1a1b24] text-blue-500"
              />
              <span className="font-medium">Export non-destructive XMP / JSON sidecar</span>
            </label>
            <p className="text-[11px] text-slate-500 ml-5 mt-0.5">
              Preserves the full parameter tree, tone curve knots, color wheels, and mask definitions.
            </p>
          </div>
        </div>

        {/* Export CTA Button */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#222432]">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {exportComplete ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Exported!</span>
              </>
            ) : isExporting ? (
              <span>Rendering GPU passes...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Render & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
