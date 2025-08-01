import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditorPanel from "./editor-panel";
import AiAssistantPanel from "./ai-assistant-panel";
import { Code, Bot } from 'lucide-react';

export default function MainPanel() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Tabs defaultValue="editor" className="flex-1 flex flex-col">
        <div className="flex-shrink-0 border-b border-border">
          <TabsList className="bg-transparent p-0 m-0 rounded-none">
            <TabsTrigger value="editor" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent">
              <Code className="w-4 h-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="ai" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent">
              <Bot className="w-4 h-4 mr-2" />
              AI Assistant
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="editor" className="flex-1 overflow-auto mt-0">
          <EditorPanel />
        </TabsContent>
        <TabsContent value="ai" className="flex-1 overflow-auto mt-0">
          <AiAssistantPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
