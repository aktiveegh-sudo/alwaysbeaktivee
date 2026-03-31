import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const included = [
  "Unlimited products",
  "Custom store link",
  "WhatsApp ordering",
  "Product pages with images",
  "Business hours & active status",
  "Contact page",
  "Social media links",
  "Mobile-optimized store",
  "Multi-currency display",
  "Store dashboard",
  "Image uploads",
  "Share & copy link tools",
];

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-bold text-foreground">Pricing</h1>
        <p className="mt-3 text-muted-foreground">Simple. Free. Forever.</p>

        <div className="mt-10 rounded-[10px] border-2 border-lime p-8">
          <p className="text-xs font-medium text-lime uppercase tracking-wide">Free Plan</p>
          <div className="mt-3 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-foreground">₵0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">No credit card required. No hidden fees.</p>

          <div className="mt-8 text-left">
            <p className="text-sm font-medium text-foreground mb-3">Everything included:</p>
            <ul className="space-y-2">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-lime">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Link to="/start" className="mt-8 block">
            <Button className="w-full bg-lime text-lime-foreground hover:bg-lime/90" size="lg">
              Get started for free
            </Button>
          </Link>
        </div>

        <div className="mt-8 rounded-[10px] border border-border p-6">
          <h2 className="font-semibold text-foreground">Why is it free?</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We believe every business deserves an online presence, regardless of budget. Aktivee is built to empower African entrepreneurs and small businesses. Premium features may be added in the future, but the core platform will always remain free.
          </p>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Pricing;
