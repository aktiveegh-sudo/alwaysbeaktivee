import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGHS } from "@/lib/utils";
import {
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store as StoreIcon,
} from "lucide-react";

type Store = {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  logo_url: string | null;
  whatsapp_number: string | null;
  whatsapp_group_link: string | null;
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
      <div className="min-h-screen grid place-items-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );

  if (notFound || !store)
    return (
      <section className="min-h-screen grid place-items-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-4xl font-bold">Store unavailable</h1>
          <p className="text-muted-foreground mt-3">This store link is inactive or no longer exists.</p>
        </div>
      </section>
    );

  const supportUrl =
    store.whatsapp_group_link || `https://wa.me/${toWhatsAppDigits(store.whatsapp_number || "")}`;

  return (
    <div style={themeStyle} className="relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_15%,hsl(var(--primary)/0.2),transparent_35%),radial-gradient(circle_at_88%_5%,hsl(var(--gold)/0.22),transparent_30%)]" />

      <section
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(122deg, ${store.theme_color || "#facc15"} 0%, hsl(0 0% 6%) 52%, hsl(0 0% 2%) 100%)`,
        }}
      >
        <div className="container py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-end">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Direct Vendor Store
              </span>

              <div className="flex items-center gap-4">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.display_name}
                    className="h-16 w-16 rounded-2xl border-2 border-white/30 bg-white/10 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-white/15 grid place-items-center backdrop-blur">
                    <StoreIcon className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{store.display_name}</h1>
                  {store.tagline && <p className="text-white/85 mt-2 text-base md:text-lg">{store.tagline}</p>}
                </div>
              </div>

              <p className="max-w-2xl text-white/80 text-sm md:text-base">
                Buy data bundles quickly and securely from this independent mini-site. Orders are processed instantly with a transaction reference for support.
              </p>

              <div className="flex flex-wrap gap-3 text-xs md:text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <ShieldCheck className="h-4 w-4" /> Secure ordering
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <Clock3 className="h-4 w-4" /> Fast processing
                </span>
              </div>
            </div>

            <Card className="border-white/20 bg-white/10 text-white shadow-2xl">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold">Need help before purchase?</h2>
                <p className="text-sm text-white/80 mt-2">Contact this store directly on WhatsApp for quick assistance.</p>
                {(store.whatsapp_group_link || store.whatsapp_number) && (
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold px-4 py-2.5 hover:bg-white/90 transition"
                  >
                    <MessageCircle className="h-4 w-4" /> {store.whatsapp_group_link ? "Join WhatsApp Group" : "Chat on WhatsApp"}
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-12 relative">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Available Bundles</h2>
          <span className="text-xs rounded-full bg-secondary px-3 py-1.5 font-semibold">{products.length} products</span>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">No bundles available right now.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card
                key={p.id}
                onClick={() => setSelected(p)}
                className="cursor-pointer transition hover:-translate-y-1.5 hover:shadow-glow border-border/60"
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
                  {p.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="mt-4 flex items-end justify-between">
                    <div className="font-display text-2xl font-bold" style={{ color: store.theme_color || undefined }}>
                      {formatGHS(p.public_price)}
                    </div>
                    <Button size="sm" style={{ background: store.theme_color || undefined }}>
                      Buy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {selected && <BuyDialog product={selected} store={store} onClose={() => setSelected(null)} />}

      {(store.whatsapp_group_link || store.whatsapp_number) && (
        <a
          href={supportUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={store.whatsapp_group_link ? "Join WhatsApp group" : "Chat on WhatsApp"}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-success text-success-foreground px-4 py-3 font-semibold shadow-glow transition-transform hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">{store.whatsapp_group_link ? "Join group" : "WhatsApp"}</span>
        </a>
      )}
    </div>
  );
}

function toWhatsAppDigits(number: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  return digits;
}

function BuyDialog({ product, store, onClose }: { product: Product; store: Store; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const [copied, setCopied] = useState(false);
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-up"
      onClick={onClose}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-6">
          {done ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold">Order received!</h3>
              <div className="mt-5 rounded-xl bg-secondary p-4 font-mono text-lg font-bold">{done.reference}</div>
              <p className="mt-3 text-sm text-muted-foreground">Save this reference to follow up with store support.</p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(done.reference);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy ref"}
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  Done
                </Button>
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
                <Input
                  inputMode="numeric"
                  placeholder="0241234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.trim())}
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Email (optional)</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                  style={{ background: store.theme_color || undefined }}
                >
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
