import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import BuiltWithAktivee from "@/components/BuiltWithAktivee";
import StoreStatus from "@/components/StoreStatus";
import Footer from "@/components/Footer";

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  whatsapp_number: string;
  business_hours_open: string;
  business_hours_close: string;
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

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", storename)
        .single();

      if (storeData) {
        setStore(storeData as Store);
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id);
        setProducts((productsData as Product[]) || []);
      }
      setLoading(false);
    };

    if (storename) fetchStore();
  }, [storename]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
              <StoreStatus openTime={store.business_hours_open} closeTime={store.business_hours_close} />
            </div>
          </div>
          {store.description && (
            <p className="mt-2 text-sm text-muted-foreground">{store.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Hours: {store.business_hours_open} — {store.business_hours_close}
          </p>
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
              />
            ))}
          </div>
        )}
      </main>

      <WhatsAppButton phone={store.whatsapp_number} />
      <BuiltWithAktivee />
      <Footer />
    </div>
  );
};

export default StorePage;
