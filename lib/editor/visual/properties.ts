import type { EditorNode, EditorValue, NodeStyleTokens } from "@/lib/editor/document";
import { getComponentDefinition, type EditablePropDefinition, type NodeStyleCapability } from "@/lib/editor/registry";

export interface VisualEditorStyleControl {
  key: keyof NodeStyleTokens;
  label: string;
  control: EditablePropDefinition["control"];
  group: EditablePropDefinition["group"];
  options?: EditablePropDefinition["options"];
}

export interface VisualEditorNodeControls {
  props: readonly EditablePropDefinition[];
  styles: readonly VisualEditorStyleControl[];
  supportsVisibility: boolean;
}

const SPACE_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Extra small", value: "xs" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra large", value: "xl" },
  { label: "2× large", value: "2xl" },
] as const;

const STYLE_CONTROLS: Record<NodeStyleCapability, VisualEditorStyleControl> = {
  alignment: {
    key: "alignment", label: "Alignment", control: "alignment", group: "layout",
    options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Balanced", value: "balanced" }],
  },
  width: {
    key: "width", label: "Width", control: "width", group: "layout",
    options: [{ label: "Narrow", value: "narrow" }, { label: "Content", value: "content" }, { label: "Wide", value: "wide" }, { label: "Full", value: "full" }],
  },
  container: {
    key: "container", label: "Container appearance", control: "container", group: "layout",
    options: [{ label: "Default", value: "default" }, { label: "Card", value: "card" }, { label: "Plain", value: "plain" }, { label: "Emphasis", value: "emphasis" }],
  },
  spacing: {
    key: "spacing", label: "Section spacing", control: "spacing", group: "layout",
    options: [{ label: "Compact", value: "compact" }, { label: "Comfortable", value: "comfortable" }, { label: "Spacious", value: "spacious" }],
  },
  columns: {
    key: "columns", label: "Columns", control: "select", group: "layout",
    options: [{ label: "One", value: 1 }, { label: "Two", value: 2 }, { label: "Three", value: 3 }],
  },
  themeMode: {
    key: "themeMode", label: "Theme mode", control: "select", group: "style",
    options: [{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }, { label: "Automatic", value: "auto" }],
  },
  backgroundColor: { key: "backgroundColor", label: "Background color", control: "color", group: "style" },
  textColor: { key: "textColor", label: "Text color", control: "color", group: "style" },
  accentColor: { key: "accentColor", label: "Accent color", control: "color", group: "style" },
  borderColor: { key: "borderColor", label: "Border color", control: "color", group: "style" },
  borderWidth: { key: "borderWidth", label: "Border width", control: "number", group: "style" },
  borderStyle: {
    key: "borderStyle", label: "Border style", control: "border-style", group: "style",
    options: [{ label: "Solid", value: "solid" }, { label: "Dashed", value: "dashed" }, { label: "Dotted", value: "dotted" }],
  },
  radius: {
    key: "radius", label: "Corner radius", control: "select", group: "style",
    options: [{ label: "Square", value: "none" }, { label: "Slight", value: "sm" }, { label: "Rounded", value: "md" }, { label: "Large", value: "lg" }, { label: "Pill", value: "pill" }],
  },
  shadow: {
    key: "shadow", label: "Shadow", control: "shadow", group: "effects",
    options: [{ label: "None", value: "none" }, { label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }],
  },
  hoverBackgroundColor: { key: "hoverBackgroundColor", label: "Hover background", control: "color", group: "effects" },
  hoverTextColor: { key: "hoverTextColor", label: "Hover text", control: "color", group: "effects" },
  focusColor: { key: "focusColor", label: "Focus color", control: "color", group: "effects" },
  opacity: { key: "opacity", label: "Opacity", control: "number", group: "effects" },
  padding: { key: "padding", label: "Padding", control: "spacing", group: "layout", options: SPACE_OPTIONS },
  margin: { key: "margin", label: "Margin", control: "spacing", group: "layout", options: SPACE_OPTIONS },
  gap: { key: "gap", label: "Gap", control: "spacing", group: "layout", options: SPACE_OPTIONS },
  height: {
    key: "height", label: "Height", control: "select", group: "layout",
    options: [{ label: "Automatic", value: "auto" }, { label: "Content", value: "content" }, { label: "Screen", value: "screen" }],
  },
  minHeight: {
    key: "minHeight", label: "Minimum height", control: "select", group: "layout",
    options: [{ label: "None", value: "none" }, { label: "Short", value: "short" }, { label: "Medium", value: "medium" }, { label: "Tall", value: "tall" }, { label: "Screen", value: "screen" }],
  },
  fontFamily: {
    key: "fontFamily", label: "Font family", control: "select", group: "typography",
    options: [{ label: "Inherited", value: "inherit" }, { label: "Sans serif", value: "sans" }, { label: "Serif", value: "serif" }, { label: "Monospace", value: "mono" }],
  },
  fontSize: {
    key: "fontSize", label: "Font size", control: "select", group: "typography",
    options: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"].map((value) => ({ label: value, value })),
  },
  fontWeight: {
    key: "fontWeight", label: "Font weight", control: "select", group: "typography",
    options: [400, 500, 600, 700, 800].map((value) => ({ label: String(value), value })),
  },
  lineHeight: {
    key: "lineHeight", label: "Line height", control: "select", group: "typography",
    options: [{ label: "Tight", value: "tight" }, { label: "Normal", value: "normal" }, { label: "Relaxed", value: "relaxed" }],
  },
  letterSpacing: {
    key: "letterSpacing", label: "Letter spacing", control: "select", group: "typography",
    options: [{ label: "Tight", value: "tight" }, { label: "Normal", value: "normal" }, { label: "Wide", value: "wide" }],
  },
  size: {
    key: "size", label: "Size", control: "select", group: "layout",
    options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }],
  },
  justifyContent: {
    key: "justifyContent", label: "Horizontal alignment", control: "select", group: "layout",
    options: [{ label: "Start", value: "start" }, { label: "Center", value: "center" }, { label: "End", value: "end" }, { label: "Space between", value: "between" }],
  },
  alignItems: {
    key: "alignItems", label: "Vertical alignment", control: "select", group: "layout",
    options: [{ label: "Start", value: "start" }, { label: "Center", value: "center" }, { label: "End", value: "end" }, { label: "Stretch", value: "stretch" }],
  },
};

export function getValueAtPath(value: Record<string, unknown>, path: string): EditorValue | undefined {
  return path.split(".").reduce<unknown>((current, key) =>
    current && typeof current === "object" && !Array.isArray(current) ? (current as Record<string, unknown>)[key] : undefined,
  value) as EditorValue | undefined;
}

export function getVisualEditorNodeControls(node: EditorNode): VisualEditorNodeControls | undefined {
  const definition = getComponentDefinition(node.type);
  if (!definition) return undefined;
  return {
    props: definition.editableProps.filter((property) => {
      if (!property.visibleWhen) return true;
      const current = getValueAtPath(node.props, property.visibleWhen.path);
      if (property.visibleWhen.exists !== undefined) return (current !== undefined) === property.visibleWhen.exists;
      return current === property.visibleWhen.equals;
    }),
    styles: definition.styleCapabilities.map((capability) => STYLE_CONTROLS[capability]),
    supportsVisibility: definition.supportsVisibility,
  };
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(value);
}
