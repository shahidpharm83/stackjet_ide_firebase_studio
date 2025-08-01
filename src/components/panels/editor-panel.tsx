import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const code = `import React from 'react';

function HelloWorld() {
  const name = "World";
  
  // This is a comment
  const a = 1;
  const b = 2; // Potential error here
  
  if (true) {
    console.log("This will run");
  }

  return (
    <h1 className="text-3xl font-bold text-primary">
      Hello, {name}!
    </h1>
  );
}

export default HelloWorld;
`;

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
        /\b(import|from|function|const|if|return|export|default)\b/g,
        '<span class="text-fuchsia-400">$&</span>'
      )
      .replace(
        /\b(React|HelloWorld|console)\b/g,
        '<span class="text-accent">$&</span>'
      )
      .replace(/(&quot;.*?&quot;)|(&#039;.*?&#039;)/g, '<span class="text-amber-400">$&</span>')
      .replace(/(\/\/.*)/g, '<span class="text-green-500">$&</span>')
      .replace(
        /(&lt;h1.*?&gt;|&lt;\/h1&gt;)/g,
        '<span class="text-gray-400">$&</span>'
      );

    return highlightedLine;
  };
  
  const lineWithError = '  const b = 2; // Potential error here';

  return (
    <pre className="font-code text-sm leading-6">
      {code.split('\n').map((line, i) => (
        <div key={i} className="flex">
          <span className="w-12 text-right pr-4 text-muted-foreground/50 select-none">{i + 1}</span>
          <span className={line.trim() === lineWithError.trim() ? "wavy-underline" : ""} dangerouslySetInnerHTML={{ __html: highlight(line) }} />
        </div>
      ))}
    </pre>
  );
}


export default function EditorPanel() {
  return (
    <div className="h-full flex flex-col">
       <div className="flex-shrink-0 p-2 border-b border-border flex items-center justify-between h-12">
        <span className="font-medium text-foreground">index.js</span>
        <div className="flex items-center gap-2">
            <Badge variant="secondary">JavaScript</Badge>
            <Badge variant="destructive">1 Error</Badge>
        </div>
       </div>
      <ScrollArea className="flex-1">
          <div className="p-4">
              <SyntaxHighlighter code={code} />
          </div>
      </ScrollArea>
    </div>
  );
}
