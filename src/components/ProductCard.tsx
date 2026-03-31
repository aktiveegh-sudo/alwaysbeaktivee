import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatWhatsAppLink } from "@/lib/store-utils";

interface ProductCardProps {
  name: string;
  price: number | null;
  requestPrice: boolean;
  imageUrl: string | null;
  slug: string;
  storeSlug: string;
  whatsappNumber: string;
}

const ProductCard = ({
  name,
  price,
  requestPrice,
  imageUrl,
  slug,
  storeSlug,
  whatsappNumber,
}: ProductCardProps) => {
  const productUrl = `${window.location.origin}/${storeSlug}/${slug}`;
  const whatsappLink = formatWhatsAppLink(whatsappNumber, name, productUrl);

  return (
    <div className="rounded-[10px] border border-border bg-card overflow-hidden">
      <Link to={`/${storeSlug}/${slug}`}>
        <div className="aspect-square bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
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
        <p className="mt-1 text-sm text-muted-foreground">
          {requestPrice ? "Request Price" : price != null ? `$${price.toFixed(2)}` : "Request Price"}
        </p>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-3 block">
          <Button className="w-full" size="sm">Order on WhatsApp</Button>
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
