
CREATE TABLE public.ai_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('research', 'code', 'math')),
  title TEXT NOT NULL DEFAULT 'New Session',
  model TEXT NOT NULL DEFAULT 'creative',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_session_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.ai_sessions(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_session_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai_sessions" ON public.ai_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create ai_sessions" ON public.ai_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ai_sessions" ON public.ai_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ai_sessions" ON public.ai_sessions FOR DELETE USING (true);

CREATE POLICY "Anyone can view ai_session_entries" ON public.ai_session_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can create ai_session_entries" ON public.ai_session_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ai_session_entries" ON public.ai_session_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ai_session_entries" ON public.ai_session_entries FOR DELETE USING (true);

CREATE INDEX idx_ai_sessions_type ON public.ai_sessions(type, updated_at DESC);
CREATE INDEX idx_ai_session_entries_session ON public.ai_session_entries(session_id, created_at);
