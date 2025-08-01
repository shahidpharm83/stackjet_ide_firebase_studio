"use client";

import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

type StatusBarProps = {
  onTerminalToggle: () => void;
};

export default function StatusBar({ onTerminalToggle }: StatusBarProps) {
  return (
    <div className="h-8 border-t border-border flex items-center px-4 justify-between text-sm">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="h-auto px-2 py-1" onClick={onTerminalToggle}>
          <Terminal className="w-4 h-4 mr-2" />
          Terminal
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <span>Ln 1, Col 1</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span>© 2024</span>
      </div>
    </div>
  );
}
