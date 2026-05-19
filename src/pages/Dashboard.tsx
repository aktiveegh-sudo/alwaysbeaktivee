import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGHS, cn } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  ExternalLink,
  Loader2,
  Package,
  PackageSearch,
  Settings,
  Store as StoreIcon,
  Users,
  Wallet as WalletIcon,
} from "lucide-react";

type Wallet = { balance: number; total_earned: number };
type Tx = { id: string; amount: number; type: string; description: string | null; created_at: string };
type Profile = { full_name: string | null };
type DashboardTab = "overview" | "packages" | "orders" | "withdrawal" | "settings";
type Store = {
  id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  whatsapp_number: string | null;
  whatsapp_group_link: string | null;
  theme_color: string | null;
  is_active: boolean;
} | null;
type StoreOrder = {
  id: string;
  reference: string;
  amount: number;
  status: "processing" | "delivered" | "failed" | "refunded";
  recipient_phone: string;
  created_at: string;
  agent_profit: number | null;
  products?: { name?: string; network?: string } | null;
};
type Withdrawal = {
  id: string;
  amount: number;
  momo_number: string;
  network: string;
  account_name: string;
  status: "pending" | "approved" | "rejected" | "paid";
  created_at: string;
};
type CheckerPricingItem = {
  id: string;
  name: string;
  type: "data" | "checker";
  network: string;
  data_volume_mb: number | null;
  agent_price: number;
  myProfit: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

const ORDER_STATUS_COLOR: Record<StoreOrder["status"], string> = {
  processing: "bg-gold/15 text-gold",
  delivered: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

const WITHDRAW_STATUS_COLOR: Record<Withdrawal["status"], string> = {
  pending: "bg-gold/15 text-gold",
  approved: "bg-primary/15 text-primary",
  rejected: "bg-destructive/15 text-destructive",
  paid: "bg-success/15 text-success",
};

export default function Dashboard() {
  const { user, roles, signOut } = useAuth();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [store, setStore] = useState<Store>(null);
  const [storeName, setStoreName] = useState("");
  const [supportWhatsapp, setSupportWhatsapp] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [checkerPricing, setCheckerPricing] = useState<CheckerPricingItem[]>([]);
  const [pricingBusyId, setPricingBusyId] = useState<string | null>(null);
  const [pricingMsg, setPricingMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [minWithdrawal, setMinWithdrawal] = useState(50);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMomo, setWithdrawMomo] = useState("");
  const [withdrawNetwork, setWithdrawNetwork] = useState("mtn");
  const [withdrawAccountName, setWithdrawAccountName] = useState("");
  const [withdrawErr, setWithdrawErr] = useState<string | null>(null);
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  const [settingsName, setSettingsName] = useState("");
  const [settingsTagline, setSettingsTagline] = useState("");
  const [settingsWhatsapp, setSettingsWhatsapp] = useState("");
  const [settingsGroupLink, setSettingsGroupLink] = useState("");
  const [settingsColor, setSettingsColor] = useState("#facc15");
  const [settingsActive, setSettingsActive] = useState(true);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [w, t, p, s, o, wr, ss, so, cp, pp] = await Promise.all([
        supabase.from("wallets").select("balance,total_earned").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("stores")
          .select("id,slug,display_name,tagline,whatsapp_number,whatsapp_group_link,theme_color,is_active")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_owner_id", user.id),
        supabase
          .from("withdrawal_requests")
          .select("id,amount,momo_number,network,account_name,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("site_settings").select("min_withdrawal").maybeSingle(),
        supabase
          .from("orders")
          .select("id,reference,amount,status,recipient_phone,created_at,agent_profit,products(name,network)")
          .eq("store_owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("products")
          .select("id,name,type,network,data_volume_mb,agent_price")
          .eq("is_active", true)
          .order("type", { ascending: true })
          .order("network", { ascending: true })
          .order("data_volume_mb", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("store_product_pricing")
          .select("product_id,profit")
          .eq("user_id", user.id),
      ]);

      setWallet((w.data as Wallet) || { balance: 0, total_earned: 0 });
      setTxs((t.data as Tx[]) || []);
      setProfile(p.data as Profile);
      setStore(s.data as Store);
      setOrderCount(o.count || 0);
      setWithdrawals((wr.data as Withdrawal[]) || []);
      setStoreOrders((so.data as StoreOrder[]) || []);
      const profitMap = new Map<string, number>((pp.data || []).map((row: any) => [row.product_id, Number(row.profit || 0)]));
      const checkerItems = ((cp.data as any[]) || []).map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        network: item.network,
        data_volume_mb: item.data_volume_mb,
        agent_price: Number(item.agent_price || 0),
        myProfit: profitMap.get(item.id) ?? 0,
      }));
      setCheckerPricing(checkerItems);
      if (ss.data?.min_withdrawal) setMinWithdrawal(Number(ss.data.min_withdrawal));

      if (s.data) {
        setSettingsName(s.data.display_name || "");
        setSettingsTagline(s.data.tagline || "");
        setSettingsWhatsapp(s.data.whatsapp_number || "");
        setSettingsGroupLink(s.data.whatsapp_group_link || "");
        setSettingsColor(s.data.theme_color || "#facc15");
        setSettingsActive(Boolean(s.data.is_active));
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading)
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );

  const isAgent = roles.includes("agent") || roles.includes("subagent") || roles.includes("admin");
  const storeUrl = store ? `${window.location.origin}/store/${store.slug}` : "";

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAgent || store) return;

    setStoreError(null);
    const name = storeName.trim();
    const whatsapp = supportWhatsapp.trim();
    const group = groupLink.trim();

    if (name.length < 3) return setStoreError("Store name must be at least 3 characters.");
    if (!/^\+?[0-9\s()-]{9,20}$/.test(whatsapp)) return setStoreError("Enter a valid support WhatsApp number.");
    if (group && !/^https:\/\//i.test(group)) return setStoreError("WhatsApp group link must start with https://");

    const base = slugify(name) || `store-${user.id.slice(0, 6)}`;
    setCreatingStore(true);

    let created: Store = null;
    let errorMessage: string | null = null;
    for (let i = 0; i < 6; i++) {
      const suffix = i === 0 ? "" : `-${Math.floor(100 + Math.random() * 900)}`;
      const slug = `${base}${suffix}`;
      const { data, error } = await supabase
        .from("stores")
        .insert({
          user_id: user.id,
          slug,
          display_name: name,
          whatsapp_number: whatsapp,
          whatsapp_group_link: group || null,
        })
        .select("id,slug,display_name,tagline,whatsapp_number,whatsapp_group_link,theme_color,is_active")
        .single();

      if (!error) {
        created = data as Store;
        break;
      }
      const duplicateSlug = error.code === "23505" && error.message.toLowerCase().includes("slug");
      if (!duplicateSlug) {
        errorMessage = error.message;
        setStoreError(error.message);
        break;
      }
    }

    setCreatingStore(false);
    if (!created) {
      if (!errorMessage) setStoreError("Could not create your store. Please try again.");
      return;
    }

    setStore(created);
    setSettingsName(created.display_name || "");
    setSettingsTagline(created.tagline || "");
    setSettingsWhatsapp(created.whatsapp_number || "");
    setSettingsGroupLink(created.whatsapp_group_link || "");
    setSettingsColor(created.theme_color || "#facc15");
    setSettingsActive(Boolean(created.is_active));

    setStoreName("");
    setSupportWhatsapp("");
    setGroupLink("");
  };

  const copyStoreLink = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 1600);
    } catch {
      setStoreError("Could not copy link. Please copy it manually.");
    }
  };

  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWithdrawErr(null);
    const amount = Number(withdrawAmount);
    if (!isFinite(amount) || amount <= 0) return setWithdrawErr("Enter a valid withdrawal amount.");
    if (amount < minWithdrawal) return setWithdrawErr(`Minimum withdrawal is ${formatGHS(minWithdrawal)}.`);
    if (amount > Number(wallet?.balance || 0)) return setWithdrawErr("Withdrawal amount exceeds wallet balance.");
    if (!/^\d{10,15}$/.test(withdrawMomo.replace(/\D/g, ""))) return setWithdrawErr("Enter a valid MoMo number.");
    if (withdrawAccountName.trim().length < 3) return setWithdrawErr("Enter a valid account name.");

    setWithdrawBusy(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount,
      momo_number: withdrawMomo.trim(),
      network: withdrawNetwork,
      account_name: withdrawAccountName.trim(),
    });
    setWithdrawBusy(false);
    if (error) return setWithdrawErr(error.message);

    const { data } = await supabase
      .from("withdrawal_requests")
      .select("id,amount,momo_number,network,account_name,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setWithdrawals((data as Withdrawal[]) || []);
    setWithdrawAmount("");
    setWithdrawMomo("");
    setWithdrawAccountName("");
  };

  const saveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !user) return;
    setSettingsMsg(null);
    if (settingsName.trim().length < 3) {
      setSettingsMsg("Store name must be at least 3 characters.");
      return;
    }
    if (settingsWhatsapp.trim() && !/^\+?[0-9\s()-]{9,20}$/.test(settingsWhatsapp.trim())) {
      setSettingsMsg("Support WhatsApp number looks invalid.");
      return;
    }
    if (settingsGroupLink.trim() && !/^https:\/\//i.test(settingsGroupLink.trim())) {
      setSettingsMsg("Group link must start with https://");
      return;
    }

    setSettingsBusy(true);
    const { error, data } = await supabase
      .from("stores")
      .update({
        display_name: settingsName.trim(),
        tagline: settingsTagline.trim() || null,
        whatsapp_number: settingsWhatsapp.trim() || null,
        whatsapp_group_link: settingsGroupLink.trim() || null,
        theme_color: settingsColor,
        is_active: settingsActive,
      })
      .eq("id", store.id)
      .select("id,slug,display_name,tagline,whatsapp_number,whatsapp_group_link,theme_color,is_active")
      .single();
    setSettingsBusy(false);
    if (error) return setSettingsMsg(error.message);

    setStore(data as Store);
    setSettingsMsg("Store settings saved.");
  };

  const changeCheckerProfit = (id: string, value: string) => {
    setCheckerPricing((prev) => prev.map((item) => (item.id === id ? { ...item, myProfit: Number(value || 0) } : item)));
  };

  const saveCheckerProfit = async (productId: string) => {
    if (!user) return;
    const item = checkerPricing.find((entry) => entry.id === productId);
    if (!item) return;

    const profit = Number(item.myProfit || 0);
    if (!isFinite(profit) || profit < 0) {
      setPricingMsg("Profit must be zero or greater.");
      return;
    }

    setPricingMsg(null);
    setPricingBusyId(productId);
    const { error } = await supabase.from("store_product_pricing").upsert({
      user_id: user.id,
      product_id: productId,
      profit,
    });
    setPricingBusyId(null);

    if (error) {
      setPricingMsg(error.message);
      return;
    }
    setPricingMsg("Store package profit saved.");
  };

  const formatPackageLabel = (item: CheckerPricingItem) => {
    if (item.type === "checker") return item.name;
    if (!item.data_volume_mb) return item.name;
    const gb = item.data_volume_mb / 1024;
    const volume = Number.isInteger(gb) ? `${gb}GB` : `${gb.toFixed(1)}GB`;
    return `${item.network.toUpperCase()} ${volume}`;
  };

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Hello, {profile?.full_name || "Agent"} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAgent ? "Manage your wallet, store and orders." : "Activate your agent account to start earning."}
          </p>
        </div>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
        <TabButton label="Store Packages" active={tab === "packages"} onClick={() => setTab("packages")} icon={<Package className="h-4 w-4" />} />
        <TabButton label="Store Orders" active={tab === "orders"} onClick={() => setTab("orders")} icon={<PackageSearch className="h-4 w-4" />} />
        <TabButton label="Withdrawal" active={tab === "withdrawal"} onClick={() => setTab("withdrawal")} icon={<WalletIcon className="h-4 w-4" />} />
        <TabButton label="Store Settings" active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings className="h-4 w-4" />} />
      </div>

      {tab === "overview" && (
        <>
          {!isAgent && (
            <Card className="border-gold/40 bg-gradient-to-br from-gold/10 to-transparent">
              <CardContent className="p-6 flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">Activate your agent account</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay the one-time signup fee to unlock your mini-store and agent pricing.
                  </p>
                </div>
                <Button>Pay activation fee</Button>
              </CardContent>
            </Card>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard icon={WalletIcon} label="Wallet balance" value={formatGHS(wallet?.balance || 0)} accent="text-gold" />
            <StatCard icon={ArrowUpRight} label="Total earned" value={formatGHS(wallet?.total_earned || 0)} accent="text-success" />
            <StatCard icon={Users} label="Orders" value={String(orderCount)} accent="text-primary" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold">Recent transactions</h2>
                  <Button size="sm" variant="outline" onClick={() => setTab("withdrawal")}>Withdraw</Button>
                </div>
                {txs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No transactions yet.</p>
                ) : (
                  <div className="divide-y">
                    {txs.map((t) => {
                      const positive = ["topup", "earning", "referral_bonus", "refund"].includes(t.type);
                      return (
                        <div key={t.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <span className={`grid h-9 w-9 place-items-center rounded-full ${positive ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
                              {positive ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </span>
                            <div>
                              <div className="font-medium text-sm capitalize">{t.type.replace(/_/g, " ")}</div>
                              <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className={`font-bold ${positive ? "text-success" : "text-foreground"}`}>
                            {positive ? "+" : "−"}
                            {formatGHS(Math.abs(Number(t.amount)))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <StoreIcon className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold">Your store</h2>
                </div>
                {store ? (
                  <>
                    <p className="text-sm text-muted-foreground">{store.display_name}</p>
                    <div className="mt-2 rounded-lg bg-secondary p-2 text-xs break-all">{storeUrl}</div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/store/${store.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" /> Open
                        </Link>
                      </Button>
                      <Button size="sm" onClick={copyStoreLink}>
                        <Copy className="h-4 w-4" /> {copyDone ? "Copied" : "Copy link"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Create your mini-store with your store name and support WhatsApp details.</p>
                    <form className="mt-4 space-y-3" onSubmit={createStore}>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Store name</label>
                        <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Kings Data Hub" disabled={!isAgent || creatingStore} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Support WhatsApp number</label>
                        <Input value={supportWhatsapp} onChange={(e) => setSupportWhatsapp(e.target.value)} placeholder="e.g. 0241234567" disabled={!isAgent || creatingStore} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold">WhatsApp group link (optional)</label>
                        <Input type="url" value={groupLink} onChange={(e) => setGroupLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." disabled={!isAgent || creatingStore} />
                      </div>
                      {storeError && <p className="text-xs text-destructive">{storeError}</p>}
                      <Button type="submit" size="sm" className="w-full" disabled={!isAgent || creatingStore}>
                        {creatingStore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create store"}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

        </>
      )}

      {tab === "packages" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-bold mb-1">Store Packages</h2>
            <p className="text-sm text-muted-foreground mb-5">Set your profit for each package. Selling price on your store = agent price + your profit.</p>

            {!isAgent ? (
              <p className="text-sm text-muted-foreground">Activate your agent account to manage store package pricing.</p>
            ) : checkerPricing.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active products available yet.</p>
            ) : (
              <div className="space-y-3">
                {checkerPricing.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/70 p-3 flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <div className="font-semibold">{formatPackageLabel(item)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.type === "checker" ? "Checker" : item.network.toUpperCase()} · Base {formatGHS(item.agent_price)} · Selling {formatGHS(item.agent_price + Number(item.myProfit || 0))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-32"
                        value={item.myProfit}
                        onChange={(e) => changeCheckerProfit(item.id, e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => saveCheckerProfit(item.id)}
                        disabled={pricingBusyId === item.id}
                      >
                        {pricingBusyId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pricingMsg && <p className={cn("text-sm mt-3", pricingMsg.toLowerCase().includes("saved") ? "text-success" : "text-destructive")}>{pricingMsg}</p>}
          </CardContent>
        </Card>
      )}

      {tab === "orders" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-bold mb-1">Store Orders</h2>
            <p className="text-sm text-muted-foreground mb-5">Orders placed through your store.</p>
            {!store ? (
              <p className="text-sm text-muted-foreground">Create your store first to start receiving orders.</p>
            ) : storeOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No store orders yet.</p>
            ) : (
              <div className="space-y-2">
                {storeOrders.map((o) => (
                  <div key={o.id} className="rounded-lg border border-border/70 p-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm font-bold">{o.reference}</div>
                      <div className="text-xs text-muted-foreground">
                        {(o.products?.name || "Bundle")} · {o.recipient_phone} · {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold">{formatGHS(o.amount)}</div>
                        <div className="text-xs text-muted-foreground">Profit {formatGHS(Number(o.agent_profit || 0))}</div>
                      </div>
                      <span className={cn("rounded-full px-2 py-1 text-xs font-semibold uppercase", ORDER_STATUS_COLOR[o.status])}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "withdrawal" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold mb-1">Withdrawal</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Minimum withdrawal: {formatGHS(minWithdrawal)} · Current balance: {formatGHS(wallet?.balance || 0)}
              </p>
              <form className="space-y-3" onSubmit={submitWithdrawal}>
                <Input type="number" step="0.01" placeholder="Amount (GHS)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required />
                <Input placeholder="MoMo number" value={withdrawMomo} onChange={(e) => setWithdrawMomo(e.target.value)} required />
                <select className="h-11 rounded-xl border border-input bg-background px-3 text-sm w-full" value={withdrawNetwork} onChange={(e) => setWithdrawNetwork(e.target.value)}>
                  <option value="mtn">MTN</option>
                  <option value="telecel">Telecel</option>
                  <option value="airteltigo">AirtelTigo</option>
                </select>
                <Input placeholder="Account name" value={withdrawAccountName} onChange={(e) => setWithdrawAccountName(e.target.value)} required />
                {withdrawErr && <p className="text-sm text-destructive">{withdrawErr}</p>}
                <Button type="submit" disabled={withdrawBusy} className="w-full">
                  {withdrawBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request withdrawal"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-bold mb-3">Recent withdrawal requests</h3>
              {withdrawals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="rounded-lg border border-border/70 p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{formatGHS(w.amount)}</div>
                        <div className="text-xs text-muted-foreground">{w.network.toUpperCase()} · {w.momo_number} · {new Date(w.created_at).toLocaleString()}</div>
                      </div>
                      <span className={cn("rounded-full px-2 py-1 text-xs font-semibold uppercase", WITHDRAW_STATUS_COLOR[w.status])}>{w.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "settings" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-bold mb-1">Store Settings</h2>
            <p className="text-sm text-muted-foreground mb-5">Manage your store details and support channels.</p>
            {!store ? (
              <p className="text-sm text-muted-foreground">Create your store in Overview first.</p>
            ) : (
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveStoreSettings}>
                <Input placeholder="Store name" className="sm:col-span-2" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} required />
                <Input placeholder="Tagline" className="sm:col-span-2" value={settingsTagline} onChange={(e) => setSettingsTagline(e.target.value)} />
                <Input placeholder="Support WhatsApp number" value={settingsWhatsapp} onChange={(e) => setSettingsWhatsapp(e.target.value)} />
                <Input type="url" placeholder="WhatsApp group link (optional)" value={settingsGroupLink} onChange={(e) => setSettingsGroupLink(e.target.value)} />
                <Input type="color" value={settingsColor} onChange={(e) => setSettingsColor(e.target.value)} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settingsActive} onChange={(e) => setSettingsActive(e.target.checked)} />
                  Store active
                </label>
                {settingsMsg && <p className={cn("sm:col-span-2 text-sm", settingsMsg.includes("saved") ? "text-success" : "text-destructive")}>{settingsMsg}</p>}
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button type="submit" disabled={settingsBusy}>{settingsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-secondary"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof WalletIcon;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <span className={`grid h-12 w-12 place-items-center rounded-xl bg-secondary ${accent}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="text-xs text-muted-foreground uppercase">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
