import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import WhatsAppButton from "@/components/WhatsAppButton";
import BuiltWithAktivee from "@/components/BuiltWithAktivee";
import { formatWhatsAppLink } from "@/lib/store-utils";
import Footer from "@/components/Footer";

const ProductPage = () => {
  const { storename, product: productSlug } = useParams<{ storename: string; product: string }>();
  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
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

    if (storename && productSlug) fetch();
  }, [storename, productSlug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!store || !product) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Product not found</p></div>;
  }

  const productUrl = `${window.location.origin}/${store.slug}/${product.slug}`;
  const whatsappLink = formatWhatsAppLink(store.whatsapp_number, product.name, productUrl);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <a href={`/${store.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to {store.name}
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="aspect-square overflow-hidden rounded-[10px] bg-muted">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {product.request_price ? "Request Price" : product.price != null ? `$${Number(product.price).toFixed(2)}` : "Request Price"}
            </p>
            {product.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-6 block">
              <Button size="lg" className="w-full">Order on WhatsApp</Button>
            </a>
          </div>
        </div>
      </main>

      <WhatsAppButton phone={store.whatsapp_number} />
      <BuiltWithAktivee />
      <Footer />
    </div>
  );
};

export default ProductPage;
