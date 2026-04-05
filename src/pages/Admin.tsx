import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Store,
  Users,
  Package,
  Ban,
  BarChart3,
  Eye,
  MessageCircle,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  UserX,
  Mail,
  Calendar,
} from "lucide-react";

import { Settings } from "lucide-react";

type AdminTab = "overview" | "stores" | "users" | "analytics" | "settings";

const Admin = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stores, setStores] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [stats, setStats] = useState({ stores: 0, users: 0, products: 0, suspended: 0 });
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [storeProducts, setStoreProducts] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "store" | "user"; id: string; name: string } | null>(null);

  // Site settings
  const [siteEmail, setSiteEmail] = useState("support@aktivee.shop");
  const [siteInstagram, setSiteInstagram] = useState("");
  const [siteTwitter, setSiteTwitter] = useState("");
  const [siteTiktok, setSiteTiktok] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

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

        const analyticsResult = await invokeAdmin("get-analytics");
        setAnalytics(analyticsResult.analytics || []);
        setTotalViews(analyticsResult.totalViews || 0);
        setTotalClicks(analyticsResult.totalClicks || 0);

        // Load site settings
        const { data: settingsData } = await supabase.from("site_settings" as any).select("*").maybeSingle();
        if (settingsData) {
          setSiteEmail((settingsData as any).support_email || "support@aktivee.shop");
          setSiteInstagram((settingsData as any).instagram_url || "");
          setSiteTwitter((settingsData as any).twitter_url || "");
          setSiteTiktok((settingsData as any).tiktok_url || "");
        }
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
    try {
      await invokeAdmin("delete-store", { id: storeId });
      toast.success("Store deleted");
      setStores(stores.filter((s) => s.id !== storeId));
      setStats((prev) => ({ ...prev, stores: prev.stores - 1 }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await invokeAdmin("delete-user", { user_id: userId });
      toast.success("User account deleted");
      setProfiles(profiles.filter((p) => p.id !== userId));
      setStores(stores.filter((s) => s.user_id !== userId));
      setStats((prev) => ({ ...prev, users: prev.users - 1 }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "store") {
      await deleteStore(deleteConfirm.id);
    } else {
      await deleteUser(deleteConfirm.id);
    }
    setDeleteConfirm(null);
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
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <ShieldCheck className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground">You don't have admin privileges.</p>
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

  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "stores", label: "Stores", icon: Store },
    { key: "users", label: "Users", icon: Users },
    { key: "analytics", label: "Analytics", icon: Eye },
    { key: "settings", label: "Site Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-foreground" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-8">
              {/* Stats grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Stores", value: stats.stores, icon: Store, color: "text-foreground" },
                  { label: "Total Users", value: stats.users, icon: Users, color: "text-foreground" },
                  { label: "Total Products", value: stats.products, icon: Package, color: "text-foreground" },
                  { label: "Suspended", value: stats.suspended, icon: Ban, color: "text-destructive" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">{s.value}</p>
                          <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                        </div>
                        <s.icon className={`h-8 w-8 ${s.color} opacity-20`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Platform analytics summary */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Store Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total WhatsApp Clicks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent stores */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Stores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stores.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {s.logo_url ? (
                            <img src={s.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {s.name[0]}
                            </div>
                          )}
                          <span className="font-medium">{s.name}</span>
                          <span className="text-muted-foreground">/{s.slug}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.is_suspended ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        }`}>
                          {s.is_suspended ? "Suspended" : "Active"}
                        </span>
                      </div>
                    ))}
                    {stores.length === 0 && (
                      <p className="text-sm text-muted-foreground">No stores yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent users */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profiles.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {(p.email || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{p.email || "No email"}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STORES TAB */}
          {tab === "stores" && (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">{filteredStores.length} store{filteredStores.length !== 1 ? "s" : ""}</p>
              <div className="space-y-3">
                {filteredStores.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {s.logo_url ? (
                            <img src={s.logo_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                              {s.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{s.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                s.is_suspended ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                              }`}>
                                {s.is_suspended ? "Suspended" : "Active"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              /{s.slug} · {s.whatsapp_number} · {new Date(s.created_at).toLocaleDateString()}
                            </p>
                            {s.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" /> {s.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-2">
                          <Button size="sm" variant="outline" onClick={() => loadStoreProducts(s.id)}>
                            {expandedStore === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="ml-1 hidden sm:inline">Products</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleSuspend(s.id, s.is_suspended)}>
                            <Ban className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">{s.is_suspended ? "Activate" : "Suspend"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteConfirm({ type: "store", id: s.id, name: s.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {expandedStore === s.id && storeProducts[s.id] && (
                        <div className="border-t border-border px-4 py-3 bg-muted/30">
                          {storeProducts[s.id].length === 0 ? (
                            <p className="text-xs text-muted-foreground">No products</p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {storeProducts[s.id].map((p: any) => (
                                <div key={p.id} className="flex items-center gap-3 text-sm rounded-lg border border-border p-2">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover" />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                      <Package className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {p.request_price ? "Request Price" : formatPrice(p.price)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {filteredStores.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No stores found.</p>
                )}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</p>
              <div className="space-y-3">
                {filteredUsers.map((p) => {
                  const userStores = stores.filter((s) => s.user_id === p.id);
                  const isExpanded = expandedUser === p.id;
                  const isSelf = p.id === user?.id;

                  return (
                    <Card key={p.id}>
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                              {(p.email || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{p.email || "No email"}</p>
                                {isSelf && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">You</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(p.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Store className="h-3 w-3" />
                                  {userStores.length} store{userStores.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-2">
                            {userStores.length > 0 && (
                              <Button size="sm" variant="outline" onClick={() => setExpandedUser(isExpanded ? null : p.id)}>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span className="ml-1 hidden sm:inline">Stores</span>
                              </Button>
                            )}
                            {!isSelf && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteConfirm({ type: "user", id: p.id, name: p.email || "this user" })}
                              >
                                <UserX className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">Delete</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        {isExpanded && userStores.length > 0 && (
                          <div className="border-t border-border px-4 py-3 bg-muted/30">
                            <div className="space-y-2">
                              {userStores.map((s) => (
                                <div key={s.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    {s.logo_url ? (
                                      <img src={s.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-background flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
                                        {s.name[0]}
                                      </div>
                                    )}
                                    <span className="font-medium">{s.name}</span>
                                    <span className="text-muted-foreground">/{s.slug}</span>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    s.is_suspended ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                  }`}>
                                    {s.is_suspended ? "Suspended" : "Active"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {tab === "analytics" && (
            <div className="space-y-6">
              {/* Totals */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Page Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{totalClicks.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total WhatsApp Clicks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Per-store breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Store Analytics Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No analytics data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.map((a: any) => {
                        const storeName = a.stores?.name || "Unknown Store";
                        const storeSlug = a.stores?.slug || "";
                        return (
                          <div key={a.id} className="flex items-center justify-between text-sm border-b border-border pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                {storeName[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{storeName}</p>
                                <p className="text-xs text-muted-foreground">/{storeSlug}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-right">
                                <p className="font-semibold">{(a.store_views || 0).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Views</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{(a.whatsapp_clicks || 0).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">WA Clicks</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {a.store_views > 0 ? ((a.whatsapp_clicks / a.store_views) * 100).toFixed(1) : "0"}%
                                </p>
                                <p className="text-xs text-muted-foreground">Conv.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Site Settings Tab */}
      {tab === "settings" && (
        <div className="mt-8 max-w-md space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Main Website Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your social links and contact email shown in the footer.</p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingSettings(true);
              // Upsert site settings
              const payload = {
                singleton: true,
                support_email: siteEmail,
                instagram_url: siteInstagram || null,
                twitter_url: siteTwitter || null,
                tiktok_url: siteTiktok || null,
              };
              const { data: existing } = await supabase.from("site_settings" as any).select("id").maybeSingle();
              if (existing) {
                await supabase.from("site_settings" as any).update(payload).eq("id", (existing as any).id);
              } else {
                await supabase.from("site_settings" as any).insert(payload);
              }
              setSavingSettings(false);
              toast.success("Site settings saved!");
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="site-email">Support Email</Label>
              <Input
                id="site-email"
                type="email"
                value={siteEmail}
                onChange={(e) => setSiteEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="site-instagram">Instagram URL</Label>
              <Input
                id="site-instagram"
                value={siteInstagram}
                onChange={(e) => setSiteInstagram(e.target.value)}
                placeholder="https://instagram.com/aktivee"
              />
            </div>
            <div>
              <Label htmlFor="site-twitter">Twitter / X URL</Label>
              <Input
                id="site-twitter"
                value={siteTwitter}
                onChange={(e) => setSiteTwitter(e.target.value)}
                placeholder="https://x.com/aktivee"
              />
            </div>
            <div>
              <Label htmlFor="site-tiktok">TikTok URL</Label>
              <Input
                id="site-tiktok"
                value={siteTiktok}
                onChange={(e) => setSiteTiktok(e.target.value)}
                placeholder="https://tiktok.com/@aktivee"
              />
            </div>
            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </div>
      )}

      <Footer />
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteConfirm?.type === "user" ? "User Account" : "Store"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "user"
                ? `This will permanently delete ${deleteConfirm?.name}'s account, all their stores, and products. This action cannot be undone.`
                : `This will permanently delete "${deleteConfirm?.name}" and all its products. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
