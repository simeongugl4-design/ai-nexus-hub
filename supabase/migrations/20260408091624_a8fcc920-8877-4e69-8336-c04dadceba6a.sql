
-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT NOT NULL DEFAULT 'creative',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: anyone can CRUD (auth disabled currently, user_id nullable)
CREATE POLICY "Anyone can view conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update conversations" ON public.conversations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete conversations" ON public.conversations FOR DELETE USING (true);

-- Chat messages: anyone can CRUD
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete chat messages" ON public.chat_messages FOR DELETE USING (true);

-- Index for fast message lookups
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);
