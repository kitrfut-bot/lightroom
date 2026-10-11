/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PhotoItem, ViewMode } from './types/darkroom';
import { getDefaultPhotos } from './data/defaultCatalog';
import { Header } from './components/Header';
import { LibraryView } from './components/library/LibraryView';
import { DevelopView } from './components/develop/DevelopView';
import { ImportModal } from './components/modals/ImportModal';
import { ExportModal } from './components/modals/ExportModal';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    return getDefaultPhotos();
  });

  const [activePhotoId, setActivePhotoId] = useState<string>(() => {
    return photos[0]?.id || '';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('develop');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status for PWA awareness
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global keybindings
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsExportOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsImportOpen(true);
      } else if (e.key === 'g' || e.key === 'G') {
        setViewMode('library');
      } else if (e.key === 'd' || e.key === 'D') {
        setViewMode('develop');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleUpdatePhoto = (updatedPhoto: PhotoItem) => {
    setPhotos((prev) => prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
  };

  const handleImportComplete = (newPhotos: PhotoItem[]) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    if (newPhotos[0]) {
      setActivePhotoId(newPhotos[0].id);
      setViewMode('develop');
    }
  };

  const activePhoto = photos.find((p) => p.id === activePhotoId) || photos[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0e12] text-slate-100 font-sans">
      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        photoCount={photos.length}
      />

      {/* Main Mode View */}
      {viewMode === 'library' ? (
        <LibraryView
          photos={photos}
          activePhotoId={activePhotoId}
          onSelectPhoto={setActivePhotoId}
          onUpdatePhoto={handleUpdatePhoto}
          onNavigateToDevelop={(id) => {
            setActivePhotoId(id);
            setViewMode('develop');
          }}
          onOpenImport={() => setIsImportOpen(true)}
        />
      ) : (
        <DevelopView
          photos={photos}
          activePhotoId={activePhotoId}
          onSelectPhoto={setActivePhotoId}
          onUpdatePhoto={handleUpdatePhoto}
          onOpenExport={() => setIsExportOpen(true)}
        />
      )}

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {activePhoto && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          activePhoto={activePhoto}
        />
      )}

      {/* Offline Toast (inform user that darkroom is 100% on-device) */}
      {!isOnline && (
        <div className="fixed bottom-3 right-3 z-50 px-3 py-1.5 rounded-lg bg-[#1a1b24] border border-[#2e3142] text-slate-300 text-xs shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Offline Ready — 100% On-Device Processing</span>
        </div>
      )}
    </div>
  );
}
