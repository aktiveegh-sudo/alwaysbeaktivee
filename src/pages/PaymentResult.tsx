import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyPaystackOrder } from "@/lib/paystack";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying payment...");
  const [orderReference, setOrderReference] = useState<string | null>(null);

  useEffect(() => {
    const value =
      searchParams.get("order_reference") ||
      searchParams.get("reference") ||
      searchParams.get("trxref");
    if (!value) {
      setStatus("error");
      setMessage("Missing order reference. Unable to verify payment.");
      return;
    }
    setOrderReference(value);

    const verify = async () => {
      try {
        const result = await verifyPaystackOrder(value);
        setStatus("success");
        setMessage(
          result?.message ||
            "Payment verified. Your order is now being processed and will be visible in the admin dashboard."
        );
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : String(err));
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="container py-16">
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="text-base text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold">Payment confirmed</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              {orderReference ? (
                <p className="text-xs text-muted-foreground">Order reference: {orderReference}</p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row justify-center">
                <Button asChild>
                  <Link to="/">Return home</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin">View admin dashboard</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/15 text-destructive">
                <XCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold">Payment verification failed</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="flex flex-col gap-3 sm:flex-row justify-center">
                <Button asChild>
                  <Link to="/products">Try again</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
