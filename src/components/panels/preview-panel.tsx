
"use client";

import { useState, useEffect } from 'react';
import { Eye, Monitor, Tablet, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

type PreviewPanelProps = {
  projectOpen: boolean;
};

export default function PreviewPanel({ projectOpen }: PreviewPanelProps) {
  const [mode, setMode] = useState<PreviewMode>('desktop');
  const [url, setUrl] = useState('http://localhost:9002');
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // In a cloud development environment, the preview URL might be different.
    // This logic attempts to construct the correct URL.
    if (typeof window !== 'undefined' && window.location.hostname.includes('cloudworkstations.dev')) {
        const newUrl = `https://${9002}-${window.location.hostname}`;
        setUrl(newUrl);
    }
  }, []);

  const getPreviewSize = () => {
    switch (mode) {
      case 'desktop': return { width: '100%', height: '100%' };
      case 'tablet': return { width: '768px', height: '1024px' };
      case 'mobile': return { width: '375px', height: '667px' };
    }
  };

  const handleRefresh = () => {
    setIframeKey(Date.now());
  };

  if (!isMounted) {
      return null;
  }

  return (
    <aside className="flex-1 flex flex-col h-full bg-muted/20">
      <div className="p-2 border-b border-border flex items-center justify-between h-12 shrink-0 bg-background">
        <h2 className="font-semibold text-sm flex items-center gap-2 pl-2">
          <Eye className="w-5 h-5" />
          Live Preview
        </h2>
        <div className="flex items-center gap-1">
          <Button variant={mode === 'desktop' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('desktop')}>
            <Monitor className="h-5 w-5" />
          </Button>
          <Button variant={mode === 'tablet' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('tablet')}>
            <Tablet className="h-5 w-5" />
          </Button>
          <Button variant={mode === 'mobile' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('mobile')}>
            <Smartphone className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="p-1 flex items-center gap-2 border-b border-border bg-background">
          <Input 
            className="h-8 text-xs" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
      </div>
      <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
        {projectOpen ? (
          <div
            className="bg-background shadow-lg rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
            style={getPreviewSize()}
          >
            <iframe
              key={iframeKey}
              src={url}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Open and run a project to see the live preview.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
