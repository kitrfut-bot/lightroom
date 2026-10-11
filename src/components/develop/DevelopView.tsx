/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  PhotoItem,
  PhotoAdjustments,
  HistoryStep,
  Preset,
  DEFAULT_ADJUSTMENTS,
  CompareMode
} from '../../types/darkroom';
import { WebGLEngine, HistogramData } from '../../engine/webglEngine';
import { Histogram } from './Histogram';
import { BasicPanel } from './panels/BasicPanel';
import { CurvePanel } from './panels/CurvePanel';
import { ColorGradingPanel } from './panels/ColorGradingPanel';
import { MaskingPanel } from './panels/MaskingPanel';
import { DetailPanel } from './panels/DetailPanel';
import { PresetsPanel } from './panels/PresetsPanel';
import { HistoryPanel } from './panels/HistoryPanel';
import {
  Sliders,
  TrendingUp,
  Palette,
  Paintbrush,
  Sparkles,
  BookOpen,
  History,
  Columns,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Star,
  Flag,
  RotateCcw
} from 'lucide-react';

interface DevelopViewProps {
  photos: PhotoItem[];
  activePhotoId: string;
  onSelectPhoto: (id: string) => void;
  onUpdatePhoto: (photo: PhotoItem) => void;
  onOpenExport: () => void;
}

type InspectorTab = 'basic' | 'curve' | 'grading' | 'masking' | 'detail' | 'presets' | 'history';

export const DevelopView: React.FC<DevelopViewProps> = ({
  photos,
  activePhotoId,
  onSelectPhoto,
  onUpdatePhoto,
  onOpenExport
}) => {
  const currentPhoto = photos.find((p) => p.id === activePhotoId) || photos[0];
  const adjustments = currentPhoto?.adjustments || DEFAULT_ADJUSTMENTS;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WebGLEngine | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Inspector active tab
  const [activeTab, setActiveTab] = useState<InspectorTab>('basic');

  // Histogram state
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);

  // Viewport Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = Fit
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Before & After comparison
  const [compareMode, setCompareMode] = useState<CompareMode>('off');
  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [showOriginalOnly, setShowOriginalOnly] = useState(false);

  // Masking state
  const [activeMaskId, setActiveMaskId] = useState<string | null>(null);
  const [showMaskOverlay, setShowMaskOverlay] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize WebGL Engine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new WebGLEngine(canvasRef.current);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Load active photo texture
  useEffect(() => {
    if (!currentPhoto || !engineRef.current || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentPhoto.url;
    img.onload = () => {
      imageElementRef.current = img;
      if (canvasRef.current && engineRef.current) {
        // Set canvas resolution to image aspect
        canvasRef.current.width = img.naturalWidth || 1600;
        canvasRef.current.height = img.naturalHeight || 1067;
        engineRef.current.setImage(img, img.naturalWidth, img.naturalHeight);
        renderFrame();
      }
    };
  }, [currentPhoto?.id, currentPhoto?.url]);

  // Re-render frame whenever adjustments, splitRatio, or overlay changes
  const renderFrame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const activeMask = currentPhoto?.adjustments.masks.find((m) => m.id === activeMaskId) || null;

    engine.render(adjustments, {
      splitRatio: compareMode === 'split' ? splitRatio : -1.0,
      showOriginalOnly,
      showMaskOverlay,
      activeMask
    });

    // Update histogram
    const hist = engine.computeHistogram();
    setHistogramData(hist);
  }, [adjustments, compareMode, splitRatio, showOriginalOnly, showMaskOverlay, activeMaskId, currentPhoto]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Handle Adjustment change with non-destructive history push
  const handleAdjustmentsChange = (updates: Partial<PhotoAdjustments>, label: string) => {
    if (!currentPhoto) return;
    const updatedAdjustments: PhotoAdjustments = {
      ...currentPhoto.adjustments,
      ...updates
    };

    const newStep: HistoryStep = {
      id: 'step_' + Date.now(),
      timestamp: Date.now(),
      label,
      adjustments: updatedAdjustments
    };

    const updatedPhoto: PhotoItem = {
      ...currentPhoto,
      adjustments: updatedAdjustments,
      history: [...currentPhoto.history, newStep]
    };

    onUpdatePhoto(updatedPhoto);
  };

  // Restore history step
  const handleRestoreStep = (step: HistoryStep) => {
    if (!currentPhoto) return;
    const updatedPhoto: PhotoItem = {
      ...currentPhoto,
      adjustments: step.adjustments
    };
    onUpdatePhoto(updatedPhoto);
  };

  // Reset all adjustments
  const handleResetAll = () => {
    if (!currentPhoto) return;
    const newStep: HistoryStep = {
      id: 'step_' + Date.now(),
      timestamp: Date.now(),
      label: 'Reset All',
      adjustments: { ...DEFAULT_ADJUSTMENTS }
    };
    const updatedPhoto: PhotoItem = {
      ...currentPhoto,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      history: [...currentPhoto.history, newStep]
    };
    onUpdatePhoto(updatedPhoto);
  };

  // Preset application
  const handleApplyPreset = (preset: Preset) => {
    if (!currentPhoto) return;
    const updatedAdjustments: PhotoAdjustments = {
      ...currentPhoto.adjustments,
      ...preset.adjustments
    };

    const newStep: HistoryStep = {
      id: 'step_' + Date.now(),
      timestamp: Date.now(),
      label: `Preset: ${preset.name}`,
      adjustments: updatedAdjustments
    };

    onUpdatePhoto({
      ...currentPhoto,
      adjustments: updatedAdjustments,
      history: [...currentPhoto.history, newStep]
    });
  };

  // Star Rating & Flag shortcuts
  const handleSetRating = (rating: number) => {
    if (!currentPhoto) return;
    onUpdatePhoto({ ...currentPhoto, rating: currentPhoto.rating === rating ? 0 : rating });
  };

  const handleSetFlag = (flag: PhotoItem['flag']) => {
    if (!currentPhoto) return;
    onUpdatePhoto({ ...currentPhoto, flag: currentPhoto.flag === flag ? 'none' : flag });
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '\\') {
        setShowOriginalOnly((prev) => !prev);
      } else if (e.key === 'y' || e.key === 'Y') {
        setCompareMode((prev) => (prev === 'split' ? 'off' : 'split'));
      } else if (e.key === 'o' || e.key === 'O') {
        setShowMaskOverlay((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        handleSetFlag('pick');
      } else if (e.key === 'x' || e.key === 'X') {
        handleSetFlag('reject');
      } else if (e.key === 'u' || e.key === 'U') {
        handleSetFlag('none');
      } else if (e.key >= '1' && e.key <= '5') {
        handleSetRating(Number(e.key));
      } else if (e.key === 'ArrowLeft') {
        const idx = photos.findIndex((p) => p.id === activePhotoId);
        if (idx > 0) onSelectPhoto(photos[idx - 1].id);
      } else if (e.key === 'ArrowRight') {
        const idx = photos.findIndex((p) => p.id === activePhotoId);
        if (idx < photos.length - 1) onSelectPhoto(photos[idx + 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoId, photos, currentPhoto]);

  // Pan interaction
  const handleViewportPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.shiftKey || zoomLevel > 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleViewportPointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
    if (isDraggingSplit && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const ratio = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      setSplitRatio(ratio);
    }
  };

  const handleViewportPointerUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-48px)] overflow-hidden bg-[#0d0e12] select-none">
      {/* Main Studio Middle Row */}
      <div className="flex-1 flex overflow-hidden">
        {/* CENTER VIEWPORT (The Darkroom Canvas) */}
        <div className="flex-1 flex flex-col relative bg-[#0b0c10] overflow-hidden">
          {/* Top Canvas Toolbar */}
          <div className="h-9 bg-[#121318] border-b border-[#1f212a] px-3 flex items-center justify-between z-20 shrink-0">
            {/* Left: Compare tools & view mode */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCompareMode((prev) => (prev === 'split' ? 'off' : 'split'))}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  compareMode === 'split'
                    ? 'bg-[#292c3d] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Split Before/After Comparison (Y)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View (Y)</span>
              </button>

              <button
                onMouseDown={() => setShowOriginalOnly(true)}
                onMouseUp={() => setShowOriginalOnly(false)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  showOriginalOnly
                    ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Hold to view original unedited photo (\)"
              >
                <span>Hold for Original (\)</span>
              </button>
            </div>

            {/* Center: Photo Title & Rating Badge */}
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="font-medium truncate max-w-[280px]">
                {currentPhoto?.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentPhoto?.width} × {currentPhoto?.height} px
              </span>
            </div>

            {/* Right: Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  zoomLevel === 1
                    ? 'bg-[#252734] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fit
              </button>
              <button
                onClick={() => setZoomLevel(1.5)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  zoomLevel === 1.5
                    ? 'bg-[#252734] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                100%
              </button>
              <button
                onClick={() => setZoomLevel(2.5)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  zoomLevel === 2.5
                    ? 'bg-[#252734] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                200%
              </button>
            </div>
          </div>

          {/* Central Image Canvas Area */}
          <div
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerUp}
            className="flex-1 flex items-center justify-center p-6 relative overflow-hidden cursor-default touch-none"
          >
            {/* Zoom / Pan container */}
            <div
              className="relative shadow-2xl transition-transform duration-75 origin-center"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
              }}
            >
              <canvas
                ref={canvasRef}
                className="max-h-[calc(100vh-220px)] max-w-[calc(100vw-380px)] object-contain rounded-xs shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#222430]"
              />

              {/* Split wipe handle (when in split mode) */}
              {compareMode === 'split' && (
                <div
                  onPointerDown={(e) => {
                    setIsDraggingSplit(true);
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex items-center justify-center z-30 group"
                  style={{ left: `${splitRatio * 100}%` }}
                >
                  <div className="w-[2px] h-full bg-white shadow-lg group-hover:bg-blue-400 transition-colors" />
                  <div className="absolute w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Columns className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              )}

              {/* Before / After labels */}
              {compareMode === 'split' && (
                <>
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium pointer-events-none">
                    Processed (After)
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium pointer-events-none">
                    Original RAW (Before)
                  </div>
                </>
              )}

              {/* "Hold for Original" status toast */}
              {showOriginalOnly && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-xs text-xs text-white font-semibold pointer-events-none shadow-lg">
                  Viewing Original RAW (Unadjusted)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR PANEL (Adjustments & Tools) */}
        <div className="w-80 bg-[#14151b] border-l border-[#22242e] flex flex-col z-20 shrink-0">
          {/* Histogram at Top */}
          <Histogram
            histogramData={histogramData}
            exif={currentPhoto?.exif || {}}
          />

          {/* Inspector Navigation Tabs */}
          <div className="flex items-center justify-between bg-[#111218] border-b border-[#20222d] p-1 shrink-0">
            <button
              onClick={() => setActiveTab('basic')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'basic' ? 'bg-[#252838] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Basic Tone & White Balance"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('curve')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'curve' ? 'bg-[#252838] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Tone Curves"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('grading')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'grading' ? 'bg-[#252838] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Color Grading (3-Way)"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('masking')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'masking' ? 'bg-[#252838] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Local Masking (Brush / Gradients)"
            >
              <Paintbrush className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'detail' ? 'bg-[#252838] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Detail & Optics"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'presets' ? 'bg-[#252838] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Presets Library"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`p-1.5 rounded-md transition-colors ${
                activeTab === 'history' ? 'bg-[#252838] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Edit History Stack"
            >
              <History className="w-4 h-4" />
            </button>
          </div>

          {/* Active Panel Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {activeTab === 'basic' && (
              <BasicPanel
                adjustments={adjustments}
                onChange={handleAdjustmentsChange}
              />
            )}
            {activeTab === 'curve' && (
              <CurvePanel
                adjustments={adjustments}
                onChange={handleAdjustmentsChange}
              />
            )}
            {activeTab === 'grading' && (
              <ColorGradingPanel
                adjustments={adjustments}
                onChange={handleAdjustmentsChange}
              />
            )}
            {activeTab === 'masking' && (
              <MaskingPanel
                adjustments={adjustments}
                activeMaskId={activeMaskId}
                onSelectMask={setActiveMaskId}
                onChange={handleAdjustmentsChange}
                showMaskOverlay={showMaskOverlay}
                onToggleOverlay={() => setShowMaskOverlay((prev) => !prev)}
              />
            )}
            {activeTab === 'detail' && (
              <DetailPanel
                adjustments={adjustments}
                onChange={handleAdjustmentsChange}
              />
            )}
            {activeTab === 'presets' && (
              <PresetsPanel
                adjustments={adjustments}
                onApplyPreset={handleApplyPreset}
              />
            )}
            {activeTab === 'history' && (
              <HistoryPanel
                history={currentPhoto?.history || []}
                currentAdjustments={adjustments}
                onRestoreStep={handleRestoreStep}
                onResetAll={handleResetAll}
              />
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM FILMSTRIP (Photo selection & quick metadata) */}
      <div className="h-18 bg-[#111217] border-t border-[#1f212a] px-3 flex items-center gap-3 shrink-0 select-none z-20">
        {/* Filmstrip navigation arrows */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              const idx = photos.findIndex((p) => p.id === activePhotoId);
              if (idx > 0) onSelectPhoto(photos[idx - 1].id);
            }}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1f212a] transition-colors"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const idx = photos.findIndex((p) => p.id === activePhotoId);
              if (idx < photos.length - 1) onSelectPhoto(photos[idx + 1].id);
            }}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1f212a] transition-colors"
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filmstrip items */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {photos.map((photo) => {
            const isActive = photo.id === activePhotoId;
            return (
              <div
                key={photo.id}
                onClick={() => onSelectPhoto(photo.id)}
                className={`h-14 w-20 rounded-md overflow-hidden relative cursor-pointer shrink-0 transition-all border ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-[#232532] opacity-60 hover:opacity-100 hover:border-[#35384a]'
                }`}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />

                {/* Rating & Flag mini indicator */}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 flex items-center justify-between text-[9px] text-white">
                  <span className="truncate max-w-[42px] font-mono">{photo.format}</span>
                  {photo.rating > 0 && (
                    <div className="flex items-center text-amber-400">
                      <span>{photo.rating}</span>
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Star Rating & Flag Buttons */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#22242e] shrink-0">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleSetRating(star)}
                className={`p-1 transition-colors ${
                  (currentPhoto?.rating || 0) >= star
                    ? 'text-amber-400'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
                title={`Rate ${star} Stars (${star})`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    (currentPhoto?.rating || 0) >= star ? 'fill-current' : ''
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-[#22242e] pl-2">
            <button
              onClick={() => handleSetFlag('pick')}
              className={`p-1 rounded transition-colors ${
                currentPhoto?.flag === 'pick'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Flag as Pick (P)"
            >
              <Flag className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={() => handleSetFlag('reject')}
              className={`p-1 rounded transition-colors ${
                currentPhoto?.flag === 'reject'
                  ? 'text-red-400 bg-red-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Flag as Reject (X)"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
