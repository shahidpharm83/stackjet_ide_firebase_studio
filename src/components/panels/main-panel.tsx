
import dynamic from 'next/dynamic';
import EditorPanel from "./editor-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Code, Terminal as TerminalIcon } from "lucide-react";
import type { OpenFile, MainView } from "@/app/page";
import { cn } from "@/lib/utils";
import { useEffect, useState } from 'react';

const TerminalPanel = dynamic(() => import("./terminal-panel"), { ssr: false });

type MainPanelProps = {
  openFiles: OpenFile[];
  activeFile: string | null;
  onCloseFile: (path: string) => void;
  onViewChange: (view: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  isExecuting: boolean;
  projectOpen: boolean;
  activeMainView: MainView;
};

export default function MainPanel({ 
  openFiles, 
  activeFile, 
  onCloseFile, 
  onViewChange,
  onFileContentChange,
  isExecuting,
  projectOpen,
  activeMainView,
}: MainPanelProps) {
  
  const noFilesOpen = openFiles.length === 0;

  // Determine the active tab value. If the main view is terminal, it's 'terminal'.
  // Otherwise, it's the active file path.
  const activeTabValue = activeMainView === 'terminal' ? 'terminal' : activeFile || '';

  if (!projectOpen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <Code className="w-16 h-16 mb-4" />
        <p>Open a project to start working.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
        {noFilesOpen && activeMainView === 'editor' ? (
           <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
              <Code className="w-16 h-16 mb-4" />
              <p>No files are open.</p>
              <p className="text-xs">Select a file from the explorer to begin editing.</p>
            </div>
        ) : (
          <Tabs value={activeTabValue} onValueChange={onViewChange} className="flex-1 flex flex-col h-full">
            <TabsList className="flex-shrink-0 h-12 p-0 border-b rounded-none justify-start bg-background">
              {openFiles.map(file => (
                <TabsTrigger 
                  key={file.path} 
                  value={file.path} 
                  className="h-full rounded-none relative data-[state=active]:bg-muted data-[state=active]:shadow-none pr-10"
                >
                  {file.name}
                  <div
                    role="button"
                    aria-label={`Close ${file.name}`}
                    className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2 rounded-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file.path);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </div>
                </TabsTrigger>
              ))}
              <TabsTrigger 
                  value="terminal" 
                  className="h-full rounded-none relative data-[state=active]:bg-muted data-[state=active]:shadow-none"
                >
                  <TerminalIcon className="w-4 h-4 mr-2" />
                  Terminal
                </TabsTrigger>
            </TabsList>

            {openFiles.map(file => (
              <TabsContent key={`content-${file.path}`} value={file.path} className="flex-1 mt-0 bg-background">
                <EditorPanel 
                    file={file}
                    onContentChange={(newContent) => onFileContentChange(file.path, newContent)}
                    isExecuting={isExecuting}
                />
              </TabsContent>
            ))}
             <TabsContent value="terminal" className="flex-1 mt-0 bg-background h-full">
                  <TerminalPanel projectOpen={projectOpen} />
              </TabsContent>
          </Tabs>
        )}
    </div>
  );
}
