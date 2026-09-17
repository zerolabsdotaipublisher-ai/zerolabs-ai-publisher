import { EditorSaveStatus } from "./editor-save-status";
import type { EditorSaveStatus as SaveStatus } from "@/lib/editor";

interface EditorToolbarProps {
  title: string;
  saveStatus: SaveStatus;
  saveMessage?: string;
  dirty: boolean;
}

export function EditorToolbar({
  title,
  saveStatus,
  saveMessage,
  dirty,
}: EditorToolbarProps) {
  return (
    <header className="editor-toolbar">
      <div className="editor-toolbar-copy">
        <span className="editor-toolbar-eyebrow">Website editor</span>
        <div className="editor-toolbar-title-row">
          <div>
            <h1>{title}</h1>
            <p>Build the page in the canvas. Site structure and design stay on the left; draft and publishing actions stay on the right.</p>
          </div>
          <EditorSaveStatus status={saveStatus} message={saveMessage} dirty={dirty} />
        </div>
      </div>
    </header>
  );
}
