"use client";

import { Button } from "@/components/ui/button";

export default function StatusBar() {
  return (
    <div className="h-8 border-t border-border flex items-center px-4 justify-between text-sm">
      <div className="flex items-center gap-4">
        {/* Terminal button removed */}
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