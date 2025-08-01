"use client"
import React, { useState, useCallback } from 'react'
import { Folder, FileText, ChevronRight, FolderOpen } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Define the structure for a file or folder in our tree
interface FileSystemTreeItem {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  children?: FileSystemTreeItem[];
}

// Function to recursively build the file tree from a directory handle
async function getDirectoryTree(directoryHandle: FileSystemDirectoryHandle): Promise<FileSystemTreeItem[]> {
    const tree: FileSystemTreeItem[] = [];
    for await (const handle of directoryHandle.values()) {
        if (handle.kind === 'directory') {
            tree.push({
                name: handle.name,
                kind: handle.kind,
                handle,
                children: await getDirectoryTree(handle),
            });
        } else {
            tree.push({
                name: handle.name,
                kind: handle.kind,
                handle,
            });
        }
    }
    // Sort so folders appear before files
    return tree.sort((a, b) => {
        if (a.kind === 'directory' && b.kind === 'file') return -1;
        if (a.kind === 'file' && b.kind === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });
}


const FileTreeItem = ({ item, level = 0 }: { item: FileSystemTreeItem; level?: number }) => {
    const isFolder = item.kind === 'directory';
    const Icon = isFolder ? Folder : FileText;
    const paddingLeft = `${level * 16 + 12}px`;

    if (isFolder) {
        return (
          <Collapsible defaultOpen={level === 0}>
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center py-1.5 px-3 rounded-md cursor-pointer hover:bg-muted" style={{ paddingLeft }}>
                  <ChevronRight className="w-4 h-4 mr-1 flex-shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                  <Icon className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {item.children?.map((child) => (
                  <FileTreeItem key={child.name} item={child} level={level + 1} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
    }
    
    return (
        <div className={`flex items-center py-1.5 px-3 rounded-md cursor-pointer hover:bg-muted`} style={{ paddingLeft }}>
             <span className="w-4 h-4 mr-1 flex-shrink-0" />
             <Icon className="w-4 h-4 mr-2 text-foreground/70 flex-shrink-0" />
             <span className="truncate">{item.name}</span>
        </div>
    );
};


export default function FileExplorer() {
  const [fileTree, setFileTree] = useState<FileSystemTreeItem[]>([]);
  const [projectTitle, setProjectTitle] = useState('File Explorer');

  const handleOpenFolder = useCallback(async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const directoryHandle = await (window as any).showDirectoryPicker();
        const tree = await getDirectoryTree(directoryHandle);
        setFileTree(tree);
        setProjectTitle(directoryHandle.name);
      } else {
        alert('Your browser does not support the File System Access API.');
      }
    } catch (error) {
      console.error('Error opening directory:', error);
    }
  }, []);

  return (
    <aside className="w-full h-full flex flex-col shrink-0">
      <div className="p-2 flex justify-between items-center border-b border-border">
          <span className="text-sm font-semibold truncate pl-2">{projectTitle}</span>
          <div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenFolder} title="Open Folder">
              <FolderOpen className="w-4 h-4" />
            </Button>
          </div>
      </div>
       <ScrollArea className="flex-1 p-2">
        {fileTree.length > 0 ? (
            fileTree.map(item => <FileTreeItem key={item.name} item={item} />)
        ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
                <p>No folder opened.</p>
                <Button variant="link" size="sm" onClick={handleOpenFolder}>Open a local folder</Button> 
                <p className="text-xs mt-2">to start editing.</p>
            </div>
        )}
      </ScrollArea>
    </aside>
  );
}