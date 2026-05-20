import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords don't match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setErr(error.message);
    setDone(true);
    setTimeout(() => nav("/dashboard"), 1500);
  };

  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardContent className="p-8">
          <h1 className="font-display text-2xl font-bold mb-4">Set new password</h1>
          {!ready ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Verifying reset link…
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-2" />
              <p className="font-semibold">Password updated!</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">New password</label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Confirm password</label>
                <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {err && <div className="text-sm text-destructive">{err}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
