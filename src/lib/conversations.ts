import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  model: string | null;
  created_at: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function createConversation(title: string, model: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ title, model })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateConversationTitle(id: string, title: string) {
  await supabase.from("conversations").update({ title, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function deleteConversation(id: string) {
  await supabase.from("conversations").delete().eq("id", id);
}

export async function getMessages(conversationId: string): Promise<DBMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DBMessage[];
}

export async function saveMessage(conversationId: string, role: string, content: string, model?: string) {
  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    model: model ?? null,
  });
  if (error) throw error;
  // Touch conversation updated_at
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
}

export function generateTitle(content: string): string {
  return content.length > 50 ? content.slice(0, 50) + "…" : content;
}
