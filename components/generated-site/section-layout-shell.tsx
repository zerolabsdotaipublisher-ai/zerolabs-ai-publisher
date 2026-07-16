import type { ReactNode } from "react";
import type { SectionLayoutNode } from "@/lib/ai/layout";

interface SectionLayoutShellProps {
  node?: SectionLayoutNode;
  children: ReactNode;
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

export function SectionLayoutShell({ node, children }: SectionLayoutShellProps) {
  return (
    <div
      className={classesFromNode(node)}
      data-layout-slot={node?.slot}
      data-layout-style-hook={node?.metadata?.styleHook}
      data-layout-desktop-columns={node?.responsive?.desktop?.columns}
      data-layout-tablet-columns={node?.responsive?.tablet?.columns}
      data-layout-mobile-columns={node?.responsive?.mobile?.columns}
    >
      {children}
    </div>
  );
}
