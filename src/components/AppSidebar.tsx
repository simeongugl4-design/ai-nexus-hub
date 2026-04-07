import {
  LayoutDashboard, MessageSquare, Search, FileText, ImageIcon,
  Code, BookOpen, Star, Clock, Puzzle, Settings, ChevronLeft, ChevronRight, Calculator, CreditCard, LogOut, Sparkles, Box, GalleryHorizontalEnd
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import megakumulLogo from "@/assets/megakumul-logo.png";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "AI Chat", url: "/chat", icon: MessageSquare },
  { title: "Deep Research", url: "/research", icon: Search },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Image AI", url: "/image-ai", icon: ImageIcon },
  { title: "Code Assistant", url: "/code", icon: Code },
  { title: "Math Solver", url: "/math", icon: Calculator },
  { title: "3D Diagrams", url: "/diagrams", icon: Box },
  { title: "Gallery", url: "/gallery", icon: GalleryHorizontalEnd },
];

const secondaryItems = [
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen },
  { title: "Saved Responses", url: "/saved", icon: Star },
  { title: "History", url: "/history", icon: Clock },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Pricing", url: "/pricing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { isTrialActive, trialDaysLeft, isPro, signOut, user } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={megakumulLogo} alt="MegaKUMUL" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          {!collapsed && (
            <span className="text-lg font-heading font-bold gradient-text">
              MegaKUMUL
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {/* Trial/Pro badge */}
        {!collapsed && (
          <div className="mx-3 mb-2">
            {isTrialActive ? (
              <div className="rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-secondary">
                  <Sparkles className="h-3 w-3" /> Pro Trial
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left</p>
              </div>
            ) : isPro ? (
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" /> Pro Plan
                </div>
              </div>
            ) : null}
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-primary glow-text"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-4 my-2 h-px bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-primary glow-text"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        {user && (
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg p-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        )}
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
