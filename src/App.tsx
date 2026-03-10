import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import ResearchPage from "./pages/ResearchPage";
import DocumentsPage from "./pages/DocumentsPage";
import ImageAIPage from "./pages/ImageAIPage";
import CodeAssistantPage from "./pages/CodeAssistantPage";
import MathSolverPage from "./pages/MathSolverPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import SavedResponsesPage from "./pages/SavedResponsesPage";
import HistoryPage from "./pages/HistoryPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-14 items-center border-b border-border bg-card px-4">
        <h1 className="font-heading font-semibold">{title}</h1>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-heading font-bold gradient-text">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/image-ai" element={<ImageAIPage />} />
            <Route path="/code" element={<CodeAssistantPage />} />
            <Route path="/math" element={<MathSolverPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/saved" element={<SavedResponsesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" description="Customize your MegaKUMUL experience" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
