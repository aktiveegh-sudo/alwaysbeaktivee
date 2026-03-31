import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "1",
    title: "Sign up for free",
    desc: "Create your Aktivee account in seconds. No credit card required, no hidden fees. Just your email and a password.",
    detail: "Your account gives you access to your own dashboard where you manage everything about your store.",
  },
  {
    step: "2",
    title: "Set up your store",
    desc: "Give your store a name, add your WhatsApp number, set your business hours, and write a short description.",
    detail: "Your store gets a unique link like aktivee.shop/yourstore that you can share anywhere.",
  },
  {
    step: "3",
    title: "Add your products",
    desc: "Upload product images, set prices (or request price), and add descriptions. It takes seconds per product.",
    detail: "Products are displayed beautifully on your store page. Customers can see everything at a glance.",
  },
  {
    step: "4",
    title: "Share your link",
    desc: "Put your store link in your Instagram bio, WhatsApp status, TikTok profile, Facebook page, or anywhere.",
    detail: "Every click is a potential customer. No app downloads required for your customers.",
  },
  {
    step: "5",
    title: "Receive orders on WhatsApp",
    desc: "When a customer wants to buy, they tap 'Order on WhatsApp' and message you directly with the product details.",
    detail: "You handle the conversation, negotiate if needed, and arrange delivery — all through WhatsApp.",
  },
];

const HowItWorks = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">How Aktivee Works</h1>
        <p className="mt-3 text-muted-foreground">
          From signup to your first order — here's everything you need to know.
        </p>

        <div className="mt-12 space-y-10">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground text-sm font-bold">
                {s.step}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <p className="mt-2 text-sm text-muted-foreground/70 italic">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[10px] border border-border p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Ready to start?</h2>
          <p className="mt-2 text-sm text-muted-foreground">It's completely free. No credit card needed.</p>
          <Link to="/start" className="mt-4 inline-block">
            <Button className="bg-lime text-lime-foreground hover:bg-lime/90">Create your store</Button>
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default HowItWorks;
