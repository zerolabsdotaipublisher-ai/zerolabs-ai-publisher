import { Renderer } from "@/components/generated-site/renderer";
import type { WebsiteStructure } from "@/lib/ai/structure";

interface EditorCanvasProps {
  structure: WebsiteStructure;
  pageSlug: string;
  previewSyncKey: string;
}

export function EditorCanvas({ structure, pageSlug, previewSyncKey }: EditorCanvasProps) {
  return (
    <section className="editor-canvas" aria-label="Live website preview canvas">
      <div className="editor-canvas-frame">
        <Renderer key={`${pageSlug}-${previewSyncKey}`} structure={structure} pageSlug={pageSlug} />
      </div>
    </section>
  );
}
