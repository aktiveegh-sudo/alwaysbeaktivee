import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("contact-message", {
        body: { name, email, message },
      });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send. Please try again.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
          <p className="mt-2 text-muted-foreground">
            Have a question, suggestion, or need help? We'd love to hear from you.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required maxLength={1000} />
            </div>
            <Button type="submit" className="w-full bg-lime text-lime-foreground hover:bg-lime/90" disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>

          <div className="mt-12 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Other ways to reach us</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[10px] border border-border p-4">
                <p className="text-xs text-muted-foreground">Email</p>
                <a href="mailto:support@aktivee.shop" className="text-sm font-medium text-foreground hover:text-lime transition-colors">
                  support@aktivee.shop
                </a>
              </div>
              <div className="rounded-[10px] border border-border p-4">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-lime transition-colors">
                  Message us on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
