import { useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";

const KEY = "gitpulse:theme";
const ORDER: Theme[] = ["system", "light", "dark"];

// eslint-disable-next-line react-refresh/only-export-components
export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      if (theme === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      /* preference is best effort */
    }
  }, [theme]);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Color theme: ${theme}. Switch to ${next}.`}
    >
      Theme: {theme}
    </button>
  );
}
