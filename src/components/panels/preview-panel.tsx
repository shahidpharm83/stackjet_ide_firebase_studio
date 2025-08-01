import { Eye } from 'lucide-react';

export default function PreviewPanel() {
  return (
    <aside className="flex-1 flex flex-col h-full">
       <div className="p-2 border-b border-border flex items-center h-12">
        <h2 className="font-semibold text-base flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
        </h2>
      </div>
      <div className="flex-1 bg-black/10 p-4 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
            <p>Your application preview will appear here.</p>
            <p className="text-xs">Changes will be reflected in real-time.</p>
        </div>
      </div>
    </aside>
  );
}