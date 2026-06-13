"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "nm-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Reads localStorage then system preference; defaults to dark per ADR-002. */
function resolveStoredOrSystemTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    return prefersLight ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(t: Theme): void {
  if (t === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  // SSR-safe lazy initializer: server always yields "dark"; client reads the real
  // preference. suppressHydrationWarning on <html> covers the class attribute
  // mismatch. Child components use only CSS vars so they emit identical HTML in
  // both themes and produce no child hydration errors.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return resolveStoredOrSystemTheme();
  });

  // Whether the user has explicitly chosen a theme (disables system-tracking).
  const userChoseRef = useRef<boolean>(false);

  // Keep the DOM class in sync whenever state changes.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // On mount: establish whether an explicit preference was stored.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      userChoseRef.current = stored === "light" || stored === "dark";
    } catch {
      userChoseRef.current = false;
    }
  }, []);

  // React to OS-level theme changes when the user has not explicitly chosen.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!userChoseRef.current) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    userChoseRef.current = true;
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // storage unavailable — visual still applies via the effect above
    }
  }, []);

  const toggle = useCallback(
    (/* no args */) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      userChoseRef.current = true;
      setThemeState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // storage unavailable
      }
    },
    [theme],
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
