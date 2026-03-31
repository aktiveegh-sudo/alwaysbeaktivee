import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatWhatsAppGeneral } from "@/lib/store-utils";
import BuiltWithAktivee from "@/components/BuiltWithAktivee";
import Footer from "@/components/Footer";

const StoreContact = () => {
  const { storename } = useParams<{ storename: string }>();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("stores").select("*").eq("slug", storename).single();
      setStore(data);
      setLoading(false);
    };
    if (storename) fetch();
  }, [storename]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!store) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Store not found</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <a href={`/${store.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to {store.name}
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-sm">
          <h1 className="text-xl font-bold text-foreground">Contact {store.name}</h1>
          <div className="mt-6 space-y-4">
            <a href={formatWhatsAppGeneral(store.whatsapp_number)} target="_blank" rel="noopener noreferrer">
              <Button className="w-full">Message on WhatsApp</Button>
            </a>
            <div className="rounded-[10px] border border-border p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm text-foreground">{store.whatsapp_number}</p>
              </div>
              {store.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{store.email}</p>
                </div>
              )}
              {store.location && (
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm text-foreground">{store.location}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BuiltWithAktivee />
      <Footer />
    </div>
  );
};

export default StoreContact;
