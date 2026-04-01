import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    if (action === "create") {
      // Validate required fields
      if (!data.name || typeof data.name !== "string" || data.name.length > 100) {
        return new Response(JSON.stringify({ error: "Invalid store name" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!data.slug || typeof data.slug !== "string") {
        return new Response(JSON.stringify({ error: "Invalid slug" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!data.whatsapp_number || typeof data.whatsapp_number !== "string") {
        return new Response(JSON.stringify({ error: "Invalid WhatsApp number" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: store, error } = await supabaseAdmin.from("stores").insert({
        user_id: user.id,
        name: data.name.trim().slice(0, 100),
        slug: data.slug.trim().slice(0, 100),
        description: (data.description || "").slice(0, 500),
        whatsapp_number: data.whatsapp_number.trim().slice(0, 20),
        business_hours_open: data.business_hours_open || "09:00",
        business_hours_close: data.business_hours_close || "17:00",
      }).select().single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ store }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!data.id) {
        return new Response(JSON.stringify({ error: "Missing store ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify ownership
      const { data: existing } = await supabaseAdmin.from("stores").select("user_id").eq("id", data.id).single();
      if (!existing || existing.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: Record<string, unknown> = {};
      if (data.name) updateData.name = String(data.name).trim().slice(0, 100);
      if (data.description !== undefined) updateData.description = String(data.description || "").slice(0, 500);
      if (data.whatsapp_number) updateData.whatsapp_number = String(data.whatsapp_number).trim().slice(0, 20);
      if (data.business_hours_open) updateData.business_hours_open = data.business_hours_open;
      if (data.business_hours_close) updateData.business_hours_close = data.business_hours_close;
      if (data.email !== undefined) updateData.email = data.email ? String(data.email).trim().slice(0, 255) : null;
      if (data.location !== undefined) updateData.location = data.location ? String(data.location).trim().slice(0, 255) : null;
      if (data.instagram !== undefined) updateData.instagram = data.instagram ? String(data.instagram).trim().slice(0, 100) : null;
      if (data.twitter !== undefined) updateData.twitter = data.twitter ? String(data.twitter).trim().slice(0, 100) : null;
      if (data.tiktok !== undefined) updateData.tiktok = data.tiktok ? String(data.tiktok).trim().slice(0, 100) : null;

      const { data: store, error } = await supabaseAdmin.from("stores").update(updateData).eq("id", data.id).select().single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ store }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!data.id) {
        return new Response(JSON.stringify({ error: "Missing store ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabaseAdmin.from("stores").select("user_id").eq("id", data.id).single();
      if (!existing || existing.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseAdmin.from("stores").delete().eq("id", data.id);
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
