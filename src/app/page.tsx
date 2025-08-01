"use client";

import { useState, useCallback } from "react";
import Header from "@/components/layout/header";
import AiAssistantPanel from "@/components/panels/ai-assistant-panel";
import FileExplorer, { getDirectoryTree, FileSystemTreeItem } from "@/components/panels/file-explorer";
import MainPanel from "@/components/panels/main-panel";
import PreviewPanel from "@/components/panels/preview-panel";
import StatusBar from "@/components/layout/status-bar";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import LeftActivityBar from "@/components/layout/left-activity-bar";
import RightActivityBar from "@/components/layout/right-activity-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, Bot } from "lucide-react";
import TerminalPanel from "@/components/panels/terminal-panel";

export interface Project {
  name: string;
  handle: FileSystemDirectoryHandle;
  tree: FileSystemTreeItem[];
}

export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  const handleOpenFolder = useCallback(async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const directoryHandle = await (window as any).showDirectoryPicker();
        const tree = await getDirectoryTree(directoryHandle);
        setProject({
          name: directoryHandle.name,
          handle: directoryHandle,
          tree: tree
        });
      } else {
        alert('Your browser does not support the File System Access API.');
      }
    } catch (error) {
      console.error('Error opening directory:', error);
    }
  }, []);

  const handleCloseProject = () => {
    setProject(null);
    // Here you would also clean up other components' states as needed,
    // for example, closing open files in the editor.
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans text-sm">
      <Header project={project} onCloseProject={handleCloseProject} />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <LeftActivityBar />
          <Sidebar side="left" className="w-96 border-r border-border" collapsible="icon" defaultOpen={true}>
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
                <FileExplorer 
                  project={project} 
                  onOpenFolder={handleOpenFolder} 
                />
              </TabsContent>
              <TabsContent value="ai" className="flex-1">
                <AiAssistantPanel />
              </TabsContent>
            </Tabs>
          </Sidebar>
        </SidebarProvider>
        <div className="flex-1 flex flex-col overflow-hidden">
          <MainPanel projectOpen={!!project} />
          {isTerminalOpen && <TerminalPanel projectOpen={!!project} />}
        </div>
        <SidebarProvider>
          <Sidebar side="right" className="flex-1 border-l border-border" collapsible="offcanvas" defaultOpen={false}>
            <PreviewPanel projectOpen={!!project} />
          </Sidebar>
          <RightActivityBar />
        </SidebarProvider>
      </div>
      <StatusBar onTerminalToggle={() => setIsTerminalOpen(!isTerminalOpen)} />
    </div>
  );
}
