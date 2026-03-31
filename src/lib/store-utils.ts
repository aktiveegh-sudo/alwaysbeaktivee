export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const isStoreActive = (openTime: string, closeTime: string): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }
  // Handles overnight hours (e.g., 22:00 - 06:00)
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
};

export const formatWhatsAppLink = (
  phone: string,
  productName: string,
  productUrl: string
): string => {
  const message = encodeURIComponent(
    `Hello, I'd like to order this product:\n\n${productName}\n\nLink: ${productUrl}\n\nMy name is:`
  );
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${message}`;
};

export const formatWhatsAppGeneral = (phone: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}`;
};
