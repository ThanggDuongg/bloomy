import { createContext } from 'react';

export interface SettingsValue {
  showEnglish: boolean;
  toggleEnglish: () => void;
}

export const SettingsContext = createContext<SettingsValue | null>(null);

export const SETTINGS_STORAGE_KEY = 'bloomy:showEnglish';
