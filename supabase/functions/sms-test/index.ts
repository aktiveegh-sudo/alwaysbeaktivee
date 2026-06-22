// Test endpoint: send a single SMS via TxtConnect to verify integration.
// POST { to: "0XXXXXXXXX", message?: "...", from?: "AKTIVE GHANA" }
import { sendSms, DEFAULT_SENDER_ID } from "../_shared/sms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const to = String(body?.to ?? "");
    if (!to) {
      return json({ success: false, error: "`to` is required" }, 400);
    }
    const message = String(
      body?.message ??
        "Test from AKTIVE GHANA: your SMS integration is working. Thank you!",
    );
    const from = String(body?.from ?? DEFAULT_SENDER_ID);
    const result = await sendSms({ to, message, from });
    return json(result, result.success ? 200 : 502);
  } catch (err) {
    return json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
