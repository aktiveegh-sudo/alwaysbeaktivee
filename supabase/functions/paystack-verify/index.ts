import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY) {
  throw new Error("Missing required environment variables for Paystack verification.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const orderReference = String(body?.order_reference ?? "");
  if (!orderReference) {
    return json({ success: false, error: "order_reference is required." }, 400);
  }

  const verifyResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(orderReference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const verifyBody = await verifyResponse.json();
  if (!verifyResponse.ok || !verifyBody?.status || verifyBody.data?.status !== "success") {
    return json({ success: false, error: verifyBody?.message || "Payment verification failed." }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("reference", orderReference)
    .maybeSingle();

  if (orderError || !order) {
    return json({ success: false, error: orderError?.message || "Order not found." }, 404);
  }

  if (order.status === "delivered") {
    return json({ success: true, message: "Order already delivered." });
  }

  const { data: purchaseResult, error: purchaseError } = await supabase.functions.invoke("purchase-data", {
    body: { order_id: order.id },
  });

  if (purchaseError) {
    return json({ success: false, error: purchaseError.message || "Failed to process order after payment." }, 500);
  }

  return json({
    success: true,
    message: "Payment verified and order processing started.",
    order_reference: orderReference,
    purchase: purchaseResult,
  });
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
