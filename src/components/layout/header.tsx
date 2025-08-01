"use client";

import { useState } from "react";
import { Play, Settings, Sparkles, Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyModal from "@/components/modals/api-key-modal";
import type { Project } from '@/app/page';

type HeaderProps = {
  project: Project | null;
  onCloseProject: () => void;
};

export default function Header({ project, onCloseProject }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="flex h-12 items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">LiveEdit AI</h1>
        </div>
        {project && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{project.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCloseProject}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={!project}>
            <Play />
            Run
          </Button>
          <Button variant="ghost" size="sm" disabled={!project}>
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
