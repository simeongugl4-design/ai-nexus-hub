import { useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { ToolsPanel } from "@/components/ToolsPanel";
import { TopNav } from "@/components/TopNav";
import { ConversationList } from "@/components/ConversationList";
import { getMessages } from "@/lib/conversations";
import { conversationToMarkdown, downloadMarkdown, safeFilename } from "@/lib/export-conversation";
import { exportConversationPDF } from "@/lib/export-vision-pdf";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleToolClick = useCallback((prefix: string) => {
    setInputPrefill(prefix);
    setPrefillKey((k) => k + 1);
  }, []);

  const handleFollowUp = useCallback((prefix: string) => {
    sendMessage(prefix);
  }, [sendMessage]);

  const loadMessagesForExport = useCallback(async (id: string): Promise<Message[]> => {
    if (id === activeConversationId) return messages;
    const dbMsgs = await getMessages(id);
    return dbMsgs.map((m) => {
      const imageUrls: string[] = [];
      const cleanContent = m.content.replace(
        /!\[attached\]\((data:image\/[^)]+)\)/g,
        (_full, url: string) => { imageUrls.push(url); return ""; }
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
  }, [activeConversationId, messages]);

  const handleExport = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const exportMsgs = await loadMessagesForExport(id);
    const md = conversationToMarkdown(conv.title, exportMsgs);
    downloadMarkdown(`${safeFilename(conv.title)}.md`, md);
  }, [conversations, loadMessagesForExport]);

  const handleExportPdf = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const exportMsgs = await loadMessagesForExport(id);
    await exportConversationPDF({ title: conv.title, messages: exportMsgs, model: conv.model });
  }, [conversations, loadMessagesForExport]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />

      {/* Mobile drawer toggle */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-3 py-2 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-1.5 text-xs text-foreground"
          aria-label="Open conversations"
        >
          <Menu className="h-4 w-4" />
          Chats
        </button>
        <button
          onClick={newChat}
          className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs text-primary"
        >
          + New
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <ConversationList
          className="hidden md:flex"
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={selectConversation}
          onNew={newChat}
          onDelete={deleteConversation}
          onRename={renameConversation}
          onExport={handleExport}
          onExportPdf={handleExportPdf}
        />

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={closeDrawer} />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-semibold">Conversations</span>
                <button onClick={closeDrawer} className="rounded p-1 hover:bg-muted" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ConversationList
                className="!w-full border-r-0"
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={(id) => { selectConversation(id); closeDrawer(); }}
                onNew={() => { newChat(); closeDrawer(); }}
                onDelete={deleteConversation}
                onRename={renameConversation}
                onExport={handleExport}
                onExportPdf={handleExportPdf}
              />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col min-w-0">
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

        {/* Tools panel only on larger screens */}
        <div className="hidden lg:block">
          <ToolsPanel onToolClick={handleToolClick} />
        </div>
      </div>
    </div>
  );
}
