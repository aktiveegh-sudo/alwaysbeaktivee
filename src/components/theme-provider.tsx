import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };

const ThemeContext = createContext<Ctx | null>(null);
const KEY = "bossudata-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (typeof localStorage !== "undefined" && (localStorage.getItem(KEY) as Theme)) || "dark"
  );
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const r = theme === "system" ? (mql.matches ? "dark" : "light") : theme;
      root.classList.toggle("dark", r === "dark");
      setResolved(r);
    };
    apply();
    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside provider");
  return ctx;
};
