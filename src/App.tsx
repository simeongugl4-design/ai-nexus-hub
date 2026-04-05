import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TubesBackground } from "@/components/ui/neon-flow";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import ResearchPage from "./pages/ResearchPage";
import DocumentsPage from "./pages/DocumentsPage";
import ImageAIPage from "./pages/ImageAIPage";
import CodeAssistantPage from "./pages/CodeAssistantPage";
import MathSolverPage from "./pages/MathSolverPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import DiagramsPage from "./pages/DiagramsPage";
import SavedResponsesPage from "./pages/SavedResponsesPage";
import HistoryPage from "./pages/HistoryPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import SettingsPage from "./pages/SettingsPage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 relative">
          <TubesBackground className="absolute inset-0 z-0 opacity-30 pointer-events-auto" />
          <div className="relative z-10 h-full">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // AUTH DISABLED TEMPORARILY — all routes are public
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route path="/*" element={
              <ProtectedRoute>
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
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
