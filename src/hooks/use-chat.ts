import { useState, useCallback, useEffect } from "react";
import { Message } from "@/lib/types";
import { streamChat } from "@/lib/chat-api";
import { hapticSuccess, hapticError } from "@/lib/native";
import { addToHistory } from "@/pages/HistoryPage";
import {
  Conversation,
  createConversation,
  getConversations,
  getMessages,
  saveMessage,
  updateConversationTitle,
  deleteConversation as deleteConv,
  generateTitle,
} from "@/lib/conversations";

export type VisionAnalysis = {
  active: boolean;
  imageUrls: string[];
  model?: string;
  streaming: boolean; // true once first delta has arrived
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("creative");
  const [vision, setVision] = useState<VisionAnalysis>({ active: false, imageUrls: [], streaming: false });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    getConversations()
      .then((convs) => {
        setConversations(convs);
        setConversationsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load conversations:", err);
        setConversationsLoaded(true);
      });
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    getMessages(activeConversationId).then((dbMsgs) => {
      setMessages(
        dbMsgs.map((m) => {
          // Extract embedded images from persisted markdown (data URLs)
          const imageUrls: string[] = [];
          const cleanContent = m.content.replace(
            /!\[attached\]\((data:image\/[^)]+)\)/g,
            (_full, url: string) => {
              imageUrls.push(url);
              return "";
            }
          ).trim();
          return {
            id: m.id,
            role: m.role as "user" | "assistant",
            content: cleanContent,
            timestamp: new Date(m.created_at),
            model: m.model ?? undefined,
            imageUrl: imageUrls[0],
            imageUrls: imageUrls.length ? imageUrls : undefined,
          };
        })
      );
    });
  }, [activeConversationId]);

  const sendMessage = useCallback(
    async (content: string, imageUrls?: string[]) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
        imageUrl: imageUrls?.[0],
        imageUrls,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Activate vision-analysis indicator if any images are attached
      if (imageUrls && imageUrls.length) {
        const visionModel =
          selectedModel === "gpt5" || selectedModel === "gpt52"
            ? "openai/gpt-5"
            : "google/gemini-2.5-pro";
        setVision({ active: true, imageUrls, model: visionModel, streaming: false });
      }

      addToHistory({ query: content, source: "chat", preview: imageUrls?.length ? `[${imageUrls.length} image(s)]` : "" });

      // Create conversation if none active
      let convId = activeConversationId;
      if (!convId) {
        try {
          const conv = await createConversation(generateTitle(content), selectedModel);
          convId = conv.id;
          setActiveConversationId(convId);
          setConversations((prev) => [conv, ...prev]);
        } catch {
          setIsLoading(false);
          return;
        }
      }

      // Persist user message — embed images as markdown so they survive reload
      const imageMarkdown = (imageUrls ?? []).map((u) => `![attached](${u})`).join("\n");
      const persisted = imageMarkdown ? `${content}\n\n${imageMarkdown}` : content;
      await saveMessage(convId, "user", persisted);

      let assistantContent = "";
      const assistantId = crypto.randomUUID();
      const allMessages = [...messages, userMsg];

      await streamChat({
        messages: allMessages,
        model: selectedModel,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setVision((v) => (v.active && !v.streaming ? { ...v, streaming: true } : v));
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === assistantId) {
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              );
            }
            return [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: assistantContent,
                timestamp: new Date(),
                model: selectedModel,
              },
            ];
          });
        },
        onDone: async () => {
          setIsLoading(false);
          setVision({ active: false, imageUrls: [], streaming: false });
          hapticSuccess();
          if (convId && assistantContent) {
            await saveMessage(convId, "assistant", assistantContent, selectedModel);
          }
        },
        onError: (error) => {
          setIsLoading(false);
          setVision({ active: false, imageUrls: [], streaming: false });
          hapticError();
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `⚠️ ${error}`,
              timestamp: new Date(),
            },
          ]);
        },
      });
    },
    [messages, selectedModel, activeConversationId]
  );

  const newChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      await deleteConv(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
    [activeConversationId]
  );

  const renameConversation = useCallback(async (id: string, title: string) => {
    await updateConversationTitle(id, title);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    selectedModel,
    setSelectedModel,
    conversations,
    activeConversationId,
    newChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    conversationsLoaded,
    vision,
  };
}
