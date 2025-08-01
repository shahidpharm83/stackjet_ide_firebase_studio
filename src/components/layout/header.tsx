
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play, Settings, Bot, X, FolderOpen, Download, CircleDashed, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyModal from "@/components/modals/api-key-modal";
import type { Project } from '@/app/page';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ProjectModal = dynamic(() => import('@/components/modals/project-modal'), {
  ssr: false,
});

type HeaderProps = {
  project: Project | null;
  onCloseProject: () => void;
  onOpenFolder: () => void;
  onDownloadProject: () => void;
  isDownloading: boolean;
  isProjectModalOpen: boolean;
  onProjectModalOpenChange: (isOpen: boolean) => void;
  openProject: (handle: FileSystemDirectoryHandle) => void;
};

export default function Header({ 
  project, 
  onCloseProject, 
  onOpenFolder, 
  onDownloadProject, 
  isDownloading,
  isProjectModalOpen,
  onProjectModalOpenChange,
  openProject,
}: HeaderProps) {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  return (
    <>
      <header className="flex h-12 items-center justify-between px-4 shrink-0 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold">Stackjet IDE</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost">File</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onProjectModalOpenChange(true)}>
                <FileIcon className="mr-2" />
                New Project...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onProjectModalOpenChange(true)}>
                <FolderOpen className="mr-2" />
                Open...
              </DropdownMenuItem>
              {project && (
                 <DropdownMenuItem onClick={onCloseProject}>
                  <X className="mr-2" />
                  Close Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {project && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{project.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCloseProject}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" disabled={!project || isDownloading} onClick={onDownloadProject}>
            {isDownloading ? <CircleDashed className="animate-spin" /> : <Download />}
            Download
          </Button>
          <Button variant="ghost" size="sm" disabled={!project}>
            <Play />
            Run
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsApiKeyModalOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <ApiKeyModal isOpen={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen} />
      {isProjectModalOpen && (
        <ProjectModal 
          isOpen={isProjectModalOpen} 
          onOpenChange={onProjectModalOpenChange}
          openProject={openProject}
        />
      )}
    </>
  );
}
