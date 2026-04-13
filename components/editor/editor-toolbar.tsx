import Link from "next/link";
import { EditorSaveStatus } from "./editor-save-status";
import type { EditorSaveStatus as SaveStatus } from "@/lib/editor";

interface EditorToolbarProps {
  title: string;
  saveStatus: SaveStatus;
  saveMessage?: string;
  dirty: boolean;
  previewPath: string;
  generatedSitePath: string;
  onSave: () => void;
}

export function EditorToolbar({
  title,
  saveStatus,
  saveMessage,
  dirty,
  previewPath,
  generatedSitePath,
  onSave,
}: EditorToolbarProps) {
  return (
    <header className="editor-toolbar">
      <div>
        <h1>{title}</h1>
        <EditorSaveStatus status={saveStatus} message={saveMessage} dirty={dirty} />
      </div>
      <div className="editor-toolbar-actions">
        <button type="button" onClick={onSave} disabled={saveStatus === "saving"}>
          Save draft
        </button>
        <Link href={previewPath} className="wizard-button-secondary">
          Open preview
        </Link>
        <Link href={generatedSitePath} className="wizard-button-secondary">
          Open generated route
        </Link>
      </div>
    </header>
  );
}
