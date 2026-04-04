import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";

const EmailVerificationGate = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const [resending, setResending] = useState(false);

  if (!user) return <>{children}</>;

  const isConfirmed = !!user.email_confirmed_at;

  if (isConfirmed) return <>{children}</>;

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Confirmation email resent! Check your inbox.");
    }
  };

  const handleRefresh = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      toast.error("Could not refresh session. Try logging in again.");
    } else if (data.user?.email_confirmed_at) {
      toast.success("Email confirmed! Redirecting...");
      window.location.reload();
    } else {
      toast.info("Email not yet confirmed. Please check your inbox.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-[10px] border border-border bg-background p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Mail className="h-8 w-8 text-foreground" />
        </div>

        <h2 className="text-xl font-bold text-foreground">Verify your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{user.email}</span>.
          Please check your inbox and click the link to activate your account.
        </p>

        <div className="mt-6 space-y-3">
          <Button onClick={handleRefresh} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            I've confirmed — let me in
          </Button>

          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending}
            className="w-full"
          >
            {resending ? "Sending..." : "Resend confirmation email"}
          </Button>

          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out & use a different email
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Don't see the email? Check your spam folder.
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationGate;
