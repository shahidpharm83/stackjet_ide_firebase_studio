"use client";

import { File, Bot, Eye } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ActivityBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col items-center gap-4 p-2 border-r border-border bg-background">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <File className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>File Explorer</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Bot className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>AI Assistant</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Eye className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Live Preview</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}