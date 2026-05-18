import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background mt-20">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-display text-lg font-bold mb-2">
            Bossu<span className="text-gold">Data</span>
          </h3>
          <p className="text-sm text-muted-foreground">Buy data instantly. Earn as an agent.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Products</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/products" className="hover:text-foreground">MTN Data</Link></li>
            <li><Link to="/products" className="hover:text-foreground">Telecel Data</Link></li>
            <li><Link to="/products" className="hover:text-foreground">AirtelTigo Data</Link></li>
            <li><Link to="/products" className="hover:text-foreground">Result Checkers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/become-agent" className="hover:text-foreground">Become an Agent</Link></li>
            <li><Link to="/track" className="hover:text-foreground">Track Order</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Agent Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Support</h4>
          <p className="text-sm text-muted-foreground">Contact us on WhatsApp for instant help.</p>
        </div>
      </div>
      <div className="border-t border-border/50 py-5">
        <p className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BossuData. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
