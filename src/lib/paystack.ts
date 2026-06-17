import { supabase } from "@/integrations/supabase/client";

export type PaystackInitResult = {
  authorizationUrl: string;
  paystackReference: string;
  orderReference: string;
};

export async function initiatePaystackCheckout(orderId: string, returnUrl: string): Promise<PaystackInitResult> {
  const { data, error } = await supabase.functions.invoke("paystack-initiate", {
    body: JSON.stringify({ order_id: orderId, return_url: returnUrl }),
    headers: { "Content-Type": "application/json" },
  });

  if (error) {
    throw error;
  }

  if (!data?.authorization_url) {
    throw new Error("Unable to initialize Paystack checkout.");
  }

  return {
    authorizationUrl: String(data.authorization_url),
    paystackReference: String(data.paystack_reference),
    orderReference: String(data.order_reference),
  };
}

export async function verifyPaystackOrder(orderReference: string) {
  // Use direct fetch to avoid supabase.functions.invoke's automatic JSON parse
  // which throws "Unexpected end of JSON input" when the function returns an
  // empty error body.
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-verify`;
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ order_reference: orderReference }),
  });

  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Verification service returned non-JSON response (${resp.status}).`);
  }

  if (!data?.success) {
    throw new Error(String(data?.error ?? "Paystack verification failed."));
  }

  return data;
}

export async function payOrderFromWallet(orderId: string) {
  const { data, error } = await supabase.functions.invoke("wallet-purchase", {
    body: { order_id: orderId },
  });
  if (error) throw error;
  if (!data?.success) {
    throw new Error(String(data?.error ?? "Wallet payment failed."));
  }
  return data;
}
