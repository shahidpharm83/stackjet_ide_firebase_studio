import ActivityBar from "@/components/layout/activity-bar";
import Header from "@/components/layout/header";
import AiAssistantPanel from "@/components/panels/ai-assistant-panel";
import FileExplorer from "@/components/panels/file-explorer";
import MainPanel from "@/components/panels/main-panel";
import PreviewPanel from "@/components/panels/preview-panel";
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans text-sm">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider defaultOpen>
          <Sidebar side="left" className="border-r border-border">
            <MainPanel />
          </Sidebar>
          <ActivityBar />
          <SidebarInset>
            <div className="flex h-full">
              <div className="h-full w-64 border-r border-border">
                <FileExplorer />
              </div>
              <div className="flex-1">
                <PreviewPanel />
              </div>
              <div className="h-full w-96 border-l border-border">
                <AiAssistantPanel />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}