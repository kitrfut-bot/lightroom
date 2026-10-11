/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PhotoItem, ViewMode } from '../../types/darkroom';
import {
  Search,
  Filter,
  Star,
  Flag,
  Upload,
  CheckCircle,
  Sliders,
  Image as ImageIcon,
  Grid as GridIcon
} from 'lucide-react';

interface LibraryViewProps {
  photos: PhotoItem[];
  activePhotoId: string;
  onSelectPhoto: (id: string) => void;
  onUpdatePhoto: (photo: PhotoItem) => void;
  onNavigateToDevelop: (id: string) => void;
  onOpenImport: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  photos,
  activePhotoId,
  onSelectPhoto,
  onUpdatePhoto,
  onNavigateToDevelop,
  onOpenImport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [flagFilter, setFlagFilter] = useState<PhotoItem['flag'] | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [gridSize, setGridSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Filtered photos
  const filteredPhotos = photos.filter((photo) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = photo.name.toLowerCase().includes(q);
      const matchCam = photo.exif.camera?.toLowerCase().includes(q);
      const matchLens = photo.exif.lens?.toLowerCase().includes(q);
      if (!matchName && !matchCam && !matchLens) return false;
    }

    if (ratingFilter > 0 && photo.rating < ratingFilter) return false;
    if (flagFilter !== 'all' && photo.flag !== flagFilter) return false;
    if (formatFilter !== 'all' && photo.format !== formatFilter) return false;

    return true;
  });

  const handleToggleRating = (photo: PhotoItem, rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdatePhoto({ ...photo, rating: photo.rating === rating ? 0 : rating });
  };

  const handleToggleFlag = (photo: PhotoItem, flag: PhotoItem['flag'], e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdatePhoto({ ...photo, flag: photo.flag === flag ? 'none' : flag });
  };

  const gridColsClass = {
    sm: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    md: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    lg: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  }[gridSize];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-48px)] overflow-hidden bg-[#0e0f13] select-none">
      {/* Top Filter & Search Bar */}
      <div className="h-12 bg-[#13141a] border-b border-[#21232d] px-5 flex items-center justify-between gap-4 shrink-0 z-10">
        {/* Left: Search input */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by filename, camera, lens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#1a1b24] border border-[#272936] rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-colors"
            />
          </div>

          {/* Rating Filter Tabs */}
          <div className="flex items-center bg-[#1a1b24] p-0.5 rounded-md border border-[#272936]">
            {[0, 1, 3, 5].map((val) => (
              <button
                key={val}
                onClick={() => setRatingFilter(val)}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors flex items-center gap-0.5 ${
                  ratingFilter === val
                    ? 'bg-[#292c3d] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {val === 0 ? 'All Stars' : `${val}★+`}
              </button>
            ))}
          </div>

          {/* Flag Filter Tabs */}
          <div className="flex items-center bg-[#1a1b24] p-0.5 rounded-md border border-[#272936]">
            {(['all', 'pick', 'reject'] as const).map((flag) => (
              <button
                key={flag}
                onClick={() => setFlagFilter(flag)}
                className={`px-2 py-0.5 text-xs font-medium rounded capitalize transition-colors ${
                  flagFilter === flag
                    ? 'bg-[#292c3d] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {flag === 'all' ? 'All Flags' : `${flag}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Grid sizing & stats */}
        <div className="flex items-center gap-4">
          <div className="text-[11px] text-slate-400 font-mono">
            <span>{filteredPhotos.length} of {photos.length} photos</span>
          </div>

          {/* Grid size segmented toggle */}
          <div className="flex items-center bg-[#1a1b24] p-0.5 rounded-md border border-[#272936]">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`px-2 py-0.5 text-xs uppercase font-medium rounded transition-colors ${
                  gridSize === size
                    ? 'bg-[#292c3d] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Grid Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {filteredPhotos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#181a24] border border-[#262838] flex items-center justify-center text-slate-500">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-semibold text-slate-200">No Photos Matching Filters</h3>
              <p className="text-xs text-slate-400">
                Adjust your search or filter settings, or import additional RAW / DNG images into your catalog.
              </p>
            </div>
            <button
              onClick={onOpenImport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Photos</span>
            </button>
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-4`}>
            {filteredPhotos.map((photo) => {
              const isSelected = photo.id === activePhotoId;
              return (
                <div
                  key={photo.id}
                  onClick={() => onSelectPhoto(photo.id)}
                  onDoubleClick={() => onNavigateToDevelop(photo.id)}
                  className={`group relative rounded-lg bg-[#14151c] border overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                      : 'border-[#21232d] hover:border-[#353849] hover:shadow-md'
                  }`}
                >
                  {/* Aspect Thumbnail Container */}
                  <div className="relative aspect-[3/2] w-full bg-[#0a0b0e] overflow-hidden">
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />

                    {/* Top Format Badge & Flag */}
                    <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-slate-200 font-semibold uppercase">
                        {photo.format}
                      </span>

                      {photo.flag !== 'none' && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                            photo.flag === 'pick'
                              ? 'bg-emerald-500/80 text-white'
                              : 'bg-red-500/80 text-white'
                          }`}
                        >
                          <Flag className="w-2.5 h-2.5 fill-current" />
                          <span>{photo.flag === 'pick' ? 'Pick' : 'Reject'}</span>
                        </span>
                      )}
                    </div>

                    {/* Hover Floating Action Bar (Star rating & Develop CTA) */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Star Rating Buttons */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => handleToggleRating(photo, star, e)}
                            className={`p-0.5 transition-colors ${
                              photo.rating >= star
                                ? 'text-amber-400'
                                : 'text-slate-400 hover:text-amber-300'
                            }`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                photo.rating >= star ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Develop CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToDevelop(photo.id);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium transition-colors"
                        title="Open in Develop Mode"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Develop</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Card Footer (Zero-pill discipline with typographic separators) */}
                  <div className="p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {photo.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
                      <span>{photo.exif.camera || 'Camera'}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>ISO {photo.exif.iso || 100}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{photo.exif.focalLength || '50mm'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
