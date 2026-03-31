import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Is your business <span className="italic">aktivee</span>?
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          Create a simple store. Let customers order instantly on WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/start">
            <Button size="lg">Create your store</Button>
          </Link>
          <a href="#demo">
            <Button variant="outline" size="lg">View demo</Button>
          </a>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">It's free to get started</p>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-background py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-foreground">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Create your store", desc: "Sign up and set up your store in under a minute." },
              { step: "2", title: "Add your products", desc: "Upload products with images, prices, and descriptions." },
              { step: "3", title: "Get orders on WhatsApp", desc: "Customers click to order and message you directly." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
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
      <section id="features" className="border-t border-border py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-foreground">Features</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Active status", desc: "Show customers when you're open for business." },
              { title: "WhatsApp ordering", desc: "Instant orders directly to your WhatsApp." },
              { title: "Product pages", desc: "Clean, simple pages for each product." },
              { title: "Shareable link", desc: "One link to share your store anywhere." },
            ].map((f) => (
              <div key={f.title} className="rounded-[10px] border border-border p-6">
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
          <div className="mx-auto mt-12 max-w-md rounded-[10px] border border-border p-6">
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
                <div key={p.name} className="rounded-lg border border-border p-3">
                  <div className="aspect-square rounded-md bg-muted" />
                  <p className="mt-2 text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.price}</p>
                  <div className="mt-2 rounded-md bg-primary px-3 py-1.5 text-center text-xs font-medium text-primary-foreground">
                    Order on WhatsApp
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground">Get your business online in minutes</h2>
          <p className="mt-2 text-muted-foreground">It's completely free.</p>
          <Link to="/start" className="mt-6 inline-block">
            <Button size="lg">Create your store</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
