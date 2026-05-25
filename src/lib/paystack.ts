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
  const { data, error } = await supabase.functions.invoke("paystack-verify", {
    body: JSON.stringify({ order_reference: orderReference }),
    headers: { "Content-Type": "application/json" },
  });

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(String(data?.error ?? "Paystack verification failed."));
  }

  return data;
}
