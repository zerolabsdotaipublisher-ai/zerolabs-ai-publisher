import type {
  EditorDocument,
  EditorNode,
  EditorValue,
  EditorValueObject,
  NodeStyleTokens,
} from "@/lib/editor/document/types";

/** Data-only control types for the future generic property inspector. */
export type EditorControlType =
  | "text"
  | "textarea"
  | "rich-text"
  | "url"
  | "link-target"
  | "toggle"
  | "select"
  | "number"
  | "media"
  | "list"
  | "spacing"
  | "alignment"
  | "width"
  | "container"
  | "responsive-visibility";

export type RegistryPropValueType =
  | "string"
  | "boolean"
  | "number"
  | "object"
  | "list"
  | "url"
  | "link-target"
  | "media";

export type ComponentCategory = "layout" | "content" | "media" | "marketing" | "global";

/**
 * Renderer keys are intentionally declarative. Registry data never accepts a
 * function supplied by a document, so document props cannot execute code.
 */
export type ComponentRendererKey =
  | "page-root"
  | "container"
  | "columns"
  | "column"
  | "section-compat"
  | "heading"
  | "paragraph"
  | "button"
  | "list"
  | "image"
  | "card"
  | "global-header"
  | "global-footer"
  | "legacy-fallback";

export type NodeStyleCapability = keyof NodeStyleTokens;

export interface EditorControlOption {
  label: string;
  value: string | number | boolean;
}

export interface PropertyValidationRule {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface PropertyVisibilityCondition {
  path: string;
  equals?: EditorValue;
  exists?: boolean;
}

/**
 * Metadata is data-only so a future property panel can be generic rather than
 * implementing a bespoke editor for every section family.
 */
export interface EditablePropDefinition {
  /** Dot-delimited path relative to EditorNode.props. */
  path: string;
  label: string;
  description?: string;
  control: EditorControlType;
  valueType: RegistryPropValueType;
  required?: boolean;
  group: "content" | "actions" | "media" | "layout" | "advanced";
  options?: readonly EditorControlOption[];
  defaultValue?: EditorValue;
  validation?: PropertyValidationRule;
  visibleWhen?: PropertyVisibilityCondition;
  inlineEditable?: boolean;
  resettable?: boolean;
  inherited?: boolean;
}

export interface ComponentSlotDefinition {
  name: string;
  /** Exact component types or a suffix wildcard such as `content.*`. */
  allowedChildTypes: readonly string[];
  minChildren?: number;
  maxChildren?: number;
}

export interface ComponentDefinition {
  type: string;
  version: number;
  label: string;
  category: ComponentCategory;
  kind: EditorNode["kind"];
  /** True only for components that may appear in EditorPage.rootNodeIds. */
  allowedAsPageRoot?: boolean;
  /** Optional second direction of containment validation. */
  allowedParentTypes?: readonly string[];
  slots: Readonly<Record<string, ComponentSlotDefinition>>;
  defaultProps: EditorValueObject;
  /** All known prop shapes, including non-editor compatibility props. */
  propSchema: readonly EditablePropDefinition[];
  /** Properties exposed to a future generic editor inspector. */
  editableProps: readonly EditablePropDefinition[];
  renderer: {
    key: ComponentRendererKey;
  };
  styleCapabilities: readonly NodeStyleCapability[];
  supportsVisibility: boolean;
  /** Compatibility nodes may retain additional JSON props until migrated. */
  allowUnknownProps?: boolean;
}

export interface ComponentRegistry {
  get(type: string): ComponentDefinition | undefined;
  list(): readonly ComponentDefinition[];
}

export interface RegistryValidationContext {
  document: EditorDocument;
  node: EditorNode;
  nodeId: string;
  path: string;
}
