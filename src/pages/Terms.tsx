import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 31, 2026</p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">By using Aktivee, you agree to these terms of service. If you do not agree, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. Service Description</h2>
            <p className="mt-2">Aktivee provides a free platform for creating online stores that enable customers to place orders via WhatsApp. We do not process payments or handle transactions between store owners and their customers.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. User Responsibilities</h2>
            <p className="mt-2">You are responsible for the content you post on your store, including product listings, descriptions, and images. You must not use Aktivee for illegal activities, fraudulent purposes, or to sell prohibited items.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Store Suspension</h2>
            <p className="mt-2">We reserve the right to suspend or terminate any store that violates these terms, engages in fraudulent activity, or receives complaints from customers.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Intellectual Property</h2>
            <p className="mt-2">You retain ownership of all content you upload to your store. By using Aktivee, you grant us a license to display your content as part of the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Limitation of Liability</h2>
            <p className="mt-2">Aktivee is provided "as is" without warranties. We are not liable for any disputes between store owners and their customers, including issues related to products, payments, or delivery.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">7. Changes to Terms</h2>
            <p className="mt-2">We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">8. Contact</h2>
            <p className="mt-2">For questions about these terms, contact us at support@aktivee.shop.</p>
          </section>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;
