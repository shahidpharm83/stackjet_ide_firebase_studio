import { ScrollArea } from "@/components/ui/scroll-area";
import type { OpenFile } from "@/app/page";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

type EditorPanelProps = {
  file: OpenFile | null;
  onContentChange: (newContent: string) => void;
  isExecuting: boolean;
};

export default function EditorPanel({ file, onContentChange, isExecuting }: EditorPanelProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const [activeLine, setActiveLine] = useState(-1);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const wasExecutingRef = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (wasExecutingRef.current && !isExecuting) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500); // Animation duration
      return () => clearTimeout(timer);
    }
    wasExecutingRef.current = isExecuting;
  }, [isExecuting]);

  useEffect(() => {
    if (isExecuting && file) {
      const lineCount = file.content.split('\n').length;
      setActiveLine(lineCount);
    } else {
      setActiveLine(-1);
    }
  }, [file?.content, isExecuting, file]);

  useEffect(() => {
    if (activeLineRef.current) {
        activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine]);
  
  useEffect(() => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
        <p>Select a file to begin editing.</p>
      </div>
    );
  }

  const lineCount = file.content.split('\n').length;
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className={cn("flex-1 h-full flex font-code text-sm bg-background", isAnimating && "animate-line-shuffle")}>
       <div ref={lineNumbersRef} className="w-12 text-right pr-4 text-muted-foreground/50 select-none bg-background pt-[9px] pb-[9px] overflow-hidden">
        {Array.from({ length: lineCount }, (_, i) => {
          const isCurrentActiveLine = isExecuting && (i + 1 === activeLine);
          return (
              <div 
                key={i} 
                ref={isCurrentActiveLine ? activeLineRef : null}
                className="relative flex items-center justify-end"
                style={{ lineHeight: '1.5rem', height: '1.5rem' }}
              >
                 {isCurrentActiveLine && <Pencil className="w-3 h-3 mr-1 text-primary animate-pulse" />}
                {i + 1}
              </div>
          )
        })}
      </div>
       <ScrollArea 
         className="flex-1" 
         viewportRef={scrollViewportRef} 
         onScroll={handleScroll}
       >
        <Textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onContentChange(e.target.value)}
          readOnly={isExecuting}
          className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-code text-sm leading-6 bg-transparent h-full whitespace-nowrap"
          style={{ lineHeight: '1.5rem', paddingTop: '9px', paddingBottom: '9px' }}
          placeholder="Start typing..."
        />
       </ScrollArea>
    </div>
  );
}
