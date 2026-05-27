// Edge function: forward a data order to the Swift API for delivery and update order status.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SWIFT_API_URL = Deno.env.get("SWIFT_API_URL") || "https://lsocdjpflecduumopijn.supabase.co/functions/v1/developer-api/payment/data";
    const SWIFT_API_KEY = Deno.env.get("SWIFT_API_KEY");

    if (!SWIFT_API_KEY) {
      return json({ success: false, error: "Missing SWIFT_API_KEY environment variable." });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return json({ success: false, error: "order_id required" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select(
        "id, reference, recipient_phone, amount, status, notes, product_id, products(name, type, network, data_volume_mb, swift_package_id)"
      )
      .eq("id", order_id)
      .maybeSingle();

    if (oErr || !order) {
      return json({ success: false, error: oErr?.message || "Order not found" });
    }

    const product = (order as any).products;
    if (!product || product.type !== "data") {
      return json({ success: true, skipped: true });
    }

    const swiftPackageId = product.swift_package_id;
    if (!swiftPackageId) {
      await supabase
        .from("orders")
        .update({ status: "failed", swift_status: "fulfillment_failed", notes: "Missing Swift package ID for product." })
        .eq("id", order_id);
      return json({ success: false, error: "Product missing Swift package ID." });
    }

    let recipient = String(order.recipient_phone || "").replace(/\D/g, "");
    if (recipient.startsWith("233") && recipient.length === 12) recipient = "0" + recipient.slice(3);
    if (recipient.length === 9) recipient = "0" + recipient;

    const payload = {
      package_id: swiftPackageId,
      recipient_phone: recipient,
      amount: Number(order.amount),
      reference: order.reference,
      metadata: {
        order_id,
        product_id: order.product_id,
        product_name: product.name,
      },
    };

    const resp = await fetch(SWIFT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SWIFT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resultBody = await resp.json();
    if (!resp.ok || !resultBody?.success) {
      const errMsg = resultBody?.message || resultBody?.error || `Swift API error ${resp.status}`;
      await supabase
        .from("orders")
        .update({ status: "failed", swift_status: "fulfillment_failed", notes: `Swift error: ${errMsg}` })
        .eq("id", order_id);
      return json({ success: false, error: errMsg, provider: resultBody });
    }

    const swiftOrderId = resultBody?.data?.id || resultBody?.data?.order_id || null;
    const swiftStatus = resultBody?.data?.status || "processing";

    await supabase
      .from("orders")
      .update({
        status: "processing",
        swift_order_id: swiftOrderId,
        swift_status: swiftStatus,
        notes: swiftOrderId ? `Swift order id: ${swiftOrderId}` : "Submitted to Swift API",
      })
      .eq("id", order_id);

    return json({ success: true, provider: resultBody });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ success: false, error: msg });
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
