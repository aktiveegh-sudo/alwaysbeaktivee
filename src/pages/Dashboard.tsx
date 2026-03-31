import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import StoreStatus from "@/components/StoreStatus";
import { generateSlug } from "@/lib/store-utils";
import { toast } from "sonner";

type Tab = "overview" | "products" | "settings" | "share";

const Dashboard = () => {
  const { user, session } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Product form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pRequestPrice, setPRequestPrice] = useState(false);
  const [pDesc, setPDesc] = useState("");
  const [pImage, setPImage] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Settings form
  const [sName, setSName] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sWhatsapp, setSWhatsapp] = useState("");
  const [sOpen, setSOpen] = useState("09:00");
  const [sClose, setSClose] = useState("17:00");
  const [sEmail, setSEmail] = useState("");
  const [sLocation, setSLocation] = useState("");
  const [sInstagram, setSInstagram] = useState("");
  const [sTwitter, setSTwitter] = useState("");
  const [sTiktok, setSTiktok] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (storeData) {
      setStore(storeData);
      setSName(storeData.name || "");
      setSDesc(storeData.description || "");
      setSWhatsapp(storeData.whatsapp_number || "");
      setSOpen(storeData.business_hours_open || "09:00");
      setSClose(storeData.business_hours_close || "17:00");
      setSEmail(storeData.email || "");
      setSLocation(storeData.location || "");
      setSInstagram(storeData.instagram || "");
      setSTwitter(storeData.twitter || "");
      setSTiktok(storeData.tiktok || "");

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });
      setProducts(productsData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error("Image upload failed");
      return null;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !session) return;
    setSaving(true);

    let imageUrl: string | null = null;
    if (pImage) {
      imageUrl = await uploadImage(pImage);
    }

    const productData: any = {
      store_id: store.id,
      name: pName,
      price: pRequestPrice ? null : parseFloat(pPrice) || null,
      request_price: pRequestPrice,
      description: pDesc,
      slug: generateSlug(pName),
    };
    if (imageUrl) productData.image_url = imageUrl;

    const action = editingProduct ? "update" : "create";
    if (editingProduct) productData.id = editingProduct;

    const { data: result, error } = await supabase.functions.invoke("manage-product", {
      body: { action, data: productData },
    });

    if (error) {
      toast.error(error.message || "Failed to save product");
    } else if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(editingProduct ? "Product updated" : "Product added");
    }

    resetProductForm();
    setSaving(false);
    fetchData();
  };

  const resetProductForm = () => {
    setPName("");
    setPPrice("");
    setPRequestPrice(false);
    setPDesc("");
    setPImage(null);
    setEditingProduct(null);
  };

  const startEdit = (p: any) => {
    setPName(p.name);
    setPPrice(p.price?.toString() || "");
    setPRequestPrice(p.request_price);
    setPDesc(p.description || "");
    setEditingProduct(p.id);
  };

  const handleDeleteProduct = async (id: string) => {
    const { data: result, error } = await supabase.functions.invoke("manage-product", {
      body: { action: "delete", data: { id } },
    });
    if (error || result?.error) {
      toast.error(result?.error || error?.message || "Delete failed");
    } else {
      toast.success("Product deleted");
      fetchData();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !session) return;
    setSaving(true);

    const { data: result, error } = await supabase.functions.invoke("manage-store", {
      body: {
        action: "update",
        data: {
          id: store.id,
          name: sName,
          description: sDesc,
          whatsapp_number: sWhatsapp,
          business_hours_open: sOpen,
          business_hours_close: sClose,
          email: sEmail || null,
          location: sLocation || null,
          instagram: sInstagram || null,
          twitter: sTwitter || null,
          tiktok: sTiktok || null,
        },
      },
    });

    setSaving(false);
    if (error || result?.error) {
      toast.error(result?.error || error?.message || "Save failed");
    } else {
      toast.success("Settings saved");
      fetchData();
    }
  };

  const storeUrl = store ? `${window.location.origin}/${store.slug}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Link copied!");
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

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">You don't have a store yet.</p>
          <Button onClick={() => navigate("/start")}>Create your store</Button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "products", label: "Products" },
    { key: "settings", label: "Settings" },
    { key: "share", label: "Share" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

        <div className="mt-6 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
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
              <div className="rounded-[10px] border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{store.name}</h2>
                    <StoreStatus openTime={store.business_hours_open} closeTime={store.business_hours_close} />
                  </div>
                  <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">View Store</Button>
                  </a>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {products.length} product{products.length !== 1 ? "s" : ""} listed
                </p>
              </div>
              <div className="rounded-[10px] border border-border p-6">
                <p className="text-sm text-muted-foreground">Your store link</p>
                <p className="mt-1 text-sm font-medium text-foreground break-all">{storeUrl}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyLink}>Copy link</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: store.name, url: storeUrl });
                    } else {
                      copyLink();
                    }
                  }}>Share</Button>
                </div>
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="space-y-6">
              <form onSubmit={handleSaveProduct} className="rounded-[10px] border border-border p-6 space-y-4">
                <h2 className="font-semibold text-foreground">
                  {editingProduct ? "Edit product" : "Add product"}
                </h2>
                <div>
                  <Label>Name</Label>
                  <Input value={pName} onChange={(e) => setPName(e.target.value)} required maxLength={200} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={pRequestPrice} onCheckedChange={setPRequestPrice} />
                  <Label>Request price (hide price)</Label>
                </div>
                {!pRequestPrice && (
                  <div>
                    <Label>Price (₵)</Label>
                    <Input type="number" step="0.01" min="0" max="999999" value={pPrice} onChange={(e) => setPPrice(e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Description</Label>
                  <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3} maxLength={1000} />
                </div>
                <div>
                  <Label>Image</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setPImage(e.target.files?.[0] || null)} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingProduct ? "Update" : "Add Product"}
                  </Button>
                  {editingProduct && (
                    <Button type="button" variant="outline" onClick={resetProductForm}>Cancel</Button>
                  )}
                </div>
              </form>

              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products yet. Add your first product above.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-[10px] border border-border p-4">
                      <div className="flex items-center gap-3">
                        {p.image_url && (
                          <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.request_price ? "Request Price" : formatPrice(p.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(p.id)} className="text-destructive">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "settings" && (
            <form onSubmit={handleSaveSettings} className="max-w-md space-y-4">
              <div>
                <Label>Store name</Label>
                <Input value={sName} onChange={(e) => setSName(e.target.value)} required maxLength={100} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={sDesc} onChange={(e) => setSDesc(e.target.value)} rows={3} maxLength={500} />
              </div>
              <div>
                <Label>WhatsApp number</Label>
                <Input value={sWhatsapp} onChange={(e) => setSWhatsapp(e.target.value)} required maxLength={20} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Opens at</Label>
                  <Input type="time" value={sOpen} onChange={(e) => setSOpen(e.target.value)} />
                </div>
                <div>
                  <Label>Closes at</Label>
                  <Input type="time" value={sClose} onChange={(e) => setSClose(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} maxLength={255} />
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input value={sLocation} onChange={(e) => setSLocation(e.target.value)} maxLength={255} />
              </div>
              <div>
                <Label>Instagram (optional)</Label>
                <Input value={sInstagram} onChange={(e) => setSInstagram(e.target.value)} placeholder="@handle" maxLength={100} />
              </div>
              <div>
                <Label>Twitter / X (optional)</Label>
                <Input value={sTwitter} onChange={(e) => setSTwitter(e.target.value)} placeholder="@handle" maxLength={100} />
              </div>
              <div>
                <Label>TikTok (optional)</Label>
                <Input value={sTiktok} onChange={(e) => setSTiktok(e.target.value)} placeholder="@handle" maxLength={100} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          )}

          {tab === "share" && (
            <div className="max-w-md space-y-4">
              <div className="rounded-[10px] border border-border p-6">
                <p className="text-sm text-muted-foreground">Your store link</p>
                <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground break-all">
                  {storeUrl}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={copyLink}>Copy link</Button>
                  <Button variant="outline" onClick={() => window.open(storeUrl, "_blank")}>Open store</Button>
                  <Button variant="outline" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: store.name, url: storeUrl });
                    } else {
                      copyLink();
                    }
                  }}>Share</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
