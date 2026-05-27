// Edge function: forward a data order to the Spendless API and update its status.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPENDLESS_URL = "https://spendless.top/api/purchase";
const SPENDLESS_API_KEY =
  Deno.env.get("SPENDLESS_API_KEY") ||
  "api_8c4a0cb55c916b0e1bd30d2f263118ce5e42e94a78b14a7308dca33d399fdda6";

const NETWORK_MAP: Record<string, string> = {
  mtn: "YELLO",
  telecel: "TELECEL",
  airteltigo: "AT_PREMIUM",
  airteltigo_bigtime: "AT_BIGTIME",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return json({ success: false, error: "order_id required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, reference, recipient_phone, amount, status, products(name, type, network, data_volume_mb)")
      .eq("id", order_id)
      .maybeSingle();

    if (oErr || !order) {
      return json({ success: false, error: oErr?.message || "Order not found" }, 404);
    }

    const product = (order as any).products;
    if (!product || product.type !== "data") {
      // Non-data products (e.g. checkers) don't need an API call.
      return json({ success: true, skipped: true });
    }

    const networkKey = NETWORK_MAP[product.network as string];
    if (!networkKey) {
      await supabase.from("orders").update({ status: "failed", notes: `Unsupported network ${product.network}` }).eq("id", order_id);
      return json({ success: false, error: `Unsupported network: ${product.network}` }, 400);
    }

    const mb = Number(product.data_volume_mb || 0);
    const capacity = Math.max(1, Math.round(mb / 1024));

    // Normalise recipient to 10-digit local format starting with 0.
    let recipient = String(order.recipient_phone || "").replace(/\D/g, "");
    if (recipient.startsWith("233") && recipient.length === 12) recipient = "0" + recipient.slice(3);
    if (recipient.length === 9) recipient = "0" + recipient;

    const payload = {
      networkKey,
      recipient,
      capacity,
    };

    const resp = await fetch(SPENDLESS_URL, {
      method: "POST",
      headers: {
        "X-API-Key": SPENDLESS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }

    if (!resp.ok || body?.status !== "success") {
      const errMsg = body?.message || body?.error || `Provider error ${resp.status}`;
      await supabase
        .from("orders")
        .update({ status: "failed", notes: `Spendless: ${errMsg}` })
        .eq("id", order_id);
      return json({ success: false, error: errMsg, provider: body }, 502);
    }

    const providerRef = body?.data?.reference || body?.data?.orderId || null;
    await supabase
      .from("orders")
      .update({
        status: "processing",
        notes: providerRef ? `Spendless ref: ${providerRef}` : "Submitted to Spendless",
      })
      .eq("id", order_id);

    return json({ success: true, provider: body });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ success: false, error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
