import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatGHS } from "@/lib/utils";
import { initiatePaystackCheckout } from "@/lib/paystack";
import {
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Store as StoreIcon,
  XCircle,
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
  type: "data" | "checker";
  public_price: number;
  agent_price: number;
  data_volume_mb: number | null;
  description: string | null;
  selling_price?: number;
  agent_profit?: number;
};

type TrackOrderResult = {
  reference: string;
  status: "processing" | "delivered" | "failed" | "refunded";
  recipient_phone: string;
  amount: number;
  created_at: string;
  product_name: string | null;
};

type NetworkKey = "mtn" | "telecel" | "airteltigo" | "other";

const NETWORK_META: Record<NetworkKey, { label: string; card: string; pill: string }> = {
  mtn: {
    label: "MTN",
    card: "border-yellow-500 bg-yellow-400 text-black",
    pill: "bg-black/15 text-black",
  },
  telecel: {
    label: "Telecel",
    card: "border-red-700 bg-red-600 text-white",
    pill: "bg-white/20 text-white",
  },
  airteltigo: {
    label: "AirtelTigo",
    card: "border-blue-700 bg-blue-600 text-white",
    pill: "bg-white/20 text-white",
  },
  other: {
    label: "Other",
    card: "border-border/60 bg-card",
    pill: "bg-secondary text-secondary-foreground",
  },
};

const toNetworkKey = (network: string): NetworkKey => {
  if (network === "mtn") return "mtn";
  if (network === "telecel") return "telecel";
  if (network === "airteltigo") return "airteltigo";
  return "other";
};

const trackStatusMeta: Record<TrackOrderResult["status"], { label: string; icon: typeof Clock3; cls: string }> = {
  processing: { label: "Processing", icon: Clock3, cls: "bg-accent/15 text-accent" },
  delivered: { label: "Delivered", icon: CheckCircle2, cls: "bg-success/15 text-success" },
  failed: { label: "Failed", icon: XCircle, cls: "bg-destructive/15 text-destructive" },
  refunded: { label: "Refunded", icon: Package, cls: "bg-muted text-muted-foreground" },
};

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<NetworkKey>("mtn");
  const [trackReference, setTrackReference] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<TrackOrderResult | null>(null);
  const [trackNotFound, setTrackNotFound] = useState(false);

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
        .select("id, name, network, type, public_price, agent_price, data_volume_mb, description")
        .eq("is_active", true)
        .order("network", { ascending: true });

      const productsData = (p as Product[]) || [];
      const { data: pricing } = await supabase
        .from("store_product_pricing")
        .select("product_id, profit")
        .eq("user_id", (s as Store).user_id);

      const pricingMap = new Map<string, number>(
        (pricing || []).map((row: any) => [row.product_id, Number(row.profit || 0)])
      );

      const pricedProducts = productsData
        .map((prod) => {
          const profit = pricingMap.get(prod.id) ?? 0;
          return {
            ...prod,
            agent_profit: profit,
            selling_price: Number(prod.agent_price) + Number(profit),
          };
        })
        .sort((a, b) => {
          if (a.network !== b.network) return a.network.localeCompare(b.network);
          return Number(a.data_volume_mb || 0) - Number(b.data_volume_mb || 0);
        });

      setProducts(pricedProducts);
      const present = new Set(pricedProducts.map((prod) => toNetworkKey(prod.network)));
      if (present.has("mtn")) setActiveNetwork("mtn");
      else if (present.has("telecel")) setActiveNetwork("telecel");
      else if (present.has("airteltigo")) setActiveNetwork("airteltigo");
      else setActiveNetwork("other");
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
  const dataProducts = products.filter((prod) => prod.type === "data");
  const checkerProducts = products.filter((prod) => prod.type === "checker");
  const networkCounts = dataProducts.reduce<Record<NetworkKey, number>>(
    (acc, prod) => {
      const key = toNetworkKey(prod.network);
      acc[key] += 1;
      return acc;
    },
    { mtn: 0, telecel: 0, airteltigo: 0, other: 0 }
  );
  const visibleNetworks = (Object.keys(networkCounts) as NetworkKey[]).filter((key) => networkCounts[key] > 0);
  const filteredProducts = dataProducts.filter((prod) => toNetworkKey(prod.network) === activeNetwork);

  const trackOrder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trackReference.trim() || !trackPhone.trim()) return;

    setTrackLoading(true);
    setTrackNotFound(false);
    setTrackResult(null);
    const { data } = await supabase.rpc("track_order", {
      _reference: trackReference.trim().toUpperCase(),
      _phone: trackPhone.trim(),
    });
    setTrackLoading(false);

    const row = (data as TrackOrderResult[] | null)?.[0] || null;
    if (row) setTrackResult(row);
    else setTrackNotFound(true);
  };

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
        <div className="mb-8 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold">Track your order</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter your reference and recipient phone to check status instantly.</p>

              <form onSubmit={trackOrder} className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Reference</label>
                  <Input
                    placeholder="GED-XXXXXXXX"
                    value={trackReference}
                    onChange={(e) => setTrackReference(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Phone number</label>
                  <Input
                    inputMode="numeric"
                    placeholder="0241234567"
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={trackLoading} className="sm:col-span-2">
                  {trackLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {trackNotFound && (
            <Card className="border-destructive/40">
              <CardContent className="p-5 text-center">
                <XCircle className="h-7 w-7 text-destructive mx-auto mb-2" />
                <p className="font-semibold">Order not found</p>
                <p className="text-sm text-muted-foreground mt-1">Check the reference and recipient phone number, then try again.</p>
              </CardContent>
            </Card>
          )}

          {trackResult && (
            <Card className="animate-fade-up">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Reference</div>
                    <div className="font-mono font-bold text-lg">{trackResult.reference}</div>
                  </div>
                  {(() => {
                    const meta = trackStatusMeta[trackResult.status];
                    const Icon = meta.icon;
                    return (
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", meta.cls)}>
                        <Icon className="h-3.5 w-3.5" /> {meta.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/70">
                  <TrackInfoField label="Product" value={trackResult.product_name || "-"} />
                  <TrackInfoField label="Recipient" value={trackResult.recipient_phone} />
                  <TrackInfoField label="Amount" value={formatGHS(trackResult.amount)} />
                  <TrackInfoField label="Placed" value={new Date(trackResult.created_at).toLocaleString()} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Available Products</h2>
          <span className="text-xs rounded-full bg-secondary px-3 py-1.5 font-semibold">{products.length} products</span>
        </div>

        {visibleNetworks.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {visibleNetworks.map((key) => {
              const active = key === activeNetwork;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveNetwork(key)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {NETWORK_META[key].label} ({networkCounts[key]})
                </button>
              );
            })}
          </div>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">No products available right now.</CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-display text-xl md:text-2xl font-bold">Data Bundles</h3>
                <span className="text-xs rounded-full bg-secondary px-3 py-1.5 font-semibold">{dataProducts.length}</span>
              </div>

              {dataProducts.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">No data bundles available right now.</CardContent>
                </Card>
              ) : filteredProducts.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No {NETWORK_META[activeNetwork].label} bundles available right now.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((p) => {
                    const key = toNetworkKey(p.network);
                    const meta = NETWORK_META[key];
                    const subtleText = key === "mtn" ? "text-black/80" : "text-white/90";
                    const buyButtonClass = key === "mtn" ? "bg-black text-white hover:bg-black/90" : "bg-white text-black hover:bg-white/90";
                    const cardStyle =
                      key === "mtn"
                        ? { background: "#facc15", color: "#000000", borderColor: "#eab308" }
                        : key === "telecel"
                          ? { background: "#dc2626", color: "#ffffff", borderColor: "#b91c1c" }
                          : key === "airteltigo"
                            ? { background: "#2563eb", color: "#ffffff", borderColor: "#1d4ed8" }
                            : undefined;
                    return (
                    <Card
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={`cursor-pointer transition hover:-translate-y-1.5 hover:shadow-glow ${meta.card}`}
                      style={cardStyle}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-bold uppercase rounded-full px-2.5 py-1 ${meta.pill}`}>{meta.label}</span>
                          {p.data_volume_mb && (
                            <span className={`text-xs ${subtleText}`}>
                              {p.data_volume_mb >= 1024 ? `${(p.data_volume_mb / 1024).toFixed(1)}GB` : `${p.data_volume_mb}MB`}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-lg font-bold">{p.name}</h3>
                        {p.description && <p className={`mt-2 text-sm line-clamp-2 ${subtleText}`}>{p.description}</p>}
                        <div className="mt-4 flex items-end justify-between">
                          <div className="font-display text-2xl font-bold">
                            {formatGHS(Number(p.selling_price ?? p.agent_price ?? p.public_price))}
                          </div>
                          <Button size="sm" className={buyButtonClass}>
                            Buy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-display text-xl md:text-2xl font-bold">Checkers</h3>
                <span className="text-xs rounded-full bg-secondary px-3 py-1.5 font-semibold">{checkerProducts.length}</span>
              </div>

              {checkerProducts.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">No checkers available right now.</CardContent>
                </Card>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {checkerProducts.map((p) => (
                    <Card
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="cursor-pointer transition hover:-translate-y-1.5 hover:shadow-glow border-border bg-card"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase rounded-full px-2.5 py-1 bg-primary/10 text-primary">Checker</span>
                          <span className="text-xs rounded-full px-2.5 py-1 bg-secondary text-secondary-foreground">{p.network.toUpperCase()}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold">{p.name}</h3>
                        {p.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                        <div className="mt-4 flex items-end justify-between">
                          <div className="font-display text-2xl font-bold" style={{ color: store.theme_color || undefined }}>
                            {formatGHS(Number(p.selling_price ?? p.agent_price ?? p.public_price))}
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
            </div>
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

function TrackInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
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
    const sellingPrice = Number(product.selling_price ?? product.agent_price ?? product.public_price);
    const agentProfit = Number(product.agent_profit ?? (sellingPrice - Number(product.agent_price || 0)));

    const { data, error: err } = await supabase
      .from("orders")
      .insert({
        product_id: product.id,
        recipient_phone: phone,
        recipient_email: email || null,
        amount: sellingPrice,
        agent_profit: agentProfit,
        store_owner_id: store.user_id,
      })
      .select("id, reference")
      .single();
    if (err) {
      setSubmitting(false);
      return setError(err.message);
    }

    try {
      const callbackUrl = `${window.location.origin}/payment-result?order_reference=${encodeURIComponent(
        data.reference
      )}`;
      const init = await initiatePaystackCheckout(data.id, callbackUrl);
      window.location.href = init.authorizationUrl;
      return;
    } catch (initError) {
      setSubmitting(false);
      return setError(initError instanceof Error ? initError.message : String(initError));
    }
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
                    {formatGHS(Number(product.selling_price ?? product.agent_price ?? product.public_price))}
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
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${formatGHS(Number(product.selling_price ?? product.agent_price ?? product.public_price))}`}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
