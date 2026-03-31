import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

type AdminTab = "overview" | "stores" | "users" | "products";

const Admin = () => {
  const { user, session } = useAuth();
  const { formatPrice } = useCurrency();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stores, setStores] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ stores: 0, users: 0, products: 0, suspended: 0 });
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [storeProducts, setStoreProducts] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const invokeAdmin = async (action: string, data: any = {}) => {
    const { data: result, error } = await supabase.functions.invoke("admin-actions", {
      body: { action, data },
    });
    if (error) throw error;
    if (result?.error) throw new Error(result.error);
    return result;
  };

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }

      try {
        const statsResult = await invokeAdmin("get-stats");
        setStats(statsResult.stats);
        setIsAdmin(true);

        const storesResult = await invokeAdmin("get-stores");
        setStores(storesResult.stores || []);

        const usersResult = await invokeAdmin("get-users");
        setProfiles(usersResult.profiles || []);
      } catch {
        setIsAdmin(false);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleSuspend = async (storeId: string, currentStatus: boolean) => {
    try {
      await invokeAdmin("suspend-store", { id: storeId, is_suspended: !currentStatus });
      toast.success(currentStatus ? "Store activated" : "Store suspended");
      setStores(stores.map((s) => (s.id === storeId ? { ...s, is_suspended: !currentStatus } : s)));
      setStats((prev) => ({
        ...prev,
        suspended: currentStatus ? prev.suspended - 1 : prev.suspended + 1,
      }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!confirm("Delete this store and all its products? This cannot be undone.")) return;
    try {
      await invokeAdmin("delete-store", { id: storeId });
      toast.success("Store deleted");
      setStores(stores.filter((s) => s.id !== storeId));
      setStats((prev) => ({ ...prev, stores: prev.stores - 1 }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadStoreProducts = async (storeId: string) => {
    if (expandedStore === storeId) {
      setExpandedStore(null);
      return;
    }
    try {
      const result = await invokeAdmin("get-store-products", { store_id: storeId });
      setStoreProducts((prev) => ({ ...prev, [storeId]: result.products || [] }));
      setExpandedStore(storeId);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">Access denied</p>
        </div>
      </div>
    );
  }

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = profiles.filter(
    (p) =>
      (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.includes(searchTerm)
  );

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "stores", label: "Stores" },
    { key: "users", label: "Users" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

        <div className="mt-6 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearchTerm(""); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[10px] border border-border p-5">
                  <p className="text-3xl font-bold text-foreground">{stats.stores}</p>
                  <p className="text-sm text-muted-foreground">Total Stores</p>
                </div>
                <div className="rounded-[10px] border border-border p-5">
                  <p className="text-3xl font-bold text-foreground">{stats.users}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="rounded-[10px] border border-border p-5">
                  <p className="text-3xl font-bold text-foreground">{stats.products}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
                <div className="rounded-[10px] border border-border p-5">
                  <p className="text-3xl font-bold text-foreground">{stats.suspended}</p>
                  <p className="text-sm text-muted-foreground">Suspended Stores</p>
                </div>
              </div>

              <div className="rounded-[10px] border border-border p-5">
                <h2 className="font-semibold text-foreground">Recent Stores</h2>
                <div className="mt-3 space-y-2">
                  {stores.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-foreground">{s.name}</span>
                        <span className="ml-2 text-muted-foreground">/{s.slug}</span>
                      </div>
                      <span className={`text-xs ${s.is_suspended ? "text-destructive" : "text-success"}`}>
                        {s.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "stores" && (
            <div className="space-y-4">
              <Input
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="space-y-3">
                {filteredStores.map((s) => (
                  <div key={s.id} className="rounded-[10px] border border-border">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{s.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            s.is_suspended ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                          }`}>
                            {s.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          /{s.slug} · {s.whatsapp_number} · Created {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => loadStoreProducts(s.id)}>
                          {expandedStore === s.id ? "Hide" : "Products"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleSuspend(s.id, s.is_suspended)}>
                          {s.is_suspended ? "Activate" : "Suspend"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteStore(s.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    {expandedStore === s.id && storeProducts[s.id] && (
                      <div className="border-t border-border px-4 py-3 bg-muted/30">
                        {storeProducts[s.id].length === 0 ? (
                          <p className="text-xs text-muted-foreground">No products</p>
                        ) : (
                          <div className="space-y-2">
                            {storeProducts[s.id].map((p: any) => (
                              <div key={p.id} className="flex items-center gap-3 text-sm">
                                {p.image_url && (
                                  <img src={p.image_url} alt={p.name} className="h-8 w-8 rounded object-cover" />
                                )}
                                <span className="font-medium text-foreground">{p.name}</span>
                                <span className="text-muted-foreground">
                                  {p.request_price ? "Request Price" : formatPrice(p.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {filteredStores.length === 0 && (
                  <p className="text-sm text-muted-foreground">No stores found.</p>
                )}
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="space-y-3">
                {filteredUsers.map((p) => {
                  const userStores = stores.filter((s) => s.user_id === p.id);
                  return (
                    <div key={p.id} className="rounded-[10px] border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.email || "No email"}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(p.created_at).toLocaleDateString()} · {userStores.length} store{userStores.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {userStores.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {userStores.map((s) => (
                            <span key={s.id} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
