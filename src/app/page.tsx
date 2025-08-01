
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
import { File, Bot, Loader } from "lucide-react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import JSZip from 'jszip';
import { useToast } from "@/hooks/use-toast";
import { agenticFlow } from "@/ai/flows/agentic-flow";
import useRecentProjects from "@/hooks/use-recent-projects";


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
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
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
            if (newActivePath === null && activeMainView === 'editor') {
                // If no files are left, but we were in editor view, decide what to do.
                // Maybe switch to terminal or show a placeholder. For now, just clear active file.
            }
        }
        return remainingFiles;
    });
  };
  
  const handleActiveFileChange = (path: string) => {
    setActiveFile(path);
    setActiveMainView('editor');
  };

  const handleViewChange = (view: string) => {
    if (view === 'terminal') {
      setActiveMainView('terminal');
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


  const handleOpenFolder = useCallback(async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const directoryHandle = await (window as any).showDirectoryPicker();
        await openProject(directoryHandle);
      } else {
        alert('Your browser does not support the File System Access API.');
      }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return;
        }
      if (error.name === 'SecurityError') {
        alert('Opening a local folder is not allowed in this environment for security reasons. Please try running the app outside of an iframe.');
      } else {
        console.error('Error opening directory:', error);
      }
    }
  }, [openProject]);

  const handleCloseProject = () => {
    setProject(null);
    setOpenFiles([]);
    setActiveFile(null);
  };

  const addFilesToZip = async (zip: JSZip, dirHandle: FileSystemDirectoryHandle, path: string = '') => {
    for await (const [name, handle] of dirHandle.entries()) {
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
      description: "First, the AI is updating your README...",
    });

    try {
        setIsExecuting(true);
        const readmePrompt = `Analyze the project structure and create or update the README.md file. It should include a brief project description, setup instructions, and how to run the application. Files to read to get context: ${project.tree.filter(f => f.name === 'package.json' || f.name.includes('config')).map(f => f.path).join(', ')}`;
        
        const result = await agenticFlow({ prompt: readmePrompt });

        const readmeStep = result.plan.find(step => 'fileName' in step && step.fileName === 'README.md');

        if (readmeStep && 'fileName' in readmeStep && readmeStep.content) {
            const handle = await getFileHandle(project.handle, 'README.md', true);
            const writable = await handle.createWritable();
            await writable.write(readmeStep.content);
            await writable.close();
            await refreshFileTree();
            toast({
              title: "README Updated",
              description: "Now zipping the project files.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "README Generation Failed",
                description: "The AI could not generate a README.md file. Proceeding with zipping.",
            });
        }

        const zip = new JSZip();
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
    } finally {
        setIsExecuting(false);
    }
  };

  if (!hydrated) {
    return null;
  }

  return (
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
              <Panel defaultSize={30} minSize={15}>
                  <PreviewPanel projectOpen={!!project} />
              </Panel>
            </>
          )}
        </PanelGroup>
        <RightActivityBar onToggle={() => setRightPanelVisible(!rightPanelVisible)} />
      </div>
       <StatusBar onToggleTerminal={() => setActiveMainView(prev => prev === 'terminal' ? 'editor' : 'terminal')} />
    </div>
  );
}
