"use client";

import type { EditorDocument, EditorNavigationItem, EditorNavigationTarget } from "@/lib/editor/document";

interface VisualEditorNavigationProps {
  document: EditorDocument;
  onUpdate: (menuId: string, itemId: string, patch: Partial<Pick<EditorNavigationItem, "label" | "visible" | "target">>) => void;
}

function targetKind(target: EditorNavigationTarget): EditorNavigationTarget["kind"] {
  return target.kind === "unresolved" ? "external" : target.kind;
}

function ExternalTargetInput({ target, onChange }: { target: EditorNavigationTarget; onChange: (next: EditorNavigationTarget) => void }) {
  const value = target.kind === "external" ? target.url : target.kind === "unresolved" ? target.originalHref : "";
  return <input aria-label="External URL" type="url" value={value} placeholder="https://" onChange={(event) => onChange({ kind: "external", url: event.target.value })} />;
}

function NavigationItemEditor({
  document,
  menuId,
  item,
  index,
  depth = 0,
  onUpdate,
}: {
  document: EditorDocument;
  menuId: string;
  item: EditorNavigationItem;
  index: number;
  depth?: number;
  onUpdate: VisualEditorNavigationProps["onUpdate"];
}) {
  const kind = targetKind(item.target);
  const updateTarget = (target: EditorNavigationTarget) => onUpdate(menuId, item.id, { target });
  return (
    <li className="visual-editor-navigation-item" data-depth={depth}>
      <div className="visual-editor-navigation-item-heading">
        <span>#{index + 1}</span>
        <label>
          <span>Label</span>
          <input value={item.label} onChange={(event) => onUpdate(menuId, item.id, { label: event.target.value })} />
        </label>
      </div>
      <label>
        <span>Destination</span>
        <select
          value={kind}
          onChange={(event) => {
            const nextKind = event.target.value as "page" | "node" | "external";
            if (nextKind === "page") updateTarget({ kind: "page", pageId: document.pages[0]?.id ?? "" });
            else if (nextKind === "node") updateTarget({ kind: "node", nodeId: Object.keys(document.nodes)[0] ?? "" });
            else updateTarget({ kind: "external", url: "" });
          }}
        >
          <option value="page">Page</option>
          <option value="node">Section / node</option>
          <option value="external">External URL</option>
        </select>
      </label>
      {kind === "page" ? (
        <label>
          <span>Page</span>
          <select value={item.target.kind === "page" ? item.target.pageId : ""} onChange={(event) => updateTarget({ kind: "page", pageId: event.target.value })}>
            {document.pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
          </select>
        </label>
      ) : null}
      {kind === "node" ? (
        <label>
          <span>Section / node</span>
          <select value={item.target.kind === "node" ? item.target.nodeId : ""} onChange={(event) => updateTarget({ kind: "node", nodeId: event.target.value })}>
            {Object.values(document.nodes).map((node) => <option key={node.id} value={node.id}>{node.type} · {node.id}</option>)}
          </select>
        </label>
      ) : null}
      {kind === "external" ? <ExternalTargetInput target={item.target} onChange={updateTarget} /> : null}
      <label className="visual-editor-toggle-field">
        <input type="checkbox" checked={item.visible} onChange={(event) => onUpdate(menuId, item.id, { visible: event.target.checked })} />
        <span>Visible in this menu</span>
      </label>
      {item.children.length ? (
        <ul className="visual-editor-navigation-children">
          {item.children.map((child, childIndex) => <NavigationItemEditor key={child.id} document={document} menuId={menuId} item={child} index={childIndex} depth={depth + 1} onUpdate={onUpdate} />)}
        </ul>
      ) : null}
    </li>
  );
}

export function VisualEditorNavigation({ document, onUpdate }: VisualEditorNavigationProps) {
  return (
    <section className="visual-editor-navigation-panel" aria-labelledby="visual-editor-navigation-heading">
      <h2 id="visual-editor-navigation-heading">Navigation</h2>
      <p className="visual-editor-muted-note">Edit labels, visibility, and typed destinations. Reordering arrives with Slice 5.</p>
      {document.navigation.menus.map((menu) => (
        <section key={menu.id} className="visual-editor-navigation-menu" aria-label={`${menu.location} navigation`}>
          <h3>{menu.label || `${menu.location[0].toUpperCase()}${menu.location.slice(1)} menu`}</h3>
          <ol>
            {menu.items.map((item, index) => <NavigationItemEditor key={item.id} document={document} menuId={menu.id} item={item} index={index} onUpdate={onUpdate} />)}
          </ol>
        </section>
      ))}
    </section>
  );
}
