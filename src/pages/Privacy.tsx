import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 31, 2026</p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">When you create an account on Aktivee, we collect your email address and password. When you create a store, we collect your store name, description, WhatsApp number, business hours, and optional contact details (email, location, social media handles).</p>
            <p className="mt-2">We also collect product information you add to your store, including product names, descriptions, prices, and images.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="mt-2">We use your information to provide and improve our services, including displaying your store and products to your customers. Your WhatsApp number is displayed to customers who wish to place orders. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. Data Storage</h2>
            <p className="mt-2">Your data is stored securely using industry-standard encryption. We use Supabase for our backend infrastructure, which provides enterprise-grade security and compliance.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Cookies</h2>
            <p className="mt-2">We use essential cookies to maintain your login session. We do not use tracking cookies or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Your Rights</h2>
            <p className="mt-2">You can access, update, or delete your personal information at any time through your dashboard. If you wish to delete your account entirely, please contact us.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Contact</h2>
            <p className="mt-2">If you have any questions about this privacy policy, please contact us at support@aktivee.shop.</p>
          </section>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Privacy;
