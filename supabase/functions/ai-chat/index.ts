import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, business, conversation_id } = await req.json();

    // Get conversation history for context
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_type, content, sent_at')
      .eq('conversation_id', conversation_id)
      .order('sent_at', { ascending: true })
      .limit(10);

    // Build conversation context
    const conversationHistory = messages?.map(msg => ({
      role: msg.sender_type === 'customer' ? 'user' : 'assistant',
      content: msg.content
    })) || [];

    // Create system prompt based on business configuration
    const currentTime = new Date().toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem' });
    const systemPrompt = `אתה ${business.assistant_name}, עוזר וירטואלי של ${business.assistant_name}.

תיאור העסק: ${business.description || 'עסק מקומי'}
סוג השירות: ${business.service_type}
שעות פעילות: ${business.working_hours}
טון השיחה: ${business.tone}

השעה הנוכחית: ${currentTime}

הנחיות:
- ענה בעברית בלבד
- השתמש בטון ${business.tone}
- אם השאלה מחוץ לשעות הפעילות, ציין את שעות הפעילות ואמר שתחזור לענות בשעות הפעילות
- היה מועיל ואדיב
- אם אתה לא יודע משהו, אמר שתעביר את הפרטים לצוות
- אל תמציא מידע על המוצרים או המחירים

זכור: אתה מייצג את ${business.assistant_name}.`;

    // Generate AI response
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8), // Last 8 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: aiMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    const aiReply = aiData.choices[0].message.content;

    console.log('AI response generated:', aiReply);

    // Save AI response to database
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation_id,
        sender_type: 'assistant',
        content: aiReply
      });

    if (msgError) {
      console.error('Failed to save AI message:', msgError);
    }

    // Send response back via WhatsApp (if token is configured)
    if (whatsappToken) {
      // Get customer phone from conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('customer_phone')
        .eq('id', conversation_id)
        .single();

      if (conversation) {
        const whatsappResponse = await fetch(`https://graph.facebook.com/v17.0/${business.phone_number}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: conversation.customer_phone,
            text: { body: aiReply }
          }),
        });

        if (!whatsappResponse.ok) {
          console.error('Failed to send WhatsApp message:', await whatsappResponse.text());
        } else {
          console.log('WhatsApp message sent successfully');
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      reply: aiReply 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});