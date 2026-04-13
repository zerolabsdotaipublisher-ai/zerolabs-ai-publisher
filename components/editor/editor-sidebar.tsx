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
}: EditorSidebarProps) {
  return (
    <aside className="editor-sidebar" aria-label="Editor selection controls">
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
    </aside>
  );
}
