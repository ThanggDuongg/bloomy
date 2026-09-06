import { useCallback, useState, type ReactNode } from 'react';
import { SettingsContext, SETTINGS_STORAGE_KEY } from './settings-context';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showEnglish, setShowEnglish] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SETTINGS_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleEnglish = useCallback(() => {
    setShowEnglish((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, String(next));
      } catch {
        // ignore storage write failures
      }
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ showEnglish, toggleEnglish }}>
      {children}
    </SettingsContext.Provider>
  );
}
