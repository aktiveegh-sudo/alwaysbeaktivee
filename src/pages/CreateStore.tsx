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

const CreateStore = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in first");
      navigate("/signup");
      return;
    }

    setLoading(true);
    const slug = generateSlug(name);

    const { error } = await supabase.from("stores").insert({
      user_id: user.id,
      name,
      slug,
      description,
      whatsapp_number: whatsapp,
      business_hours_open: openTime,
      business_hours_close: closeTime,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("A store with this name already exists. Try a different name.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Store created!");
      navigate("/dashboard");
    }
  };

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
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Bakery" required />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp number (with country code)</Label>
              <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1234567890" required />
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
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="We sell fresh baked goods..." rows={3} />
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
