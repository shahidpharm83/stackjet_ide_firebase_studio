"use client";

import { useState, useCallback } from "react";
import Header from "@/components/layout/header";
import AiAssistantPanel from "@/components/panels/ai-assistant-panel";
import FileExplorer, { getDirectoryTree, FileSystemTreeItem } from "@/components/panels/file-explorer";
import MainPanel from "@/components/panels/main-panel";
import PreviewPanel from "@/components/panels/preview-panel";
import StatusBar from "@/components/layout/status-bar";
import LeftActivityBar from "@/components/layout/left-activity-bar";
import RightActivityBar from "@/components/layout/right-activity-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, Bot, Eye } from "lucide-react";
import TerminalPanel from "@/components/panels/terminal-panel";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";


export interface Project {
  name: string;
  handle: FileSystemDirectoryHandle;
  tree: FileSystemTreeItem[];
}

export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);


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
    } catch (error: any) {
      if (error.name === 'SecurityError') {
        alert('Opening a local folder is not allowed in this environment for security reasons. Please try running the app outside of an iframe.');
      } else {
        console.error('Error opening directory:', error);
      }
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
        <LeftActivityBar onToggle={() => setLeftPanelVisible(!leftPanelVisible)} />
        <PanelGroup direction="horizontal">
          {leftPanelVisible && (
            <Panel defaultSize={20} minSize={15}>
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
            </Panel>
          )}
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
          <Panel>
            <PanelGroup direction="vertical">
              <Panel>
                <MainPanel projectOpen={!!project} />
              </Panel>
              {isTerminalOpen && (
                <>
                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />
                  <Panel defaultSize={25} minSize={10}>
                    <TerminalPanel projectOpen={!!project} />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
          {rightPanelVisible && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
              <Panel defaultSize={25} minSize={20}>
                  <PreviewPanel projectOpen={!!project} />
              </Panel>
            </>
          )}
        </PanelGroup>
        <RightActivityBar onToggle={() => setRightPanelVisible(!rightPanelVisible)} />
      </div>
      <StatusBar onTerminalToggle={() => setIsTerminalOpen(!isTerminalOpen)} />
    </div>
  );
}
