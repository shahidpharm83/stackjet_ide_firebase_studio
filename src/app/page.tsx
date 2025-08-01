import Header from "@/components/layout/header";
import FileExplorer from "@/components/panels/file-explorer";
import MainPanel from "@/components/panels/main-panel";
import PreviewPanel from "@/components/panels/preview-panel";
import TerminalPanel from "@/components/panels/terminal-panel";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans text-sm">
      <Header />
      <main className="flex flex-1 overflow-hidden border-t border-border">
        <FileExplorer />
        <div className="flex flex-1 flex-col overflow-hidden border-l border-r border-border">
          <MainPanel />
          <TerminalPanel />
        </div>
        <PreviewPanel />
      </main>
    </div>
  );
}
