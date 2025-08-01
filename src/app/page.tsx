import Header from "@/components/layout/header";
import AiAssistantPanel from "@/components/panels/ai-assistant-panel";
import FileExplorer from "@/components/panels/file-explorer";
import MainPanel from "@/components/panels/main-panel";
import PreviewPanel from "@/components/panels/preview-panel";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import LeftActivityBar from "@/components/layout/left-activity-bar";
import RightActivityBar from "@/components/layout/right-activity-bar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans text-sm">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <div className="flex flex-1">
            <LeftActivityBar />
            <Sidebar side="left" className="w-64 border-r border-border">
              <FileExplorer />
            </Sidebar>
            <Sidebar side="left" className="w-96 border-r border-border">
              <AiAssistantPanel />
            </Sidebar>
            <div className="flex-1 flex flex-col">
              <MainPanel />
            </div>
            <Sidebar side="right" className="flex-1 border-l border-border" collapsible="offcanvas">
              <PreviewPanel />
            </Sidebar>
            <RightActivityBar />
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
