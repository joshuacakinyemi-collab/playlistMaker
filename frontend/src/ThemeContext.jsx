import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';

const ThemeContext = createContext();

const ACCENTS = [
  { color: '#e8334a', glow: 'rgba(232,51,74,0.3)', ink: '#000', label: 'Red' },
  { color: '#f07020', glow: 'rgba(240,112,32,0.3)', ink: '#000', label: 'Orange' },
  { color: '#d4a010', glow: 'rgba(212,160,16,0.3)', ink: '#000', label: 'Yellow' },
  { color: '#2ea84a', glow: 'rgba(46,168,74,0.3)', ink: '#000', label: 'Green' },
  { color: '#0078d4', glow: 'rgba(0,120,212,0.3)', ink: '#fff', label: 'Blue' },
  { color: '#7c3aed', glow: 'rgba(124,58,237,0.3)', ink: '#fff', label: 'Purple' },
];

// Index used for the user's own color (picked with the color input rather
// than one of the presets above).
const CUSTOM = -1;
const DEFAULT_CUSTOM = '#33ff66';

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Builds the same { color, glow, ink } a preset has, for any hex color.
// Ink is whichever of black or white contrasts more with the color, so the
// selection bar stays readable.
const accentFromHex = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const onBlack = (lum + 0.05) / 0.05;
  const onWhite = 1.05 / (lum + 0.05);
  return { color: hex, glow: `rgba(${r},${g},${b},0.3)`, ink: onBlack >= onWhite ? '#000' : '#fff', label: 'Custom' };
};

const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

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
    accentIndex: accent === CUSTOM || ACCENTS[accent] ? accent : 4, // default blue
    customColor: isHex(saved.themeCustomColor) ? saved.themeCustomColor : DEFAULT_CUSTOM,
    tintArt: saved.themeTintArt !== false, // default on
  };
};

const saveTheme = (updates) => {
  window.api.settings.set(updates).catch((err) => console.error(err));
};

export function ThemeProvider({ children }) {
  const [initialTheme] = useState(loadSavedTheme);
  const [isDark, setIsDark] = useState(initialTheme.isDark);
  const [accentIndex, setAccentIndex] = useState(initialTheme.accentIndex);
  const [customColor, setCustomColorState] = useState(initialTheme.customColor);
  const [tintArt, setTintArt] = useState(initialTheme.tintArt);
  const saveTimerRef = useRef(null);

  const accent = accentIndex === CUSTOM ? accentFromHex(customColor) : ACCENTS[accentIndex];

  // Before paint, so the saved theme is there from the very first frame.
  useLayoutEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent', accent.color);
    root.setProperty('--accent-glow', accent.glow);
    // Text drawn on top of the accent (the selection bar).
    root.setProperty('--on-accent', accent.ink);
    document.body.classList.toggle('light', !isDark);
    document.body.classList.toggle('art-natural', !tintArt);
  }, [accent.color, isDark, tintArt]);

  const toggleMode = () => {
    const next = !isDark;
    setIsDark(next);
    saveTheme({ themeMode: next ? 'dark' : 'light' });
  };

  const setAccent = (idx) => {
    setAccentIndex(idx);
    saveTheme({ themeAccent: idx });
  };

  // Dragging around the color picker fires constantly, so the theme updates
  // live but only the color it settles on is written to disk.
  const setCustomColor = (hex) => {
    if (!isHex(hex)) return;
    setCustomColorState(hex);
    setAccentIndex(CUSTOM);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveTheme({ themeAccent: CUSTOM, themeCustomColor: hex }), 300);
  };

  const toggleTintArt = () => {
    const next = !tintArt;
    setTintArt(next);
    saveTheme({ themeTintArt: next });
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleMode,
        accentIndex,
        setAccent,
        ACCENTS,
        CUSTOM,
        customColor,
        setCustomColor,
        tintArt,
        toggleTintArt,
        accent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
