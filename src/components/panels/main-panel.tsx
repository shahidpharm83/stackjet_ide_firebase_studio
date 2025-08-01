import EditorPanel from "./editor-panel";
import TerminalPanel from "./terminal-panel";

export default function MainPanel() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
        <EditorPanel />
        <TerminalPanel />
    </div>
  );
}