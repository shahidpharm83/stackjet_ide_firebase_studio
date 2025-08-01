
"use client";

import { File, Bot, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type LeftPanel = "files" | "ai";

type LeftActivityBarProps = {
  onToggle: () => void;
  activePanel: LeftPanel;
  setActivePanel: (panel: LeftPanel) => void;
};

export default function LeftActivityBar({ onToggle, activePanel, setActivePanel }: LeftActivityBarProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-between gap-4 p-2 border-r border-border bg-background w-12">
        <div className="flex flex-col items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8", activePanel === "files" ? "bg-accent text-accent-foreground" : "")}
                    onClick={() => setActivePanel("files")}
                >
                  <File className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>File Explorer</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8", activePanel === "ai" ? "bg-accent text-accent-foreground" : "")}
                    onClick={() => setActivePanel("ai")}
                >
                  <Bot className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>AI Assistant</p>
              </TooltipContent>
            </Tooltip>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              <PanelLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Toggle Panel</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
