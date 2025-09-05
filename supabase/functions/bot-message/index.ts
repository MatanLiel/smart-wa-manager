import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { phone, userId, text, messageType = 'incoming', timestamp } = await req.json();

    if (!phone || !userId || !text) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone, userId, text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the message
    console.log(`[${messageType}] Message from ${userId} to business ${phone}: ${text}`);
    console.log(`Timestamp: ${timestamp || new Date().toISOString()}`);

    // Find the business to validate the phone number
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, assistant_name')
      .eq('phone_number', phone)
      .single();

    if (businessError || !business) {
      console.log('Business not found for phone:', phone);
      return new Response(JSON.stringify({ 
        error: 'Business not found',
        logged: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Message logged for business: ${business.assistant_name} (ID: ${business.id})`);

    return new Response(JSON.stringify({ 
      success: true,
      logged: true,
      business_name: business.assistant_name,
      timestamp: timestamp || new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bot-message function:', error);
    return new Response(JSON.stringify({ error: error.message, logged: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});