"use client";

import { useMemo, useReducer } from "react";
import type { LayoutVariantName } from "@/lib/ai/layout";
import type { SectionType, StylePreset, TonePreset, WebsiteStructure } from "@/lib/ai/structure";
import {
  addSectionToPage,
  buildPreviewStructureFromDraft,
  createInitialEditorState,
  getEditorSelection,
  reduceWebsiteEditorState,
  removeSectionFromPage,
  reorderNavigation,
  reorderPageSections,
  saveEditorDraft,
  setNavigationInclusion,
  updateNavigationLabel,
  updateSectionTextValue,
  updateSectionVisibility,
  updateStructurePage,
  validateEditorDraft,
} from "@/lib/editor";
import { EditorCanvas } from "./editor-canvas";
import { EditorErrorState } from "./editor-error-state";
import { EditorNavigationPanel } from "./editor-navigation-panel";
import { EditorPageSettingsPanel } from "./editor-page-settings-panel";
import { EditorSidebar } from "./editor-sidebar";
import { EditorStylePanel } from "./editor-style-panel";
import { EditorTextPanel } from "./editor-text-panel";
import { EditorToolbar } from "./editor-toolbar";
import { EditorUnsavedWarning } from "./editor-unsaved-warning";

interface WebsiteEditorShellProps {
  initialStructure: WebsiteStructure;
  previewPath: string;
  generatedSitePath: string;
}

function moveItem(ids: string[], targetId: string, direction: "up" | "down"): string[] {
  const index = ids.indexOf(targetId);
  if (index < 0) {
    return ids;
  }

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= ids.length) {
    return ids;
  }

  const next = ids.slice();
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

export function WebsiteEditorShell({ initialStructure, previewPath, generatedSitePath }: WebsiteEditorShellProps) {
  const [state, dispatch] = useReducer(reduceWebsiteEditorState, initialStructure, createInitialEditorState);
  const selection = useMemo(() => getEditorSelection(state), [state]);

  function setDraft(nextDraft: WebsiteStructure) {
    dispatch({ type: "set-draft", draft: nextDraft });
  }

  async function handleSaveDraft() {
    const validationErrors = validateEditorDraft(state.draft);
    dispatch({ type: "set-validation-errors", errors: validationErrors });

    if (validationErrors.length > 0) {
      dispatch({ type: "set-save-status", status: "error", message: "Fix validation errors before saving." });
      return;
    }

    dispatch({ type: "set-save-status", status: "saving" });
    const response = await saveEditorDraft({
      structureId: state.draft.id,
      draft: state.draft,
    });

    if (!response.ok || !response.structure) {
      dispatch({
        type: "set-error",
        message: response.error || "Failed to save draft.",
      });
      if (response.validationErrors?.length) {
        dispatch({ type: "set-validation-errors", errors: response.validationErrors });
      }
      return;
    }

    dispatch({
      type: "mark-saved",
      structure: response.structure,
      message: "Draft saved successfully.",
    });
  }

  function resetSelectedSectionAfterDraft(nextDraft: WebsiteStructure) {
    const currentPage = nextDraft.pages.find((page) => page.id === state.selectedPageId);
    if (!currentPage) {
      dispatch({ type: "select-section", sectionId: undefined });
      return;
    }

    const selectedStillExists = currentPage.sections.some((section) => section.id === state.selectedSectionId);
    if (selectedStillExists) {
      return;
    }

    const firstSection = currentPage.sections.slice().sort((left, right) => left.order - right.order)[0];
    dispatch({ type: "select-section", sectionId: firstSection?.id });
  }

  function handleSectionTextChange(path: string, value: string) {
    if (!selection.page || !selection.section) {
      return;
    }

    const nextSection = updateSectionTextValue(selection.section, path, value);
    setDraft(
      updateStructurePage(state.draft, selection.page.id, (page) => ({
        ...page,
        sections: page.sections.map((section) => (section.id === selection.section?.id ? nextSection : section)),
      })),
    );
  }

  function handleSectionVisibility(sectionId: string, visible: boolean) {
    setDraft(
      updateStructurePage(state.draft, state.selectedPageId, (page) => updateSectionVisibility(page, sectionId, visible)),
    );
  }

  function handleSectionRemove(sectionId: string) {
    const nextDraft = updateStructurePage(state.draft, state.selectedPageId, (page) => removeSectionFromPage(page, sectionId));
    setDraft(nextDraft);
    resetSelectedSectionAfterDraft(nextDraft);
  }

  function handleSectionReorder(sectionId: string, direction: "up" | "down") {
    setDraft(
      updateStructurePage(state.draft, state.selectedPageId, (page) => {
        const orderedIds = page.sections
          .slice()
          .sort((left, right) => left.order - right.order)
          .map((section) => section.id);
        const nextOrder = moveItem(orderedIds, sectionId, direction);
        return reorderPageSections(page, nextOrder);
      }),
    );
  }

  function handleSectionAdd(type: SectionType) {
    const nextDraft = updateStructurePage(state.draft, state.selectedPageId, (page) => addSectionToPage(page, type));
    setDraft(nextDraft);
    const page = nextDraft.pages.find((candidate) => candidate.id === state.selectedPageId);
    const latest = page?.sections.slice().sort((left, right) => right.order - left.order)[0];
    if (latest) {
      dispatch({ type: "select-section", sectionId: latest.id });
    }
  }

  function handlePageTitleChange(value: string) {
    setDraft(
      updateStructurePage(state.draft, state.selectedPageId, (page) => ({
        ...page,
        title: value,
      })),
    );
  }

  function handlePageSlugChange(value: string) {
    setDraft(
      updateStructurePage(state.draft, state.selectedPageId, (page) => ({
        ...page,
        slug: value,
      })),
    );
  }

  function handlePageNavigationLabelChange(value: string) {
    setDraft(
      updateStructurePage(state.draft, state.selectedPageId, (page) => ({
        ...page,
        navigationLabel: value,
      })),
    );
  }

  function handlePageVisibilityChange(visible: boolean) {
    setDraft(
      updateStructurePage(state.draft, state.selectedPageId, (page) => ({
        ...page,
        visible,
      })),
    );
  }

  function handleNavigationLabelChange(href: string, label: string) {
    setDraft(updateNavigationLabel(state.draft, href, label));
  }

  function handleNavigationMove(href: string, direction: "up" | "down") {
    const orderedHrefs = state.draft.navigation.primary.map((item) => item.href);
    const next = moveItem(orderedHrefs, href, direction);
    setDraft(reorderNavigation(state.draft, next, "primary"));
  }

  function handleNavigationToggle(href: string, include: boolean) {
    setDraft(setNavigationInclusion(state.draft, "primary", href, include));
  }

  function handleToneChange(tone: TonePreset) {
    setDraft({
      ...state.draft,
      styleConfig: {
        ...state.draft.styleConfig,
        tone,
      },
    });
  }

  function handleStyleChange(style: StylePreset) {
    setDraft({
      ...state.draft,
      styleConfig: {
        ...state.draft.styleConfig,
        style,
      },
    });
  }

  function handleLayoutTemplateChange(templateName: LayoutVariantName) {
    setDraft({
      ...state.draft,
      layout: state.draft.layout
        ? {
            ...state.draft.layout,
            pages: state.draft.layout.pages.map((page) =>
              page.pageId === state.selectedPageId
                ? {
                    ...page,
                    templateName,
                  }
                : page,
            ),
          }
        : state.draft.layout,
    });
  }

  function handleThemeModeChange(themeMode: "light" | "dark" | "auto") {
    if (!state.draft.layout) {
      return;
    }

    setDraft({
      ...state.draft,
      layout: {
        ...state.draft.layout,
        pages: state.draft.layout.pages.map((page) =>
          page.pageId === state.selectedPageId
            ? {
                ...page,
                metadata: {
                  ...page.metadata,
                  themeMode,
                },
              }
            : page,
        ),
      },
    });
  }

  const previewStructure = useMemo(() => buildPreviewStructureFromDraft(state.draft), [state.draft]);
  const layoutPage = state.draft.layout?.pages.find((page) => page.pageId === state.selectedPageId);

  return (
    <div className="editor-shell">
      <EditorToolbar
        title={`${state.draft.siteTitle} editor`}
        saveStatus={state.saveStatus}
        saveMessage={state.saveMessage}
        dirty={state.dirty}
        previewPath={previewPath}
        generatedSitePath={generatedSitePath}
        onSave={() => void handleSaveDraft()}
      />

      <EditorUnsavedWarning dirty={state.dirty} />
      <EditorErrorState message={state.saveStatus === "error" ? state.saveMessage : undefined} validationErrors={state.validationErrors} />

      <div className="editor-layout">
        <EditorSidebar
          pages={state.draft.pages}
          selectedPageId={state.selectedPageId}
          selectedSectionId={state.selectedSectionId}
          sections={selection.page?.sections ?? []}
          onPageSelect={(pageId) => dispatch({ type: "select-page", pageId })}
          onSectionSelect={(sectionId) => dispatch({ type: "select-section", sectionId })}
          onSectionVisibility={handleSectionVisibility}
          onSectionRemove={handleSectionRemove}
          onSectionMoveUp={(sectionId) => handleSectionReorder(sectionId, "up")}
          onSectionMoveDown={(sectionId) => handleSectionReorder(sectionId, "down")}
          onSectionAdd={handleSectionAdd}
        />

        <EditorCanvas
          structure={previewStructure}
          pageSlug={selection.page?.slug || "/"}
          previewSyncKey={state.previewSyncKey}
        />

        <aside className="editor-panels" aria-label="Editor controls">
          <EditorTextPanel section={selection.section} onChange={handleSectionTextChange} />
          <EditorPageSettingsPanel
            page={selection.page}
            onTitleChange={handlePageTitleChange}
            onSlugChange={handlePageSlugChange}
            onNavigationLabelChange={handlePageNavigationLabelChange}
            onVisibilityChange={handlePageVisibilityChange}
          />
          <EditorNavigationPanel
            structure={state.draft}
            onLabelChange={handleNavigationLabelChange}
            onMoveUp={(href) => handleNavigationMove(href, "up")}
            onMoveDown={(href) => handleNavigationMove(href, "down")}
            onTogglePrimary={handleNavigationToggle}
          />
          <EditorStylePanel
            tone={state.draft.styleConfig.tone}
            style={state.draft.styleConfig.style}
            layoutTemplate={layoutPage?.templateName}
            themeMode={layoutPage?.metadata.themeMode}
            onToneChange={handleToneChange}
            onStyleChange={handleStyleChange}
            onLayoutTemplateChange={handleLayoutTemplateChange}
            onThemeModeChange={handleThemeModeChange}
          />
        </aside>
      </div>
    </div>
  );
}
