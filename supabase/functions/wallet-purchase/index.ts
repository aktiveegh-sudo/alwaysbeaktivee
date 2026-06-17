// Pays for an order using the signed-in user's wallet balance (no fees),
// then forwards the order to the Swift fulfillment pipeline.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ success: false, error: "Missing Authorization header" });
    }

    // Authed client to enforce auth.uid() inside RPC.
    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => null);
    const orderId = String(body?.order_id ?? "");
    if (!orderId) return json({ success: false, error: "order_id is required" });

    const { data: payResult, error: payErr } = await authed.rpc("wallet_pay_for_order", {
      _order_id: orderId,
    });
    if (payErr) return json({ success: false, error: payErr.message });
    if (!payResult || (payResult as any).success !== true) {
      return json({ success: false, error: "Wallet payment failed", details: payResult });
    }

    // Fulfill via Swift.
    const purchaseResp = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/purchase-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    const purchaseRaw = await purchaseResp.text();
    let purchase: any = null;
    try { purchase = purchaseRaw ? JSON.parse(purchaseRaw) : null; } catch { purchase = null; }

    if (!purchase?.success) {
      // Refund wallet because fulfillment failed.
      const { data: order } = await admin
        .from("orders")
        .select("amount, reference, buyer_user_id")
        .eq("id", orderId)
        .maybeSingle();
      if (order?.buyer_user_id) {
        const { data: w } = await admin
          .from("wallets")
          .select("balance")
          .eq("user_id", order.buyer_user_id)
          .maybeSingle();
        const newBalance = Number(w?.balance || 0) + Number(order.amount);
        await admin
          .from("wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", order.buyer_user_id);
        await admin.from("wallet_transactions").insert({
          user_id: order.buyer_user_id,
          amount: Number(order.amount),
          type: "refund",
          description: `Refund: fulfillment failed for ${order.reference}`,
        });
      }
      return json({
        success: false,
        error: purchase?.error || "Fulfillment failed; wallet refunded.",
        details: purchase,
      });
    }

    return json({
      success: true,
      message: "Paid from wallet and fulfillment started.",
      order_reference: (payResult as any).reference,
      purchase,
    });
  } catch (err) {
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
