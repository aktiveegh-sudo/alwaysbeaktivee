import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import BuiltWithAktivee from "@/components/BuiltWithAktivee";
import StoreStatus from "@/components/StoreStatus";
import StoreFooter from "@/components/StoreFooter";
import { isStoreActive, formatWhatsAppMultiOrder } from "@/lib/store-utils";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  whatsapp_number: string;
  phone_number: string | null;
  business_hours_open: string;
  business_hours_close: string;
  logo_url: string | null;
  custom_greeting: string | null;
  email: string | null;
  location: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number | null;
  request_price: boolean;
  image_url: string | null;
  slug: string;
}

const StorePage = () => {
  const { storename } = useParams<{ storename: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", storename)
        .single();

      if (storeData) {
        setStore(storeData as unknown as Store);
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id);
        setProducts((productsData as unknown as Product[]) || []);

        // Track view
        const { data: existing } = await supabase
          .from("store_analytics" as any)
          .select("id, store_views")
          .eq("store_id", storeData.id)
          .maybeSingle();
        if (existing) {
          await supabase.from("store_analytics" as any).update({
            store_views: (existing as any).store_views + 1,
            updated_at: new Date().toISOString(),
          }).eq("id", (existing as any).id);
        } else {
          await supabase.from("store_analytics" as any).insert({
            store_id: storeData.id,
            store_views: 1,
          });
        }
      }
      setLoading(false);
    };

    if (storename) fetchStore();
  }, [storename]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const trackWhatsAppClick = async () => {
    if (!store) return;
    const { data: existing } = await supabase
      .from("store_analytics" as any)
      .select("id, whatsapp_clicks")
      .eq("store_id", store.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("store_analytics" as any).update({
        whatsapp_clicks: (existing as any).whatsapp_clicks + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", (existing as any).id);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Store not found</p>
      </div>
    );
  }

  const storeOpen = isStoreActive(store.business_hours_open, store.business_hours_close);
  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  const multiOrderLink = selectedProducts.length > 0
    ? formatWhatsAppMultiOrder(
        store.whatsapp_number,
        selectedProducts.map((p) => ({
          name: p.name,
          price: p.request_price ? "Request Price" : formatPrice(p.price),
        })),
        store.custom_greeting,
        !storeOpen
      )
    : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded-full object-cover border border-border" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{store.name}</h1>
              {store.description && (
                <p className="text-sm text-muted-foreground truncate">{store.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StoreStatus openTime={store.business_hours_open} closeTime={store.business_hours_close} />
              <span className="text-xs text-muted-foreground hidden sm:block">
                {store.business_hours_open} — {store.business_hours_close}
              </span>
              <Link to={`/${store.slug}/contact`}>
                <Button variant="outline" size="sm">Contact</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products yet.</p>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                requestPrice={product.request_price}
                imageUrl={product.image_url}
                slug={product.slug}
                storeSlug={store.slug}
                whatsappNumber={store.whatsapp_number}
                isStoreOpen={storeOpen}
                customGreeting={store.custom_greeting}
                selected={selectedIds.has(product.id)}
                onSelect={() => toggleSelect(product.id)}
                onWhatsAppClick={trackWhatsAppClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Multi-product floating bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-slide-up-fade">
          <a href={multiOrderLink} target="_blank" rel="noopener noreferrer" onClick={trackWhatsAppClick}>
            <Button size="lg" className="shadow-lg rounded-full px-6">
              Order {selectedProducts.length} item{selectedProducts.length > 1 ? "s" : ""} on WhatsApp
            </Button>
          </a>
        </div>
      )}

      <WhatsAppButton phone={store.whatsapp_number} />
      <BuiltWithAktivee />
      <StoreFooter store={store} />
    </div>
  );
};

export default StorePage;
