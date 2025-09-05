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
    if (req.method === 'GET') {
      // WhatsApp webhook verification
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === 'whatsapp_bot_verify') {
        console.log('Webhook verified');
        return new Response(challenge, { status: 200 });
      }
      
      return new Response('Forbidden', { status: 403 });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      // Process WhatsApp messages
      if (body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0]) {
        const change = body.entry[0].changes[0];
        
        if (change.value && change.value.messages && change.value.messages[0]) {
          const message = change.value.messages[0];
          const customerPhone = message.from;
          const messageText = message.text?.body || '';
          const businessPhone = change.value.metadata?.phone_number_id;

          console.log(`Message from ${customerPhone} to business ${businessPhone}: ${messageText}`);

          // Find the business by phone number
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('phone_number', businessPhone)
            .single();

          if (businessError || !business) {
            console.log('Business not found for phone:', businessPhone);
            return new Response('Business not found', { status: 404 });
          }

          // Find or create conversation
          let conversation;
          const { data: existingConv, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('business_id', business.id)
            .eq('customer_phone', customerPhone)
            .eq('status', 'active')
            .single();

          if (convError || !existingConv) {
            // Create new conversation
            const { data: newConv, error: newConvError } = await supabase
              .from('conversations')
              .insert({
                business_id: business.id,
                customer_phone: customerPhone,
                status: 'active'
              })
              .select()
              .single();

            if (newConvError) {
              throw new Error(`Failed to create conversation: ${newConvError.message}`);
            }
            conversation = newConv;
          } else {
            conversation = existingConv;
            // Update last message timestamp
            await supabase
              .from('conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', conversation.id);
          }

          // Save customer message
          const { error: msgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              sender_type: 'customer',
              content: messageText
            });

          if (msgError) {
            throw new Error(`Failed to save message: ${msgError.message}`);
          }

          // Generate AI response
          const aiResponse = await supabase.functions.invoke('ai-chat', {
            body: {
              message: messageText,
              business: business,
              conversation_id: conversation.id
            }
          });

          if (aiResponse.error) {
            console.error('AI response error:', aiResponse.error);
          }

          return new Response('OK', { status: 200 });
        }
      }

      return new Response('No message processed', { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});