import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGHS, cn } from "@/lib/utils";
import { CheckCircle2, Loader2, MessageCircle, Store as StoreIcon } from "lucide-react";

type Store = {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  logo_url: string | null;
  whatsapp_number: string | null;
  theme_color: string | null;
  is_active: boolean;
};

type Product = {
  id: string;
  name: string;
  network: string;
  public_price: number;
  data_volume_mb: number | null;
  description: string | null;
};

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: s } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStore(s as Store);
      const { data: p } = await supabase
        .from("products")
        .select("id, name, network, public_price, data_volume_mb, description")
        .eq("is_active", true)
        .order("public_price", { ascending: true });
      setProducts((p as Product[]) || []);
      setLoading(false);
    })();
  }, [slug]);

  const themeStyle = useMemo(
    () => (store?.theme_color ? ({ ["--store-accent" as any]: store.theme_color } as React.CSSProperties) : {}),
    [store]
  );

  if (loading)
    return (
      <div className="container py-32 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );

  if (notFound || !store)
    return (
      <section className="container py-24 text-center">
        <h1 className="font-display text-4xl font-bold">Store not found</h1>
        <p className="text-muted-foreground mt-3">This shop is unavailable or has been disabled.</p>
        <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
      </section>
    );

  return (
    <div style={themeStyle}>
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, ${store.theme_color || "#DC2626"} 0%, hsl(0 0% 6%) 100%)`,
        }}
      >
        <div className="container py-14 md:py-20 flex flex-col md:flex-row items-start md:items-end gap-6 justify-between">
          <div className="flex items-center gap-4">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.display_name} className="h-16 w-16 rounded-2xl border-2 border-white/30 bg-white/10 object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white/15 grid place-items-center backdrop-blur">
                <StoreIcon className="h-8 w-8" />
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">{store.display_name}</h1>
              {store.tagline && <p className="text-white/80 mt-1">{store.tagline}</p>}
            </div>
          </div>
          {store.whatsapp_number && (
            <a
              href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold px-5 py-2.5 hover:bg-white/90 transition"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="container py-10">
        <h2 className="font-display text-2xl font-bold mb-6">Shop bundles</h2>
        {products.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No bundles available right now.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card
                key={p.id}
                onClick={() => setSelected(p)}
                className="cursor-pointer transition hover:-translate-y-1 hover:shadow-glow"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase rounded-full px-2.5 py-1 bg-secondary">{p.network}</span>
                    {p.data_volume_mb && (
                      <span className="text-xs text-muted-foreground">
                        {p.data_volume_mb >= 1024 ? `${(p.data_volume_mb / 1024).toFixed(1)}GB` : `${p.data_volume_mb}MB`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="font-display text-2xl font-bold" style={{ color: store.theme_color || undefined }}>
                      {formatGHS(p.public_price)}
                    </div>
                    <Button size="sm" style={{ background: store.theme_color || undefined }}>Buy</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {selected && <BuyDialog product={selected} store={store} onClose={() => setSelected(null)} />}
    </div>
  );
}

function BuyDialog({ product, store, onClose }: { product: Product; store: Store; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^0\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Ghana phone number.");
      return;
    }
    setSubmitting(true);
    const { data, error: err } = await supabase
      .from("orders")
      .insert({
        product_id: product.id,
        recipient_phone: phone,
        recipient_email: email || null,
        amount: product.public_price,
        store_owner_id: store.user_id,
      })
      .select("reference")
      .single();
    setSubmitting(false);
    if (err) return setError(err.message);
    setDone({ reference: data.reference });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-up" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-6">
          {done ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold">Order received!</h3>
              <div className="mt-5 rounded-xl bg-secondary p-4 font-mono text-lg font-bold">{done.reference}</div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
                <Button asChild className="flex-1"><a href={`/track?ref=${done.reference}&phone=${phone}`}>Track</a></Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h3 className="font-display text-2xl font-bold">{product.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {product.network.toUpperCase()} ·{" "}
                  <span className="font-bold" style={{ color: store.theme_color || undefined }}>
                    {formatGHS(product.public_price)}
                  </span>
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Recipient phone</label>
                <Input inputMode="numeric" placeholder="0241234567" value={phone} onChange={(e) => setPhone(e.target.value.trim())} maxLength={10} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Email (optional)</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value.trim())} />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={submitting} style={{ background: store.theme_color || undefined }}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${formatGHS(product.public_price)}`}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// unused but exposed for cn import linter
void cn;
