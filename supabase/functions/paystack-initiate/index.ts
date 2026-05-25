import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const PAYSTACK_CURRENCY = Deno.env.get("PAYSTACK_CURRENCY") ?? "GHS";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY) {
  throw new Error("Missing required environment variables for Paystack initialization.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  const body = await parseJsonBody(req);
  const orderId = String(body?.order_id ?? "");
  const returnUrl = String(body?.return_url ?? "");
  if (!orderId || !returnUrl) {
    return json({ success: false, error: "order_id and return_url are required." }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, reference, amount, recipient_email")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return json({ success: false, error: orderError?.message || "Order not found." }, 404);
  }

  const email = order.recipient_email || "no-reply@aktivee.shop";
  const amount = Math.max(1, Math.round(Number(order.amount) * 100));

  const paystackResp = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      currency: PAYSTACK_CURRENCY,
      reference: order.reference,
      callback_url: returnUrl,
      metadata: {
        order_id: order.id,
        order_reference: order.reference,
      },
    }),
  });

  const paystackBody = await paystackResp.json();
  if (!paystackResp.ok || !paystackBody?.status) {
    return json({ success: false, error: paystackBody?.message || "Paystack initialization failed." }, 502);
  }

  return json({
    success: true,
    authorization_url: paystackBody.data.authorization_url,
    paystack_reference: paystackBody.data.reference,
    order_reference: order.reference,
  });
});

async function parseJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    try {
      const text = await req.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
