import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    console.log(`Request: ${req.method} ${url.pathname}`);

    if (req.method === 'GET') {
      // GET /config/{phone} - Fetch business configuration
      const phone = url.pathname.split('/').pop();
      
      if (!phone) {
        return new Response(JSON.stringify({ error: 'Phone number is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetching config for phone: ${phone}`);

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('phone_number', decodeURIComponent(phone))
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!data) {
        console.log(`No business found for phone: ${phone}`);
        return new Response(JSON.stringify({ error: 'Business not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Transform database response to match expected format
      const response = {
        assistant_name: data.assistant_name,
        description: data.description || '',
        tone: data.tone,
        working_hours: data.working_hours,
        service_type: data.service_type
      };

      console.log('Config fetched successfully:', response);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'POST') {
      // POST /config - Save business configuration
      const body = await req.json();
      console.log('Saving config:', body);

      const { assistant_name, description, tone, working_hours, service_type, phone_number } = body;

      if (!assistant_name || !phone_number) {
        return new Response(JSON.stringify({ error: 'Assistant name and phone number are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Try to update existing business first
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('phone_number', phone_number)
        .maybeSingle();

      let result;
      if (existingBusiness) {
        // Update existing business
        result = await supabase
          .from('businesses')
          .update({
            assistant_name,
            description: description || '',
            tone: tone || 'professional',
            working_hours: working_hours || '9:00-17:00',
            service_type: service_type || 'general',
          })
          .eq('phone_number', phone_number);
      } else {
        // Create new business
        result = await supabase
          .from('businesses')
          .insert({
            phone_number,
            assistant_name,
            description: description || '',
            tone: tone || 'professional',
            working_hours: working_hours || '9:00-17:00',
            service_type: service_type || 'general',
          });
      }

      if (result.error) {
        console.error('Database error:', result.error);
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Config saved successfully');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});