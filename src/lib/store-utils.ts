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
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
};

export const formatWhatsAppLink = (
  phone: string,
  productName: string,
  productUrl: string,
  price?: string | null,
  customGreeting?: string | null,
  isClosed?: boolean
): string => {
  let message = "";
  if (customGreeting) {
    message += `${customGreeting}\n\n`;
  }
  if (isClosed) {
    message += `Hello, I know you're currently closed, but I'd like to order:\n\n`;
  } else {
    message += `Hello, I want to order:\n\n`;
  }
  message += `Product: ${productName}\n`;
  message += `Price: ${price || "Request Price"}\n`;
  message += `Quantity: 1\n`;
  message += `\nLink: ${productUrl}\n`;
  message += `\nMy name is:\nMy location is:`;

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export const formatWhatsAppMultiOrder = (
  phone: string,
  products: { name: string; price: string }[],
  customGreeting?: string | null,
  isClosed?: boolean
): string => {
  let message = "";
  if (customGreeting) {
    message += `${customGreeting}\n\n`;
  }
  if (isClosed) {
    message += `Hello, I know you're currently closed, but I'd like to order:\n\n`;
  } else {
    message += `Hello, I want to order:\n\n`;
  }
  products.forEach((p) => {
    message += `${p.name} – ${p.price}\n`;
  });
  message += `\nMy name is:\nMy location is:`;

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export const formatWhatsAppGeneral = (phone: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}`;
};
