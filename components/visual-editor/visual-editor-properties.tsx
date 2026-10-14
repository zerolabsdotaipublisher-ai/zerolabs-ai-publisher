"use client";

import type { ChangeEvent, ReactNode } from "react";
import type { EditorDocument, EditorNavigationTarget, EditorNode, EditorPage, EditorValue, NodeStyleTokens } from "@/lib/editor/document";
import { getValueAtPath, getVisualEditorNodeControls, type VisualEditorPanelTab, type VisualEditorStyleControl } from "@/lib/editor/visual";
import type { EditablePropDefinition } from "@/lib/editor/registry";

type ControlDefinition = Pick<EditablePropDefinition, "label" | "description" | "control" | "options" | "group">;

interface VisualEditorPropertiesProps {
  document: EditorDocument;
  selectedScope: "site" | "page" | "node";
  selectedPageId: string;
  selectedNodeId?: string;
  panelTab: VisualEditorPanelTab;
  onPanelTabChange: (tab: VisualEditorPanelTab) => void;
  onNodePropChange: (nodeId: string, path: string, value: EditorValue) => void;
  onNodeStyleChange: (nodeId: string, key: keyof NodeStyleTokens, value: EditorValue | undefined) => void;
  onNodeVisibilityChange: (nodeId: string, breakpoint: "base" | "desktop" | "tablet" | "mobile", value: boolean | undefined) => void;
  onPageChange: (pageId: string, path: string, value: EditorValue) => void;
  onSiteChange: (path: string, value: EditorValue) => void;
}

const PANEL_TABS: Array<{ id: VisualEditorPanelTab; label: string }> = [
  { id: "properties", label: "All" },
  { id: "content", label: "Content" },
  { id: "layout", label: "Layout" },
  { id: "style", label: "Style" },
  { id: "typography", label: "Typography" },
  { id: "visibility", label: "Visibility" },
];

function asInputValue(value: EditorValue | undefined): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function groupForControl(group: ControlDefinition["group"]): VisualEditorPanelTab {
  if (group === "layout" || group === "style" || group === "typography" || group === "visibility") return group;
  return "content";
}

function selectValue(event: ChangeEvent<HTMLSelectElement>, definition: ControlDefinition): EditorValue {
  return definition.options?.find((option) => String(option.value) === event.target.value)?.value ?? event.target.value;
}

function LinkTargetControl({ value, document, onChange }: { value: EditorValue | undefined; document: EditorDocument; onChange: (value: EditorValue) => void }) {
  const target = value && typeof value === "object" && !Array.isArray(value) && typeof value.kind === "string"
    ? value as EditorNavigationTarget
    : { kind: "external", url: "" } as EditorNavigationTarget;
  return (
    <div className="visual-editor-link-target">
      <select
        aria-label="Link destination type"
        value={target.kind === "unresolved" ? "external" : target.kind}
        onChange={(event) => {
          if (event.target.value === "page") onChange({ kind: "page", pageId: document.pages[0]?.id ?? "" });
          else if (event.target.value === "node") onChange({ kind: "node", nodeId: Object.keys(document.nodes)[0] ?? "" });
          else onChange({ kind: "external", url: "https://example.com" });
        }}
      >
        <option value="external">External URL</option>
        <option value="page">Page</option>
        <option value="node">Section / node</option>
      </select>
      {target.kind === "external" || target.kind === "unresolved" ? <input aria-label="External URL" type="url" placeholder="https://" value={target.kind === "external" ? target.url : target.originalHref} onChange={(event) => onChange({ kind: "external", url: event.target.value })} /> : null}
      {target.kind === "page" ? <select aria-label="Target page" value={target.pageId} onChange={(event) => onChange({ kind: "page", pageId: event.target.value })}>{document.pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select> : null}
      {target.kind === "node" ? <select aria-label="Target node" value={target.nodeId} onChange={(event) => onChange({ kind: "node", nodeId: event.target.value })}>{Object.values(document.nodes).map((node) => <option key={node.id} value={node.id}>{node.type} · {node.id}</option>)}</select> : null}
    </div>
  );
}

function GenericControl({ definition, value, document, onChange }: { definition: ControlDefinition; value: EditorValue | undefined; document: EditorDocument; onChange: (value: EditorValue) => void }) {
  if (definition.control === "toggle") {
    return <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />;
  }
  if (definition.control === "link-target") return <LinkTargetControl value={value} document={document} onChange={onChange} />;
  if (definition.control === "list") {
    return <textarea aria-label={definition.label} defaultValue={Array.isArray(value) ? JSON.stringify(value, null, 2) : "[]"} onBlur={(event) => {
      try {
        const parsed: unknown = JSON.parse(event.target.value);
        if (Array.isArray(parsed)) onChange(parsed as EditorValue);
      } catch {
        // Keep the typed draft in the textarea; it becomes an editor value after valid JSON is supplied.
      }
    }} />;
  }
  if (definition.control === "color") {
    const color = typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value.slice(0, 7) : "#000000";
    return <input type="color" aria-label={definition.label} value={color} onChange={(event) => onChange(event.target.value)} />;
  }
  if (definition.control === "select" || definition.control === "alignment" || definition.control === "width" || definition.control === "container" || definition.control === "spacing" || definition.control === "shadow") {
    return <select value={asInputValue(value)} onChange={(event) => onChange(selectValue(event, definition))}>{definition.options?.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}</select>;
  }
  if (definition.control === "textarea" || definition.control === "rich-text") {
    return <textarea value={asInputValue(value)} onChange={(event) => onChange(event.target.value)} />;
  }
  if (definition.control === "number") {
    return <input type="number" value={asInputValue(value)} onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))} />;
  }
  return <input type={definition.control === "url" ? "url" : "text"} value={asInputValue(value)} onChange={(event) => onChange(event.target.value)} />;
}

function Field({ definition, value, document, onChange }: { definition: ControlDefinition; value: EditorValue | undefined; document: EditorDocument; onChange: (value: EditorValue) => void }) {
  return (
    <label className={`visual-editor-property-field visual-editor-property-${definition.control}`}>
      <span>{definition.label}</span>
      {definition.description ? <small>{definition.description}</small> : null}
      <GenericControl definition={definition} value={value} document={document} onChange={onChange} />
    </label>
  );
}

function PropertySection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="visual-editor-property-section"><h3>{title}</h3><div>{children}</div></section>;
}

function visibilityField(label: string, checked: boolean, onChange: (value: boolean) => void) {
  return <label className="visual-editor-toggle-field"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}

function NodeProperties({ node, document, panelTab, onPropChange, onStyleChange, onVisibilityChange }: {
  node: EditorNode;
  document: EditorDocument;
  panelTab: VisualEditorPanelTab;
  onPropChange: (path: string, value: EditorValue) => void;
  onStyleChange: (key: keyof NodeStyleTokens, value: EditorValue | undefined) => void;
  onVisibilityChange: VisualEditorPropertiesProps["onNodeVisibilityChange"];
}) {
  const controls = getVisualEditorNodeControls(node);
  if (!controls) return <p className="visual-editor-warning">This legacy node has no registry definition. It remains visible so unsupported content is never silently discarded.</p>;
  const visible = (tab: VisualEditorPanelTab) => panelTab === "properties" || panelTab === tab;
  const propertiesByTab = (tab: VisualEditorPanelTab) => controls.props.filter((property) => groupForControl(property.group) === tab);
  const stylesByTab = (tab: VisualEditorPanelTab) => controls.styles.filter((style) => style.group === tab);
  const content = propertiesByTab("content");
  const layout = [...propertiesByTab("layout"), ...stylesByTab("layout")];
  const style = [...propertiesByTab("style"), ...stylesByTab("style")];
  const typography = [...propertiesByTab("typography"), ...stylesByTab("typography")];
  const renderControl = (control: EditablePropDefinition | VisualEditorStyleControl) => {
    const isStyle = "key" in control;
    const value = isStyle ? node.styles?.[control.key] : getValueAtPath(node.props, control.path);
    return <Field key={isStyle ? control.key : control.path} definition={control} value={value} document={document} onChange={(next) => isStyle ? onStyleChange(control.key, next) : onPropChange(control.path, next)} />;
  };
  return (
    <>
      {visible("content") && content.length ? <PropertySection title="Content">{content.map(renderControl)}</PropertySection> : null}
      {visible("layout") && layout.length ? <PropertySection title="Layout">{layout.map(renderControl)}</PropertySection> : null}
      {visible("style") && style.length ? <PropertySection title="Style">{style.map(renderControl)}</PropertySection> : null}
      {visible("typography") && typography.length ? <PropertySection title="Typography">{typography.map(renderControl)}</PropertySection> : null}
      {visible("visibility") && controls.supportsVisibility ? <PropertySection title="Visibility">{visibilityField("Visible", node.visibility.base, (value) => onVisibilityChange(node.id, "base", value))}{visibilityField("Desktop", node.visibility.desktop !== false, (value) => onVisibilityChange(node.id, "desktop", value))}{visibilityField("Tablet", node.visibility.tablet !== false, (value) => onVisibilityChange(node.id, "tablet", value))}{visibilityField("Mobile", node.visibility.mobile !== false, (value) => onVisibilityChange(node.id, "mobile", value))}</PropertySection> : null}
    </>
  );
}

function SiteProperties({ document, panelTab, onChange }: { document: EditorDocument; panelTab: VisualEditorPanelTab; onChange: VisualEditorPropertiesProps["onSiteChange"] }) {
  const site = document.site;
  const colorField = (label: string, path: string, value: string | undefined) => <Field key={path} definition={{ label, control: "color", group: "style" }} value={value} document={document} onChange={(next) => onChange(path, next)} />;
  return <>
    {(panelTab === "properties" || panelTab === "content") ? <PropertySection title="Site details"><Field definition={{ label: "Site name", control: "text", group: "content" }} value={site.name} document={document} onChange={(value) => onChange("name", value)} /><Field definition={{ label: "Tagline", control: "text", group: "content" }} value={site.tagline} document={document} onChange={(value) => onChange("tagline", value)} /></PropertySection> : null}
    {(panelTab === "properties" || panelTab === "style") ? <PropertySection title="Theme palette">{colorField("Primary color", "styles.palette.primary", site.styles.palette?.primary)}{colorField("Secondary color", "styles.palette.secondary", site.styles.palette?.secondary)}{colorField("Background", "styles.palette.background", site.styles.palette?.background)}{colorField("Surface", "styles.palette.surface", site.styles.palette?.surface)}{colorField("Text color", "styles.palette.text", site.styles.palette?.text)}{colorField("Muted text", "styles.palette.mutedText", site.styles.palette?.mutedText)}<Field definition={{ label: "Theme mode", control: "select", group: "style", options: [{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }, { label: "Automatic", value: "auto" }] }} value={site.styles.themeMode} document={document} onChange={(value) => onChange("styles.themeMode", value)} /></PropertySection> : null}
    {(panelTab === "properties" || panelTab === "typography") ? <PropertySection title="Global typography"><Field definition={{ label: "Font family", control: "select", group: "typography", options: [{ label: "Inherited", value: "inherit" }, { label: "Sans serif", value: "sans" }, { label: "Serif", value: "serif" }, { label: "Monospace", value: "mono" }] }} value={site.styles.typography?.fontFamily} document={document} onChange={(value) => onChange("styles.typography.fontFamily", value)} /><Field definition={{ label: "Type scale", control: "select", group: "typography", options: [{ label: "Compact", value: "compact" }, { label: "Default", value: "default" }, { label: "Generous", value: "generous" }] }} value={site.styles.typography?.scale} document={document} onChange={(value) => onChange("styles.typography.scale", value)} /><Field definition={{ label: "Global spacing", control: "select", group: "typography", options: [{ label: "Compact", value: "compact" }, { label: "Comfortable", value: "comfortable" }, { label: "Spacious", value: "spacious" }] }} value={site.styles.spacing} document={document} onChange={(value) => onChange("styles.spacing", value)} /></PropertySection> : null}
  </>;
}

function PageProperties({ page, document, panelTab, onChange }: { page: EditorPage; document: EditorDocument; panelTab: VisualEditorPanelTab; onChange: VisualEditorPropertiesProps["onPageChange"] }) {
  return <>
    {(panelTab === "properties" || panelTab === "content") ? <PropertySection title="Page settings"><Field definition={{ label: "Page name", control: "text", group: "content" }} value={page.name} document={document} onChange={(value) => onChange(page.id, "name", value)} /><Field definition={{ label: "Path", control: "text", group: "content" }} value={page.path} document={document} onChange={(value) => onChange(page.id, "path", value)} /></PropertySection> : null}
    {(panelTab === "properties" || panelTab === "visibility") ? <PropertySection title="Visibility">{visibilityField("Page visible", page.visibility.base, (value) => onChange(page.id, "visibility.base", value))}</PropertySection> : null}
    {(panelTab === "properties" || panelTab === "content") ? <PropertySection title="SEO"><Field definition={{ label: "SEO title", control: "text", group: "content" }} value={page.seo.title} document={document} onChange={(value) => onChange(page.id, "seo.title", value)} /><Field definition={{ label: "SEO description", control: "textarea", group: "content" }} value={page.seo.description} document={document} onChange={(value) => onChange(page.id, "seo.description", value)} /><Field definition={{ label: "Canonical URL", control: "url", group: "content" }} value={page.seo.canonicalUrl} document={document} onChange={(value) => onChange(page.id, "seo.canonicalUrl", value)} /><Field definition={{ label: "Open Graph title", control: "text", group: "content" }} value={page.seo.openGraph?.title} document={document} onChange={(value) => onChange(page.id, "seo.openGraph.title", value)} /><Field definition={{ label: "Open Graph description", control: "textarea", group: "content" }} value={page.seo.openGraph?.description} document={document} onChange={(value) => onChange(page.id, "seo.openGraph.description", value)} /><Field definition={{ label: "Open Graph type", control: "select", group: "content", options: [{ label: "Website", value: "website" }, { label: "Article", value: "article" }] }} value={page.seo.openGraph?.type ?? "website"} document={document} onChange={(value) => onChange(page.id, "seo.openGraph.type", value)} /><Field definition={{ label: "Open Graph URL", control: "url", group: "content" }} value={page.seo.openGraph?.url} document={document} onChange={(value) => onChange(page.id, "seo.openGraph.url", value)} /><Field definition={{ label: "Open Graph image", control: "media", group: "content" }} value={page.seo.openGraph?.image} document={document} onChange={(value) => onChange(page.id, "seo.openGraph.image", value)} /></PropertySection> : null}
  </>;
}

export function VisualEditorProperties(props: VisualEditorPropertiesProps) {
  const selectedNode = props.selectedNodeId ? props.document.nodes[props.selectedNodeId] : undefined;
  const selectedPage = props.document.pages.find((page) => page.id === props.selectedPageId);
  const title = props.selectedScope === "node" && selectedNode ? selectedNode.type : props.selectedScope === "site" ? "Site settings" : selectedPage?.name || "Page settings";
  return <aside className="visual-editor-properties" aria-label="Properties"><header><p>Properties</p><h2>{title}</h2></header><div className="visual-editor-property-tabs" role="tablist">{PANEL_TABS.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={props.panelTab === tab.id} className={props.panelTab === tab.id ? "is-active" : undefined} onClick={() => props.onPanelTabChange(tab.id)}>{tab.label}</button>)}</div><div className="visual-editor-properties-scroll">{props.selectedScope === "node" && selectedNode ? <NodeProperties node={selectedNode} document={props.document} panelTab={props.panelTab} onPropChange={(path, value) => props.onNodePropChange(selectedNode.id, path, value)} onStyleChange={(key, value) => props.onNodeStyleChange(selectedNode.id, key, value)} onVisibilityChange={props.onNodeVisibilityChange} /> : props.selectedScope === "site" ? <SiteProperties document={props.document} panelTab={props.panelTab} onChange={props.onSiteChange} /> : selectedPage ? <PageProperties page={selectedPage} document={props.document} panelTab={props.panelTab} onChange={props.onPageChange} /> : <p className="visual-editor-warning">Select a page or element to edit its properties.</p>}</div></aside>;
}
