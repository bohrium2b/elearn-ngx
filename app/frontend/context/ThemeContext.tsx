/**
 * ThemeContext.tsx – Dark mode theme management
 *
 * Provides a React context for managing light/dark theme mode across the application.
 * Persists user preference to localStorage and respects system preference.
 */

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  actualMode: "light" | "dark";
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "elearn-theme-mode";

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getStoredMode);
  const [systemMode, setSystemMode] = useState<"light" | "dark">(getSystemMode);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? "dark" : "light");
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const actualMode = mode === "system" ? systemMode : mode;
    document.documentElement.setAttribute("data-theme", actualMode);
    document.body.classList.toggle("dark-mode", actualMode === "dark");
  }, [mode, systemMode]);

  const actualMode: "light" | "dark" = mode === "system" ? systemMode : mode;

  const toggleMode = () => {
    const newMode = actualMode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const setModeValue = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, actualMode, toggleMode, setMode: setModeValue }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProviderWrapper");
  }
  return context;
}

// Hook to get the current theme mode (for use in components)
export function useDarkMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback when not wrapped
    return { isDark: false, toggle: () => {}, setMode: () => {} };
  }
  return {
    isDark: context.actualMode === "dark",
    toggle: context.toggleMode,
    setMode: context.setMode,
  };
}