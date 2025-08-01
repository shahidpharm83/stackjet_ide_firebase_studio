import Header from "@/components/layout/header";
import AiAssistantPanel from "@/components/panels/ai-assistant-panel";
import FileExplorer from "@/components/panels/file-explorer";
import MainPanel from "@/components/panels/main-panel";
import PreviewPanel from "@/components/panels/preview-panel";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import LeftActivityBar from "@/components/layout/left-activity-bar";
import RightActivityBar from "@/components/layout/right-activity-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, Bot } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans text-sm">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <div className="flex flex-1">
            <LeftActivityBar />
            <Sidebar side="left" className="w-96 border-r border-border" collapsible="offcanvas" defaultOpen={true}>
              <Tabs defaultValue="files" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-none p-0 h-12 border-b">
                  <TabsTrigger value="files" className="rounded-none h-full text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-none">
                    <File className="w-4 h-4 mr-2" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="rounded-none h-full text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-none">
                     <Bot className="w-4 h-4 mr-2" />
                    AI Assistant
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="files" className="flex-1 overflow-y-auto">
                  <FileExplorer />
                </TabsContent>
                <TabsContent value="ai" className="flex-1">
                  <AiAssistantPanel />
                </TabsContent>
              </Tabs>
            </Sidebar>
            <div className="flex-1 flex flex-col">
              <MainPanel />
            </div>
            <Sidebar side="right" className="flex-1 border-l border-border" collapsible="offcanvas" defaultOpen={false}>
              <PreviewPanel />
            </Sidebar>
            <RightActivityBar />
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
