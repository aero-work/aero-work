import { EditorTabs } from "./EditorTabs";
import { FileViewer } from "./FileViewer";

export function EditorPanel() {
  return (
    <div className="flex flex-col h-full">
      <EditorTabs />
      <FileViewer />
    </div>
  );
}
