import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Wifi, GraduationCap, TrendingUp, Zap, Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";

const products = [
  { icon: Smartphone, name: "MTN Data", desc: "Instant bundles from 100MB to 100GB", color: "bg-gold/15 text-gold" },
  { icon: Wifi, name: "Telecel Data", desc: "Affordable Telecel data packages", color: "bg-primary/15 text-primary" },
  { icon: Smartphone, name: "AirtelTigo Data", desc: "Stay connected, pay less", color: "bg-success/15 text-success" },
  { icon: GraduationCap, name: "Result Checkers", desc: "BECE & WASSCE pins delivered instantly", color: "bg-accent/15 text-accent" },
];

const features = [
  { icon: Zap, title: "Instant Delivery", desc: "Data and pins delivered in seconds." },
  { icon: Shield, title: "Secure Payments", desc: "Mobile money and card payments protected." },
  { icon: Users, title: "Agent Economy", desc: "Sell data, build your store, earn profits." },
  { icon: TrendingUp, title: "Real Profits", desc: "Wallet, withdrawals, leaderboards & rewards." },
];

const testimonials = [
  { name: "Kwame A.", role: "Top Agent — Kumasi", quote: "I made ₵1,200 in my first month. The mini store is fire." },
  { name: "Ama O.", role: "Customer", quote: "Bought MTN data at midnight. Delivered before I locked my phone." },
  { name: "Joseph K.", role: "Sub-agent", quote: "Easy to use, fast withdrawals. Best data platform in Ghana." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(48_100%_52%/0.28),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,hsl(48_100%_45%/0.18),transparent_50%)]" />
        <div className="container relative py-20 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Trusted by 10,000+ Ghanaians
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
              Buy Data Instantly.
              <span className="block text-gold mt-2">Earn as an Agent.</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              Ghana's fastest data and result-checker platform. Buy in seconds, or launch your own mini-store
              and turn data into a daily income.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="xl" className="bg-gradient-gold shadow-glow text-gold-foreground">
                <Link to="/products">Buy Data Now <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button asChild size="xl" variant="gold">
                <Link to="/become-agent">Become an Agent — ₵50</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm text-white/70">
              {["No signup to buy", "Instant delivery", "Refunds on failed orders"].map((t) => (
                <span key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold" /> {t}</span>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl rounded-full" />
            <Card className="relative bg-black/60 backdrop-blur border-white/10 text-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-white/60">Live Order</span>
                  <span className="text-xs text-success flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Delivered
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold">5GB MTN Data</div>
                  <div className="text-sm text-white/60 mt-1">to 024•••4521</div>
                </div>
                <div className="flex items-end justify-between pt-4 border-t border-white/10">
                  <div>
                    <div className="text-xs text-white/60">Total paid</div>
                    <div className="text-2xl font-bold text-gold">₵28.00</div>
                  </div>
                  <div className="text-xs text-white/50">Ref: GED-A4F92B</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold">What we sell</h2>
          <p className="mt-3 text-muted-foreground">All networks. All bundles. Instant fulfillment.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Card key={p.name} className="group transition-all hover:-translate-y-1 hover:shadow-glow cursor-pointer">
              <CardContent className="p-6">
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${p.color} mb-4`}>
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  Shop now <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Become agent CTA */}
      <section className="container py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-gold p-10 md:p-14 text-gold-foreground shadow-elegant">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block rounded-full bg-gold text-gold-foreground px-3 py-1 text-xs font-bold">
                ONE-TIME ₵50 FEE
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
                Launch your own data store.
              </h2>
              <p className="mt-3 text-gold-foreground/85 max-w-md">
                Get a mini-store, wallet, referral link, API access, flyer generator, and leaderboard rewards.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Button asChild size="xl" variant="gold" className="shadow-glow">
                <Link to="/become-agent">Start Earning Today <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
              <f.icon className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-display font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Track order */}
      <section className="container py-12">
        <Card className="bg-secondary/40 border-dashed">
          <CardContent className="p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-bold">Track your order</h3>
              <p className="text-muted-foreground mt-2">Enter your reference & phone number to see live status.</p>
            </div>
            <Button asChild size="lg" variant="outline">
              <Link to="/track">Open Order Tracker <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Testimonials */}
      <section className="container py-20">
        <h2 className="font-display text-4xl font-bold text-center mb-12">Loved by agents & customers</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardContent className="p-6">
                <p className="text-sm">"{t.quote}"</p>
                <div className="mt-5 pt-5 border-t">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
