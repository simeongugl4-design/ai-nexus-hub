import { useState, useCallback } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { ToolsPanel } from "@/components/ToolsPanel";
import { TopNav } from "@/components/TopNav";
import { ConversationList } from "@/components/ConversationList";
import { getMessages } from "@/lib/conversations";
import { conversationToMarkdown, downloadMarkdown, safeFilename } from "@/lib/export-conversation";
import type { Message } from "@/lib/types";

export default function ChatPage() {
  const {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
    selectedModel,
    setSelectedModel,
    conversations,
    activeConversationId,
    newChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    vision,
  } = useChat();
  const [inputPrefill, setInputPrefill] = useState("");
  const [prefillKey, setPrefillKey] = useState(0);

  const handleToolClick = useCallback((prefix: string) => {
    setInputPrefill(prefix);
    setPrefillKey((k) => k + 1);
  }, []);

  const handleFollowUp = useCallback((prefix: string) => {
    sendMessage(prefix);
  }, [sendMessage]);

  const handleExport = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    let exportMsgs: Message[];
    if (id === activeConversationId) {
      exportMsgs = messages;
    } else {
      const dbMsgs = await getMessages(id);
      exportMsgs = dbMsgs.map((m) => {
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
      });
    }

    const md = conversationToMarkdown(conv.title, exportMsgs);
    downloadMarkdown(`${safeFilename(conv.title)}.md`, md);
  }, [activeConversationId, conversations, messages]);

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={selectConversation}
          onNew={newChat}
          onDelete={deleteConversation}
          onRename={renameConversation}
          onExport={handleExport}
        />
        <div className="flex flex-1 flex-col">
          <ChatMessages messages={messages} isLoading={isLoading} onSend={handleFollowUp} vision={vision} />
          <ChatInput
            key={prefillKey}
            onSend={sendMessage}
            isLoading={isLoading}
            prefill={inputPrefill}
            onPrefillUsed={() => setInputPrefill("")}
            onStop={stopGeneration}
          />
        </div>
        <ToolsPanel onToolClick={handleToolClick} />
      </div>
    </div>
  );
}
