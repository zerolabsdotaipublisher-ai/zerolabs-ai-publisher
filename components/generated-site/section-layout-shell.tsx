import type { ReactNode } from "react";
import type { SectionLayoutNode } from "@/lib/ai/layout";

interface SectionLayoutShellProps {
  node?: SectionLayoutNode;
  children: ReactNode;
  editorSection?: {
    id: string;
    selected: boolean;
    onSelect?: (sectionId: string) => void;
  };
}

function classesFromNode(node?: SectionLayoutNode): string {
  if (!node) return "gs-layout-shell";

  return [
    "gs-layout-shell",
    `gs-layout-slot-${node.slot ?? "custom"}`,
    `gs-layout-align-${node.alignment?.alignment ?? "left"}`,
    `gs-layout-width-${node.alignment?.widthConstraint ?? "content"}`,
    `gs-layout-container-${node.alignment?.containerVariant ?? "default"}`,
    `gs-layout-space-${node.spacing?.paddingBlock ?? "md"}`,
  ].join(" ");
}

export function SectionLayoutShell({ node, children, editorSection }: SectionLayoutShellProps) {
  const canSelectSection = Boolean(editorSection?.onSelect);

  return (
    <div
      className={classesFromNode(node)}
      data-layout-slot={node?.slot}
      data-layout-style-hook={node?.metadata?.styleHook}
      data-layout-desktop-columns={node?.responsive?.desktop?.columns}
      data-layout-tablet-columns={node?.responsive?.tablet?.columns}
      data-layout-mobile-columns={node?.responsive?.mobile?.columns}
      data-editor-section-id={editorSection?.id}
      data-editor-active={editorSection?.selected ? "true" : undefined}
      contentEditable={editorSection?.selected || undefined}
      suppressContentEditableWarning={editorSection?.selected || undefined}
      onClick={
        canSelectSection
          ? (event) => {
              if (!editorSection?.selected) {
                event.preventDefault();
                editorSection?.onSelect?.(editorSection.id);
                return;
              }

              if ((event.target as HTMLElement).closest("a")) {
                event.preventDefault();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
