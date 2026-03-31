import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const channels = [
  { icon: "📸", name: "Instagram Bio", desc: "Add your Aktivee link to your Instagram bio. Every profile visitor becomes a potential customer." },
  { icon: "🎵", name: "TikTok Shop", desc: "Link your store in your TikTok bio or mention it in videos. Convert viewers into buyers." },
  { icon: "💬", name: "WhatsApp Status", desc: "Share your store link on your WhatsApp status. Your contacts see it instantly." },
  { icon: "👍", name: "Facebook Page", desc: "Add your store link to your Facebook business page or share it in posts and groups." },
  { icon: "✉️", name: "Direct Messages", desc: "Send your store link directly to interested customers in any messaging app." },
  { icon: "📱", name: "QR Codes", desc: "Generate a QR code for your store link. Print it on flyers, business cards, or packaging." },
  { icon: "🐦", name: "Twitter / X", desc: "Pin your store link in your Twitter bio or tweet about new products." },
  { icon: "📧", name: "Email Signature", desc: "Add your store link to your email signature. Every email becomes a marketing opportunity." },
];

const UseYourStore = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground text-center">Use Your Store Anywhere</h1>
        <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
          One link that works everywhere your customers are. No app downloads, no complicated setups.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {channels.map((c) => (
            <div key={c.name} className="group flex gap-4 rounded-[10px] border border-border p-5 transition-all duration-200 hover:border-lime/40 hover:shadow-sm">
              <span className="text-3xl shrink-0">{c.icon}</span>
              <div>
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[10px] border border-border p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Get your link now</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create your store in under a minute. It's free.</p>
          <Link to="/start" className="mt-4 inline-block">
            <Button className="bg-lime text-lime-foreground hover:bg-lime/90">Create your store</Button>
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default UseYourStore;
