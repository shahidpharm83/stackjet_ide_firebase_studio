
"use client"
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import EditorPanel from "./editor-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Code, Terminal as TerminalIcon } from "lucide-react";
import type { OpenFile } from "@/app/page";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

const TerminalPanel = dynamic(() => import("./terminal-panel"), { ssr: false });

export type MainView = "editor" | "terminal";

type MainPanelProps = {
  openFiles: OpenFile[];
  activeFile: string | null;
  onCloseFile: (path: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  isExecuting: boolean;
  projectOpen: boolean;
  activeMainView: MainView;
  onViewChange: (view: MainView | string) => void;
};

export default function MainPanel({ 
  openFiles, 
  activeFile, 
  onCloseFile, 
  onFileContentChange,
  isExecuting,
  projectOpen,
  activeMainView,
  onViewChange,
}: MainPanelProps) {
  
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);

  const noFilesOpen = openFiles.length === 0;
  
  const activeTabValue = activeMainView === 'terminal' ? 'terminal' : activeFile;

  if (!projectOpen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <Code className="w-16 h-16 mb-4" />
        <p>Open a project to start working.</p>
      </div>
    );
  }

  if (!hydrated) {
    return (
       <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
          <Code className="w-16 h-16 mb-4 animate-pulse" />
          <p>Loading Editor...</p>
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
        <Tabs value={activeTabValue ?? ""} onValueChange={onViewChange} className="flex-1 flex flex-col h-full">
            <TabsList className="flex-shrink-0 h-10 p-0 border-b rounded-none justify-start bg-background">
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
              <TabsTrigger value="terminal" className="h-full rounded-none data-[state=active]:bg-muted data-[state=active]:shadow-none">
                <TerminalIcon className="w-4 h-4 mr-2" />
                Terminal
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              <PanelGroup direction="vertical">
                  <Panel>
                    {activeMainView === 'editor' && (
                        noFilesOpen ? (
                             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
                                <Code className="w-16 h-16 mb-4" />
                                <p>No files are open.</p>
                                <p className="text-xs">Select a file from the explorer to begin editing.</p>
                              </div>
                          ) : (
                            openFiles.map(file => (
                              <TabsContent key={`content-${file.path}`} value={file.path} className="flex-1 mt-0 bg-background h-full overflow-auto">
                                <EditorPanel 
                                    file={file}
                                    onContentChange={(newContent) => onFileContentChange(file.path, newContent)}
                                    isExecuting={isExecuting}
                                />
                              </TabsContent>
                            ))
                          )
                    )}
                    {activeMainView === 'terminal' && (
                         <TabsContent value="terminal" className="flex-1 mt-0 bg-background h-full overflow-auto">
                           <TerminalPanel projectOpen={projectOpen} />
                         </TabsContent>
                    )}
                  </Panel>
              </PanelGroup>
            </div>
          </Tabs>
    </div>
  );
}
