import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGHS, cn } from "@/lib/utils";
import {
  Loader2, Package, ShoppingCart, Wallet, Settings as SettingsIcon,
  Plus, Trash2, LayoutDashboard, Users, TrendingUp, Clock,
  CheckCircle2, ShieldCheck, ShieldOff, CircleDollarSign,
  RefreshCw, X, Phone, Calendar, Hash, CreditCard, Store as StoreIcon, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "products" | "orders" | "withdrawals" | "users" | "settings";
type Network = "mtn" | "telecel" | "airteltigo" | "bece" | "wassce";
type ProductType = "data" | "checker";
type OrderStatus = "processing" | "delivered" | "failed" | "refunded";
type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
type Role = "admin" | "agent" | "subagent" | "customer";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("overview");
  const activeLabel = TABS.find((t) => t.id === tab)?.label || "";
  return (
    <section className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] items-start">
        <aside className="lg:sticky lg:top-24 space-y-4">
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-gold/10">
            <AdminDoodle />
            <CardContent className="relative p-5 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/80">Admin Console</p>
              <h1 className="font-display text-2xl font-bold leading-tight">
                Control Room <span className="inline-block animate-doodle-float">⚡</span>
              </h1>
              <p className="text-muted-foreground text-xs">Manage AktiveeData operations end-to-end.</p>
              <div className="mt-3 rounded-xl border border-gold/30 bg-background/60 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Current view</div>
                <div className="font-display text-base font-bold text-gold">{activeLabel}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Navigate</p>
              <nav className="space-y-1">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "group w-full inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition relative",
                        active
                          ? "bg-gradient-to-r from-primary to-gold text-primary-foreground shadow-elegant"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "grid h-7 w-7 place-items-center rounded-md transition",
                        active ? "bg-background/25" : "bg-secondary group-hover:bg-background"
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{t.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-background/80" />}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 space-y-6">
          <header className="mb-2">
            <h1 className="font-display text-3xl md:text-4xl font-bold">{activeLabel}</h1>
            <p className="text-muted-foreground mt-1 text-sm">Admin tools for {activeLabel.toLowerCase()}.</p>
          </header>
          {tab === "overview" && <OverviewTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "withdrawals" && <WithdrawalsTab />}
          {tab === "users" && <UsersTab />}
          {tab === "settings" && <SettingsTab />}
        </main>
      </div>
    </section>
  );
}

function AdminDoodle() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 text-primary/30"
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <g className="animate-doodle-spin origin-center">
        <circle cx="60" cy="60" r="34" strokeDasharray="6 8" />
        <circle cx="60" cy="60" r="22" strokeDasharray="3 6" />
      </g>
      <path d="M20 90 Q40 60 60 90 T100 90" className="animate-doodle-draw" />
      <circle cx="60" cy="60" r="4" fill="currentColor" className="animate-pulse-glow" />
    </svg>
  );
}

/* ---------------- Overview ---------------- */

function OverviewTab() {
  const [stats, setStats] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: o }] = await Promise.all([
      supabase.rpc("admin_overview" as any),
      supabase.from("orders").select("reference, amount, status, recipient_phone, created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    setStats(s);
    setRecentOrders(o || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading || !stats) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />;

  const kpis = [
    { label: "Revenue (delivered)", value: formatGHS(stats.revenue_total), accent: "text-success", icon: TrendingUp, sub: `Today ${formatGHS(stats.revenue_today)}` },
    { label: "Orders", value: stats.total_orders, accent: "text-foreground", icon: ShoppingCart, sub: `Today ${stats.orders_today}` },
    { label: "Processing", value: stats.processing_orders, accent: "text-gold", icon: Clock, sub: `${stats.failed_orders} failed` },
    { label: "Users", value: stats.total_users, accent: "text-foreground", icon: Users, sub: `${stats.total_agents} agents` },
    { label: "Pending withdrawals", value: stats.pending_withdrawals, accent: "text-primary", icon: Wallet, sub: formatGHS(stats.pending_withdrawal_amount) },
    { label: "Wallet float", value: formatGHS(stats.total_wallet_balance), accent: "text-gold", icon: CircleDollarSign, sub: `${stats.active_products} active products` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
                    <p className={cn("mt-2 text-3xl font-display font-bold", k.accent)}>{k.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
                  </div>
                  <Icon className={cn("h-8 w-8 opacity-30", k.accent)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold">Latest orders</h3>
            <Button size="sm" variant="ghost" onClick={load}>Refresh</Button>
          </div>
          <div className="divide-y divide-border/60">
            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground py-4">No orders yet.</p>}
            {recentOrders.map((o) => (
              <div key={o.reference} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono font-bold">{o.reference}</span>
                  <span className="text-muted-foreground ml-2">{o.recipient_phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatGHS(o.amount)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                    o.status === "delivered" ? "bg-success/15 text-success" :
                    o.status === "processing" ? "bg-gold/15 text-gold" :
                    o.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground")}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Users ---------------- */

const ROLES: Role[] = ["admin", "agent", "subagent", "customer"];

function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adminExists, setAdminExists] = useState(true);

  const load = async (q = "") => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users" as any, { _search: q });
    if (!error) setUsers((data as any[]) || []);
    setLoading(false);
  };

  const checkBootstrap = async () => {
    const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    setAdminExists((count ?? 0) > 0);
  };

  useEffect(() => { load(); checkBootstrap(); }, []);

  const claimAdmin = async () => {
    const { error } = await supabase.rpc("claim_first_admin" as any);
    if (error) return alert(error.message);
    alert("You are now admin. Reload the page.");
    window.location.reload();
  };

  const toggleRole = async (uid: string, role: Role, enabled: boolean) => {
    setBusyId(uid + role);
    const { error } = await supabase.rpc("admin_set_role" as any, { _user_id: uid, _role: role, _enabled: enabled });
    setBusyId(null);
    if (error) return alert(error.message);
    load(search);
  };

  const credit = async (uid: string) => {
    const raw = prompt("Amount to credit (negative to debit) in GHS:");
    if (!raw) return;
    const amount = Number(raw);
    if (!isFinite(amount) || amount === 0) return;
    const desc = prompt("Description?", "Admin adjustment") || "Admin adjustment";
    const { error } = await supabase.rpc("admin_credit_wallet" as any, { _user_id: uid, _amount: amount, _description: desc });
    if (error) return alert(error.message);
    load(search);
  };

  return (
    <div className="space-y-4">
      {!adminExists && (
        <Card className="border-gold/40 bg-gold/5">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">No admin exists yet</p>
              <p className="text-sm text-muted-foreground">Promote yourself to admin to start managing the platform.</p>
            </div>
            <Button onClick={claimAdmin}><ShieldCheck className="h-4 w-4" /> Claim admin</Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex gap-2">
        <Input placeholder="Search by name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />
      ) : (
        <div className="grid gap-3">
          {users.length === 0 && <p className="text-muted-foreground text-center py-10">No users found.</p>}
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {u.full_name || "Unnamed"}
                      {u.id === me?.id && <span className="text-xs rounded-full px-2 py-0.5 bg-primary/15 text-primary">you</span>}
                      {u.is_suspended && <span className="text-xs rounded-full px-2 py-0.5 bg-destructive/15 text-destructive">suspended</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email} · {u.phone || "no phone"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Wallet</div>
                    <div className="font-bold text-gold">{formatGHS(u.balance || 0)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const has = (u.roles || []).includes(r);
                    const k = u.id + r;
                    return (
                      <button
                        key={r}
                        disabled={busyId === k}
                        onClick={() => toggleRole(u.id, r, !has)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border transition",
                          has
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {busyId === k ? <Loader2 className="h-3 w-3 animate-spin" /> : has ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {r}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => credit(u.id)}>
                    <CircleDollarSign className="h-4 w-4" /> Credit wallet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await supabase.from("profiles").update({ is_suspended: !u.is_suspended }).eq("id", u.id);
                      load(search);
                    }}
                  >
                    {u.is_suspended ? <><ShieldCheck className="h-4 w-4" /> Reactivate</> : <><ShieldOff className="h-4 w-4" /> Suspend</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Products ---------------- */

function ProductsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const networkOrder: Record<Network, number> = {
    mtn: 0,
    telecel: 1,
    airteltigo: 2,
    bece: 3,
    wassce: 4,
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*");
    const sorted = (data || []).sort((a, b) => {
      const byType = a.type === b.type ? 0 : a.type === "data" ? -1 : 1;
      if (byType !== 0) return byType;
      const byNetwork = (networkOrder[a.network as Network] ?? 99) - (networkOrder[b.network as Network] ?? 99);
      if (byNetwork !== 0) return byNetwork;
      if (a.type === "checker" || b.type === "checker") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }
      const aMb = Number(a.data_volume_mb || 0);
      const bMb = Number(b.data_volume_mb || 0);
      if (aMb !== bMb) return aMb - bMb;
      return Number(a.agent_price || 0) - Number(b.agent_price || 0);
    });
    setItems(sorted);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this data package? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert(`Could not delete: ${error.message}`);
      return;
    }
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

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            load();
            setEditingProduct(null);
          }}
        />
      )}

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
                    <span className="text-xs uppercase rounded-full px-2 py-0.5 bg-primary/10 text-primary">{p.type}</span>
                    <span className="text-xs uppercase rounded-full px-2 py-0.5 bg-secondary">{p.network}</span>
                    {p.type === "data" && p.data_volume_mb ? (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
                        {(Number(p.data_volume_mb) / 1024).toFixed(Number(p.data_volume_mb) % 1024 === 0 ? 0 : 1)}GB
                      </span>
                    ) : null}
                    {!p.is_active && (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-destructive/10 text-destructive">
                        inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    User {formatGHS(p.public_price)} · Agent Base {formatGHS(p.agent_price)}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggle(p.id, p.is_active)}>
                  {p.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEditingProduct(p); setShowForm(true); }}>
                  Edit
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

function ProductForm({ product, onClose, onSaved }: { product?: any | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(() => ({
    type: (product?.type as ProductType) ?? "data",
    network: (product?.network as Network) ?? "mtn",
    volume_gb: product?.data_volume_mb ? String(Number(product.data_volume_mb) / 1024) : "",
    checker_name: product?.type === "checker" ? (product.name ?? "") : "",
    public_price: product ? String(product.public_price ?? "") : "",
    agent_price: product ? String(product.agent_price ?? "") : "",
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const publicPrice = Number(f.public_price);
    const agentPrice = Number(f.agent_price);
    if (!isFinite(publicPrice) || publicPrice <= 0 || !isFinite(agentPrice) || agentPrice <= 0) {
      setErr("Enter valid public and agent prices.");
      return;
    }
    if (agentPrice > publicPrice) {
      setErr("Agent price cannot be greater than public price.");
      return;
    }

    let payload: any = null;
    if (f.type === "data") {
      const gb = Number(f.volume_gb);
      if (!isFinite(gb) || gb <= 0) {
        setErr("Enter a valid volume in GB.");
        return;
      }
      const volumeMb = Math.round(gb * 1024);
      const productName = `${f.network.toUpperCase()} ${gb}GB`;
      payload = {
        name: productName,
        network: f.network,
        type: "data" as ProductType,
        public_price: publicPrice,
        agent_price: agentPrice,
        data_volume_mb: volumeMb,
        description: null,
      };
    } else {
      const checkerName = f.checker_name.trim();
      if (checkerName.length < 2) {
        setErr("Enter a valid checker name.");
        return;
      }
      const inferredNetwork: Network = checkerName.toLowerCase().includes("wassce") ? "wassce" : "bece";
      payload = {
        name: checkerName,
        network: inferredNetwork,
        type: "checker" as ProductType,
        public_price: publicPrice,
        agent_price: agentPrice,
        data_volume_mb: null,
        description: null,
      };
    }

    setSaving(true);
    setErr(null);
    let error = null;
    if (product && product.id) {
      const res = await supabase.from("products").update(payload).eq("id", product.id);
      error = res.error;
    } else {
      const res = await supabase.from("products").insert(payload);
      error = res.error;
    }
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
    onClose();
  };

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <select
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value as ProductType })}
          >
            <option value="data">Data Bundle</option>
            <option value="checker">Checker</option>
          </select>
          {f.type === "data" ? (
            <>
              <select
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                value={f.network}
                onChange={(e) => setF({ ...f, network: e.target.value as Network })}
              >
                {(["mtn", "telecel", "airteltigo"] as Network[]).map((n) => (
                  <option key={n} value={n}>{n.toUpperCase()}</option>
                ))}
              </select>
              <Input type="number" step="0.1" placeholder="Volume (GB)" value={f.volume_gb} onChange={(e) => setF({ ...f, volume_gb: e.target.value })} required />
            </>
          ) : (
            <Input placeholder="Checker name" value={f.checker_name} onChange={(e) => setF({ ...f, checker_name: e.target.value })} required />
          )}
          <Input type="number" step="0.01" placeholder="Public price (GHS)" value={f.public_price} onChange={(e) => setF({ ...f, public_price: e.target.value })} required />
          <Input type="number" step="0.01" placeholder="Agent price (GHS)" value={f.agent_price} onChange={(e) => setF({ ...f, agent_price: e.target.value })} required />
          {f.type === "checker" && <p className="sm:col-span-2 text-xs text-muted-foreground">Checker network is auto-set based on name (contains WASSCE = WASSCE, otherwise BECE).</p>}
          {err && <div className="sm:col-span-2 text-destructive text-sm">{err}</div>}
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : product ? "Save" : "Create"}</Button>
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
  const [selected, setSelected] = useState<any | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, products(name, network, type, data_volume_mb)")
      .order("created_at", { ascending: false })
      .limit(200);
    // Fetch related buyer/store profiles + payment in parallel
    const rows = data || [];
    const buyerIds = Array.from(new Set(rows.map((r) => r.buyer_user_id).filter(Boolean)));
    const storeIds = Array.from(new Set(rows.map((r) => r.store_owner_id).filter(Boolean)));
    const allIds = Array.from(new Set([...buyerIds, ...storeIds]));
    const refs = rows.map((r) => r.reference).filter(Boolean);
    const [{ data: profiles }, { data: payments }] = await Promise.all([
      allIds.length
        ? supabase.from("profiles").select("id, full_name, email, phone").in("id", allIds)
        : Promise.resolve({ data: [] as any[] }),
      refs.length
        ? supabase.from("payment_transactions").select("reference, status, amount, currency, processed_at, paystack_authorization_url").in("reference", refs)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const paymentMap = new Map((payments || []).map((p: any) => [p.reference, p]));
    const enriched = rows.map((r) => ({
      ...r,
      buyer: r.buyer_user_id ? profileMap.get(r.buyer_user_id) : null,
      store_owner: r.store_owner_id ? profileMap.get(r.store_owner_id) : null,
      payment: paymentMap.get(r.reference) || null,
    }));
    setItems(enriched);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  };

  const retryOrder = async (order: any) => {
    setRetrying(order.id);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-data", {
        body: { order_id: order.id, retry: true },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Order resubmitted to Swift");
      } else {
        toast.error(data?.error || "Retry failed");
      }
      await load();
      if (selected?.id === order.id) {
        const fresh = (items || []).find((i) => i.id === order.id);
        if (fresh) setSelected(fresh);
      }
    } catch (e: any) {
      toast.error(e?.message || "Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  const sourceOf = (o: any) =>
    o.store_owner_id ? "Agent store" : o.buyer_user_id ? "Dashboard" : "Main site";

  const filtered = filter === "all" ? items : items.filter((o) => o.status === filter);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-10" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["all", "processing", "delivered", "failed", "refunded"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold uppercase border",
              filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-secondary"
            )}
          >
            {s}
          </button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {filtered.length === 0 && <p className="text-muted-foreground text-center py-10">No orders.</p>}
      {filtered.map((o) => {
        const isFailed = o.status === "failed";
        const insufficient = isFailed && /insufficient|balance|funds/i.test(String(o.notes || ""));
        return (
          <Card key={o.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <button onClick={() => setSelected(o)} className="flex-1 min-w-[220px] text-left">
                <div className="font-mono text-sm font-bold">{o.reference}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {o.products?.name || "—"} · {o.recipient_phone} · {formatGHS(o.amount)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1"><StoreIcon className="h-3 w-3" /> {sourceOf(o)}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(o.created_at).toLocaleString()}</span>
                  {o.swift_order_id && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> Swift</span>}
                </div>
              </button>
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", STATUS_COLORS[o.status as OrderStatus])}>
                {o.status}
              </span>
              {isFailed && (
                <Button
                  size="sm"
                  variant={insufficient ? "default" : "outline"}
                  disabled={retrying === o.id}
                  onClick={(e) => { e.stopPropagation(); retryOrder(o); }}
                >
                  {retrying === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Retry
                </Button>
              )}
              <select
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                onClick={(e) => e.stopPropagation()}
                className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
              >
                {(["processing", "delivered", "failed", "refunded"] as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        );
      })}

      {selected && (
        <OrderDetailDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onRetry={() => retryOrder(selected)}
          retrying={retrying === selected.id}
          source={sourceOf(selected)}
        />
      )}
    </div>
  );
}

function OrderDetailDrawer({
  order, onClose, onRetry, retrying, source,
}: { order: any; onClose: () => void; onRetry: () => void; retrying: boolean; source: string }) {
  const payment = order.payment;
  const isFailed = order.status === "failed";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-card/95 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Order details</div>
            <div className="font-mono text-lg font-bold">{order.reference}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", STATUS_COLORS[order.status as OrderStatus])}>
              {order.status}
            </span>
            {order.swift_status && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase bg-primary/10 text-primary">
                Swift: {order.swift_status}
              </span>
            )}
            {payment?.status && (
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase",
                payment.status === "success" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
              )}>
                Payment: {payment.status}
              </span>
            )}
          </div>

          <Section title="Product">
            <Row icon={Package} label="Name" value={order.products?.name || "—"} />
            <Row icon={Hash} label="Network" value={(order.products?.network || "—").toUpperCase()} />
            <Row icon={Hash} label="Volume" value={order.products?.data_volume_mb ? `${order.products.data_volume_mb} MB` : "—"} />
            <Row icon={CreditCard} label="Amount" value={formatGHS(order.amount)} />
          </Section>

          <Section title="Recipient & Source">
            <Row icon={Phone} label="Recipient" value={order.recipient_phone} />
            <Row icon={StoreIcon} label="Source" value={source} />
            {order.buyer && <Row icon={UserIcon} label="Buyer" value={`${order.buyer.full_name || order.buyer.email || "—"} ${order.buyer.phone ? `· ${order.buyer.phone}` : ""}`} />}
            {order.store_owner && <Row icon={StoreIcon} label="Store owner" value={`${order.store_owner.full_name || order.store_owner.email || "—"}`} />}
            <Row icon={Calendar} label="Created" value={new Date(order.created_at).toLocaleString()} />
            <Row icon={Calendar} label="Updated" value={new Date(order.updated_at).toLocaleString()} />
          </Section>

          <Section title="Swift API">
            <Row icon={Hash} label="Swift order ID" value={order.swift_order_id || "—"} mono />
            <Row icon={Hash} label="Swift status" value={order.swift_status || "—"} />
            {order.notes && (
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                {order.notes}
              </div>
            )}
          </Section>

          <Section title="Payment">
            <Row icon={Hash} label="Reference" value={order.reference} mono />
            <Row icon={CreditCard} label="Paystack status" value={payment?.status || "—"} />
            {payment?.amount != null && <Row icon={CreditCard} label="Paid" value={`${formatGHS(payment.amount)} ${payment.currency || ""}`} />}
            {payment?.processed_at && <Row icon={Calendar} label="Processed" value={new Date(payment.processed_at).toLocaleString()} />}
          </Section>

          {isFailed && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="font-semibold text-destructive">Fulfillment failed</div>
                <div className="text-xs text-muted-foreground">Retry to resubmit this order to the Swift API.</div>
              </div>
              <Button onClick={onRetry} disabled={retrying}>
                {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Retry order
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={cn("text-foreground break-words", mono && "font-mono text-xs")}>{value}</div>
      </div>
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
