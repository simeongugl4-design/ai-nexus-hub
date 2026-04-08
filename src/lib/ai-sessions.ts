import { supabase } from "@/integrations/supabase/client";

export interface AISession {
  id: string;
  type: string;
  title: string;
  model: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AISessionEntry {
  id: string;
  session_id: string;
  query: string;
  response: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function getSessions(type: string): Promise<AISession[]> {
  const { data, error } = await supabase
    .from("ai_sessions")
    .select("*")
    .eq("type", type)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AISession[];
}

export async function createSession(type: string, title: string, model: string, metadata?: Record<string, unknown>): Promise<AISession> {
  const { data, error } = await supabase
    .from("ai_sessions")
    .insert({ type, title, model, metadata: metadata ?? {} } as any)
    .select()
    .single();
  if (error) throw error;
  return data as AISession;
}

export async function updateSessionTitle(id: string, title: string) {
  await supabase.from("ai_sessions").update({ title, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function deleteSession(id: string) {
  await supabase.from("ai_sessions").delete().eq("id", id);
}

export async function getSessionEntries(sessionId: string): Promise<AISessionEntry[]> {
  const { data, error } = await supabase
    .from("ai_session_entries")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AISessionEntry[];
}

export async function saveSessionEntry(sessionId: string, query: string, response: string, metadata?: Record<string, unknown>) {
  await supabase.from("ai_session_entries").insert({
    session_id: sessionId,
    query,
    response,
    metadata: metadata ?? {},
  });
  await supabase.from("ai_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
}

export async function updateSessionEntry(id: string, response: string) {
  await supabase.from("ai_session_entries").update({ response }).eq("id", id);
}

export function truncateTitle(text: string, max = 50): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}
