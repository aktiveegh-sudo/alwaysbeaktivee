import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import EmailVerificationGate from "@/components/EmailVerificationGate";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <EmailVerificationGate>
      {children}
    </EmailVerificationGate>
  );
};

export default ProtectedRoute;
