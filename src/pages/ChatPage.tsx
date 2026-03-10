import { useState, useCallback } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { ToolsPanel } from "@/components/ToolsPanel";
import { TopNav } from "@/components/TopNav";

export default function ChatPage() {
  const { messages, isLoading, sendMessage, selectedModel, setSelectedModel } = useChat();
  const [inputPrefill, setInputPrefill] = useState("");
  const [prefillKey, setPrefillKey] = useState(0);

  const handleToolClick = useCallback((prefix: string) => {
    setInputPrefill(prefix);
    setPrefillKey((k) => k + 1);
  }, []);

  const handleFollowUp = useCallback((prefix: string) => {
    sendMessage(prefix);
  }, [sendMessage]);

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <ChatMessages messages={messages} isLoading={isLoading} onSend={handleFollowUp} />
          <ChatInput
            key={prefillKey}
            onSend={sendMessage}
            isLoading={isLoading}
            prefill={inputPrefill}
            onPrefillUsed={() => setInputPrefill("")}
          />
        </div>
        <ToolsPanel onToolClick={handleToolClick} />
      </div>
    </div>
  );
}
