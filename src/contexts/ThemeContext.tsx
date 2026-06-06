import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light" | "bold";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  isBoldUnlocked: boolean;
  handleLogoClick: () => void;
  nsfw: boolean;
  toggleNsfw: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "erohub-theme";
const BOLD_KEY = "erohub-bold-unlocked";
const NSFW_KEY = "erohub-nsfw";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light" || stored === "bold") {
    return stored;
  }
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

function getInitialBoldUnlocked(): boolean {
  return localStorage.getItem(BOLD_KEY) === "true";
}

function getInitialNsfw(): boolean {
  const stored = localStorage.getItem(NSFW_KEY);
  return stored === null ? true : stored === "true";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isBoldUnlocked, setIsBoldUnlocked] = useState(getInitialBoldUnlocked);
  const [nsfw, setNsfw] = useState(getInitialNsfw);
  const clickTimestamps = useRef<number[]>([]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      let next: Theme;
      if (isBoldUnlocked) {
        const order: Theme[] = ["dark", "light", "bold"];
        const idx = order.indexOf(current);
        next = order[(idx + 1) % order.length];
      } else {
        next = current === "dark" ? "light" : "dark";
      }
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, [isBoldUnlocked]);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    clickTimestamps.current = clickTimestamps.current.filter(
      (t) => now - t <= 3000,
    );
    if (clickTimestamps.current.length >= 5 && !isBoldUnlocked) {
      setIsBoldUnlocked(true);
      localStorage.setItem(BOLD_KEY, "true");
      setTheme("bold");
      clickTimestamps.current = [];
    }
  }, [isBoldUnlocked, setTheme]);

  const toggleNsfw = useCallback(() => {
    setNsfw((prev) => {
      const next = !prev;
      localStorage.setItem(NSFW_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light", "bold");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, cycleTheme, isBoldUnlocked, handleLogoClick, nsfw, toggleNsfw }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
