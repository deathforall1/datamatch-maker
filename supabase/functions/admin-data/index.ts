import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_PASSWORD = 'DARVIXHRSC';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, action, data } = await req.json();

    // Verify admin password
    if (password !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'get-participants': {
        const { data: participants, error } = await supabase
          .from('participants')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ participants }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-matches': {
        const { data: matches, error } = await supabase
          .from('matches')
          .select('*');

        if (error) throw error;
        return new Response(
          JSON.stringify({ matches }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-settings': {
        const { data: settings, error } = await supabase
          .from('app_settings')
          .select('*');

        if (error) throw error;
        return new Response(
          JSON.stringify({ settings }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-score': {
        const { matchId, field, value } = data;
        const { error } = await supabase
          .from('matches')
          .update({ [field]: value })
          .eq('id', matchId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'toggle-visibility': {
        const { visible } = data;
        
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', 'results_visible')
          .maybeSingle();

        if (existing) {
          await supabase
            .from('app_settings')
            .update({ value: visible })
            .eq('key', 'results_visible');
        } else {
          await supabase
            .from('app_settings')
            .insert({ key: 'results_visible', value: visible });
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Admin data error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
