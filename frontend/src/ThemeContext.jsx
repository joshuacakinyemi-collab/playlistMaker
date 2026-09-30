import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const ACCENTS = [
  { color: '#e8334a', glow: 'rgba(232,51,74,0.3)', label: 'Red' },
  { color: '#f07020', glow: 'rgba(240,112,32,0.3)', label: 'Orange' },
  { color: '#d4a010', glow: 'rgba(212,160,16,0.3)', label: 'Yellow' },
  { color: '#2ea84a', glow: 'rgba(46,168,74,0.3)', label: 'Green' },
  { color: '#0078d4', glow: 'rgba(0,120,212,0.3)', label: 'Blue' },
  { color: '#7c3aed', glow: 'rgba(124,58,237,0.3)', label: 'Purple' },
];

// Saved in the app's settings file rather than localStorage: the built app
// is served from a new random port each launch, and localStorage is scoped
// per origin (port included), so it came back empty after every restart.
const loadSavedTheme = () => {
  let saved = {};
  try {
    saved = window.api.settings.getSync() || {};
  } catch {}
  const mode = saved.themeMode ?? localStorage.getItem('theme-mode');
  const accent = Number(saved.themeAccent ?? localStorage.getItem('theme-accent') ?? 4);
  return {
    isDark: mode !== 'light', // default dark
    accentIndex: ACCENTS[accent] ? accent : 4, // default blue
  };
};

const saveTheme = (updates) => {
  window.api.settings.set(updates).catch((err) => console.error(err));
};

export function ThemeProvider({ children }) {
  const [initialTheme] = useState(loadSavedTheme);
  const [isDark, setIsDark] = useState(initialTheme.isDark);
  const [accentIndex, setAccentIndex] = useState(initialTheme.accentIndex);

  useEffect(() => {
    const a = ACCENTS[accentIndex];
    document.documentElement.style.setProperty('--accent', a.color);
    document.documentElement.style.setProperty('--accent-glow', a.glow);
    document.body.classList.toggle('light', !isDark);
  }, []);

  const applyTheme = (dark, idx) => {
    const a = ACCENTS[idx];
    document.documentElement.style.setProperty('--accent', a.color);
    document.documentElement.style.setProperty('--accent-glow', a.glow);
    document.body.classList.toggle('light', !dark);
  };

  const toggleMode = () => {
    const next = !isDark;
    setIsDark(next);
    saveTheme({ themeMode: next ? 'dark' : 'light' });
    applyTheme(next, accentIndex);
  };

  const setAccent = (idx) => {
    setAccentIndex(idx);
    saveTheme({ themeAccent: idx });
    applyTheme(isDark, idx);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleMode, accentIndex, setAccent, ACCENTS, accent: ACCENTS[accentIndex] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
