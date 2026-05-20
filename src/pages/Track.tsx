import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGHS } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, Loader2, Package } from "lucide-react";

type OrderResult = {
  reference: string;
  status: "processing" | "delivered" | "failed" | "refunded";
  recipient_phone: string;
  amount: number;
  created_at: string;
  product_name: string | null;
};

const statusMeta: Record<OrderResult["status"], { label: string; icon: typeof Clock; cls: string }> = {
  processing: { label: "Processing", icon: Clock, cls: "bg-accent/15 text-accent" },
  delivered: { label: "Delivered", icon: CheckCircle2, cls: "bg-success/15 text-success" },
  failed: { label: "Failed", icon: XCircle, cls: "bg-destructive/15 text-destructive" },
  refunded: { label: "Refunded", icon: Package, cls: "bg-muted text-muted-foreground" },
};

export default function Track() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!reference || !phone) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    const { data } = await supabase.rpc("track_order", {
      _reference: reference.trim().toUpperCase(),
      _phone: phone.trim(),
    });
    setLoading(false);
    const row = (data as OrderResult[] | null)?.[0];
    if (row) setResult(row);
    else setNotFound(true);
  };

  useEffect(() => {
    if (params.get("ref") && params.get("phone")) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <section className="bg-gradient-hero text-white">
        <div className="container py-14 md:py-20">
          <h1 className="font-display text-4xl md:text-5xl font-bold">Track your order</h1>
          <p className="mt-3 text-white/75 max-w-xl">
            Enter your reference number and the recipient phone number to view live status.
          </p>
        </div>
      </section>

      <section className="container py-12 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={search} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Reference</label>
                <Input
                  placeholder="GED-XXXXXXXX"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Phone number</label>
                <Input
                  inputMode="numeric"
                  placeholder="0241234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="sm:col-span-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="mt-6 border-destructive/40">
            <CardContent className="p-6 text-center">
              <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold">Order not found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check the reference and recipient phone number, then try again.
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="mt-6 animate-fade-up">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Reference</div>
                  <div className="font-mono font-bold text-lg">{result.reference}</div>
                </div>
                {(() => {
                  const m = statusMeta[result.status];
                  const Icon = m.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${m.cls}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {m.label}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <Field label="Product" value={result.product_name || "—"} />
                <Field label="Recipient" value={result.recipient_phone} />
                <Field label="Amount" value={formatGHS(result.amount)} />
                <Field label="Placed" value={new Date(result.created_at).toLocaleString()} />
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
