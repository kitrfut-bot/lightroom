/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { RawParser } from '../../engine/rawParser';
import { PhotoItem } from '../../types/darkroom';
import { Upload, X, CheckCircle, FileText, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newPhotos: PhotoItem[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setProgress({ current: 0, total: files.length });

    const importedPhotos: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { photo } = await RawParser.parseFile(file);
        importedPhotos.push(photo);
      } catch (err) {
        console.error('Error importing file:', file.name, err);
      }
      setProgress({ current: i + 1, total: files.length });
    }

    setIsProcessing(false);
    if (importedPhotos.length > 0) {
      onImportComplete(importedPhotos);
      onClose();
    } else {
      setErrorMsg('No valid photo files could be parsed.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-[#15161e] border border-[#262838] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222432]">
          <div>
            <h2 className="text-base font-semibold text-white">Import Photos to Darkroom</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports DNG, camera RAW (Sony, Canon, Nikon, Leica, Fuji), TIFF, and JPEG.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#20222f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-[#2c2f40] hover:border-blue-500/50 bg-[#101117] hover:bg-[#13141c]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".dng,.raw,.cr2,.nef,.arw,.tif,.tiff,.jpg,.jpeg,.png,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.value && e.target.files) {
                processFiles(e.target.files);
              }
            }}
          />

          <div className="w-12 h-12 rounded-full bg-[#1b1d28] border border-[#2b2d3e] flex items-center justify-center text-blue-400 mb-3 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-semibold text-slate-200">
            {isDragging ? 'Drop RAW or image files here' : 'Drag & drop photos or browse from disk'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Files are parsed 100% locally in your browser. No files are uploaded to any server.
          </p>

          <span className="mt-4 px-3 py-1 rounded bg-[#202230] text-slate-300 text-xs font-medium border border-[#2c2f42]">
            Browse Files
          </span>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Decoding RAW metadata & previews...</span>
              <span className="font-mono">{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full h-1.5 bg-[#1b1d26] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{
                  width: `${(progress.current / Math.max(1, progress.total)) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#222432]">
          <span>Non-destructive local catalog</span>
          <span>Zero cloud telemetry</span>
        </div>
      </div>
    </div>
  );
};
