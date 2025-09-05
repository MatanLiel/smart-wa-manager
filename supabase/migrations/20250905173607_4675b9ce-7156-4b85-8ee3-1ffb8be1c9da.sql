-- Create businesses table for storing business configurations
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  assistant_name TEXT NOT NULL,
  description TEXT,
  tone TEXT NOT NULL DEFAULT 'professional',
  working_hours TEXT NOT NULL DEFAULT '9:00-17:00',
  service_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create conversations table for managing customer conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  UNIQUE(business_id, customer_phone)
);

-- Create messages table for individual messages in conversations
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'assistant')),
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for businesses table (public access for configuration)
CREATE POLICY "Anyone can view businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert businesses" ON public.businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update businesses" ON public.businesses FOR UPDATE USING (true);

-- Create policies for conversations table (business-specific access)
CREATE POLICY "Business can view own conversations" ON public.conversations 
  FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE phone_number = current_setting('app.current_phone', true)));

CREATE POLICY "Business can insert own conversations" ON public.conversations 
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE phone_number = current_setting('app.current_phone', true)));

CREATE POLICY "Business can update own conversations" ON public.conversations 
  FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE phone_number = current_setting('app.current_phone', true)));

-- Create policies for messages table (conversation-specific access)
CREATE POLICY "Business can view own messages" ON public.messages 
  FOR SELECT USING (conversation_id IN (
    SELECT c.id FROM public.conversations c 
    JOIN public.businesses b ON c.business_id = b.id 
    WHERE b.phone_number = current_setting('app.current_phone', true)
  ));

CREATE POLICY "Business can insert own messages" ON public.messages 
  FOR INSERT WITH CHECK (conversation_id IN (
    SELECT c.id FROM public.conversations c 
    JOIN public.businesses b ON c.business_id = b.id 
    WHERE b.phone_number = current_setting('app.current_phone', true)
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_last_message_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_businesses_phone ON public.businesses(phone_number);
CREATE INDEX idx_conversations_business_customer ON public.conversations(business_id, customer_phone);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at);