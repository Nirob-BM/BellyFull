import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use the anon key (NOT the service role key) — the SECURITY DEFINER
    // RPC `get_public_payment_info` returns only the four safe payment fields.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data, error } = await supabase.rpc("get_public_payment_info");

    if (error) throw error;

    const value = (data as Record<string, unknown>) || {};
    const safe = {
      bkash_number: value.bkash_number ?? "",
      nagad_number: value.nagad_number ?? "",
      bkash_type: value.bkash_type ?? "personal",
      nagad_type: value.nagad_type ?? "personal",
    };

    return new Response(JSON.stringify(safe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-payment-info error:", e);
    return new Response(JSON.stringify({ error: "Failed to load payment info" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
