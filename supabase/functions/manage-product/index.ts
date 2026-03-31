import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!).auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, data } = body;

    // Helper: verify product ownership via store
    const verifyOwnership = async (productId: string): Promise<boolean> => {
      const { data: product } = await supabaseAdmin.from("products").select("store_id").eq("id", productId).single();
      if (!product) return false;
      const { data: store } = await supabaseAdmin.from("stores").select("user_id").eq("id", product.store_id).single();
      return store?.user_id === user.id;
    };

    const verifyStoreOwnership = async (storeId: string): Promise<boolean> => {
      const { data: store } = await supabaseAdmin.from("stores").select("user_id").eq("id", storeId).single();
      return store?.user_id === user.id;
    };

    if (action === "create") {
      if (!data.store_id || !data.name || !data.slug) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!(await verifyStoreOwnership(data.store_id))) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const productData: Record<string, unknown> = {
        store_id: data.store_id,
        name: String(data.name).trim().slice(0, 200),
        slug: String(data.slug).trim().slice(0, 200),
        description: (data.description || "").slice(0, 1000),
        request_price: Boolean(data.request_price),
      };

      if (!data.request_price && data.price != null) {
        const price = parseFloat(data.price);
        if (isNaN(price) || price < 0 || price > 999999) {
          return new Response(JSON.stringify({ error: "Invalid price" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        productData.price = price;
      }

      if (data.image_url) {
        productData.image_url = String(data.image_url).slice(0, 2000);
      }

      const { data: product, error } = await supabaseAdmin.from("products").insert(productData).select().single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ product }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!data.id) {
        return new Response(JSON.stringify({ error: "Missing product ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!(await verifyOwnership(data.id))) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: Record<string, unknown> = {};
      if (data.name) updateData.name = String(data.name).trim().slice(0, 200);
      if (data.slug) updateData.slug = String(data.slug).trim().slice(0, 200);
      if (data.description !== undefined) updateData.description = String(data.description || "").slice(0, 1000);
      if (data.request_price !== undefined) updateData.request_price = Boolean(data.request_price);
      if (data.price !== undefined) {
        const price = data.price === null ? null : parseFloat(data.price);
        if (price !== null && (isNaN(price) || price < 0 || price > 999999)) {
          return new Response(JSON.stringify({ error: "Invalid price" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        updateData.price = price;
      }
      if (data.image_url !== undefined) {
        updateData.image_url = data.image_url ? String(data.image_url).slice(0, 2000) : null;
      }

      const { data: product, error } = await supabaseAdmin.from("products").update(updateData).eq("id", data.id).select().single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ product }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!data.id) {
        return new Response(JSON.stringify({ error: "Missing product ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!(await verifyOwnership(data.id))) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
