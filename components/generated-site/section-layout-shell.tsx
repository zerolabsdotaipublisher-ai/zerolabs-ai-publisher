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
    `gs-layout-slot-${node.slot}`,
    `gs-layout-align-${node.alignment.alignment}`,
    `gs-layout-width-${node.alignment.widthConstraint}`,
    `gs-layout-container-${node.alignment.containerVariant}`,
    `gs-layout-space-${node.spacing.paddingBlock}`,
  ].join(" ");
}

export function SectionLayoutShell({ node, children }: SectionLayoutShellProps) {
  return (
    <div
      className={classesFromNode(node)}
      data-layout-slot={node?.slot}
      data-layout-style-hook={node?.metadata.styleHook}
      data-layout-desktop-columns={node?.responsive.desktop.columns}
      data-layout-tablet-columns={node?.responsive.tablet.columns}
      data-layout-mobile-columns={node?.responsive.mobile.columns}
    >
      {children}
    </div>
  );
}
