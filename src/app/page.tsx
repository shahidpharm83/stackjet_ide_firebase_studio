
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
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useToast } from "@/hooks/use-toast";
import { agenticFlow } from "@/ai/flows/agentic-flow";
import useRecentProjects from "@/hooks/use-recent-projects";
import { TerminalProvider } from "@/contexts/terminal-context";

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

type LeftPanel = "files" | "ai";
export type MainView = "editor" | "terminal";


export default function Home() {
  const [project, setProject] = useState<Project | null>(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [activeLeftPanel, setActiveLeftPanel] = useState<LeftPanel>("files");
  const [rightPanelVisible, setRightPanelVisible] = useState(true); // Default to true to show preview
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeMainView, setActiveMainView] = useState<MainView>("editor");
  const { toast } = useToast();
  const { addRecentProject } = useRecentProjects();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const getFileHandle = async (root: FileSystemDirectoryHandle, path: string, create = false): Promise<FileSystemFileHandle> => {
      const parts = path.split('/');
      const fileName = parts.pop();
      if (!fileName) throw new Error('Invalid file path');
      
      let currentHandle: FileSystemDirectoryHandle = root;
      for (const part of parts) {
        if (!part) continue;
        currentHandle = await currentHandle.getDirectoryHandle(part, { create });
      }
      
      return await currentHandle.getFileHandle(fileName, { create });
  };

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
    const existingFile = openFiles.find(f => f.path === path);
    setActiveMainView('editor');

    if (existingFile) {
        setActiveFile(path);
        if (typeof content !== 'undefined' && existingFile.content !== content) {
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
    setOpenFiles(prev => {
        const remainingFiles = prev.filter(f => f.path !== path);
        if (activeFile === path) {
            const newActivePath = remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1].path : null;
            setActiveFile(newActivePath);
        }
        return remainingFiles;
    });
  };
  
  const handleViewChange = (view: string) => {
    if (view === 'terminal') {
      setActiveMainView('terminal');
      // When switching to terminal tab, we might want to clear the active file
      // but preserve the editor view. Let's keep active file for now.
    } else {
      setActiveFile(view);
      setActiveMainView('editor');
    }
  };
  
  const handleFileContentChange = useCallback((path: string, newContent: string) => {
    setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, content: newContent } : f));
  }, []);

  const getOpenFile = useCallback((path: string) => {
    return openFiles.find(f => f.path === path);
  }, [openFiles]);

  const openProject = useCallback(async (handle: FileSystemDirectoryHandle) => {
    const tree = await getDirectoryTree(handle);
    setProject({
        name: handle.name,
        handle,
        tree
    });
    addRecentProject(handle);
    setOpenFiles([]);
    setActiveFile(null);
    setIsProjectModalOpen(false);
  }, [addRecentProject]);

  const handleCloseProject = () => {
    setProject(null);
    setOpenFiles([]);
    setActiveFile(null);
  };

  const addFilesToZip = async (zip: JSZip, dirHandle: FileSystemDirectoryHandle, path: string = '') => {
    for await (const [name, handle] of dirHandle.entries()) {
        // Exclude node_modules and .next directories
        if (name === 'node_modules' || name === '.next') continue;

        const newPath = path ? `${path}/${name}` : name;
        if (handle.kind === 'file') {
            const file = await handle.getFile();
            zip.file(newPath, file);
        } else if (handle.kind === 'directory') {
            await addFilesToZip(zip, handle, newPath);
        }
    }
};

  const handleDownloadProject = async () => {
    if (!project) return;
     toast({
      title: "Preparing Project Download",
      description: "Zipping project files...",
    });

    try {
        const zip = new (await import('jszip')).default();
        await addFilesToZip(zip, project.handle);
        
        const content = await zip.generateAsync({type:"blob"});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${project.name}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
         toast({
          title: "Download Started!",
          description: "Your project is being downloaded as a zip file.",
        });
    } catch (error: any) {
        console.error("Failed to download project:", error);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: error.message,
        });
    }
  };

  if (!hydrated) {
    return null;
  }

  return (
    <TerminalProvider>
      <div className="flex flex-col h-screen bg-background text-foreground font-sans text-sm">
        <Header 
          project={project} 
          onCloseProject={handleCloseProject} 
          onOpenFolder={() => setIsProjectModalOpen(true)}
          onDownloadProject={handleDownloadProject}
          isDownloading={isExecuting}
          isProjectModalOpen={isProjectModalOpen}
          onProjectModalOpenChange={setIsProjectModalOpen}
          openProject={openProject}
        />
        <div className="flex flex-1 overflow-hidden">
          <LeftActivityBar 
              onToggle={() => setLeftPanelVisible(!leftPanelVisible)} 
              activePanel={activeLeftPanel}
              setActivePanel={setActiveLeftPanel}
          />
          <PanelGroup direction="horizontal" className="flex-1">
            {leftPanelVisible && (
              <>
                <Panel defaultSize={20} minSize={15} className="flex flex-col">
                  {activeLeftPanel === 'files' && (
                      <FileExplorer 
                        project={project} 
                        onOpenFile={handleOpenFile}
                      />
                  )}
                  {activeLeftPanel === 'ai' && (
                      <AiAssistantPanel 
                          project={project} 
                          refreshFileTree={refreshFileTree} 
                          onOpenFile={handleOpenFile}
                          onFileContentChange={handleFileContentChange}
                          getOpenFile={getOpenFile}
                          setActiveMainView={setActiveMainView}
                      />
                  )}
                </Panel>
                <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
              </>
            )}
            <Panel>
              <MainPanel 
                    openFiles={openFiles} 
                    activeFile={activeFile}
                    onCloseFile={handleCloseFile}
                    onViewChange={handleViewChange}
                    onFileContentChange={handleFileContentChange}
                    isExecuting={isExecuting}
                    projectOpen={!!project}
                    activeMainView={activeMainView}
                  />
            </Panel>
            {rightPanelVisible && (
              <>
                <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
                <Panel defaultSize={40} minSize={25}>
                    <PreviewPanel projectOpen={!!project} />
                </Panel>
              </>
            )}
          </PanelGroup>
          <RightActivityBar onToggle={() => setRightPanelVisible(!rightPanelVisible)} />
        </div>
        <StatusBar onToggleTerminal={() => handleViewChange(activeMainView === 'terminal' ? 'editor' : 'terminal')} />
      </div>
    </TerminalProvider>
  );
}
