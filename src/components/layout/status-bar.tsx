
"use client";

import { Button } from "@/components/ui/button";
import { Terminal } from 'lucide-react';

type StatusBarProps = {
  onToggleTerminal: () => void;
};

export default function StatusBar({ onToggleTerminal }: StatusBarProps) {

  return (
    <div className="h-8 border-t border-border flex items-center px-4 justify-between text-sm">
      <div className="flex items-center gap-4">
         <Button variant="ghost" size="sm" className="h-full" onClick={onToggleTerminal}>
            <Terminal />
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
