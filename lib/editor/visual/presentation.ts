export const VISUAL_EDITOR_DRAFT_ONLY_MESSAGE = "Draft-only mode. Saving will be enabled after atomic persistence is connected.";

export const VISUAL_EDITOR_LEGACY_HANDOFF = {
  actionLabel: "Open Visual Editor",
  notice: "The Visual Editor is the recommended editing experience. This legacy editor remains available for compatibility.",
} as const;

export const VISUAL_EDITOR_PRIMARY_AREAS = [
  { id: "pages", label: "Pages", description: "Page structure and settings" },
  { id: "design", label: "Design", description: "Colors, typography, shape, spacing, and theme" },
  { id: "globals", label: "Globals", description: "Website header, footer, and reusable elements" },
  { id: "navigation", label: "Navigation", description: "Header navigation labels, destinations, order, and nesting" },
] as const;

export const VISUAL_EDITOR_DESIGN_SECTIONS = {
  colors: {
    label: "Colors",
    controls: ["Primary", "Secondary", "Accent", "Page Background", "Surface", "Elevated Surface", "Primary Text", "Secondary Text", "Muted Text", "Border", "Success", "Warning", "Error"],
  },
  typography: {
    label: "Typography",
    controls: ["Heading Font", "Body Font", "Typography Scale"],
  },
  shape: {
    label: "Shape",
    controls: ["Global Corner Shape"],
  },
  spacing: {
    label: "Spacing",
    controls: ["Global Spacing Scale"],
  },
  theme: {
    label: "Theme",
    controls: ["Light", "Dark", "Automatic"],
  },
} as const;

export const VISUAL_EDITOR_PROPERTY_GROUPS = {
  content: { label: "Content", description: "Text, media, and element-specific content." },
  layout: { label: "Layout", description: "Size, spacing, alignment, and columns." },
  style: { label: "Style", description: "Background, colors, borders, and corner radius." },
  typography: { label: "Typography", description: "Font, size, weight, spacing, and alignment." },
  effects: { label: "Effects", description: "Shadow and opacity." },
  visibility: { label: "Visibility", description: "Choose Default, Desktop, Tablet, and Mobile visibility." },
  actions: { label: "Link / Action", description: "Labels, destinations, and link behavior." },
} as const;
