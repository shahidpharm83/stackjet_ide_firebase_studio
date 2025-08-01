import { ScrollArea } from "@/components/ui/scroll-area";
import type { OpenFile } from "@/app/page";
import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

type EditorPanelProps = {
  file: OpenFile | null;
  onContentChange: (newContent: string) => void;
  isExecuting: boolean;
};

export default function EditorPanel({ file, onContentChange, isExecuting }: EditorPanelProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const syncScroll = () => {
      if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', syncScroll);
      return () => textarea.removeEventListener('scroll', syncScroll);
    }
  }, []);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
        <p>Select a file to begin editing.</p>
      </div>
    );
  }

  const lineCount = file.content.split('\n').length;

  return (
    <div className="flex-1 h-full flex font-code text-sm">
      <div 
        ref={lineNumbersRef} 
        className="w-12 text-right pr-4 text-muted-foreground/50 select-none bg-background py-4"
        style={{ lineHeight: '1.5rem', overflow: 'hidden' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <Textarea
        ref={textareaRef}
        value={file.content}
        onChange={(e) => onContentChange(e.target.value)}
        readOnly={isExecuting}
        className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-code text-sm leading-6"
        style={{ lineHeight: '1.5rem' }}
        placeholder="Start typing..."
      />
    </div>
  );
}
