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

    const rawReq = await req.text();
    let reqBody: any = null;
    try {
      reqBody = rawReq ? JSON.parse(rawReq) : null;
    } catch {
      return json({ success: false, error: "Invalid JSON in request body." });
    }
    const order_id = reqBody?.order_id;
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

    const resolvedPackageId = await resolveSwiftPackageId(swiftPackageId, product, SWIFT_API_URL, SWIFT_API_KEY);
    if (!resolvedPackageId) {
      await supabase
        .from("orders")
        .update({ status: "failed", swift_status: "fulfillment_failed", notes: "Unable to resolve Swift package ID for product." })
        .eq("id", order_id);
      return json({ success: false, error: "Unable to resolve Swift package ID for product." });
    }

    // Build payload matching SwiftData docs: package_id + phone (+ optional request_id)
    const payload = {
      package_id: resolvedPackageId,
      phone: recipient,
      request_id: order.reference,
      metadata: {
        order_id,
        product_id: order.product_id,
        product_name: product.name,
      },
    };

    const bodyStr = JSON.stringify(payload);

    // Prepare headers: Authorization + Content-Type + Idempotency
    const headers: Record<string, string> = {
      Authorization: `Bearer ${SWIFT_API_KEY}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": String(order.reference || order_id),
    };

    // Optional HMAC signing: use SWIFT_SIGNING_KEY if available to compute X-Swift-Signature
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
      } catch (e) {
        // signature failure should not block fulfillment; log via notes later
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

async function fetchSwiftPlans(swiftApiUrl: string, apiKey: string) {
  try {
    const url = new URL(swiftApiUrl);
    if (url.pathname.endsWith("/payment/data")) {
      url.pathname = url.pathname.replace(/\/payment\/data$/, "/plans");
    } else {
      url.pathname = url.pathname.replace(/\/$/, "") + "/plans";
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const body = await response.json();
    return Array.isArray(body?.plans) ? body.plans : [];
  } catch {
    return [];
  }
}

function normalizePackageSize(dataVolumeMb: number | null) {
  if (!dataVolumeMb) return null;
  if (dataVolumeMb % 1024 === 0) return `${dataVolumeMb / 1024}GB`;
  return `${dataVolumeMb}MB`;
}

function networkCandidates(network: string) {
  const value = network?.toLowerCase();
  if (value === "mtn") return ["BLUE", "MTN", "RED", "YELLO"];
  if (value === "telecel") return ["YELLO", "TELECEL", "RED"];
  if (value === "airteltigo") return ["YELLO", "AT", "RED"];
  return ["BLUE", "YELLO", "RED", "MTN", "TELECEL", "AT"];
}

async function resolveSwiftPackageId(
  swiftPackageId: string,
  product: any,
  swiftApiUrl: string,
  apiKey: string
) {
  const plans = await fetchSwiftPlans(swiftApiUrl, apiKey);
  const exactMatch = plans.find((plan: any) => plan.package_id === swiftPackageId);
  if (exactMatch) return swiftPackageId;

  const packageSize = normalizePackageSize(product.data_volume_mb);
  if (!packageSize) return null;

  const networkOrder = networkCandidates(product.network);
  const candidates = plans.filter((plan: any) => plan.package_size === packageSize);
  for (const network of networkOrder) {
    const plan = candidates.find((candidate: any) => candidate.network === network);
    if (plan) return plan.package_id;
  }

  return candidates.length ? candidates[0].package_id : null;
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
