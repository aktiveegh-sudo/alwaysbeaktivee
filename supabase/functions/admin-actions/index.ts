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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const { data: { user }, error: authError } = await createClient(supabaseUrl, anonKey).auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: adminRole } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, data } = body;

    if (action === "suspend-store") {
      if (!data.id) {
        return new Response(JSON.stringify({ error: "Missing store ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: store, error } = await supabaseAdmin.from("stores")
        .update({ is_suspended: Boolean(data.is_suspended) })
        .eq("id", data.id)
        .select()
        .single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ store }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete-store") {
      if (!data.id) {
        return new Response(JSON.stringify({ error: "Missing store ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabaseAdmin.from("products").delete().eq("store_id", data.id);
      await supabaseAdmin.from("store_analytics").delete().eq("store_id", data.id);
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

    if (action === "delete-user") {
      if (!data.user_id) {
        return new Response(JSON.stringify({ error: "Missing user ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Prevent self-deletion
      if (data.user_id === user.id) {
        return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Delete user's stores, products, analytics
      const { data: userStores } = await supabaseAdmin.from("stores").select("id").eq("user_id", data.user_id);
      if (userStores && userStores.length > 0) {
        const storeIds = userStores.map((s: any) => s.id);
        await supabaseAdmin.from("products").delete().in("store_id", storeIds);
        await supabaseAdmin.from("store_analytics").delete().in("store_id", storeIds);
        await supabaseAdmin.from("stores").delete().eq("user_id", data.user_id);
      }
      // Delete roles & profile
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
      await supabaseAdmin.from("profiles").delete().eq("id", data.user_id);
      // Delete auth user
      const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-stats") {
      const { count: storeCount } = await supabaseAdmin.from("stores").select("*", { count: "exact", head: true });
      const { count: userCount } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
      const { count: productCount } = await supabaseAdmin.from("products").select("*", { count: "exact", head: true });
      const { count: suspendedCount } = await supabaseAdmin.from("stores").select("*", { count: "exact", head: true }).eq("is_suspended", true);

      return new Response(JSON.stringify({
        stats: {
          stores: storeCount || 0,
          users: userCount || 0,
          products: productCount || 0,
          suspended: suspendedCount || 0,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-stores") {
      const { data: stores, error } = await supabaseAdmin.from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ stores }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-users") {
      const { data: profiles, error } = await supabaseAdmin.from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ profiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-store-products") {
      if (!data.store_id) {
        return new Response(JSON.stringify({ error: "Missing store ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: products, error } = await supabaseAdmin.from("products")
        .select("*")
        .eq("store_id", data.store_id)
        .order("created_at", { ascending: false });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-analytics") {
      const { data: analytics, error } = await supabaseAdmin.from("store_analytics")
        .select("*, stores(name, slug)")
        .order("store_views", { ascending: false });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Totals
      let totalViews = 0;
      let totalClicks = 0;
      (analytics || []).forEach((a: any) => {
        totalViews += a.store_views || 0;
        totalClicks += a.whatsapp_clicks || 0;
      });
      return new Response(JSON.stringify({ analytics, totalViews, totalClicks }), {
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
