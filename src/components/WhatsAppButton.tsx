import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path
      fill="#fff"
      d="M16.001 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.72 6.4L3.2 28.8l6.59-1.72a12.74 12.74 0 0 0 6.21 1.61h.01c7.07 0 12.8-5.73 12.8-12.8 0-3.42-1.33-6.63-3.75-9.05A12.71 12.71 0 0 0 16 3.2zm0 23.31h-.01a10.5 10.5 0 0 1-5.36-1.47l-.38-.23-3.91 1.02 1.04-3.81-.25-.39a10.49 10.49 0 0 1-1.62-5.63c0-5.81 4.73-10.54 10.54-10.54 2.81 0 5.46 1.1 7.45 3.09a10.45 10.45 0 0 1 3.09 7.46c0 5.81-4.73 10.5-10.59 10.5zm5.78-7.86c-.32-.16-1.87-.92-2.16-1.03-.29-.11-.5-.16-.71.16-.21.32-.81 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.5.14-.66.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.72-.98-2.36-.26-.62-.52-.53-.71-.54l-.61-.01c-.21 0-.55.08-.83.4-.29.32-1.09 1.07-1.09 2.61 0 1.54 1.12 3.02 1.27 3.23.16.21 2.2 3.36 5.33 4.71.75.32 1.33.51 1.78.66.75.24 1.43.21 1.97.13.6-.09 1.87-.76 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37z"
    />
  </svg>
);

export function WhatsAppButton() {
  const location = useLocation();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("whatsapp_channel_url")
      .maybeSingle()
      .then(({ data }) => {
        let channel = (data as any)?.whatsapp_channel_url?.trim();
        if (!channel) return;
        if (!/^https?:\/\//i.test(channel)) channel = "https://" + channel;
        setHref(channel);
      });
  }, []);

  if (location.pathname.startsWith("/store/")) return null;
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join our WhatsApp channel"
      className="group fixed bottom-6 right-6 z-40 block h-14 w-14"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 blur-xl animate-pulse" />
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />
      <span
        className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] shadow-[0_0_24px_rgba(37,211,102,0.85)] ring-2 ring-white/70 transition-transform group-hover:scale-110"
      >
        <WhatsAppLogo className="h-8 w-8" />
      </span>
    </a>
  );
}
