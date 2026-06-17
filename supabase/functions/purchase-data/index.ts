// Edge function: forward a data order to the Swift API for delivery and update order status.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveSwiftPackageId } from "../_shared/swift.ts";

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

    const rawReq = await req.text();
    let reqBody: any = null;
    try {
      reqBody = rawReq ? JSON.parse(rawReq) : null;
    } catch {
      return json({ success: false, error: "Invalid JSON in request body." });
    }
    const order_id = reqBody?.order_id;
    const retry = Boolean(reqBody?.retry);
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
        "id, reference, recipient_phone, amount, status, notes, product_id, swift_order_id, swift_status, products(name, type, network, data_volume_mb, swift_package_id)"
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

    if (!retry && order.swift_order_id) {
      return json({
        success: true,
        skipped: true,
        message: "Order already submitted to Swift",
        swift_order_id: order.swift_order_id,
        swift_status: order.swift_status,
      });
    }

    const resolvedPackageId = await resolveSwiftPackageId(
      product.swift_package_id,
      product,
      SWIFT_API_URL,
      SWIFT_API_KEY
    );

    if (!resolvedPackageId) {
      await supabase
        .from("orders")
        .update({
          status: "failed",
          swift_status: "fulfillment_failed",
          notes: "Unable to resolve Swift package ID for product.",
        })
        .eq("id", order_id);
      return json({ success: false, error: "Unable to resolve Swift package ID for product." });
    }

    if (order.product_id && product.swift_package_id !== resolvedPackageId) {
      await supabase
        .from("products")
        .update({ swift_package_id: resolvedPackageId })
        .eq("id", order.product_id);
    }

    let recipient = String(order.recipient_phone || "").replace(/\D/g, "");
    if (recipient.startsWith("233") && recipient.length === 12) recipient = "0" + recipient.slice(3);
    if (recipient.length === 9) recipient = "0" + recipient;

    const idemSuffix = retry ? `-r${Date.now()}` : "";
    const requestId = `${order.reference}${idemSuffix}`;

    const payload = {
      package_id: resolvedPackageId,
      phone: recipient,
      request_id: requestId,
      metadata: {
        order_id,
        product_id: order.product_id,
        product_name: product.name,
      },
    };

    const bodyStr = JSON.stringify(payload);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${SWIFT_API_KEY}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": requestId,
    };

    const SWIFT_SIGNING_KEY = Deno.env.get("SWIFT_SIGNING_KEY");
    if (SWIFT_SIGNING_KEY) {
      try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          enc.encode(SWIFT_SIGNING_KEY),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(bodyStr));
        const sigArray = Array.from(new Uint8Array(sigBuf));
        const sigHex = sigArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        headers["X-Swift-Signature"] = sigHex;
      } catch {
        // signature failure should not block fulfillment
      }
    }

    const resp = await fetch(SWIFT_API_URL, {
      method: "POST",
      headers,
      body: bodyStr,
    });

    const respText = await resp.text();
    let resultBody: any = null;
    try {
      resultBody = respText ? JSON.parse(respText) : null;
    } catch {
      resultBody = null;
    }
    if (!resp.ok || !resultBody || !resultBody.success) {
      const errMsg = resultBody?.message || resultBody?.error || `Swift API error ${resp.status}: ${respText.slice(0, 200)}`;
      await supabase
        .from("orders")
        .update({ status: "failed", swift_status: "fulfillment_failed", notes: `Swift error: ${errMsg}` })
        .eq("id", order_id);
      return json({ success: false, error: errMsg, provider: resultBody, raw: respText.slice(0, 500) });
    }

    const swiftOrderId = resultBody?.order_id || resultBody?.data?.id || resultBody?.data?.order_id || null;
    const swiftStatus = resultBody?.status || resultBody?.data?.status || "processing";

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
