
"use client";

import { useState, useCallback, useEffect } from "react";
import Header from "@/components/layout/header";
import AiAssistantPanel from "@/components/panels/ai-assistant-panel";
import FileExplorer, { getDirectoryTree, FileSystemTreeItem } from "@/components/panels/file-explorer";
import MainPanel from "@/components/panels/main-panel";
import PreviewPanel from "@/components/panels/preview-panel";
import StatusBar from "@/components/layout/status-bar";
import LeftActivityBar from "@/components/layout/left-activity-bar";
import RightActivityBar from "@/components/layout/right-activity-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, Bot } from "lucide-react";
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

export interface OpenFile {
  name: string;
  path: string;
  handle: FileSystemFileHandle;
  content: string;
}


export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);


  const refreshFileTree = useCallback(async () => {
    if (project?.handle) {
      try {
        await project.handle.requestPermission({ mode: 'readwrite' });
        const tree = await getDirectoryTree(project.handle);
        setProject(p => p ? { ...p, tree, handle: project.handle } : null);
      } catch (error) {
        console.error("Error refreshing file tree:", error);
      }
    }
  }, [project?.handle]);

  const handleOpenFile = useCallback(async (path: string, handle: FileSystemFileHandle, content?: string) => {
    if (openFiles.some(f => f.path === path)) {
      setActiveFile(path);
      // If content is provided, update it for the already open file.
      if (typeof content !== 'undefined') {
          setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, content } : f));
      }
      return;
    }

    try {
      let fileContent = content;
      if (typeof fileContent === 'undefined') {
        const file = await handle.getFile();
        fileContent = await file.text();
      }
      const newFile: OpenFile = {
        name: handle.name,
        path,
        handle,
        content: fileContent,
      };
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFile(path);
    } catch (error) {
      console.error("Error opening file:", error);
    }
  }, [openFiles]);


  const handleCloseFile = (path: string) => {
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    if (activeFile === path) {
      setActiveFile(prev => {
          const remainingFiles = openFiles.filter(f => f.path !== path);
          return remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1].path : null;
      });
    }
  };
  
  const handleActiveFileChange = (path: string) => {
    setActiveFile(path);
  };
  
  const handleFileContentChange = useCallback((path: string, newContent: string) => {
    setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, content: newContent } : f));
  }, []);

  const getOpenFile = useCallback((path: string) => {
    return openFiles.find(f => f.path === path);
  }, [openFiles]);


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
        setOpenFiles([]);
        setActiveFile(null);
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
    setOpenFiles([]);
    setActiveFile(null);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans text-sm">
      <Header project={project} onCloseProject={handleCloseProject} onOpenFolder={handleOpenFolder} />
      <div className="flex flex-1 overflow-hidden">
        <LeftActivityBar onToggle={() => setLeftPanelVisible(!leftPanelVisible)} />
        <PanelGroup direction="horizontal" className="flex-1">
          {leftPanelVisible && (
            <>
              <Panel defaultSize={20} minSize={15} className="flex flex-col">
                <Tabs defaultValue="files" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 rounded-none p-0 h-12 border-b shrink-0">
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
                      onOpenFile={handleOpenFile}
                    />
                  </TabsContent>
                  <TabsContent value="ai" className="flex-1 overflow-hidden">
                    <AiAssistantPanel 
                        project={project} 
                        refreshFileTree={refreshFileTree} 
                        onOpenFile={handleOpenFile}
                        onFileContentChange={handleFileContentChange}
                        getOpenFile={getOpenFile}
                    />
                  </TabsContent>
                </Tabs>
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
            </>
          )}
          <Panel>
            <PanelGroup direction="vertical">
              <Panel className="flex-1">
                <MainPanel 
                  openFiles={openFiles} 
                  activeFile={activeFile}
                  onCloseFile={handleCloseFile}
                  onActiveFileChange={handleActiveFileChange}
                  onFileContentChange={handleFileContentChange}
                  isExecuting={isExecuting}
                />
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
              <Panel defaultSize={30} minSize={15}>
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
