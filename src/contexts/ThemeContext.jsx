import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const COLOR_STORAGE_KEY = 'quantisColorTheme';
const CUSTOM_COLORS_KEY = 'quantisCustomColors';

/** Colores de barra de estado / navegador (Android Chrome, PWA): igual que header (bg-white / dark:bg-gray-800). */
const THEME_COLOR_LIGHT = '#ffffff';
const THEME_COLOR_DARK = '#1f2937';

function syncBrowserThemeColor(isDark) {
  if (typeof document === 'undefined') return;
  const meta = document.getElementById('quantis-theme-color');
  if (meta) {
    meta.setAttribute('content', isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
  }
}

const PRESETS = {
  default: {
    name: 'Por defecto',
    primary: '#171717',
    primaryDark: '#f5f5f5',
    income: '#34d181',
    incomeDark: '#5ee0a0',
    expense: '#ed4e4e',
    expenseDark: '#f07a7a',
  },
  ocean: {
    name: 'Océano',
    primary: '#4f46e5',
    primaryDark: '#818cf8',
    income: '#0d9488',
    incomeDark: '#2dd4bf',
    expense: '#e11d48',
    expenseDark: '#fb7185',
  },
  forest: {
    name: 'Bosque',
    primary: '#7c3aed',
    primaryDark: '#a78bfa',
    income: '#059669',
    incomeDark: '#34d399',
    expense: '#d97706',
    expenseDark: '#fbbf24',
  },
};

const applyColorVariables = (presetKey, customColors) => {
  const root = document.documentElement;
  let primary, primaryDark, income, incomeDark, expense, expenseDark;
  if (presetKey === 'custom' && customColors?.primary && customColors?.income && customColors?.expense) {
    primary = customColors.primary;
    primaryDark = customColors.primary;
    income = customColors.income;
    incomeDark = customColors.income;
    expense = customColors.expense;
    expenseDark = customColors.expense;
  } else {
    const preset = PRESETS[presetKey] || PRESETS.default;
    primary = preset.primary;
    primaryDark = preset.primaryDark;
    income = preset.income;
    incomeDark = preset.incomeDark;
    expense = preset.expense;
    expenseDark = preset.expenseDark;
  }
  /* Ingreso/gasto: mismo tono en claro y oscuro. Primario: en preset "default" se mantiene
     variante _dark para contraste negro/blanco; en Océano, Bosque y custom es el mismo color. */
  const samePrimaryBothModes =
    presetKey === 'custom' || presetKey === 'ocean' || presetKey === 'forest';
  root.style.setProperty('--q-primary', primary);
  root.style.setProperty(
    '--q-primary-dark',
    samePrimaryBothModes ? primary : primaryDark
  );
  root.style.setProperty('--q-income', income);
  root.style.setProperty('--q-income-dark', income);
  root.style.setProperty('--q-expense', expense);
  root.style.setProperty('--q-expense-dark', expense);
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      try {
        return JSON.parse(savedTheme);
      } catch {
        localStorage.removeItem('darkMode');
        return false;
      }
    }
    return false;
  });

  const [colorPreset, setColorPresetState] = useState(() => {
    try {
      const saved = localStorage.getItem(COLOR_STORAGE_KEY);
      if (saved && (PRESETS[saved] || saved === 'custom')) return saved;
    } catch (_) {}
    return 'default';
  });

  const [customColors, setCustomColorsState] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_COLORS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.primary && parsed?.income && parsed?.expense) return parsed;
      }
    } catch (_) {}
    return {
      primary: PRESETS.default.primary,
      income: PRESETS.default.income,
      expense: PRESETS.default.expense,
    };
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    syncBrowserThemeColor(darkMode);
  }, [darkMode]);

  useEffect(() => {
    applyColorVariables(colorPreset, customColors);
  }, [colorPreset, customColors]);

  const toggleDarkMode = () => setDarkMode((v) => !v);

  const setColorPreset = useCallback((key) => {
    if (key !== 'custom' && !PRESETS[key]) return;
    setColorPresetState(key);
    localStorage.setItem(COLOR_STORAGE_KEY, key);
  }, []);

  const setCustomColors = useCallback((colors) => {
    setCustomColorsState((prev) => {
      const next = { ...prev, ...colors };
      try {
        localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  const value = {
    darkMode,
    toggleDarkMode,
    setDarkMode,
    colorPreset,
    setColorPreset,
    customColors,
    setCustomColors,
    colorPresets: PRESETS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { PRESETS };
