import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">About Aktivee</h1>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            Aktivee was built with one mission: <span className="text-foreground font-medium">make it effortless for African businesses to sell online.</span>
          </p>
          <p>
            Across Africa, millions of small businesses rely on WhatsApp to communicate with customers. But most of them don't have a professional online presence. Building a website costs money. E-commerce platforms are complicated. And most solutions aren't designed for the way African businesses actually operate.
          </p>
          <p>
            Aktivee bridges this gap. We give every business a simple, beautiful online store that connects directly to WhatsApp. No coding, no developers, no monthly fees. Just create your store, add your products, and share your link.
          </p>

          <h2 className="text-lg font-semibold text-foreground pt-4">Our values</h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-foreground">Simplicity first</p>
              <p>If it's not simple, it's not Aktivee. Every feature we build must be intuitive and effortless.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Free forever</p>
              <p>We believe every business deserves an online presence, regardless of budget. Aktivee is and will remain free.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Built for Africa</p>
              <p>We understand the unique challenges African businesses face — from mobile-first customers to WhatsApp-based commerce.</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-foreground pt-4">Our story</h2>
          <p>
            Aktivee started from a simple observation: small business owners in Ghana were spending hundreds of dollars on developers to build basic websites — only to end up with something they couldn't update themselves. Many just gave up and relied on WhatsApp alone.
          </p>
          <p>
            We knew there had to be a better way. So we built Aktivee — a tool so simple that anyone can create a professional online store in under 60 seconds, and start receiving orders via WhatsApp immediately.
          </p>
        </div>

        <div className="mt-12 rounded-[10px] border border-border p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Join thousands of businesses on Aktivee</h2>
          <p className="mt-2 text-sm text-muted-foreground">It's completely free. Always.</p>
          <Link to="/start" className="mt-4 inline-block">
            <Button className="bg-lime text-lime-foreground hover:bg-lime/90">Create your store</Button>
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default About;
