import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, Lock, Zap } from "lucide-react";

export default function Login() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    if (forgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) setErr(error.message);
      else setInfo("Check your inbox for a password reset link.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    nav("/dashboard");
  };

  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-red text-primary-foreground">
              <Zap className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl font-bold">{forgot ? "Reset password" : "Welcome back"}</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {!forgot && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {err && <div className="text-sm text-destructive">{err}</div>}
            {info && <div className="text-sm text-success">{info}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : forgot ? "Send reset link" : "Login"}
            </Button>

            <button
              type="button"
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setForgot(!forgot);
                setErr(null);
                setInfo(null);
              }}
            >
              {forgot ? "Back to login" : "Forgot password?"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            New to BossuData?{" "}
            <Link to="/become-agent" className="font-semibold text-primary hover:underline">
              Become an Agent
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
