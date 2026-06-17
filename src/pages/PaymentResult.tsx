import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyPaystackOrder } from "@/lib/paystack";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const REDIRECT_SECONDS = 6;

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment...");
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string>("/");
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

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

    (async () => {
      try {
        const result = await verifyPaystackOrder(value);
        const slug: string | null = result?.store_slug || null;
        const buyerId: string | null = result?.buyer_user_id || null;
        // If buyer is the signed-in user (agent buying), send them to their dashboard.
        // Otherwise (public store buyer), send them back to the store front.
        if (user && buyerId && buyerId === user.id) {
          setRedirectTo("/dashboard");
        } else if (slug) {
          setRedirectTo(`/store/${slug}`);
        } else if (user) {
          setRedirectTo("/dashboard");
        } else {
          setRedirectTo("/");
        }
        setStatus("success");
        setMessage(
          result?.message ||
            "Payment confirmed. Your order is being processed and the bundle will arrive shortly."
        );
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [searchParams, user]);

  useEffect(() => {
    if (status !== "success") return;
    setCountdown(REDIRECT_SECONDS);
    const interval = window.setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const redirect = window.setTimeout(() => navigate(redirectTo, { replace: true }), REDIRECT_SECONDS * 1000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(redirect);
    };
  }, [status, redirectTo, navigate]);

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
            <div className="space-y-5">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold">Payment successful</h1>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              {orderReference && (
                <div className="rounded-xl bg-secondary p-3 font-mono text-base font-bold">
                  {orderReference}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Redirecting in {countdown}s…
              </p>
              <div className="flex flex-col gap-2 sm:flex-row justify-center">
                <Button asChild>
                  <Link to={redirectTo}>
                    {redirectTo.startsWith("/store/")
                      ? "Back to store"
                      : redirectTo === "/dashboard"
                        ? "Go to dashboard"
                        : "Continue"}
                  </Link>
                </Button>
                {orderReference && (
                  <Button asChild variant="outline">
                    <Link to={`/track?ref=${orderReference}`}>Track order</Link>
                  </Button>
                )}
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
                  <Link to={user ? "/dashboard" : "/products"}>
                    {user ? "Back to dashboard" : "Try again"}
                  </Link>
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
