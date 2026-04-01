import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import WhatsAppButton from "@/components/WhatsAppButton";
import BuiltWithAktivee from "@/components/BuiltWithAktivee";
import StoreFooter from "@/components/StoreFooter";
import { formatWhatsAppLink, isStoreActive } from "@/lib/store-utils";
import { useCurrency } from "@/hooks/useCurrency";

const ProductPage = () => {
  const { storename, product: productSlug } = useParams<{ storename: string; product: string }>();
  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchData = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", storename)
        .single();

      if (storeData) {
        setStore(storeData);
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("slug", productSlug)
          .single();
        setProduct(productData);
      }
      setLoading(false);
    };

    if (storename && productSlug) fetchData();
  }, [storename, productSlug]);

  useEffect(() => {
    if (product && store) {
      document.title = `${product.name} — ${store.name}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", product.description || `${product.name} from ${store.name}`);

      // OG tags
      const setMeta = (property: string, content: string) => {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
        el.setAttribute("content", content);
      };
      setMeta("og:title", `${product.name} — ${store.name}`);
      setMeta("og:description", product.description || `Order ${product.name} on WhatsApp`);
      if (product.image_url) setMeta("og:image", product.image_url);
      setMeta("og:url", window.location.href);
    }
  }, [product, store]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!store || !product) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Product not found</p></div>;
  }

  const storeOpen = isStoreActive(store.business_hours_open, store.business_hours_close);
  const priceText = product.request_price ? "Request Price" : formatPrice(product.price);
  const productUrl = `${window.location.origin}/${store.slug}/${product.slug}`;
  const whatsappLink = formatWhatsAppLink(
    store.whatsapp_number, product.name, productUrl, priceText, store.custom_greeting, !storeOpen
  );

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url: productUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(productUrl);
    }
  };

  const trackClick = async () => {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          {store.logo_url && (
            <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded-full object-cover border border-border" />
          )}
          <a href={`/${store.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to {store.name}
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="aspect-square overflow-hidden rounded-[10px] bg-muted">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{priceText}</p>
            {product.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}
            <div className="mt-6 flex gap-3">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={trackClick}>
                <Button size="lg" className="w-full">
                  {storeOpen ? "Order on WhatsApp" : "Pre-order on WhatsApp"}
                </Button>
              </a>
              {store.phone_number && (
                <a href={`tel:${store.phone_number}`} className="shrink-0">
                  <Button size="lg" variant="outline">📞 Call</Button>
                </a>
              )}
            </div>
            <button onClick={handleShare} className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              Share this product
            </button>
          </div>
        </div>
      </main>

      <WhatsAppButton phone={store.whatsapp_number} />
      <BuiltWithAktivee />
      <StoreFooter store={store} />
    </div>
  );
};

export default ProductPage;
