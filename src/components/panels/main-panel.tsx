import EditorPanel from "./editor-panel";

type MainPanelProps = {
  projectOpen: boolean;
};

export default function MainPanel({ projectOpen }: MainPanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
        <EditorPanel projectOpen={projectOpen} />
    </div>
  );
}
