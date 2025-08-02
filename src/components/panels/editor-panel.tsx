import { ScrollArea } from "@/components/ui/scroll-area";
import type { OpenFile } from "@/app/page";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EditorPanelProps = {
  file: OpenFile | null;
  onContentChange: (newContent: string) => void;
  isExecuting: boolean;
};

export default function EditorPanel({ file, onContentChange, isExecuting }: EditorPanelProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeLine, setActiveLine] = useState(-1);
  const activeLineRef = useRef<HTMLDivElement>(null);


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

  useEffect(() => {
    if (isExecuting && file) {
      const lineCount = file.content.split('\n').length;
      setActiveLine(lineCount);
    } else {
      setActiveLine(-1);
    }
  }, [file?.content, isExecuting, file]);

  useEffect(() => {
    if (activeLineRef.current && textareaRef.current && lineNumbersRef.current) {
        activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine]);


  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
        <p>Select a file to begin editing.</p>
      </div>
    );
  }

  const lineCount = file.content.split('\n').length;

  return (
    <div className="flex-1 h-full flex font-code text-sm bg-background">
      <ScrollArea className="w-12 text-right pr-4 text-muted-foreground/50 select-none bg-background pt-[9px] pb-[9px]" ref={lineNumbersRef}>
        {Array.from({ length: lineCount }, (_, i) => {
          const isCurrentActiveLine = isExecuting && (i + 1 === activeLine);
          return (
              <div 
                key={i} 
                ref={isCurrentActiveLine ? activeLineRef : null}
                className={cn(
                  "relative", 
                  isCurrentActiveLine ? "wavy-underline-editor" : ""
                )}
                style={{ lineHeight: '1.5rem' }}
              >
                {i + 1}
              </div>
          )
        })}
      </ScrollArea>
       <Textarea
        ref={textareaRef}
        value={file.content}
        onChange={(e) => onContentChange(e.target.value)}
        readOnly={isExecuting}
        className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-code text-sm leading-6 bg-transparent"
        style={{ lineHeight: '1.5rem', paddingTop: '9px', paddingBottom: '9px' }}
        placeholder="Start typing..."
      />
    </div>
  );
}
