import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Zap, Menu, X, Shield } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/track", label: "Track Order" },
  { to: "/become-agent", label: "Become Agent" },
];

export function Header() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-red text-primary-foreground shadow-glow">
            <Zap className="h-5 w-5" />
          </span>
          <span>
            Bossu<span className="text-gold">Data</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"
                }`
              }
              end={n.to === "/"}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin"><Shield className="h-4 w-4" /> Admin</Link>
                </Button>
              )}
              <Button asChild size="sm">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/become-agent">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-secondary/40 text-foreground hover:bg-secondary transition"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 top-16 z-40 bg-background/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="md:hidden absolute left-0 right-0 top-16 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2">
            <div className="container py-4 flex flex-col gap-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === "/"}
                  onClick={close}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}

              <div className="my-2 h-px bg-border/60" />

              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    {isAdmin && (
                      <Button asChild variant="outline" onClick={close}>
                        <Link to="/admin"><Shield className="h-4 w-4" /> Admin Console</Link>
                      </Button>
                    )}
                    <Button asChild onClick={close}>
                      <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" onClick={close}>
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button asChild onClick={close}>
                      <Link to="/become-agent">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
