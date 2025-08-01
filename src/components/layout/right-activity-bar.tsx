"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type RightActivityBarProps = {
  onToggle: () => void;
};

export default function RightActivityBar({ onToggle }: RightActivityBarProps) {

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-4 p-1 border-l border-border bg-background" style={{ width: '25px' }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
              <Eye className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Live Preview</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
