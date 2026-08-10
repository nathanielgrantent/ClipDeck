'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  autoPlay: boolean;
  showAnimations: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  contrastTheme: 'default' | 'high' | 'maximum';
}

const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderMode: false,
  focusIndicators: true,
  keyboardNavigation: true,
  autoPlay: false,
  showAnimations: true,
  fontSize: 'medium',
  contrastTheme: 'default',
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('clipdeck-accessibility');
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem('clipdeck-accessibility', JSON.stringify(settings));
    } catch {}
  }, [settings, loaded]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('large-text', settings.largeText);
    root.classList.toggle('screen-reader-mode', settings.screenReaderMode);
    root.classList.toggle('focus-indicators', settings.focusIndicators);
    root.classList.toggle('no-auto-play', !settings.autoPlay);
    root.classList.toggle('no-animations', !settings.showAnimations);
    root.setAttribute('data-font-size', settings.fontSize);
    root.setAttribute('data-contrast', settings.contrastTheme);
  }, [settings]);

  useEffect(() => {
    if (settings.reducedMotion) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mq.matches) {
        setSettings(prev => ({ ...prev, reducedMotion: false }));
      }
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const announce = useCallback((message: string) => {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, []);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings, announce }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
