"use client";

import { useState } from "react";
import { Play, Settings, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyModal from "@/components/modals/api-key-modal";

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="flex h-12 items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">LiveEdit AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Play />
            Run
          </Button>
          <Button variant="ghost" size="sm">
            <Sparkles />
            AI Refactor
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <ApiKeyModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
