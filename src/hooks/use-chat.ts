import { useState, useCallback } from "react";
import { Message } from "@/lib/types";
import { streamChat } from "@/lib/chat-api";
import { addToHistory } from "@/pages/HistoryPage";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("creative");

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Add to history
    addToHistory({ query: content, source: "chat", preview: "" });

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    const allMessages = [...messages, userMsg];

    await streamChat({
      messages: allMessages,
      model: selectedModel,
      onDelta: (chunk) => {
        assistantContent += chunk;
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
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
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
  }, [messages, selectedModel]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages, selectedModel, setSelectedModel };
}
