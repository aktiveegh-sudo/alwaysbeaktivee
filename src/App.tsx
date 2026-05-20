import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Track from "@/pages/Track";
import Placeholder from "@/pages/Placeholder";

const qc = new QueryClient();

const App = () => (
  <QueryClientProvider client={qc}>
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/track" element={<Track />} />
              <Route path="/become-agent" element={<Placeholder title="Become an Agent" />} />
              <Route path="/login" element={<Placeholder title="Login" />} />
              <Route path="/dashboard" element={<Placeholder title="Agent Dashboard" />} />
              <Route path="/admin" element={<Placeholder title="Admin Dashboard" />} />
              <Route path="/store/:slug" element={<Placeholder title="Agent Store" />} />
              <Route path="*" element={<Placeholder title="404 — Not Found" />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
