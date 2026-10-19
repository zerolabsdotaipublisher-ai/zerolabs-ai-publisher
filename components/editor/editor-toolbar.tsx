import Link from "next/link";
import { VISUAL_EDITOR_LEGACY_HANDOFF } from "@/lib/editor/visual";
import { EditorSaveStatus } from "./editor-save-status";
import type { EditorSaveStatus as SaveStatus } from "@/lib/editor";

interface EditorToolbarProps {
  title: string;
  saveStatus: SaveStatus;
  saveMessage?: string;
  dirty: boolean;
  visualEditorPath: string;
}

export function EditorToolbar({
  title,
  saveStatus,
  saveMessage,
  dirty,
  visualEditorPath,
}: EditorToolbarProps) {
  return (
    <header className="editor-toolbar">
      <div className="editor-toolbar-copy">
        <span className="editor-toolbar-eyebrow">Legacy website editor</span>
        <div className="editor-toolbar-title-row">
          <div>
            <h1>{title}</h1>
            <p>{VISUAL_EDITOR_LEGACY_HANDOFF.notice}</p>
          </div>
          <EditorSaveStatus status={saveStatus} message={saveMessage} dirty={dirty} />
        </div>
      </div>
      <div className="editor-toolbar-actions">
        <Link href={visualEditorPath} className="editor-toolbar-link">{VISUAL_EDITOR_LEGACY_HANDOFF.actionLabel}</Link>
      </div>
    </header>
  );
}
