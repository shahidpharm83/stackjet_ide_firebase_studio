
import dynamic from 'next/dynamic';
import EditorPanel from "./editor-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Code, Terminal as TerminalIcon } from "lucide-react";
import type { OpenFile, MainView } from "@/app/page";
import { cn } from "@/lib/utils";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useEffect, useState } from 'react';

const TerminalPanel = dynamic(() => import("./terminal-panel"), { ssr: false });

type MainPanelProps = {
  openFiles: OpenFile[];
  activeFile: string | null;
  onCloseFile: (path: string) => void;
  onActiveFileChange: (path: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  isExecuting: boolean;
  hydrated: boolean;
  projectOpen: boolean;
  activeMainView: MainView;
  setActiveMainView: (view: MainView) => void;
};

export default function MainPanel({ 
  openFiles, 
  activeFile, 
  onCloseFile, 
  onActiveFileChange,
  onFileContentChange,
  isExecuting,
  hydrated,
  projectOpen,
  activeMainView,
  setActiveMainView
}: MainPanelProps) {
  
  const [terminalPanelSize, setTerminalPanelSize] = useState(20);
  const [isClient, setIsClient] = useState(false);
  const noFilesOpen = openFiles.length === 0;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTabChange = (value: string) => {
    if (value === 'terminal') {
      setActiveMainView('terminal');
    } else {
      // If switching to an editor tab, and terminal was the active view, switch back to editor view.
      if(activeMainView === 'terminal') setActiveMainView('editor');
      onActiveFileChange(value);
    }
  }
  
  // When activeMainView changes (e.g. from status bar), update panel sizes
  useEffect(() => {
    if (activeMainView === 'terminal') {
      setTerminalPanelSize(100); // Expand terminal
    } else {
      if(terminalPanelSize > 90) { // if terminal was expanded
         setTerminalPanelSize(20); // Collapse it back
      }
    }
  }, [activeMainView, terminalPanelSize]);
  

  const activeValue = activeMainView === 'terminal' && !activeFile ? 'terminal' : activeFile || "";


  if (!projectOpen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <Code className="w-16 h-16 mb-4" />
        <p>Open a project to start working.</p>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <Code className="w-16 h-16 mb-4" />
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
        <PanelGroup direction="vertical" onLayout={(layout) => setTerminalPanelSize(layout[1])}>
            <Panel defaultSize={80} minSize={20}>
              {noFilesOpen ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
                    <Code className="w-16 h-16 mb-4" />
                    <p>No files are open.</p>
                    <p className="text-xs">Select a file from the explorer to begin editing.</p>
                  </div>
              ) : (
                <Tabs value={activeFile || ""} onValueChange={handleTabChange} className="flex-1 flex flex-col h-full">
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
                  </TabsList>

                  {openFiles.map(file => (
                    <TabsContent key={`content-${file.path}`} value={file.path} className="flex-1 mt-0">
                      <EditorPanel 
                          file={file}
                          onContentChange={(newContent) => onFileContentChange(file.path, newContent)}
                          isExecuting={isExecuting}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </Panel>
            <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors data-[resize-handle-state=drag]:bg-primary" />
            <Panel defaultSize={20} minSize={5} maxSize={80} collapsible={true} collapsedSize={5}>
                <Tabs value={activeMainView} onValueChange={(v) => setActiveMainView(v as MainView)} className="flex flex-col h-full">
                    <TabsList className="flex-shrink-0 h-12 p-0 border-b rounded-none justify-start bg-background">
                        <TabsTrigger value="terminal" className="h-full rounded-none relative data-[state=active]:bg-muted data-[state=active]:shadow-none">
                            <TerminalIcon className="w-4 h-4 mr-2" />
                            Terminal
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="editor" className="flex-1 mt-0 bg-background h-full">
                        <div className="flex items-center justify-center h-full text-muted-foreground">Terminal is collapsed. Drag handle to expand or click the Terminal tab.</div>
                    </TabsContent>
                    <TabsContent value="terminal" className="flex-1 mt-0 bg-background h-full">
                        <TerminalPanel projectOpen={projectOpen} />
                    </TabsContent>
                </Tabs>
            </Panel>
        </PanelGroup>
    </div>
  );
}
