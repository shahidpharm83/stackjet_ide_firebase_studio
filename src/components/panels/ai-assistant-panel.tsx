"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Mic,
  Send,
  Sparkles,
  AlertCircle,
  Clock,
  ThumbsUp,
  File,
} from "lucide-react";

export default function AiAssistantPanel() {
  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Thinking Message */}
          <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <CircleDashed className="w-5 h-5 animate-spin" />
              <span>Thinking...</span>
              <span className="font-mono text-xs">(1.2s)</span>
            </div>
          </div>

          {/* Analysis Message */}
          <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 text-primary flex-shrink-0" />
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-4">
                <p className="font-semibold mb-2">Analysis</p>
                <p className="text-muted-foreground">
                  The user wants to add a new feature. This will involve creating a new component, updating the main page, and adding a new route.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Plan Message */}
          <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 text-primary flex-shrink-0" />
            <Card className="w-full bg-card/50">
              <CardContent className="p-2">
                <Accordion type="single" collapsible defaultValue="item-1">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="p-2 text-base font-semibold">
                      Execution Plan
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 px-2 pb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>Create `components/new-feature.tsx`</span>
                      </div>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>Modify `app/page.tsx` to import and use the new component</span>
                      </div>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span>Delete `components/old-feature.tsx` (requires confirmation)</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Execution Log Message */}
          <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="w-full space-y-3">
              <p className="font-semibold">Live Execution</p>
              <div className="space-y-3 text-sm font-mono border-l-2 border-border pl-4 ml-1">
                <div className="flex items-center gap-2">
                   <File className="w-4 h-4 text-primary"/>
                   <span>CREATE: `components/new-feature.tsx`</span>
                   <span className="text-green-500 ml-auto">SUCCESS</span>
                </div>
                {/* Reusable Terminal */}
                <div className="bg-black/50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ChevronRight className="w-3 h-3"/>
                    <span>Running shell command...</span>
                  </div>
                  <code>$ npm install new-dependency</code>
                  <br/>
                  <code className="text-green-400">+ new-dependency@1.0.0</code>
                  <br/>
                  <code>added 1 package, and audited 1 package in 2s</code>
                </div>
                 <div className="flex items-center gap-2">
                   <AlertCircle className="w-4 h-4 text-yellow-500"/>
                   <span>DELETE: `components/old-feature.tsx`</span>
                   <span className="text-yellow-500 ml-auto">CONFIRMATION PENDING</span>
                </div>
                 <div className="flex items-center gap-2">
                   <Clock className="w-4 h-4 text-muted-foreground"/>
                   <span>FINISHED in 5.8s</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Message */}
           <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 text-primary flex-shrink-0" />
            <Card className="w-full bg-primary/10 border-primary/20">
              <CardContent className="p-4">
                <p className="font-semibold mb-2 text-primary flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> Execution Summary</p>
                <p className="text-muted-foreground mb-3">
                  Successfully created the new feature component and installed dependencies. The project is ready for the next steps.
                </p>
                <p className="font-semibold mb-2 text-primary/80 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Improvement Suggestions</p>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">Refactor for performance</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">Add unit tests</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">Improve accessibility</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border">
        <div className="relative">
          <Textarea
            placeholder="Type your prompt here or use the microphone..."
            className="pr-20 min-h-[60px] resize-none"
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Mic className="w-5 h-5" />
            </Button>
            <Button size="icon">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
