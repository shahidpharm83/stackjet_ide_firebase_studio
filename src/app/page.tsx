
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


export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
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
        <LeftActivityBar onToggle={() => setLeftPanelVisible(!leftPanelVisible)} />
        <PanelGroup direction="horizontal" className="flex-1">
          {hydrated && leftPanelVisible && (
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
                      onOpenFile={handleOpenFile}
                    />
                  </TabsContent>
                  <TabsContent value="ai" className="flex-1 overflow-hidden" forceMount>
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
                  hydrated={hydrated}
                />
              </Panel>
              {hydrated && isTerminalOpen && (
                <>
                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />
                  <Panel defaultSize={25} minSize={10}>
                    <TerminalPanel projectOpen={!!project} />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
          {hydrated && rightPanelVisible && (
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
