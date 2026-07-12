'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('transitops_theme');
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
    setMounted(true);
  }, []);

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem('transitops_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
