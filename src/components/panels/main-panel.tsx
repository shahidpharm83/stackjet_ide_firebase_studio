import EditorPanel from "./editor-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Code } from "lucide-react";
import type { OpenFile } from "@/app/page";

type MainPanelProps = {
  openFiles: OpenFile[];
  activeFile: string | null;
  onCloseFile: (path: string) => void;
  onActiveFileChange: (path: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  isExecuting: boolean;
};

export default function MainPanel({ 
  openFiles, 
  activeFile, 
  onCloseFile, 
  onActiveFileChange,
  onFileContentChange,
  isExecuting
}: MainPanelProps) {

  const getFileByPath = (path: string | null) => {
    if (!path) return null;
    return openFiles.find(f => f.path === path) || null;
  }

  const currentFile = getFileByPath(activeFile);
  
  if (openFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <Code className="w-16 h-16 mb-4" />
        <p>No files are open.</p>
        <p className="text-xs">Select a file from the explorer to begin editing.</p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <Tabs value={activeFile || ""} onValueChange={onActiveFileChange} className="flex-1 flex flex-col">
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
          <TabsContent key={file.path} value={file.path} className="flex-1 overflow-auto mt-0">
            <EditorPanel 
                file={file}
                onContentChange={(newContent) => onFileContentChange(file.path, newContent)}
                isExecuting={isExecuting}
             />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
