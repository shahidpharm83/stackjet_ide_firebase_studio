"use client";

import { File, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type LeftActivityBarProps = {
  onToggle: () => void;
};

export default function LeftActivityBar({ onToggle }: LeftActivityBarProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-4 p-1 border-r border-border bg-background" style={{ width: '25px' }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
              <File className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Explorer</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
              <Bot className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
