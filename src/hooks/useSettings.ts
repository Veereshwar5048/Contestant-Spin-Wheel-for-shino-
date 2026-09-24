import { useState, useCallback, useEffect } from 'react';
import type { Settings } from '../types';
import { setAudioEnabled } from '../utils/sound';

const STORAGE_KEY = 'toastmasters_settings';

const DEFAULT_SETTINGS: Settings = {
  contestName: 'Humorous Speech Contest',
  clubName: '',
  date: '',
  venue: '',
  soundOn: false,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* */ }
}

interface UseSettingsReturn {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = safeGet<Partial<Settings>>(STORAGE_KEY, {});
    return { ...DEFAULT_SETTINGS, ...saved };
  });

  useEffect(() => {
    safeSet(STORAGE_KEY, settings);
    setAudioEnabled(settings.soundOn);
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  return { settings, updateSettings };
}
