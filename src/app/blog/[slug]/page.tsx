"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import JSZip from 'jszip';

import Header from "@/components/layout/header";
import LeftActivityBar from "@/components/layout/left-activity-bar";
import RightActivityBar from "@/components/layout/right-activity-bar";
import StatusBar from "@/components/layout/status-bar";
import FileExplorer, { getDirectoryTree, type FileSystemTreeItem } from '@/components/panels/file-explorer';
import AiAssistantPanel from '@/components/panels/ai-assistant-panel';
import PreviewPanel from '@/components/panels/preview-panel';
import MainPanel from '@/components/panels/main-panel';
import type { MainView } from '@/components/panels/main-panel';
import { useToast } from '@/hooks/use-toast';
import useRecentProjects from '@/hooks/use-recent-projects';


export type Project = {
  name: string;
  handle: FileSystemDirectoryHandle;
  tree: FileSystemTreeItem[];
}

export type OpenFile = {
  name: string;
  path: string;
  handle: FileSystemFileHandle;
  content: string;
}

export default function IdePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(true);
  
  const [activeLeftPanel, setActiveLeftPanel] = useState<'files' | 'ai'>('files');
  const [activeMainView, setActiveMainView] = useState<MainView | string>('editor');

  const [isDownloading, setIsDownloading] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { addRecentProject } = useRecentProjects();
  const { toast } = useToast();
  
  const agentMessageRef = useRef<any>(null); // Replace 'any' with your message type
  const isExecuting = agentMessageRef.current?.isExecuting || false;

  const refreshFileTree = useCallback(async () => {
    if (project?.handle) {
      const tree = await getDirectoryTree(project.handle);
      setProject(p => p ? { ...p, tree } : null);
    }
  }, [project?.handle]);
  
  const openProject = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
        const tree = await getDirectoryTree(handle);
        setProject({
            name: handle.name,
            handle: handle,
            tree: tree,
        });
        addRecentProject(handle);
        setIsProjectModalOpen(false);
        setOpenFiles([]);
        setActiveFile(null);
    } catch (error) {
        console.error("Failed to open project:", error);
        toast({ variant: 'destructive', title: 'Error Opening Project', description: 'Could not read the directory tree.' });
    }
  }, [addRecentProject, toast]);

  const handleOpenFile = async (path: string, handle: FileSystemFileHandle, content?: string) => {
    if (openFiles.some(f => f.path === path)) {
      setActiveFile(path);
      setActiveMainView(path);
      return;
    }

    try {
      if (content === undefined) {
        const file = await handle.getFile();
        content = await file.text();
      }
      const newFile: OpenFile = { name: handle.name, path, handle, content };
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFile(path);
      setActiveMainView(path);
    } catch (error) {
      console.error("Failed to open file:", error);
      toast({ variant: 'destructive', title: 'Error Opening File', description: 'Could not read the file content.' });
    }
  };
  
  const handleCloseFile = (path: string) => {
    const fileIndex = openFiles.findIndex(f => f.path === path);
    if (fileIndex === -1) return;

    const newOpenFiles = openFiles.filter(f => f.path !== path);
    setOpenFiles(newOpenFiles);

    if (activeFile === path) {
      if (newOpenFiles.length > 0) {
        const newActiveIndex = Math.max(0, fileIndex - 1);
        const newActiveFile = newOpenFiles[newActiveIndex];
        setActiveFile(newActiveFile.path);
        setActiveMainView(newActiveFile.path);
      } else {
        setActiveFile(null);
        setActiveMainView('editor');
      }
    }
  };

  const handleFileContentChange = (path: string, newContent: string) => {
    setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, content: newContent } : f));
  };
  
  const handleOpenFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        await openProject(handle);
      } else {
         toast({
          variant: "destructive",
          title: "Browser Not Supported",
          description: "Your browser does not support the File System Access API.",
        });
      }
    } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error opening folder:", error);
          toast({ variant: 'destructive', title: 'Error opening folder', description: error.message });
        }
    }
  };
  
  const handleCloseProject = async () => {
    // Before closing, we should offer to save unsaved changes.
    // This is a simplified version.
    for (const file of openFiles) {
        try {
            const writable = await file.handle.createWritable();
            await writable.write(file.content);
            await writable.close();
        } catch (error) {
            console.error(`Failed to save ${file.path}:`, error);
            toast({ variant: 'destructive', title: `Failed to save ${file.path}`, description: 'Could not write changes to disk.' });
        }
    }
    setProject(null);
    setOpenFiles([]);
    setActiveFile(null);
  };

  const handleDownloadProject = async () => {
    if (!project) return;
    setIsDownloading(true);
    toast({ title: 'Preparing Download', description: 'Zipping project files...' });

    const zip = new JSZip();

    async function addFolderToZip(dirHandle: FileSystemDirectoryHandle, zipFolder: JSZip) {
        for await (const handle of dirHandle.values()) {
            if (handle.kind === 'file') {
                const file = await handle.getFile();
                zipFolder.file(handle.name, file);
            } else if (handle.kind === 'directory') {
                const subFolder = zipFolder.folder(handle.name);
                if(subFolder) await addFolderToZip(handle, subFolder);
            }
        }
    }

    try {
        await addFolderToZip(project.handle, zip);
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${project.name}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast({ title: 'Download Started!', description: 'Your project zip file is downloading.' });
    } catch (error) {
        console.error("Failed to zip project:", error);
        toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not create the zip file.' });
    } finally {
        setIsDownloading(false);
    }
  };
  
  const getOpenFile = (path: string): OpenFile | undefined => {
    return openFiles.find(f => f.path === path);
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header 
        project={project}
        onCloseProject={handleCloseProject}
        onOpenFolder={handleOpenFolder}
        onDownloadProject={handleDownloadProject}
        isDownloading={isDownloading}
        isProjectModalOpen={isProjectModalOpen}
        onProjectModalOpenChange={setIsProjectModalOpen}
        openProject={openProject}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftActivityBar 
            onToggle={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            activePanel={activeLeftPanel}
            setActivePanel={setActiveLeftPanel}
        />
        <PanelGroup direction="horizontal" className="flex-1">
          {!leftPanelCollapsed && (
            <>
              <Panel defaultSize={20} minSize={15}>
                  {activeLeftPanel === 'files' && (
                    <FileExplorer project={project} onOpenFile={handleOpenFile} />
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
            <PanelGroup direction="vertical">
              <Panel minSize={30}>
                 <MainPanel
                    openFiles={openFiles}
                    activeFile={activeFile}
                    onCloseFile={handleCloseFile}
                    onFileContentChange={handleFileContentChange}
                    isExecuting={isExecuting}
                    projectOpen={!!project}
                    activeMainView={activeMainView as MainView}
                    onViewChange={(view) => setActiveMainView(view)}
                  />
              </Panel>
              {!rightPanelCollapsed && (
                <>
                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />
                  <Panel defaultSize={40} minSize={20}>
                    <PreviewPanel projectOpen={!!project} />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
          
        </PanelGroup>
      </div>
    </div>
  );
}