/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { PhotoAdjustments, CurvePoint } from '../../../types/darkroom';
import { RotateCcw } from 'lucide-react';

interface CurvePanelProps {
  adjustments: PhotoAdjustments;
  onChange: (updates: Partial<PhotoAdjustments>, label: string) => void;
}

type ChannelKey = 'rgb' | 'red' | 'green' | 'blue';

export const CurvePanel: React.FC<CurvePanelProps> = ({ adjustments, onChange }) => {
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('rgb');
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = adjustments.curves[activeChannel] || [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ];

  // Helper to build smooth SVG path through control points
  const getSplinePath = (pts: CurvePoint[]) => {
    if (pts.length < 2) return '';
    const sorted = [...pts].sort((a, b) => a.x - b.x);
    let path = `M ${(sorted[0].x * 200).toFixed(1)} ${((1 - sorted[0].y) * 200).toFixed(1)}`;

    for (let i = 0; i < sorted.length - 1; i++) {
      const p0 = sorted[i === 0 ? 0 : i - 1];
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      const p3 = sorted[i + 2 >= sorted.length ? sorted.length - 1 : i + 2];

      // Catmull-Rom to Cubic Bezier control points
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      const x1 = (cp1x * 200).toFixed(1);
      const y1 = ((1 - cp1y) * 200).toFixed(1);
      const x2 = (cp2x * 200).toFixed(1);
      const y2 = ((1 - cp2y) * 200).toFixed(1);
      const x = (p2.x * 200).toFixed(1);
      const y = ((1 - p2.y) * 200).toFixed(1);

      path += ` C ${x1} ${y1}, ${x2} ${y2}, ${x} ${y}`;
    }
    return path;
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));

    // Check if clicked close to an existing point
    const threshold = 0.08;
    const existingIndex = points.findIndex(
      (p) => Math.hypot(p.x - nx, p.y - ny) < threshold
    );

    if (existingIndex !== -1) {
      setDraggedPointIndex(existingIndex);
    } else {
      // Add a new knot point
      const newPts = [...points, { x: nx, y: ny }].sort((a, b) => a.x - b.x);
      const newCurves = { ...adjustments.curves, [activeChannel]: newPts };
      onChange({ curves: newCurves }, `Add Curve Knot (${activeChannel})`);
      setDraggedPointIndex(newPts.findIndex((p) => p.x === nx && p.y === ny));
    }
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggedPointIndex === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    let nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));

    // Clamp boundary endpoints to 0 and 1 on X axis
    if (draggedPointIndex === 0) nx = 0;
    if (draggedPointIndex === points.length - 1) nx = 1;

    const newPts = [...points];
    newPts[draggedPointIndex] = { x: nx, y: ny };
    const newCurves = { ...adjustments.curves, [activeChannel]: newPts };
    onChange({ curves: newCurves }, `Adjust Curve (${activeChannel})`);
  };

  const handleSvgPointerUp = () => {
    setDraggedPointIndex(null);
  };

  const handlePointDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0 || index === points.length - 1) return; // Don't remove edge knots
    const newPts = points.filter((_, i) => i !== index);
    const newCurves = { ...adjustments.curves, [activeChannel]: newPts };
    onChange({ curves: newCurves }, `Remove Curve Knot (${activeChannel})`);
  };

  const resetActiveCurve = () => {
    const defaultPts = [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ];
    const newCurves = { ...adjustments.curves, [activeChannel]: defaultPts };
    onChange({ curves: newCurves }, `Reset ${activeChannel.toUpperCase()} Curve`);
  };

  const channelColorClass = {
    rgb: 'text-slate-100',
    red: 'text-red-400',
    green: 'text-emerald-400',
    blue: 'text-blue-400'
  }[activeChannel];

  const strokeColor = {
    rgb: '#f1f5f9',
    red: '#f87171',
    green: '#34d399',
    blue: '#60a5fa'
  }[activeChannel];

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          Tone Curve
        </span>
        <button
          onClick={resetActiveCurve}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Reset Curve"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Channel Selector */}
      <div className="flex items-center bg-[#15161d] p-0.5 rounded-lg border border-[#22242f]">
        {(['rgb', 'red', 'green', 'blue'] as ChannelKey[]).map((ch) => (
          <button
            key={ch}
            onClick={() => setActiveChannel(ch)}
            className={`flex-1 py-1 text-center font-medium uppercase text-[10px] rounded transition-colors ${
              activeChannel === ch
                ? 'bg-[#2b2d3d] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Interactive SVG Tone Curve Editor */}
      <div className="relative w-full aspect-square max-w-[220px] mx-auto bg-[#0d0e12] rounded-lg border border-[#232532] p-2 overflow-hidden shadow-inner">
        {/* Background diagonal reference line */}
        <div className="absolute inset-2 pointer-events-none opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="0" y1="200" x2="200" y2="0" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="50" y1="0" x2="50" y2="200" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="100" y1="0" x2="100" y2="200" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="150" y1="0" x2="150" y2="200" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="200" y2="50" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="0" y1="100" x2="200" y2="100" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="0" y1="150" x2="200" y2="150" stroke="#94a3b8" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Interactive SVG Curve Canvas */}
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={handleSvgPointerUp}
          className="w-full h-full cursor-crosshair touch-none"
        >
          {/* Interpolated spline curve line */}
          <path
            d={getSplinePath(points)}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Knot Handles */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x * 200}
              cy={(1 - pt.y) * 200}
              r={draggedPointIndex === idx ? 6 : 4.5}
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2"
              onDoubleClick={(e) => handlePointDoubleClick(idx, e)}
              className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
            />
          ))}
        </svg>

        <div className="absolute bottom-1 right-2 text-[9px] text-slate-500 font-mono">
          Click to add · Double-click to remove
        </div>
      </div>

      {/* Parametric Curve Sliders */}
      <div className="space-y-2 pt-2 border-t border-[#1f212a]">
        <span className="text-slate-400 font-medium block">Zone Adjustments</span>

        {/* Highlights */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Highlights</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.parametricCurve.highlights > 0 ? `+${adjustments.parametricCurve.highlights}` : adjustments.parametricCurve.highlights}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjustments.parametricCurve.highlights}
            onChange={(e) =>
              onChange(
                {
                  parametricCurve: {
                    ...adjustments.parametricCurve,
                    highlights: Number(e.target.value)
                  }
                },
                'Curve Highlights'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Lights */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Lights</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.parametricCurve.lights > 0 ? `+${adjustments.parametricCurve.lights}` : adjustments.parametricCurve.lights}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjustments.parametricCurve.lights}
            onChange={(e) =>
              onChange(
                {
                  parametricCurve: {
                    ...adjustments.parametricCurve,
                    lights: Number(e.target.value)
                  }
                },
                'Curve Lights'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Darks */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Darks</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.parametricCurve.darks > 0 ? `+${adjustments.parametricCurve.darks}` : adjustments.parametricCurve.darks}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjustments.parametricCurve.darks}
            onChange={(e) =>
              onChange(
                {
                  parametricCurve: {
                    ...adjustments.parametricCurve,
                    darks: Number(e.target.value)
                  }
                },
                'Curve Darks'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>

        {/* Shadows */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Shadows</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {adjustments.parametricCurve.shadows > 0 ? `+${adjustments.parametricCurve.shadows}` : adjustments.parametricCurve.shadows}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjustments.parametricCurve.shadows}
            onChange={(e) =>
              onChange(
                {
                  parametricCurve: {
                    ...adjustments.parametricCurve,
                    shadows: Number(e.target.value)
                  }
                },
                'Curve Shadows'
              )
            }
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[#262836]"
          />
        </div>
      </div>
    </div>
  );
};
