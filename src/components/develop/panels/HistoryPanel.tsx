/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HistoryStep, PhotoAdjustments } from '../../../types/darkroom';
import { History, RotateCcw, Clock } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryStep[];
  currentAdjustments: PhotoAdjustments;
  onRestoreStep: (step: HistoryStep) => void;
  onResetAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onRestoreStep,
  onResetAll
}) => {
  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232530]">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Adjustment History</span>
        </div>
        <button
          onClick={onResetAll}
          className="text-slate-400 hover:text-red-400 transition-colors text-[10px] flex items-center gap-1"
          title="Reset All to Original Image"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* History Steps List (Reverse chronological) */}
      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
        {[...history].reverse().map((step, index) => {
          const isLatest = index === 0;
          const timeStr = new Date(step.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div
              key={step.id}
              onClick={() => onRestoreStep(step)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                isLatest
                  ? 'bg-[#1e2233] border-blue-500/50 text-white'
                  : 'bg-[#14151c] border-[#1e202c] text-slate-400 hover:bg-[#1a1c26] hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate font-medium">{step.label}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                {timeStr}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-2.5 rounded-lg bg-[#111218] border border-[#1d1f2a] text-[10px] text-slate-500 text-center">
        Every slider adjustment is stored non-destructively. Click any step above to roll back to that state.
      </div>
    </div>
  );
};
