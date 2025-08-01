import { Terminal, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type TerminalPanelProps = {
  projectOpen: boolean;
};

export default function TerminalPanel({ projectOpen }: TerminalPanelProps) {
  return (
    <div className="h-48 flex-shrink-0 flex flex-col border-t border-border">
        <div className="flex items-center justify-between p-2 h-12 border-b border-border">
            <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                <h2 className="font-semibold text-base">Terminal</h2>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Plus className="w-4 h-4" />
                </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7">
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
      <ScrollArea className="flex-1 bg-black/20 p-4 font-code text-xs">
          {projectOpen ? (
            <>
              <p>
                <span className="text-green-400">root@liveedit-ai</span>
                <span className="text-primary">~</span>
                <span>$ npm start</span>
              </p>
              <p>
                <span className="text-muted-foreground">> liveedit-ai@0.1.0 start</span>
              </p>
              <p>
                <span className="text-muted-foreground">> next dev --turbopack -p 9002</span>
              </p>
              <p className="text-accent">
                - ready started server on 0.0.0.0:9002, url: http://localhost:9002
              </p>
              <p className="text-green-400">
                ✓ Compiled / in 247ms
              </p>
            </>
          ) : (
             <p>Open a project to use the terminal.</p>
          )}
      </ScrollArea>
    </div>
  );
}
