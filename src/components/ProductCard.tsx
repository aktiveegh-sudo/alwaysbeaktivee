import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatWhatsAppLink } from "@/lib/store-utils";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductCardProps {
  name: string;
  price: number | null;
  requestPrice: boolean;
  imageUrl: string | null;
  slug: string;
  storeSlug: string;
  whatsappNumber: string;
  isStoreOpen?: boolean;
  customGreeting?: string | null;
  selected?: boolean;
  onSelect?: () => void;
  onWhatsAppClick?: () => void;
}

const ProductCard = ({
  name,
  price,
  requestPrice,
  imageUrl,
  slug,
  storeSlug,
  whatsappNumber,
  isStoreOpen = true,
  customGreeting,
  selected,
  onSelect,
  onWhatsAppClick,
}: ProductCardProps) => {
  const productUrl = `${window.location.origin}/${storeSlug}/${slug}`;
  const { formatPrice } = useCurrency();
  const priceText = requestPrice ? "Request Price" : formatPrice(price);
  const whatsappLink = formatWhatsAppLink(
    whatsappNumber, name, productUrl, priceText, customGreeting, !isStoreOpen
  );

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title: name, url: productUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(productUrl);
    }
  };

  return (
    <div className={`rounded-[10px] border bg-card overflow-hidden transition-all duration-200 ${
      selected ? "border-lime ring-2 ring-lime/30" : "border-border"
    }`}>
      <Link to={`/${storeSlug}/${slug}`}>
        <div className="aspect-square bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-contain" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/${storeSlug}/${slug}`}>
          <h3 className="font-medium text-foreground">{name}</h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{priceText}</p>
        <div className="mt-3 flex gap-2">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={onWhatsAppClick}>
            <Button className="w-full" size="sm">
              {isStoreOpen ? "Order on WhatsApp" : "Pre-order"}
            </Button>
          </a>
          {onSelect && (
            <Button
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={(e) => { e.preventDefault(); onSelect(); }}
              className="shrink-0"
            >
              {selected ? "✓" : "+"}
            </Button>
          )}
        </div>
        <button onClick={handleShare} className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          Share
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
