import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatGHS } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Loader2, Store as StoreIcon, Users, Wallet as WalletIcon, Plus } from "lucide-react";

type Wallet = { balance: number; total_earned: number };
type Tx = { id: string; amount: number; type: string; description: string | null; created_at: string };
type Profile = { full_name: string | null };
type Store = { slug: string; display_name: string } | null;

export default function Dashboard() {
  const { user, roles, signOut } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [store, setStore] = useState<Store>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [w, t, p, s, o] = await Promise.all([
        supabase.from("wallets").select("balance,total_earned").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("stores").select("slug,display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_owner_id", user.id),
      ]);
      setWallet((w.data as Wallet) || { balance: 0, total_earned: 0 });
      setTxs((t.data as Tx[]) || []);
      setProfile(p.data as Profile);
      setStore(s.data as Store);
      setOrderCount(o.count || 0);
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

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Hello, {profile?.full_name || "Agent"} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAgent ? "Manage your wallet, store and orders." : "Activate your agent account to start earning."}
          </p>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>

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
        <StatCard
          icon={WalletIcon}
          label="Wallet balance"
          value={formatGHS(wallet?.balance || 0)}
          accent="text-gold"
        />
        <StatCard
          icon={ArrowUpRight}
          label="Total earned"
          value={formatGHS(wallet?.total_earned || 0)}
          accent="text-success"
        />
        <StatCard icon={Users} label="Orders" value={String(orderCount)} accent="text-primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Recent transactions</h2>
              <Button size="sm" variant="outline">
                Withdraw
              </Button>
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
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-full ${
                            positive ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                          }`}
                        >
                          {positive ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </span>
                        <div>
                          <div className="font-medium text-sm capitalize">{t.type.replace(/_/g, " ")}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleString()}
                          </div>
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
                <code className="block mt-2 text-xs bg-secondary rounded p-2 break-all">
                  /store/{store.slug}
                </code>
                <Button asChild size="sm" className="w-full mt-4" variant="outline">
                  <Link to={`/store/${store.slug}`}>View store</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Create your mini-store to start selling.</p>
                <Button size="sm" className="w-full mt-4" disabled={!isAgent}>
                  <Plus className="h-4 w-4" /> Create store
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
