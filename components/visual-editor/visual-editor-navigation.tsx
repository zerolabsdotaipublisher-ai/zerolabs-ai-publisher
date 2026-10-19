"use client";

import type { EditorDocument, EditorNavigationItem, EditorNavigationTarget } from "@/lib/editor/document";
import { VisualEditorOperationNote } from "./visual-editor-operation-note";

interface VisualEditorNavigationProps {
  document: EditorDocument;
  onUpdate: (menuId: string, itemId: string, patch: Partial<Pick<EditorNavigationItem, "label" | "visible" | "target" | "variant">>) => void;
  onAdd: (menuId: string, parentItemId?: string) => void;
  onRemove: (menuId: string, itemId: string) => void;
  onMove: (menuId: string, itemId: string, direction: "up" | "down") => void;
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
  siblingCount,
  depth = 0,
  onUpdate,
  onAdd,
  onRemove,
  onMove,
}: {
  document: EditorDocument;
  menuId: string;
  item: EditorNavigationItem;
  index: number;
  siblingCount: number;
  depth?: number;
  onUpdate: VisualEditorNavigationProps["onUpdate"];
  onAdd: VisualEditorNavigationProps["onAdd"];
  onRemove: VisualEditorNavigationProps["onRemove"];
  onMove: VisualEditorNavigationProps["onMove"];
}) {
  const kind = targetKind(item.target);
  const updateTarget = (target: EditorNavigationTarget) => onUpdate(menuId, item.id, { target });
  const moveUpBlocker = index === 0 ? "Move up is unavailable: this navigation item is already first in its menu level." : undefined;
  const moveDownBlocker = index === siblingCount - 1 ? "Move down is unavailable: this navigation item is already last in its menu level." : undefined;
  return (
    <li className="visual-editor-navigation-item" data-depth={depth}>
      <div className="visual-editor-navigation-item-heading">
        <span>#{index + 1}</span>
        <label>
          <span>Label</span>
          <input value={item.label} onChange={(event) => onUpdate(menuId, item.id, { label: event.target.value })} />
        </label>
        <div className="visual-editor-navigation-reorder" aria-label={`Reorder ${item.label || "navigation item"}`}>
          <button type="button" onClick={() => onMove(menuId, item.id, "up")} disabled={index === 0} title={moveUpBlocker}>Move up</button>
          <button type="button" onClick={() => onMove(menuId, item.id, "down")} disabled={index === siblingCount - 1} title={moveDownBlocker}>Move down</button>
          <button type="button" onClick={() => onAdd(menuId, item.id)}>Add child</button>
          <button type="button" className="is-danger" onClick={() => {
            if (window.confirm(`Delete “${item.label || "this navigation item"}” and its child items from the local draft?`)) onRemove(menuId, item.id);
          }}>Delete</button>
        </div>
      </div>
      <VisualEditorOperationNote messages={[moveUpBlocker, moveDownBlocker]} />
      <label>
        <span>Destination</span>
        <select
          value={kind}
          onChange={(event) => {
            const nextKind = event.target.value as "page" | "node" | "external";
            if (nextKind === "page") updateTarget({ kind: "page", pageId: document.pages[0]?.id ?? "" });
            else if (nextKind === "node") updateTarget({ kind: "node", nodeId: Object.keys(document.nodes)[0] ?? "" });
            else updateTarget({ kind: "external", url: "https://example.com" });
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
      <label>
        <span>Item style</span>
        <select value={item.variant ?? "link"} onChange={(event) => onUpdate(menuId, item.id, { variant: event.target.value as "link" | "button" })}>
          <option value="link">Link</option>
          <option value="button">Button</option>
        </select>
      </label>
      <label className="visual-editor-toggle-field">
        <input type="checkbox" checked={item.visible} onChange={(event) => onUpdate(menuId, item.id, { visible: event.target.checked })} />
        <span>Visible in this menu</span>
      </label>
      {item.children.length ? (
        <ul className="visual-editor-navigation-children">
          {item.children.map((child, childIndex) => <NavigationItemEditor key={child.id} document={document} menuId={menuId} item={child} index={childIndex} siblingCount={item.children.length} depth={depth + 1} onUpdate={onUpdate} onAdd={onAdd} onRemove={onRemove} onMove={onMove} />)}
        </ul>
      ) : null}
    </li>
  );
}

export function VisualEditorNavigation({ document, onUpdate, onAdd, onRemove, onMove }: VisualEditorNavigationProps) {
  const menuLocationLabel = (location: EditorDocument["navigation"]["menus"][number]["location"]) => {
    if (location === "header") return "Website Header Navigation";
    if (location === "footer") return "Website Footer Navigation";
    return `${location[0].toUpperCase()}${location.slice(1)} Navigation`;
  };

  return (
    <section className="visual-editor-navigation-panel" aria-labelledby="visual-editor-navigation-heading">
      <h2 id="visual-editor-navigation-heading">Navigation</h2>
      <p className="visual-editor-muted-note">Edit labels, destinations, ordering, nesting, and styling. Header navigation appears in the Site Header at the top of the website preview. Changes remain in this local draft.</p>
      {document.navigation.menus.map((menu) => (
        <section key={menu.id} className="visual-editor-navigation-menu" aria-label={`${menu.location} navigation`}>
          <div className="visual-editor-navigation-menu-heading">
            <div>
              <h3>{menuLocationLabel(menu.location)}</h3>
              {menu.label ? <p className="visual-editor-muted-note">{menu.label}</p> : null}
            </div>
            <button type="button" onClick={() => onAdd(menu.id)}>Add item</button>
          </div>
          {menu.items.length ? (
            <ol>
              {menu.items.map((item, index) => <NavigationItemEditor key={item.id} document={document} menuId={menu.id} item={item} index={index} siblingCount={menu.items.length} onUpdate={onUpdate} onAdd={onAdd} onRemove={onRemove} onMove={onMove} />)}
            </ol>
          ) : <p className="visual-editor-empty-state">This menu is empty. Add an item to start building its navigation.</p>}
        </section>
      ))}
    </section>
  );
}
