import type { ReactNode } from "react";
import type { SectionType, WebsitePage, WebsiteSection } from "@/lib/ai/structure";
import { EditorPageSelector } from "./editor-page-selector";
import { EditorSectionSelector } from "./editor-section-selector";

interface EditorSidebarProps {
  pages: WebsitePage[];
  selectedPageId: string;
  selectedSectionId?: string;
  sections: WebsiteSection[];
  onPageSelect: (pageId: string) => void;
  onSectionSelect: (sectionId?: string) => void;
  onSectionVisibility: (sectionId: string, visible: boolean) => void;
  onSectionRemove: (sectionId: string) => void;
  onSectionMoveUp: (sectionId: string) => void;
  onSectionMoveDown: (sectionId: string) => void;
  onSectionAdd: (type: SectionType) => void;
  structureSettings?: ReactNode;
  designControls?: ReactNode;
}

export function EditorSidebar({
  pages,
  selectedPageId,
  selectedSectionId,
  sections,
  onPageSelect,
  onSectionSelect,
  onSectionVisibility,
  onSectionRemove,
  onSectionMoveUp,
  onSectionMoveDown,
  onSectionAdd,
  structureSettings,
  designControls,
}: EditorSidebarProps) {
  return (
    <aside className="editor-sidebar" aria-label="Editor selection controls">
      <header className="editor-structure-header">
        <span className="editor-panel-eyebrow">Site structure</span>
        <h2>Pages &amp; sections</h2>
        <p>Choose a page, then select a section to edit its content.</p>
      </header>
      <EditorPageSelector pages={pages} selectedPageId={selectedPageId} onSelect={onPageSelect} />
      <EditorSectionSelector
        sections={sections}
        selectedSectionId={selectedSectionId}
        onSelect={onSectionSelect}
        onToggleVisibility={onSectionVisibility}
        onRemove={onSectionRemove}
        onMoveUp={onSectionMoveUp}
        onMoveDown={onSectionMoveDown}
        onAdd={onSectionAdd}
      />
      {structureSettings ? <div className="editor-sidebar-settings">{structureSettings}</div> : null}
      {designControls ? (
        <section className="editor-sidebar-design" aria-label="Website design controls">
          <div className="editor-sidebar-design-header">
            <span className="editor-panel-eyebrow">Design</span>
            <h3>Website appearance</h3>
            <p>Only settings already connected to this website are editable.</p>
          </div>
          {designControls}
        </section>
      ) : null}
    </aside>
  );
}
