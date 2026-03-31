import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FloatingShapes = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* Circles */}
    <div className="animate-float-1 absolute -top-10 left-[10%] h-64 w-64 rounded-full border border-border/40 opacity-30" />
    <div className="animate-float-2 absolute top-[20%] right-[5%] h-40 w-40 rounded-full bg-muted/50 opacity-40" />
    <div className="animate-float-3 absolute bottom-[30%] left-[5%] h-32 w-32 rounded-full border border-border/30 opacity-25" />
    {/* Rounded squares */}
    <div className="animate-float-4 absolute top-[60%] right-[15%] h-48 w-48 rounded-3xl border border-border/30 opacity-20 rotate-12" />
    <div className="animate-float-5 absolute top-[10%] left-[50%] h-24 w-24 rounded-2xl bg-lime/5 opacity-50" />
    {/* Small dots */}
    <div className="animate-float-2 absolute top-[40%] left-[30%] h-3 w-3 rounded-full bg-lime/20" />
    <div className="animate-float-1 absolute top-[70%] right-[40%] h-2 w-2 rounded-full bg-muted-foreground/10" />
    <div className="animate-float-3 absolute top-[15%] left-[70%] h-4 w-4 rounded-full bg-lime/15" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <FloatingShapes />
        <div className="container relative mx-auto px-4 py-28 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-block rounded-full bg-lime-light px-4 py-1.5 text-xs font-medium text-lime-foreground mb-6">
              🚀 Free to get started
            </span>
          </div>
          <h1 className="animate-fade-in-up-delay-1 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Is your business{" "}
            <span className="italic text-lime">aktivee</span>?
          </h1>
          <p className="animate-fade-in-up-delay-2 mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
            Create a simple store. Let customers order instantly on WhatsApp.
          </p>
          <div className="animate-fade-in-up-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/start">
              <Button size="lg" className="bg-lime text-lime-foreground hover:bg-lime/90 shadow-sm">
                Create your store
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" size="lg">View demo</Button>
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-t border-border bg-background py-20 overflow-hidden">
        <div className="container relative mx-auto px-4">
          <h2 className="animate-fade-in-up text-center text-2xl font-bold text-foreground">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Create your store", desc: "Sign up and set up your store in under a minute." },
              { step: "2", title: "Add your products", desc: "Upload products with images, prices, and descriptions." },
              { step: "3", title: "Get orders on WhatsApp", desc: "Customers click to order and message you directly." },
            ].map((item, i) => (
              <div key={item.step} className={`animate-fade-in-up-delay-${i + 1} text-center group`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-lime text-lime-foreground text-sm font-bold transition-transform duration-200 group-hover:scale-110">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative border-t border-border py-20 overflow-hidden">
        <FloatingShapes />
        <div className="container relative mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-foreground">Features</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Active status", desc: "Show customers when you're open for business.", icon: "🟢" },
              { title: "WhatsApp ordering", desc: "Instant orders directly to your WhatsApp.", icon: "💬" },
              { title: "Product pages", desc: "Clean, simple pages for each product.", icon: "📦" },
              { title: "Shareable link", desc: "One link to share your store anywhere.", icon: "🔗" },
            ].map((f) => (
              <div key={f.title} className="group rounded-[10px] border border-border p-6 transition-all duration-200 hover:border-lime/40 hover:shadow-sm">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="border-t border-border py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-foreground">See it in action</h2>
          <div className="animate-scale-in mx-auto mt-12 max-w-md rounded-[10px] border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Sample Store</h3>
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-success">Active Now</span>
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Fresh baked goods delivered daily.</p>
            <p className="mt-1 text-xs text-muted-foreground">Open: 08:00 — 18:00</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { name: "Sourdough Bread", price: "$6.00" },
                { name: "Croissant", price: "$3.50" },
              ].map((p) => (
                <div key={p.name} className="group rounded-lg border border-border p-3 transition-all duration-200 hover:border-lime/40">
                  <div className="aspect-square rounded-md bg-muted" />
                  <p className="mt-2 text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.price}</p>
                  <div className="mt-2 rounded-md bg-lime px-3 py-1.5 text-center text-xs font-medium text-lime-foreground transition-opacity hover:opacity-90">
                    Order on WhatsApp
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-border py-20 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-lime/5 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground">Get your business online in minutes</h2>
          <p className="mt-2 text-muted-foreground">It's completely free.</p>
          <Link to="/start" className="mt-6 inline-block">
            <Button size="lg" className="bg-lime text-lime-foreground hover:bg-lime/90 shadow-sm">
              Create your store
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
