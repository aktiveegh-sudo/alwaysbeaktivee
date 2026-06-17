import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchSwiftPlans, resolveSwiftPackageIdFromPlans } from "../_shared/swift.ts";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let productId: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        productId = body?.product_id ? String(body.product_id) : null;
      } catch {
        productId = null;
      }
    }

    const plans = await fetchSwiftPlans(SWIFT_API_URL, SWIFT_API_KEY);
    if (!plans.length) {
      return json({ success: false, error: "Unable to fetch Swift plans." });
    }

    let query = supabase
      .from("products")
      .select("id, name, network, type, data_volume_mb, swift_package_id")
      .eq("type", "data");

    if (productId) {
      query = query.eq("id", productId);
    }

    const { data: products, error } = await query;
    if (error) {
      return json({ success: false, error: error.message });
    }

    const results: Array<{ id: string; name: string; swift_package_id: string | null; status: string }> = [];

    for (const product of products || []) {
      const resolved = resolveSwiftPackageIdFromPlans(product.swift_package_id, product, plans);
      if (!resolved) {
        if (product.swift_package_id) {
          await supabase.from("products").update({ swift_package_id: null }).eq("id", product.id);
        }
        results.push({
          id: product.id,
          name: product.name,
          swift_package_id: null,
          status: "unmatched",
        });
        continue;
      }

      if (product.swift_package_id === resolved) {
        results.push({
          id: product.id,
          name: product.name,
          swift_package_id: resolved,
          status: "already_set",
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ swift_package_id: resolved })
        .eq("id", product.id);

      results.push({
        id: product.id,
        name: product.name,
        swift_package_id: resolved,
        status: updateError ? "update_failed" : "updated",
      });
    }

    const updated = results.filter((item) => item.status === "updated").length;
    const unmatched = results.filter((item) => item.status === "unmatched").length;

    return json({
      success: true,
      updated,
      unmatched,
      total: results.length,
      results,
    });
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
