import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGHS, cn } from "@/lib/utils";
import { CheckCircle2, Loader2, ShieldCheck, Smartphone, Wifi } from "lucide-react";

type Network = "mtn" | "telecel" | "airteltigo" | "other";
type ProductTab = "mtn" | "telecel" | "airteltigo" | "checker";
type Product = {
  id: string;
  name: string;
  type: string;
  network: string;
  public_price: number;
  agent_price: number;
  data_volume_mb: number | null;
  description: string | null;
  is_active: boolean;
};

const NETWORKS: { id: ProductTab; label: string }[] = [
  { id: "mtn", label: "MTN" },
  { id: "telecel", label: "Telecel" },
  { id: "airteltigo", label: "AirtelTigo" },
  { id: "checker", label: "Checkers" },
];

const networkBadge: Record<Network, string> = {
  mtn: "bg-gold/15 text-gold border-gold/30",
  telecel: "bg-primary/15 text-primary border-primary/30",
  airteltigo: "bg-success/15 text-success border-success/30",
  other: "bg-accent/15 text-accent border-accent/30",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductTab>("mtn");
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("public_price", { ascending: true })
      .then(({ data }) => {
        setProducts((data as Product[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (filter === "checker") return products.filter((p) => p.type === "checker");
    return products.filter((p) => p.type === "data" && p.network === filter);
  }, [products, filter]);

  return (
    <>
      <section className="bg-gradient-hero text-white">
        <div className="container py-14 md:py-20">
          <h1 className="font-display text-4xl md:text-5xl font-bold">Data Bundles & Pins</h1>
          <p className="mt-3 text-white/75 max-w-xl">
            Pick a bundle, pay with mobile money, delivered in seconds. No signup needed.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              onClick={() => setFilter(n.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium border transition",
                filter === n.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-secondary"
              )}
            >
              {n.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No products available in this category right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="group transition-all hover:-translate-y-1 hover:shadow-glow cursor-pointer"
                onClick={() => setSelected(p)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase",
                        p.type === "checker" ? "bg-accent/15 text-accent border-accent/30" : networkBadge[(p.network as Network) || "other"]
                      )}
                    >
                      {p.type === "checker" ? <ShieldCheck className="h-3 w-3" /> : p.network === "telecel" ? <Wifi className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                      {p.type === "checker" ? "checker" : p.network}
                    </span>
                    {p.type === "data" && p.data_volume_mb ? (
                      <span className="text-xs text-muted-foreground">
                        {p.data_volume_mb >= 1024 ? `${(p.data_volume_mb / 1024).toFixed(1)}GB` : `${p.data_volume_mb}MB`}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-display text-lg font-bold leading-snug">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="font-display text-2xl font-bold text-gold">{formatGHS(p.public_price)}</div>
                    </div>
                    <Button size="sm">Buy</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {selected && <BuyDialog product={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function BuyDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^0\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Ghana phone number (e.g. 0241234567).");
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
      })
      .select("reference")
      .single();
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
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
              <p className="text-muted-foreground mt-2 text-sm">
                Your reference is below. Save it to track your order.
              </p>
              <div className="mt-5 rounded-xl bg-secondary p-4 font-mono text-lg font-bold">{done.reference}</div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Close
                </Button>
                <Button asChild className="flex-1">
                  <a href={`/track?ref=${done.reference}&phone=${phone}`}>Track</a>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h3 className="font-display text-2xl font-bold">{product.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {product.network.toUpperCase()} •{" "}
                  <span className="text-gold font-bold">{formatGHS(product.public_price)}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Recipient phone number</label>
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
                <label className="text-sm font-semibold">Email (optional, for receipt)</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                />
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground flex gap-2">
                <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                You'll get a reference to track delivery. Refunds are issued for failed orders.
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
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
