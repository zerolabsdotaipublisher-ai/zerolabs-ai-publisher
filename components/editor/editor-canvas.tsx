"use client";

import { useRef, type FormEvent, type MouseEvent as ReactMouseEvent } from "react";
import { flushSync } from "react-dom";
import { Renderer } from "@/components/generated-site/renderer";
import { getEditableSectionTextFields } from "@/lib/editor";
import type { WebsiteStructure } from "@/lib/ai/structure";

interface EditorCanvasProps {
  structure: WebsiteStructure;
  pageSlug: string;
  pageTitle?: string;
  pageId?: string;
  selectedSectionId?: string;
  previewSyncKey: string;
  onSectionSelect: (sectionId: string) => void;
  onSectionTextChange: (sectionId: string, path: string, value: string) => void;
}

interface PendingInlineEdit {
  sectionId: string;
  path: string;
  originalValue: string;
  value: string;
  element: HTMLElement;
}

function getTextElementFromSelection(root: HTMLElement): HTMLElement | undefined {
  const selection = window.getSelection();
  const anchorNode = selection?.anchorNode;
  if (!anchorNode || !root.contains(anchorNode)) {
    return undefined;
  }

  if (anchorNode.nodeType === Node.ELEMENT_NODE) {
    return anchorNode as HTMLElement;
  }

  return anchorNode.parentElement ?? undefined;
}

export function EditorCanvas({
  structure,
  pageSlug,
  pageTitle,
  pageId,
  selectedSectionId,
  previewSyncKey,
  onSectionSelect,
  onSectionTextChange,
}: EditorCanvasProps) {
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const pendingInlineEditRef = useRef<PendingInlineEdit | undefined>(undefined);

  function commitPendingInlineEdit() {
    const pendingEdit = pendingInlineEditRef.current;
    if (!pendingEdit) {
      return;
    }

    pendingInlineEditRef.current = undefined;
    if (pendingEdit.value !== pendingEdit.originalValue) {
      flushSync(() => {
        onSectionTextChange(pendingEdit.sectionId, pendingEdit.path, pendingEdit.value);
      });
    }
  }

  function captureActiveTextField() {
    const previewFrame = previewFrameRef.current;
    const textElement = previewFrame ? getTextElementFromSelection(previewFrame) : undefined;
    if (!previewFrame || !textElement) {
      return;
    }

    const sectionElement = textElement.closest<HTMLElement>("[data-editor-section-id]");
    const sectionId = sectionElement?.dataset.editorSectionId;
    if (!sectionElement || !sectionId || sectionId !== selectedSectionId) {
      return;
    }

    const page = structure.pages.find((candidate) => candidate.id === pageId);
    const section = page?.sections.find((candidate) => candidate.id === sectionId);
    if (!section) {
      return;
    }

    let candidateElement: HTMLElement | null = textElement;
    const fields = getEditableSectionTextFields(section);
    while (candidateElement && candidateElement !== sectionElement) {
      const field = fields.find((entry) => entry.value === candidateElement?.textContent);
      if (field) {
        const pendingEdit = pendingInlineEditRef.current;
        if (pendingEdit?.element !== candidateElement) {
          commitPendingInlineEdit();
          pendingInlineEditRef.current = {
            sectionId,
            path: field.path,
            originalValue: field.value,
            value: field.value,
            element: candidateElement,
          };
        }
        return;
      }

      candidateElement = candidateElement.parentElement;
    }
  }

  function handlePreviewPointerUp(event: ReactMouseEvent<HTMLDivElement>) {
    const sectionElement = (event.target as HTMLElement).closest<HTMLElement>("[data-editor-section-id]");
    const sectionId = sectionElement?.dataset.editorSectionId;
    if (sectionId && sectionId !== selectedSectionId) {
      onSectionSelect(sectionId);
      return;
    }

    captureActiveTextField();
  }

  function handlePreviewInput() {
    const pendingEdit = pendingInlineEditRef.current;
    if (!pendingEdit) {
      return;
    }

    pendingEdit.value = pendingEdit.element.textContent ?? "";
  }

  function handlePreviewBeforeInput(event: FormEvent<HTMLDivElement>) {
    if (!pendingInlineEditRef.current) {
      event.preventDefault();
    }
  }

  return (
    <section className="editor-canvas" aria-label="Live website preview canvas">
      <header className="editor-canvas-header">
        <div>
          <span className="editor-panel-eyebrow">Live preview</span>
          <h2>{pageTitle || "Website preview"}</h2>
          <p>Choose a section, then click any copy to edit it in place.</p>
        </div>
        <span className="editor-canvas-path">{pageSlug}</span>
      </header>
      <div className="editor-canvas-stage">
        <div className="editor-canvas-browser" aria-hidden="true">
          <span className="editor-canvas-browser-dots"><i /><i /><i /></span>
          <span className="editor-canvas-browser-address">{pageSlug}</span>
          <span className="editor-canvas-browser-status">Draft</span>
        </div>
        <div
          ref={previewFrameRef}
          className="editor-canvas-frame editor-canvas-inline-preview"
          onMouseUp={handlePreviewPointerUp}
          onBeforeInput={handlePreviewBeforeInput}
          onInput={handlePreviewInput}
          onBlur={commitPendingInlineEdit}
        >
          <Renderer
            key={`${pageSlug}-${previewSyncKey}`}
            structure={structure}
            pageSlug={pageSlug}
            inlineEditing={{ selectedSectionId, onSectionSelect }}
          />
        </div>
      </div>
    </section>
  );
}
