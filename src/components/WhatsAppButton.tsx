import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function WhatsAppButton() {
  const location = useLocation();
  const [number, setNumber] = useState<string>("+233000000000");
  useEffect(() => {
    supabase.from("site_settings").select("whatsapp_number").maybeSingle().then(({ data }) => {
      if (data?.whatsapp_number) setNumber(data.whatsapp_number);
    });
  }, []);

  if (location.pathname.startsWith("/store/")) return null;

  return (
    <a
      href={`https://wa.me/${number.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground shadow-glow transition-transform hover:scale-110 animate-pulse-glow"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
