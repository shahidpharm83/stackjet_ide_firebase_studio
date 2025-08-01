import { ScrollArea } from "@/components/ui/scroll-area";
import type { OpenFile } from "@/app/page";
import { useEffect, useState } from "react";

// A simple syntax highlighter for demonstration
function SyntaxHighlighter({ code }: { code: string }) {
  const highlight = (line: string) => {
    // Basic HTML entity escaping
    const escapedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // All of these replacements are on a line that's been HTML-escaped
    const highlightedLine = escapedLine
      .replace(
        /\b(import|from|function|const|if|return|export|default|class|extends|async|await|let|var)\b/g,
        '<span class="text-fuchsia-400">$&</span>'
      )
      .replace(
        /\b(React|useState|useEffect|useCallback|console|window|document|localStorage|true|false|null)\b/g,
        '<span class="text-accent">$&</span>'
      )
      .replace(/(&quot;.*?&quot;)|(&#039;.*?&#039;)/g, '<span class="text-amber-400">$&</span>')
      .replace(/(\/\/.*)/g, '<span class="text-green-500">$&</span>')
       .replace(/([{}\[\]\(\)])/g, '<span class="text-gray-400">$&</span>');

    return highlightedLine;
  };
  
  return (
    <pre className="font-code text-sm leading-6">
      {code.split('\n').map((line, i) => (
        <div key={i} className="flex">
          <span className="w-12 text-right pr-4 text-muted-foreground/50 select-none">{i + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: highlight(line) }} />
        </div>
      ))}
    </pre>
  );
}

type EditorPanelProps = {
  file: OpenFile | null;
};

export default function EditorPanel({ file }: EditorPanelProps) {

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
        <p>Select a file to begin editing.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-full">
        <div className="p-4">
            <SyntaxHighlighter code={file.content} />
        </div>
    </ScrollArea>
  );
}
