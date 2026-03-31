import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_CURRENCIES = ["GHS","NGN","KES","ZAR","EGP","TZS","UGX","XOF","XAF","MAD","USD","EUR"];

// Cache rates in memory (edge function instance lifetime)
let cachedRates: Record<string, number> | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    if (cachedRates && now - cacheTime < CACHE_TTL) {
      return new Response(JSON.stringify({ rates: cachedRates, base: "GHS", cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch rates with GHS as base
    const response = await fetch("https://open.er-api.com/v6/latest/GHS");
    if (!response.ok) {
      throw new Error(`Exchange rate API failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.result !== "success") {
      throw new Error("Exchange rate API returned error");
    }

    // Filter to only supported currencies
    const rates: Record<string, number> = {};
    for (const code of SUPPORTED_CURRENCIES) {
      if (data.rates[code]) {
        rates[code] = data.rates[code];
      }
    }
    // GHS to GHS is always 1
    rates["GHS"] = 1;

    cachedRates = rates;
    cacheTime = now;

    return new Response(JSON.stringify({ rates, base: "GHS" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Exchange rate error:", error);

    // Fallback rates (approximate)
    const fallback: Record<string, number> = {
      GHS: 1, NGN: 100, KES: 8.5, ZAR: 1.2, EGP: 3.2,
      TZS: 170, UGX: 250, XOF: 40, XAF: 40, MAD: 0.65,
      USD: 0.065, EUR: 0.06,
    };

    return new Response(JSON.stringify({ rates: fallback, base: "GHS", fallback: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
