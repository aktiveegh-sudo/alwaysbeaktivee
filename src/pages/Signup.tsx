import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const ALLOWED_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com"];

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-destructive", width: "w-1/5" };
  if (score === 2) return { label: "Fair", color: "bg-orange-400", width: "w-2/5" };
  if (score === 3) return { label: "Good", color: "bg-yellow-400", width: "w-3/5" };
  if (score === 4) return { label: "Strong", color: "bg-lime", width: "w-4/5" };
  return { label: "Very Strong", color: "bg-success", width: "w-full" };
};

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const emailDomain = email.includes("@") ? email.split("@")[1]?.toLowerCase() : "";
  const isEmailDomainValid = !emailDomain || ALLOWED_DOMAINS.includes(emailDomain);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailDomainValid) {
      toast.error("Please use a valid email provider (Gmail, Yahoo, Outlook, or iCloud).");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: "https://aktivee.shop/dashboard" },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm, then log in.");
      navigate("/login");
    }
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://aktivee.shop/dashboard",
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm rounded-[10px] border border-border p-8">
          <h1 className="text-xl font-bold text-foreground">Sign up</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your free Aktivee account</p>

          <button
            onClick={handleGoogleSignup}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailDomain && !isEmailDomainValid && (
                <p className="mt-1 text-xs text-destructive">
                  Only Gmail, Yahoo, Outlook, and iCloud emails are allowed.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Strength: <span className="font-medium text-foreground">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || (!isEmailDomainValid && !!emailDomain)}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;