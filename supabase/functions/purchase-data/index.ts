// Edge function: forward a data order to the SwiftData Reseller API for delivery.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendSms, buildPurchaseSmsMessage } from "../_shared/sms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESELLER_BASE_URL =
  Deno.env.get("SWIFT_RESELLER_BASE_URL") ||
  "https://ihrvvniomtoofrjkmalb.supabase.co/functions/v1/api/v1";

function mapNetwork(network: string | undefined | null): string | null {
  const n = (network || "").toLowerCase();
  if (n === "mtn" || n === "yello") return "yello";
  if (n === "telecel" || n === "vodafone") return "telecel";
  if (n === "airteltigo" || n === "at" || n === "at_ishare") return "at_ishare";
  if (n === "at_bigtime") return "at_bigtime";
  return null;
}

function toSizeGb(dataVolumeMb: number | null | undefined): number | null {
  if (!dataVolumeMb || dataVolumeMb <= 0) return null;
  const gb = dataVolumeMb / 1024;
  // Only whole-GB packages are supported by the reseller
  if (!Number.isFinite(gb)) return null;
  const rounded = Math.round(gb * 100) / 100;
  return rounded;
}

function normalizePhone(raw: string): string {
  let p = String(raw || "").replace(/\D/g, "");
  if (p.startsWith("233") && p.length === 12) p = "0" + p.slice(3);
  if (p.length === 9) p = "0" + p;
  return p;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const API_KEY = Deno.env.get("SWIFT_RESELLER_API_KEY");
    if (!API_KEY) {
      return json({ success: false, error: "Missing SWIFT_RESELLER_API_KEY environment variable." });
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
    if (!order_id) return json({ success: false, error: "order_id required" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select(
        "id, reference, recipient_phone, amount, status, notes, product_id, swift_order_id, swift_status, products(name, type, network, data_volume_mb)"
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
        message: "Order already submitted",
        swift_order_id: order.swift_order_id,
        swift_status: order.swift_status,
      });
    }

    const network = mapNetwork(product.network);
    const size_gb = toSizeGb(product.data_volume_mb);
    const phone = normalizePhone(order.recipient_phone);

    if (!network) {
      await supabase.from("orders").update({
        status: "failed",
        swift_status: "fulfillment_failed",
        notes: `Unsupported network: ${product.network}`,
      }).eq("id", order_id);
      return json({ success: false, error: `Unsupported network: ${product.network}` });
    }
    if (!size_gb) {
      await supabase.from("orders").update({
        status: "failed",
        swift_status: "fulfillment_failed",
        notes: `Unsupported data size (${product.data_volume_mb} MB)`,
      }).eq("id", order_id);
      return json({ success: false, error: `Unsupported data size: ${product.data_volume_mb} MB` });
    }

    const idemSuffix = retry ? `-r${Date.now()}` : "";
    const reference = `${order.reference}${idemSuffix}`;

    const payload = { phone, network, size_gb, reference };

    let resp: Response;
    try {
      resp = await fetch(`${RESELLER_BASE_URL}/buy-data`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      await supabase.from("orders").update({
        status: "failed",
        swift_status: "fulfillment_failed",
        notes: `Network error contacting provider: ${msg}`,
      }).eq("id", order_id);
      return json({ success: false, error: `Provider unreachable: ${msg}` });
    }

    const respText = await resp.text();
    let body: any = null;
    try { body = respText ? JSON.parse(respText) : null; } catch { body = null; }

    if (!resp.ok || !body?.success) {
      const rawErr = body?.error || body?.message || `Provider error ${resp.status}: ${respText.slice(0, 200)}`;
      await supabase.from("orders").update({
        status: "failed",
        swift_status: "fulfillment_failed",
        notes: `Provider error: ${rawErr}`,
      }).eq("id", order_id);
      return json({ success: false, error: rawErr, provider: body, raw: respText.slice(0, 500) });
    }

    const providerOrder = body.order || {};
    const providerRef = providerOrder.reference || reference;
    const providerStatus = providerOrder.status || "processing";
    const finalStatus = providerStatus === "completed" ? "delivered" : (providerStatus === "failed" ? "failed" : "processing");

    await supabase
      .from("orders")
      .update({
        status: finalStatus,
        swift_order_id: providerRef,
        swift_status: providerStatus,
        notes: `Provider ref: ${providerRef}`,
      })
      .eq("id", order_id);

    // Send SMS confirmation (non-blocking on failure)
    let smsResult: any = null;
    try {
      const message = buildPurchaseSmsMessage({
        productName: product?.name,
        dataVolumeMb: product?.data_volume_mb,
        reference: order.reference,
      });
      smsResult = await sendSms({ to: order.recipient_phone, message });
      if (!smsResult.success) console.warn("SMS send failed:", smsResult.error);
    } catch (smsErr) {
      console.warn("SMS send threw:", smsErr);
    }

    return json({ success: true, provider: body, sms: smsResult });
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
