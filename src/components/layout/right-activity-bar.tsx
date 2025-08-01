
"use client";

import { Eye, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type RightActivityBarProps = {
  onToggle: () => void;
};

export default function RightActivityBar({ onToggle }: RightActivityBarProps) {

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-between gap-4 p-2 border-l border-border bg-background w-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-accent text-accent-foreground">
              <Eye className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Live Preview</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              <PanelRight className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Toggle Panel</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
