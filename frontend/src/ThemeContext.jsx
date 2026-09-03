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

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('theme-mode') !== 'light' // default dark
  );
  const [accentIndex, setAccentIndex] = useState(
    () => parseInt(localStorage.getItem('theme-accent') ?? '4') // default blue
  );

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
    localStorage.setItem('theme-mode', next ? 'dark' : 'light');
    applyTheme(next, accentIndex);
  };

  const setAccent = (idx) => {
    setAccentIndex(idx);
    localStorage.setItem('theme-accent', idx)
    applyTheme(isDark, idx);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleMode, accentIndex, setAccent, ACCENTS, accent: ACCENTS[accentIndex] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
