import { Link } from "react-router-dom";

interface StoreFooterProps {
  store: {
    name: string;
    slug: string;
    description?: string | null;
    whatsapp_number: string;
    phone_number?: string | null;
    email?: string | null;
    location?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
  };
}

const StoreFooter = ({ store }: StoreFooterProps) => (
  <footer className="border-t border-border bg-background mt-12">
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-foreground">{store.name}</p>
          {store.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{store.description}</p>
          )}
          {store.location && (
            <p className="mt-2 text-xs text-muted-foreground">📍 {store.location}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium text-foreground mb-1">Contact</p>
          <a href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            💬 WhatsApp
          </a>
          {store.phone_number && (
            <a href={`tel:${store.phone_number}`} className="text-muted-foreground hover:text-foreground transition-colors">
              📞 {store.phone_number}
            </a>
          )}
          {store.email && (
            <a href={`mailto:${store.email}`} className="text-muted-foreground hover:text-foreground transition-colors">
              ✉️ {store.email}
            </a>
          )}
          <Link to={`/${store.slug}/contact`} className="text-muted-foreground hover:text-foreground transition-colors">
            Contact page
          </Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium text-foreground mb-1">Socials</p>
          {store.instagram && (
            <a href={`https://instagram.com/${store.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              📸 Instagram
            </a>
          )}
          {store.twitter && (
            <a href={`https://x.com/${store.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              𝕏 Twitter
            </a>
          )}
          {store.tiktok && (
            <a href={`https://tiktok.com/@${store.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              🎵 TikTok
            </a>
          )}
          {!store.instagram && !store.twitter && !store.tiktok && (
            <p className="text-muted-foreground text-xs">No socials added</p>
          )}
        </div>
      </div>
      <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        <p>Powered by <a href="/" className="font-medium text-foreground hover:underline">Aktivee</a></p>
      </div>
    </div>
  </footer>
);

export default StoreFooter;
