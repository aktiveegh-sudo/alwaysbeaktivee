import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  { icon: "💬", title: "WhatsApp Ordering", desc: "Customers order directly via WhatsApp. No complicated checkout flows, no payment gateways. Just a simple conversation." },
  { icon: "🟢", title: "Active Status", desc: "Show customers when you're open for business. Your store automatically displays your business hours and current availability." },
  { icon: "📦", title: "Product Pages", desc: "Each product gets its own clean, shareable page with image, description, and price. Perfect for sharing individual items." },
  { icon: "🔗", title: "Shareable Store Link", desc: "Get a unique link like aktivee.shop/yourstore. Share it anywhere — Instagram, TikTok, WhatsApp status, business cards." },
  { icon: "📱", title: "Mobile First", desc: "Your store looks beautiful on any device. Most of your customers will visit from their phones, and we've optimized for that." },
  { icon: "⚡", title: "Lightning Fast", desc: "No bloated code, no unnecessary features. Your store loads instantly, even on slow connections." },
  { icon: "🆓", title: "Completely Free", desc: "No monthly fees, no transaction fees, no hidden charges. Aktivee is free to use, forever." },
  { icon: "🎨", title: "Clean Design", desc: "Minimal, professional design that puts your products first. No distracting templates or cluttered layouts." },
  { icon: "💰", title: "Multi-Currency", desc: "Display prices in Ghana Cedis, Nigerian Naira, South African Rand, US Dollars, Euros, and more with live exchange rates." },
  { icon: "📊", title: "Dashboard", desc: "Manage your store, products, and settings from a simple dashboard. Everything you need, nothing you don't." },
  { icon: "🔒", title: "Secure", desc: "All data is encrypted and secured. Your store information is protected with enterprise-grade security." },
  { icon: "📍", title: "Contact Page", desc: "Each store gets a contact page with WhatsApp, email, location, and social media links." },
];

const Features = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground text-center">Features</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Everything you need to sell online. Nothing you don't.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-[10px] border border-border p-6 transition-all duration-200 hover:border-lime/40 hover:shadow-sm">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/start">
            <Button className="bg-lime text-lime-foreground hover:bg-lime/90" size="lg">
              Get started for free
            </Button>
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Features;
