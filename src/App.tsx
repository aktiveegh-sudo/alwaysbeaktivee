import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Track from "@/pages/Track";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import BecomeAgent from "@/pages/BecomeAgent";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import StorePage from "@/pages/Store";
import Placeholder from "@/pages/Placeholder";

const qc = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const isStoreRoute = location.pathname.startsWith("/store/");

  if (isStoreRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/store/:slug" element={<StorePage />} />
          <Route path="*" element={<Placeholder title="404 - Not Found" />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/track" element={<Track />} />
          <Route path="/become-agent" element={<BecomeAgent />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth adminOnly>
                <Admin />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Placeholder title="404 - Not Found" />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={qc}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
