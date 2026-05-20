import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatGHS } from "@/lib/utils";
import { CheckCircle2, Loader2, Sparkles, TrendingUp, Wallet, Zap } from "lucide-react";

const perks = [
  { icon: Wallet, title: "Wallet & withdrawals", desc: "Track earnings and cash out to MoMo." },
  { icon: Sparkles, title: "Mini-store at /store/you", desc: "Personalized storefront with your brand." },
  { icon: TrendingUp, title: "Referral & API access", desc: "Earn from referrals and integrate." },
];

export default function BecomeAgent() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState(50);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("agent_signup_fee")
      .maybeSingle()
      .then(({ data }) => data && setFee(Number(data.agent_signup_fee)));
  }, []);

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (!/^0\d{9}$/.test(phone)) return setErr("Enter a valid 10-digit Ghana phone number.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);
    if (error) return setErr(error.message);
    setDone(true);
    setTimeout(() => nav("/dashboard"), 1500);
  };

  return (
    <>
      <section className="bg-gradient-hero text-white">
        <div className="container py-14 md:py-20">
          <span className="inline-block rounded-full bg-gold text-gold-foreground px-3 py-1 text-xs font-bold">
            ONE-TIME {formatGHS(fee)} FEE
          </span>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold">Become a BossuData Agent</h1>
          <p className="mt-3 text-white/75 max-w-xl">
            Launch your mini-store, sell data at agent prices, and keep the profit.
          </p>
        </div>
      </section>

      <section className="container py-12 grid lg:grid-cols-[1fr_400px] gap-8">
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">What you get</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {perks.map((p) => (
              <div key={p.title} className="rounded-xl border bg-card p-5">
                <p.icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-bold">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-gradient-red p-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6" />
              <div>
                <div className="font-display text-xl font-bold">Activate after signup</div>
                <p className="text-sm opacity-85">Pay {formatGHS(fee)} from your dashboard to unlock agent perks.</p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {done ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <h3 className="font-display text-xl font-bold">Account created!</h3>
                <p className="text-sm text-muted-foreground mt-2">Taking you to your dashboard…</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="font-display text-xl font-bold">Create your account</h2>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Full name</label>
                  <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Email</label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Phone</label>
                  <Input
                    inputMode="numeric"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.trim())}
                    placeholder="0241234567"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Password</label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                {err && <div className="text-sm text-destructive">{err}</div>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Already a member?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
