import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGHS, cn } from "@/lib/utils";
import { Loader2, Package, ShoppingCart, Wallet, Settings as SettingsIcon, Plus, Trash2 } from "lucide-react";

type Tab = "products" | "orders" | "withdrawals" | "settings";
type Network = "mtn" | "telecel" | "airteltigo" | "bece" | "wassce";
type OrderStatus = "processing" | "delivered" | "failed" | "refunded";
type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("products");
  return (
    <section className="container py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold">Admin Console</h1>
        <p className="text-muted-foreground mt-1">Manage BossuData operations.</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "products" && <ProductsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "withdrawals" && <WithdrawalsTab />}
      {tab === "settings" && <SettingsTab />}
    </section>
  );
}

/* ---------------- Products ---------------- */

function ProductsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("products").update({ is_active: !is_active }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} products</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> New product
        </Button>
      </div>

      {showForm && <ProductForm onClose={() => setShowForm(false)} onSaved={load} />}

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs uppercase rounded-full px-2 py-0.5 bg-secondary">{p.network}</span>
                    {!p.is_active && (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-destructive/10 text-destructive">
                        inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Public {formatGHS(p.public_price)} · Agent {formatGHS(p.agent_price)}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggle(p.id, p.is_active)}>
                  {p.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: "",
    network: "mtn" as Network,
    type: "data" as "data" | "checker",
    public_price: "",
    agent_price: "",
    data_volume_mb: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const { error } = await supabase.from("products").insert({
      name: f.name,
      network: f.network,
      type: f.type,
      public_price: Number(f.public_price),
      agent_price: Number(f.agent_price),
      data_volume_mb: f.data_volume_mb ? Number(f.data_volume_mb) : null,
      description: f.description || null,
    });
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
    onClose();
  };

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name (e.g. MTN 1GB)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          <select
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            value={f.network}
            onChange={(e) => setF({ ...f, network: e.target.value as Network })}
          >
            {(["mtn", "telecel", "airteltigo", "bece", "wassce"] as Network[]).map((n) => (
              <option key={n} value={n}>{n.toUpperCase()}</option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value as "data" | "checker" })}
          >
            <option value="data">Data bundle</option>
            <option value="checker">Result checker</option>
          </select>
          <Input type="number" placeholder="Volume MB (optional)" value={f.data_volume_mb} onChange={(e) => setF({ ...f, data_volume_mb: e.target.value })} />
          <Input type="number" step="0.01" placeholder="Public price (GHS)" value={f.public_price} onChange={(e) => setF({ ...f, public_price: e.target.value })} required />
          <Input type="number" step="0.01" placeholder="Agent price (GHS)" value={f.agent_price} onChange={(e) => setF({ ...f, agent_price: e.target.value })} required />
          <Input className="sm:col-span-2" placeholder="Description (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          {err && <div className="sm:col-span-2 text-destructive text-sm">{err}</div>}
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------------- Orders ---------------- */

const STATUS_COLORS: Record<OrderStatus, string> = {
  processing: "bg-gold/15 text-gold",
  delivered: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

function OrdersTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, products(name, network)")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />;

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-muted-foreground text-center py-10">No orders yet.</p>}
      {items.map((o) => (
        <Card key={o.id}>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="font-mono text-sm font-bold">{o.reference}</div>
              <div className="text-xs text-muted-foreground">
                {o.products?.name || "—"} · {o.recipient_phone} · {formatGHS(o.amount)}
              </div>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", STATUS_COLORS[o.status as OrderStatus])}>
              {o.status}
            </span>
            <select
              value={o.status}
              onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
            >
              {(["processing", "delivered", "failed", "refunded"] as OrderStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Withdrawals ---------------- */

const W_STATUS: Record<WithdrawalStatus, string> = {
  pending: "bg-gold/15 text-gold",
  approved: "bg-primary/15 text-primary",
  paid: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

function WithdrawalsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: WithdrawalStatus) => {
    await supabase.from("withdrawal_requests").update({ status }).eq("id", id);
    load();
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />;

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-muted-foreground text-center py-10">No withdrawal requests.</p>}
      {items.map((w) => (
        <Card key={w.id}>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="font-bold">{formatGHS(w.amount)} → {w.account_name}</div>
              <div className="text-xs text-muted-foreground">
                {w.network.toUpperCase()} · {w.momo_number}
              </div>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", W_STATUS[w.status as WithdrawalStatus])}>
              {w.status}
            </span>
            <select
              value={w.status}
              onChange={(e) => setStatus(w.id, e.target.value as WithdrawalStatus)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
            >
              {(["pending", "approved", "paid", "rejected"] as WithdrawalStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsTab() {
  const [s, setS] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("site_settings").select("*").maybeSingle().then(({ data }) => setS(data));
  }, []);

  if (!s) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("site_settings")
      .update({
        site_name: s.site_name,
        whatsapp_number: s.whatsapp_number,
        agent_signup_fee: Number(s.agent_signup_fee),
        min_withdrawal: Number(s.min_withdrawal),
        maintenance_mode: s.maintenance_mode,
        maintenance_message: s.maintenance_message,
      })
      .eq("id", s.id);
    setSaving(false);
    setMsg(error ? error.message : "Saved!");
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name">
            <Input value={s.site_name} onChange={(e) => setS({ ...s, site_name: e.target.value })} />
          </Field>
          <Field label="WhatsApp number">
            <Input value={s.whatsapp_number || ""} onChange={(e) => setS({ ...s, whatsapp_number: e.target.value })} />
          </Field>
          <Field label="Agent signup fee (GHS)">
            <Input type="number" step="0.01" value={s.agent_signup_fee} onChange={(e) => setS({ ...s, agent_signup_fee: e.target.value })} />
          </Field>
          <Field label="Minimum withdrawal (GHS)">
            <Input type="number" step="0.01" value={s.min_withdrawal} onChange={(e) => setS({ ...s, min_withdrawal: e.target.value })} />
          </Field>
          <Field label="Maintenance message" className="sm:col-span-2">
            <Input value={s.maintenance_message || ""} onChange={(e) => setS({ ...s, maintenance_message: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 sm:col-span-2 text-sm">
            <input
              type="checkbox"
              checked={s.maintenance_mode}
              onChange={(e) => setS({ ...s, maintenance_mode: e.target.checked })}
            />
            Enable maintenance mode
          </label>
          {msg && <div className="sm:col-span-2 text-sm text-success">{msg}</div>}
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
