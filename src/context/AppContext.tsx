import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { db, type PhotoItem, type Journey } from '../db';
import { createWorker, type Worker } from 'tesseract.js';
import { useApiKey } from '../hooks/useApiKey';
import { useDarkMode } from '../hooks/useDarkMode';

interface AppContextType {
  photos: PhotoItem[];
  journeys: Journey[];
  loadPhotos: () => Promise<void>;
  loadJourneys: () => Promise<void>;
  workerRef: React.MutableRefObject<Worker | null>;
  apiKey: string;
  saveKey: (key: string) => void;
  validateKey: (key: string) => Promise<boolean>;
  isDark: boolean;
  toggleDark: () => void;
  // Global processing states could go here if needed, or kept local to hooks
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const workerRef = useRef<Worker | null>(null);
  
  const { apiKey, saveKey, validateKey } = useApiKey();
  const { isDark, toggle } = useDarkMode();

  const loadPhotos = useCallback(async () => {
    const all = await db.photos.toArray();
    const visible = all.filter(p => !p.isDeleted);
    setPhotos(visible);
  }, []);

  const loadJourneys = useCallback(async () => {
    const all = await db.journeys.toArray();
    setJourneys(all.sort((a, b) => b.startDate - a.startDate));
  }, []);

  // Init Data
  useEffect(() => {
    loadPhotos();
    loadJourneys();
  }, [loadPhotos, loadJourneys]);

  // Init Tesseract
  useEffect(() => {
    let worker: Worker;
    (async () => {
      worker = await createWorker('chi_tra+eng');
      workerRef.current = worker;
    })();
    return () => {
      worker?.terminate();
    };
  }, []);

  return (
    <AppContext.Provider value={{
      photos,
      journeys,
      loadPhotos,
      loadJourneys,
      workerRef,
      apiKey,
      saveKey,
      validateKey,
      isDark,
      toggleDark: toggle
    }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
