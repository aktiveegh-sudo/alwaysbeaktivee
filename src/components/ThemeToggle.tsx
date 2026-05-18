import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const opts: { value: "light" | "dark" | "system"; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun className="h-3.5 w-3.5" />, label: "Light" },
    { value: "dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Dark" },
    { value: "system", icon: <Monitor className="h-3.5 w-3.5" />, label: "System" },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-secondary/50 p-1">
      {opts.map((o) => (
        <button
          key={o.value}
          aria-label={o.label}
          onClick={() => setTheme(o.value)}
          className={cn(
            "rounded-full p-1.5 transition-all",
            theme === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
