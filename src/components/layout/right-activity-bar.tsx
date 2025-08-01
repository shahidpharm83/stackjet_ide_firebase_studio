"use client";

import { Eye } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function RightActivityBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-4 p-2 border-l border-border bg-background">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Eye className="w-5 h-5" />
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
