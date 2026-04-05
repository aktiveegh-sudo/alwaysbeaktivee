import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  support_email: string;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
}

const Footer = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    support_email: "support@aktivee.shop",
    instagram_url: null,
    twitter_url: null,
    tiktok_url: null,
  });

  useEffect(() => {
    supabase
      .from("site_settings" as any)
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as unknown as SiteSettings);
      });
  }, []);

  return (
    <footer className="border-t border-border bg-background">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-foreground">Aktivee</p>
          <p className="mt-1 text-sm text-muted-foreground">Simple stores. Instant sales.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <a href={`mailto:${settings.support_email}`} className="hover:text-foreground transition-colors">
              {settings.support_email}
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium text-foreground mb-1">Product</p>
          <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          <Link to="/use-your-store" className="text-muted-foreground hover:text-foreground transition-colors">Use Your Store</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium text-foreground mb-1">Company</p>
          <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium text-foreground mb-1">Get Started</p>
          <Link to="/start" className="text-muted-foreground hover:text-foreground transition-colors">Create Store</Link>
          <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</Link>
          <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
        <p>© 2026 Aktivee. All rights reserved.</p>
        <div className="flex gap-4">
          {settings.instagram_url && (
            <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Instagram">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          )}
          {settings.twitter_url && (
            <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Twitter">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          )}
          {settings.tiktok_url && (
            <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="TikTok">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z"/></svg>
            </a>
          )}
          {!settings.instagram_url && !settings.twitter_url && !settings.tiktok_url && (
            <span className="text-xs">Follow us soon</span>
          )}
        </div>
      </div>
    </div>
    </footer>
  );
};

export default Footer;
