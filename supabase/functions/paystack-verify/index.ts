import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY) {
      return json({ success: false, error: "Missing required environment variables." });
    }
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ success: false, error: "Method not allowed." });
    }

    const rawText = await req.text();
    let body: any = null;
    try {
      body = rawText ? JSON.parse(rawText) : null;
    } catch {
      body = null;
    }
    const query = new URL(req.url).searchParams;
    const orderReference = String(
      body?.order_reference ?? body?.reference ?? body?.trxref ?? query.get("order_reference") ?? query.get("reference") ?? query.get("trxref") ?? ""
    );
    if (!orderReference) {
      return json({ success: false, error: "order_reference is required." });
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(orderReference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyText = await verifyResponse.text();
    let verifyBody: any = null;
    try {
      verifyBody = verifyText ? JSON.parse(verifyText) : null;
    } catch {
      return json({ success: false, error: "Paystack returned non-JSON response.", raw: verifyText.slice(0, 500) });
    }
    if (!verifyResponse.ok || !verifyBody?.status || verifyBody.data?.status !== "success") {
      return json({ success: false, error: verifyBody?.message || "Payment verification failed.", details: verifyBody });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, swift_order_id, store_owner_id, buyer_user_id")
      .eq("reference", orderReference)
      .maybeSingle();

    if (orderError || !order) {
      return json({ success: false, error: orderError?.message || "Order not found." });
    }

    // Resolve a store slug to redirect public buyers back to.
    let storeSlug: string | null = null;
    if (order.store_owner_id) {
      const { data: store } = await supabase
        .from("stores")
        .select("slug")
        .eq("user_id", order.store_owner_id)
        .maybeSingle();
      storeSlug = store?.slug ?? null;
    }

    if (order.status === "delivered") {
      return json({
        success: true,
        message: "Order already delivered.",
        order_reference: orderReference,
        store_slug: storeSlug,
        buyer_user_id: order.buyer_user_id,
      });
    }

    // If we already submitted to Swift, do not resend — just acknowledge.
    if (order.swift_order_id) {
      return json({
        success: true,
        message: "Order already submitted to Swift.",
        order_reference: orderReference,
        swift_order_id: order.swift_order_id,
        store_slug: storeSlug,
        buyer_user_id: order.buyer_user_id,
      });
    }

    // Call purchase-data via direct fetch to avoid SDK invoke JSON-parse issues.
    let purchaseResult: any = null;
    let purchaseHttpStatus = 0;
    let purchaseRaw = "";
    try {
      const purchaseUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/purchase-data`;
      const purchaseResp = await fetch(purchaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ order_id: order.id }),
      });
      purchaseHttpStatus = purchaseResp.status;
      purchaseRaw = await purchaseResp.text();
      if (purchaseRaw) {
        try {
          purchaseResult = JSON.parse(purchaseRaw);
        } catch {
          purchaseResult = null;
        }
      }
    } catch (invokeError) {
      return json({
        success: false,
        error: invokeError instanceof Error ? invokeError.message : String(invokeError),
      });
    }

    if (!purchaseResult) {
      return json({
        success: false,
        error: `Fulfillment service returned no JSON (status ${purchaseHttpStatus}).`,
        raw: purchaseRaw.slice(0, 500),
        store_slug: storeSlug,
        buyer_user_id: order.buyer_user_id,
      });
    }

    if (!purchaseResult.success) {
      return json({
        success: false,
        error: purchaseResult.error || "Order was verified but fulfillment failed.",
        details: purchaseResult,
        store_slug: storeSlug,
        buyer_user_id: order.buyer_user_id,
      });
    }

    return json({
      success: true,
      message: "Payment verified and order processing started.",
      order_reference: orderReference,
      purchase: purchaseResult,
      store_slug: storeSlug,
      buyer_user_id: order.buyer_user_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ success: false, error: message });
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
