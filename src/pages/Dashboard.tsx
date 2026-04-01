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
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Product form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pRequestPrice, setPRequestPrice] = useState(false);
  const [pDesc, setPDesc] = useState("");
  const [pImages, setPImages] = useState<FileList | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Settings form
  const [sName, setSName] = useState("");
  const [sSlug, setSSlug] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sWhatsapp, setSWhatsapp] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sOpen, setSOpen] = useState("09:00");
  const [sClose, setSClose] = useState("17:00");
  const [sEmail, setSEmail] = useState("");
  const [sLocation, setSLocation] = useState("");
  const [sInstagram, setSInstagram] = useState("");
  const [sTwitter, setSTwitter] = useState("");
  const [sTiktok, setSTiktok] = useState("");
  const [sGreeting, setSGreeting] = useState("");
  const [sLogo, setSLogo] = useState<File | null>(null);

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
      setSSlug(storeData.slug || "");
      setSDesc(storeData.description || "");
      setSWhatsapp(storeData.whatsapp_number || "");
      setSPhone((storeData as any).phone_number || "");
      setSOpen(storeData.business_hours_open || "09:00");
      setSClose(storeData.business_hours_close || "17:00");
      setSEmail(storeData.email || "");
      setSLocation(storeData.location || "");
      setSInstagram(storeData.instagram || "");
      setSTwitter(storeData.twitter || "");
      setSTiktok(storeData.tiktok || "");
      setSGreeting((storeData as any).custom_greeting || "");

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });
      setProducts(productsData || []);

      const { data: analyticsData } = await supabase
        .from("store_analytics" as any)
        .select("*")
        .eq("store_id", storeData.id)
        .maybeSingle();
      setAnalytics(analyticsData);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !session) return;
    setSaving(true);

    let imageUrl: string | null = null;
    if (pImages && pImages.length > 0) {
      // Upload first image (primary)
      imageUrl = await uploadImage(pImages[0]);
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
    setPName(""); setPPrice(""); setPRequestPrice(false); setPDesc(""); setPImages(null); setEditingProduct(null);
    // Reset file input
    const fileInput = document.getElementById("product-images") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const startEdit = (p: any) => {
    setPName(p.name);
    setPPrice(p.price?.toString() || "");
    setPRequestPrice(p.request_price);
    setPDesc(p.description || "");
    setEditingProduct(p.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setDeleteConfirm(null);
  };

  const handleDuplicate = async (p: any) => {
    if (!store || !session) return;
    const productData = {
      store_id: store.id,
      name: `${p.name} (copy)`,
      price: p.price,
      request_price: p.request_price,
      description: p.description || "",
      slug: generateSlug(`${p.name} copy`),
      image_url: p.image_url || undefined,
    };
    const { data: result, error } = await supabase.functions.invoke("manage-product", {
      body: { action: "create", data: productData },
    });
    if (error || result?.error) {
      toast.error("Duplicate failed");
    } else {
      toast.success("Product duplicated");
      fetchData();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !session) return;
    setSaving(true);

    let logoUrl = (store as any).logo_url;
    if (sLogo) {
      logoUrl = await uploadImage(sLogo);
    }

    // Validate slug
    const cleanSlug = sSlug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 100);

    const { data: result, error } = await supabase.functions.invoke("manage-store", {
      body: {
        action: "update",
        data: {
          id: store.id,
          name: sName,
          slug: cleanSlug,
          description: sDesc,
          whatsapp_number: sWhatsapp,
          phone_number: sPhone || null,
          business_hours_open: sOpen,
          business_hours_close: sClose,
          email: sEmail || null,
          location: sLocation || null,
          instagram: sInstagram || null,
          twitter: sTwitter || null,
          tiktok: sTiktok || null,
          custom_greeting: sGreeting || null,
          logo_url: logoUrl || null,
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
  const copyLink = () => { navigator.clipboard.writeText(storeUrl); toast.success("Link copied!"); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24"><p className="text-muted-foreground">Loading...</p></div>
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
        {/* Welcome header */}
        <div className="flex items-center gap-4 mb-2">
          {(store as any).logo_url && (
            <img src={(store as any).logo_url} alt={store.name} className="h-12 w-12 rounded-full object-cover border border-border" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back 👋
            </h1>
            <p className="text-sm text-muted-foreground">Here's how <span className="text-foreground font-medium">{store.name}</span> is doing</p>
          </div>
        </div>

        <div className="mt-6 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-[10px] border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{products.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Products</p>
                </div>
                <div className="rounded-[10px] border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{analytics?.store_views || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Store Views</p>
                </div>
                <div className="rounded-[10px] border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{analytics?.whatsapp_clicks || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">WhatsApp Clicks</p>
                </div>
                <div className="rounded-[10px] border border-border p-4 text-center">
                  <StoreStatus openTime={store.business_hours_open} closeTime={store.business_hours_close} />
                  <p className="text-xs text-muted-foreground mt-1">Status</p>
                </div>
              </div>

              <div className="rounded-[10px] border border-border p-6">
                <p className="text-sm text-muted-foreground">Your store link</p>
                <p className="mt-1 text-sm font-medium text-foreground break-all">{storeUrl}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyLink}>Copy link</Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/${store.slug}`, "_blank")}>View Store</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (navigator.share) navigator.share({ title: store.name, url: storeUrl });
                    else copyLink();
                  }}>Share</Button>
                </div>
              </div>

              {products.length === 0 && (
                <div className="rounded-[10px] border border-lime/30 bg-lime-light p-6 text-center">
                  <p className="text-foreground font-medium">Add your first product to get started!</p>
                  <Button size="sm" className="mt-3" onClick={() => setTab("products")}>
                    Add Product
                  </Button>
                </div>
              )}
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
                  <Label>Images</Label>
                  <Input
                    id="product-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPImages(e.target.files)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">First image will be used as the product photo</p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving} className={editingProduct ? "bg-lime text-lime-foreground hover:bg-lime/90" : ""}>
                    {saving ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
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
                        <Button size="sm" variant="outline" onClick={() => handleDuplicate(p)}>Duplicate</Button>
                        <Button
                          size="sm"
                          variant={editingProduct === p.id ? "default" : "outline"}
                          onClick={() => startEdit(p)}
                          className={editingProduct === p.id ? "opacity-50" : ""}
                        >
                          Edit
                        </Button>
                        {deleteConfirm === p.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(p.id)}>Confirm</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>No</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(p.id)} className="text-destructive">Delete</Button>
                        )}
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
                <Label>Store logo</Label>
                <Input type="file" accept="image/*" onChange={(e) => setSLogo(e.target.files?.[0] || null)} />
                {(store as any).logo_url && (
                  <img src={(store as any).logo_url} alt="Logo" className="mt-2 h-16 w-16 rounded-full object-cover border border-border" />
                )}
              </div>
              <div>
                <Label>Store name</Label>
                <Input value={sName} onChange={(e) => setSName(e.target.value)} required maxLength={100} />
              </div>
              <div>
                <Label>Store URL slug</Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">aktivee.shop/</span>
                  <Input value={sSlug} onChange={(e) => setSSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required maxLength={100} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={sDesc} onChange={(e) => setSDesc(e.target.value)} rows={3} maxLength={500} />
              </div>
              <div>
                <Label>WhatsApp number</Label>
                <Input value={sWhatsapp} onChange={(e) => setSWhatsapp(e.target.value)} required maxLength={20} />
              </div>
              <div>
                <Label>Call number</Label>
                <Input value={sPhone} onChange={(e) => setSPhone(e.target.value)} maxLength={20} placeholder="+233XXXXXXXXX" />
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
                <Label>Custom WhatsApp greeting (optional)</Label>
                <Input value={sGreeting} onChange={(e) => setSGreeting(e.target.value)} placeholder="Hi 👋, thanks for reaching out to My Store" maxLength={200} />
                <p className="text-xs text-muted-foreground mt-1">Shown at the start of every WhatsApp order message</p>
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
                  <Button variant="outline" onClick={() => window.open(`/${store.slug}`, "_blank")}>Open store</Button>
                  <Button variant="outline" onClick={() => {
                    if (navigator.share) navigator.share({ title: store.name, url: storeUrl });
                    else copyLink();
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
