import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (data) {
        setIsAdmin(true);
        const { data: storesData } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
        setStores(storesData || []);
        const { data: profilesData } = await supabase.from("profiles").select("*");
        setProfiles(profilesData || []);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const toggleSuspend = async (storeId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("stores").update({ is_suspended: !currentStatus }).eq("id", storeId);
    if (error) toast.error(error.message);
    else {
      toast.success(currentStatus ? "Store activated" : "Store suspended");
      setStores(stores.map(s => s.id === storeId ? { ...s, is_suspended: !currentStatus } : s));
    }
  };

  const deleteStore = async (storeId: string) => {
    const { error } = await supabase.from("stores").delete().eq("id", storeId);
    if (error) toast.error(error.message);
    else {
      toast.success("Store deleted");
      setStores(stores.filter(s => s.id !== storeId));
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-24"><p className="text-muted-foreground">Loading...</p></div></div>;
  if (!isAdmin) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-24"><p className="text-muted-foreground">Access denied</p></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Admin</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[10px] border border-border p-4">
            <p className="text-2xl font-bold text-foreground">{stores.length}</p>
            <p className="text-sm text-muted-foreground">Total stores</p>
          </div>
          <div className="rounded-[10px] border border-border p-4">
            <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
            <p className="text-sm text-muted-foreground">Total users</p>
          </div>
          <div className="rounded-[10px] border border-border p-4">
            <p className="text-2xl font-bold text-foreground">{stores.filter(s => s.is_suspended).length}</p>
            <p className="text-sm text-muted-foreground">Suspended stores</p>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-semibold text-foreground">All Stores</h2>
        <div className="mt-4 space-y-3">
          {stores.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-[10px] border border-border p-4">
              <div>
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">/{s.slug} · {s.is_suspended ? "Suspended" : "Active"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleSuspend(s.id, s.is_suspended)}>
                  {s.is_suspended ? "Activate" : "Suspend"}
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteStore(s.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-lg font-semibold text-foreground">All Users</h2>
        <div className="mt-4 space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-[10px] border border-border p-4">
              <p className="text-sm font-medium text-foreground">{p.email || p.id}</p>
              <p className="text-xs text-muted-foreground">Joined {new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
