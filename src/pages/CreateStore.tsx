import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { generateSlug } from "@/lib/store-utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const CreateStore = () => {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [description, setDescription] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [storeName, setStoreName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session) {
      toast.error("Please log in first");
      navigate("/signup");
      return;
    }

    setLoading(true);
    const slug = generateSlug(name);

    const { data: result, error } = await supabase.functions.invoke("manage-store", {
      body: {
        action: "create",
        data: {
          name,
          slug,
          description,
          whatsapp_number: whatsapp,
          phone_number: phone || null,
          business_hours_open: openTime,
          business_hours_close: closeTime,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to create store");
    } else if (result?.error) {
      if (result.code === "23505") {
        toast.error("A store with this name already exists. Try a different name.");
      } else {
        toast.error(result.error);
      }
    } else {
      // Create analytics row
      if (result?.store?.id) {
        await supabase.from("store_analytics" as any).insert({ store_id: result.store.id });
      }

      // Confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#1a1a1a", "#ffffff", "#65a30d"],
      });

      setStoreName(name);
      setShowWelcome(true);
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-24">
          <div className="text-center max-w-md animate-fade-in-up">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-foreground">Welcome aboard!</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              <span className="text-foreground font-medium">{storeName}</span> is live! Let's set up your products and start getting orders.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-lime text-lime-foreground hover:bg-lime/90"
              onClick={() => navigate("/dashboard")}
            >
              Go to your dashboard →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-[10px] border border-border p-8">
          <h1 className="text-xl font-bold text-foreground">Create your store</h1>
          <p className="mt-1 text-sm text-muted-foreground">It's free. Takes under a minute.</p>
          {!user && (
            <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              You'll need to <a href="/signup" className="font-medium text-foreground underline">sign up</a> first.
            </p>
          )}
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Store name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Bakery" required maxLength={100} />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp number (with country code)</Label>
              <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+233XXXXXXXXX" required maxLength={20} />
            </div>
            <div>
              <Label htmlFor="phone">Call number (with country code)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233XXXXXXXXX" required maxLength={20} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="open">Opens at</Label>
                <Input id="open" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="close">Closes at</Label>
                <Input id="close" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="desc">Short description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="We sell fresh baked goods..." rows={3} maxLength={500} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !user}>
              {loading ? "Creating..." : "Create Store"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
