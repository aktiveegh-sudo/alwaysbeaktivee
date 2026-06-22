// Shared TxtConnect SMS helper. Sends a single SMS via the TxtConnect API.
// Docs: https://txtconnect.net/ApiDocumentation
// Endpoint: POST https://api.txtconnect.net/dev/api/sms/send

const TXTCONNECT_URL = "https://api.txtconnect.net/dev/api/sms/send";
export const DEFAULT_SENDER_ID = "AKTIVE DATA";

export type SmsResult = {
  success: boolean;
  status: number;
  body: unknown;
  error?: string;
};

// Normalize a Ghana phone number into local 0XXXXXXXXX form expected by the gateway.
export function normalizeGhPhone(raw: string): string {
  let n = String(raw || "").replace(/\D/g, "");
  if (n.startsWith("233") && n.length === 12) n = "0" + n.slice(3);
  if (n.length === 9) n = "0" + n;
  return n;
}

export async function sendSms(opts: {
  to: string;
  message: string;
  from?: string;
  apiKey?: string;
}): Promise<SmsResult> {
  const apiKey = opts.apiKey ?? Deno.env.get("TXTCONNECT_API_KEY");
  if (!apiKey) {
    return { success: false, status: 0, body: null, error: "Missing TXTCONNECT_API_KEY" };
  }
  const to = normalizeGhPhone(opts.to);
  if (!to) {
    return { success: false, status: 0, body: null, error: "Invalid recipient phone" };
  }

  const payload = {
    to,
    from: opts.from || DEFAULT_SENDER_ID,
    unicode: "regular",
    sms: opts.message,
  };

  try {
    const resp = await fetch(TXTCONNECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    const ok = resp.ok && (body?.data?.in_error === false || body?.msg?.toLowerCase?.().includes("success") || resp.status === 200);
    return {
      success: ok,
      status: resp.status,
      body,
      error: ok ? undefined : (body?.data?.reason || body?.msg || `SMS failed (${resp.status})`),
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      body: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Build the standard purchase-success message.
export function buildPurchaseSmsMessage(opts: {
  productName?: string | null;
  dataVolumeMb?: number | null;
  reference?: string | null;
}): string {
  const gb =
    opts.dataVolumeMb && opts.dataVolumeMb > 0
      ? `${(opts.dataVolumeMb / 1000).toFixed(opts.dataVolumeMb % 1000 === 0 ? 0 : 2)}GB`
      : (opts.productName || "your data bundle");
  const ref = opts.reference ? ` (Ref: ${opts.reference})` : "";
  return `Hello! Your order of ${gb} is being processed and will arrive shortly${ref}. Thank you for buying from AKTIVE GHANA.`;
}
