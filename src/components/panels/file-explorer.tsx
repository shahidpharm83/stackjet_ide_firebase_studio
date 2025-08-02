
"use client"
import React from 'react'
import { Folder, FileText, ChevronRight, Briefcase } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Project } from '@/app/page';

export interface FileSystemTreeItem {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  path: string;
  children?: FileSystemTreeItem[];
}

export async function getDirectoryTree(directoryHandle: FileSystemDirectoryHandle, path = ''): Promise<FileSystemTreeItem[]> {
    const tree: FileSystemTreeItem[] = [];
    for await (const handle of directoryHandle.values()) {
        const newPath = path ? `${path}/${handle.name}` : handle.name;
        if (handle.kind === 'directory') {
            tree.push({
                name: handle.name,
                kind: handle.kind,
                handle,
                path: newPath,
                children: await getDirectoryTree(handle, newPath),
            });
        } else {
            tree.push({
                name: handle.name,
                kind: handle.kind,
                handle,
                path: newPath,
            });
        }
    }
    return tree.sort((a, b) => {
        if (a.kind === 'directory' && b.kind === 'file') return -1;
        if (a.kind === 'file' && b.kind === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });
}

type FileTreeItemProps = {
    item: FileSystemTreeItem;
    level?: number;
    onOpenFile: (path: string, handle: FileSystemFileHandle) => void;
}

const FileTreeItem = ({ item, level = 0, onOpenFile }: FileTreeItemProps) => {
    const isFolder = item.kind === 'directory';
    const Icon = isFolder ? Folder : FileText;
    const paddingLeft = `${level * 16 + 12}px`;

    const handleFileClick = () => {
        if (item.kind === 'file') {
            onOpenFile(item.path, item.handle as FileSystemFileHandle);
        }
    }

    if (isFolder) {
        return (
          <Collapsible key={item.path} defaultOpen={level === 0}>
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center py-1.5 px-3 rounded-md cursor-pointer hover:bg-muted" style={{ paddingLeft }}>
                  <ChevronRight className="w-4 h-4 mr-1 flex-shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                  <Icon className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {item.children?.map((child) => (
                  <FileTreeItem key={child.path} item={child} level={level + 1} onOpenFile={onOpenFile}/>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
    }
    
    return (
        <div 
            className={`flex items-center py-1.5 px-3 rounded-md cursor-pointer hover:bg-muted`} 
            style={{ paddingLeft }}
            onClick={handleFileClick}
        >
             <span className="w-4 h-4 mr-1 flex-shrink-0" />
             <Icon className="w-4 h-4 mr-2 text-foreground/70 flex-shrink-0" />
             <span className="truncate">{item.name}</span>
        </div>
    );
};

type FileExplorerProps = {
  project: Project | null;
  onOpenFile: (path: string, handle: FileSystemFileHandle) => void;
};

export default function FileExplorer({ project, onOpenFile }: FileExplorerProps) {
  return (
    <aside className="w-full h-full flex flex-col shrink-0">
      <div className="p-2 flex justify-between items-center border-b border-border h-12">
          <span className="text-sm font-semibold truncate pl-2 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> {project?.name ?? 'File Explorer'}
          </span>
      </div>
       <ScrollArea className="flex-1 p-2">
        {project?.tree && project.tree.length > 0 ? (
            project.tree.map(item => <FileTreeItem key={item.path} item={item} onOpenFile={onOpenFile} />)
        ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
                <p>No folder opened.</p>
                <p className="text-xs mt-2">Use the File menu to create or open a project.</p>
            </div>
        )}
      </ScrollArea>
    </aside>
  );
}
