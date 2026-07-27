// Agent activation payment: initialize a Paystack checkout for the one-time
// signup fee (always read live from site_settings) and grant the agent role
// after verifying the payment.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const CURRENCY = Deno.env.get("PAYSTACK_CURRENCY") ?? "GHS";
    if (!PAYSTACK_SECRET_KEY) return json({ success: false, error: "Paystack is not configured." });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => null);
    const action = String(body?.action ?? "init");

    if (action === "init") {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) {
        return json({ success: false, error: "You must be signed in to activate." });
      }
      const authed = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await authed.auth.getUser();
      const user = userData?.user;
      if (userErr || !user) return json({ success: false, error: "Invalid session. Please sign in again." });

      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
      if ((roles || []).some((r: { role: string }) => r.role === "agent" || r.role === "admin")) {
        return json({ success: false, error: "Your account is already activated." });
      }

      const { data: settings } = await admin
        .from("site_settings")
        .select("agent_signup_fee")
        .maybeSingle();
      const fee = Number(settings?.agent_signup_fee ?? 0);
      if (!(fee > 0)) return json({ success: false, error: "Activation fee is not configured." });

      const returnUrl = String(body?.return_url ?? "");
      if (!returnUrl) return json({ success: false, error: "return_url is required." });

      const reference = `ACT-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .maybeSingle();
      const email = profile?.email || user.email || "no-reply@aktivee.shop";

      const paystackResp = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.max(1, Math.round(fee * 100)),
          currency: CURRENCY,
          reference,
          callback_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}order_reference=${reference}`,
          metadata: { purpose: "agent_activation", user_id: user.id },
        }),
      });
      const paystackBody = await paystackResp.json().catch(() => null);
      if (!paystackResp.ok || !paystackBody?.status) {
        return json({ success: false, error: paystackBody?.message || "Could not start payment." });
      }

      await admin.from("payment_transactions").insert({
        reference,
        user_id: user.id,
        purpose: "agent_activation",
        amount: fee,
        currency: CURRENCY,
        status: "pending",
        metadata: { user_id: user.id },
        paystack_access_code: paystackBody.data.access_code ?? null,
        paystack_authorization_url: paystackBody.data.authorization_url ?? null,
      });

      return json({
        success: true,
        authorization_url: paystackBody.data.authorization_url,
        reference,
        amount: fee,
      });
    }

    if (action === "verify") {
      const reference = String(body?.reference ?? "");
      if (!reference) return json({ success: false, error: "reference is required." });

      const { data: tx } = await admin
        .from("payment_transactions")
        .select("id, user_id, status, amount")
        .eq("reference", reference)
        .maybeSingle();
      if (!tx) return json({ success: false, error: "Activation payment not found." });

      if (tx.status === "success") {
        await admin.rpc("activate_agent", { _user_id: tx.user_id });
        return json({ success: true, message: "Your agent account is already activated.", activated: true });
      }

      const verifyResp = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const verifyBody = await verifyResp.json().catch(() => null);
      if (!verifyResp.ok || !verifyBody?.status || verifyBody.data?.status !== "success") {
        return json({ success: false, error: verifyBody?.message || "Payment not confirmed yet." });
      }

      const { error: rpcErr } = await admin.rpc("activate_agent", { _user_id: tx.user_id });
      if (rpcErr) return json({ success: false, error: rpcErr.message });

      await admin
        .from("payment_transactions")
        .update({ status: "success", processed_at: new Date().toISOString(), paystack_response: verifyBody })
        .eq("id", tx.id);

      return json({
        success: true,
        activated: true,
        message: "Payment confirmed. Your agent account is now active.",
      });
    }

    return json({ success: false, error: "Unknown action." });
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
