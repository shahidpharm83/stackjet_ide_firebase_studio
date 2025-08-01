import { Folder, FileText, ChevronDown, Plus, UploadCloud } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';

const fileTree = [
  {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'app',
        type: 'folder',
        children: [{ name: 'page.tsx', type: 'file' }, { name: 'layout.tsx', type: 'file' }],
      },
      {
        name: 'components',
        type: 'folder',
        children: [
            { name: 'ui', type: 'folder', children: [{ name: 'button.tsx', type: 'file' }] },
            { name: 'header.tsx', type: 'file' },
        ],
      },
      { name: 'index.js', type: 'file', active: true },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'README.md', type: 'file' },
];

const FileTreeItem = ({ item, level = 0 }: { item: any; level?: number }) => {
    const isFolder = item.type === 'folder';
    const Icon = isFolder ? Folder : FileText;
    const paddingLeft = `${level * 16 + 12}px`;

    if (isFolder) {
        return (
            <div>
                <div className="flex items-center py-1.5 px-3 rounded-md cursor-pointer hover:bg-muted" style={{ paddingLeft }}>
                    <ChevronDown className="w-4 h-4 mr-1 flex-shrink-0" />
                    <Icon className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                </div>
                {item.children.map((child: any) => (
                    <FileTreeItem key={child.name} item={child} level={level + 1} />
                ))}
            </div>
        );
    }
    
    return (
        <div className={`flex items-center py-1.5 px-3 rounded-md cursor-pointer hover:bg-muted ${item.active ? 'bg-muted' : ''}`} style={{ paddingLeft }}>
             <span className="w-4 h-4 mr-1 flex-shrink-0" />
             <Icon className="w-4 h-4 mr-2 text-foreground/70 flex-shrink-0" />
             <span className="truncate">{item.name}</span>
        </div>
    );
};


export default function FileExplorer() {
  return (
    <aside className="w-full h-full flex flex-col shrink-0">
      <ScrollArea className="flex-1 p-2">
        {fileTree.map(item => <FileTreeItem key={item.name} item={item} />)}
      </ScrollArea>
    </aside>
  );
}