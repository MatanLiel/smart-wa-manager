import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
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

    const { phone, userId, text } = await req.json();

    if (!phone || !userId || !text) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone, userId, text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing message from ${userId} (phone: ${phone}): ${text}`);

    // Find the business by phone number
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('phone_number', phone)
      .single();

    if (businessError || !business) {
      console.log('Business not found for phone:', phone);
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find or create conversation
    let conversation;
    const { data: existingConv, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('business_id', business.id)
      .eq('customer_phone', userId)
      .eq('status', 'active')
      .single();

    if (convError || !existingConv) {
      // Create new conversation
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          business_id: business.id,
          customer_phone: userId,
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
        content: text
      });

    if (msgError) {
      throw new Error(`Failed to save customer message: ${msgError.message}`);
    }

    // Get conversation history for context
    const { data: messages, error: historyError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('sent_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
    }

    // Build conversation context
    let conversationHistory = '';
    if (messages && messages.length > 1) {
      conversationHistory = '\n\nהיסטוריית השיחה האחרונה:\n';
      messages.slice(0, -1).forEach(msg => {
        const role = msg.sender_type === 'customer' ? 'לקוח' : 'אסיסטנט';
        conversationHistory += `${role}: ${msg.content}\n`;
      });
    }

    // Generate system prompt
    const systemPrompt = `אתה ${business.assistant_name}, אסיסטנט AI ידידותי ומועיל עבור ${business.assistant_name}.

תיאור העסק: ${business.description || 'לא סופק תיאור'}

סוג השירות: ${business.service_type}

שעות עבודה: ${business.working_hours}

סגנון התקשורת: ${business.tone}

אנא ענה בעברית, היה ${business.tone}, ועזור ללקוח בכל שאלה או בקשה.
${conversationHistory}`;

    // Generate AI response using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiData = await openaiResponse.json();
    const aiReply = aiData.choices[0].message.content;

    // Save AI response
    const { error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'assistant',
        content: aiReply
      });

    if (aiMsgError) {
      throw new Error(`Failed to save AI message: ${aiMsgError.message}`);
    }

    console.log(`AI response generated: ${aiReply}`);

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-reply function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});