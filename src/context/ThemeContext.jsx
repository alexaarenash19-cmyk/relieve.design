// Dark mode — same context+localStorage shape as CartContext.jsx.
// Initial state is read from document.documentElement's own class (already
// set correctly, before mount, by the blocking script in index.html) —
// not re-derived from localStorage/matchMedia here, so there's no chance
// of this disagreeing with what the user actually sees on first paint.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { setStoredTheme } from '../lib/theme.js';

const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    setStoredTheme(window.localStorage, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
