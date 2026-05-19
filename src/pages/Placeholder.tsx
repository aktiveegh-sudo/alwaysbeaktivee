import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <section className="container py-24 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold mb-6">
        <Construction className="h-7 w-7" />
      </div>
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-3 max-w-md mx-auto">
        This section is coming next. We're building AktiveeData feature by feature - ask to continue and this page will come alive.
      </p>
      <Button asChild className="mt-6"><Link to="/">Back to Home</Link></Button>
    </section>
  );
}
