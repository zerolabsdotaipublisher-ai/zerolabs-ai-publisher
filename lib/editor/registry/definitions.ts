import type { EditorValueObject } from "@/lib/editor/document/types";
import type {
  ComponentDefinition,
  ComponentRegistry,
  EditablePropDefinition,
  NodeStyleCapability,
} from "./types";

const ALL_STYLE_CAPABILITIES: readonly NodeStyleCapability[] = [
  "alignment",
  "width",
  "container",
  "spacing",
  "columns",
  "themeMode",
];

const CONTENT_STYLE_CAPABILITIES: readonly NodeStyleCapability[] = [
  "alignment",
  "width",
  "spacing",
  "themeMode",
];

const LEAF_SLOTS = {} as const;
const CONTENT_CHILDREN = ["component.*", "content.*", "media.*", "legacy.component.*"] as const;
const SECTION_CHILDREN = ["section.*", "legacy.section.*", "layout.section", "layout.container"] as const;
const CONTAINER_CHILDREN = ["layout.container", "layout.columns", ...CONTENT_CHILDREN] as const;

function field(
  path: string,
  label: string,
  control: EditablePropDefinition["control"],
  valueType: EditablePropDefinition["valueType"],
  group: EditablePropDefinition["group"],
  options: Partial<EditablePropDefinition> = {},
): EditablePropDefinition {
  return {
    path,
    label,
    control,
    valueType,
    group,
    resettable: true,
    ...options,
  };
}

const contentObject = field("content", "Section content", "textarea", "object", "advanced", {
  required: true,
  description: "Compatibility content retained from the generated website.",
});

function sectionDefinition(
  type: string,
  label: string,
  editableProps: readonly EditablePropDefinition[],
): ComponentDefinition {
  return {
    type: `section.${type}`,
    version: 1,
    label,
    category: "marketing",
    kind: "section",
    allowedParentTypes: ["layout.page-root", "layout.section", "layout.container"],
    slots: {
      default: { name: "default", allowedChildTypes: CONTAINER_CHILDREN },
      components: { name: "components", allowedChildTypes: CONTENT_CHILDREN },
    },
    defaultProps: { content: {} },
    propSchema: [contentObject, ...editableProps],
    editableProps,
    renderer: { key: "section-compat" },
    styleCapabilities: ALL_STYLE_CAPABILITIES,
    supportsVisibility: true,
    allowUnknownProps: true,
  };
}

const marketingSections: readonly ComponentDefinition[] = [
  sectionDefinition("hero", "Hero", [
    field("content.eyebrow", "Eyebrow", "text", "string", "content", { inlineEditable: true }),
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.subheadline", "Subheading", "textarea", "string", "content", { inlineEditable: true }),
    field("content.primaryCta", "Primary CTA label", "text", "string", "actions", { inlineEditable: true }),
    field("content.ctaHref", "Primary CTA destination", "url", "url", "actions"),
    field("content.secondaryCta", "Secondary CTA label", "text", "string", "actions", { inlineEditable: true }),
    field("content.image", "Hero media", "media", "media", "media"),
  ]),
  sectionDefinition("about", "About", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.subheadline", "Subheading", "textarea", "string", "content", { inlineEditable: true }),
    field("content.description", "Description", "textarea", "string", "content", { inlineEditable: true }),
    field("content.body", "Body", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.paragraphs", "Paragraphs", "list", "list", "content"),
    field("content.bullets", "Bullets", "list", "list", "content"),
  ]),
  sectionDefinition("services", "Services", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.subheadline", "Subheading", "textarea", "string", "content", { inlineEditable: true }),
    field("content.description", "Description", "textarea", "string", "content", { inlineEditable: true }),
    field("content.items", "Service items", "list", "list", "content"),
  ]),
  sectionDefinition("features", "Features", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.items", "Feature items", "list", "list", "content"),
    field("content.bullets", "Feature bullets", "list", "list", "content"),
  ]),
  sectionDefinition("benefits", "Benefits", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.items", "Benefit items", "list", "list", "content"),
    field("content.bullets", "Benefit bullets", "list", "list", "content"),
  ]),
  sectionDefinition("testimonials", "Testimonials", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.items", "Testimonials", "list", "list", "content"),
  ]),
  sectionDefinition("faq", "FAQ", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.items", "Questions", "list", "list", "content"),
  ]),
  sectionDefinition("pricing", "Pricing", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.tiers", "Pricing tiers", "list", "list", "content"),
  ]),
  sectionDefinition("cta", "Call to action", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.ctaText", "CTA label", "text", "string", "actions", { inlineEditable: true }),
    field("content.ctaHref", "CTA destination", "url", "url", "actions"),
    field("content.secondaryCtaText", "Secondary CTA label", "text", "string", "actions", { inlineEditable: true }),
    field("content.secondaryCtaHref", "Secondary CTA destination", "url", "url", "actions"),
  ]),
  sectionDefinition("contact", "Contact", [
    field("content.headline", "Headline", "rich-text", "string", "content", { inlineEditable: true }),
    field("content.subheadline", "Subheading", "textarea", "string", "content", { inlineEditable: true }),
    field("content.channels", "Contact channels", "list", "list", "content"),
  ]),
  sectionDefinition("footer", "Footer section", [
    field("content.shortBlurb", "Short blurb", "textarea", "string", "content", { inlineEditable: true }),
    field("content.legalText", "Legal text", "textarea", "string", "content", { inlineEditable: true }),
    field("content.trustIndicators", "Trust indicators", "list", "list", "content"),
  ]),
];

const definitions: readonly ComponentDefinition[] = [
  {
    type: "layout.page-root",
    version: 1,
    label: "Page root",
    category: "layout",
    kind: "container",
    allowedAsPageRoot: true,
    slots: {
      default: { name: "default", allowedChildTypes: SECTION_CHILDREN, minChildren: 0 },
    },
    defaultProps: {},
    propSchema: [],
    editableProps: [],
    renderer: { key: "page-root" },
    styleCapabilities: ALL_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "layout.section",
    version: 1,
    label: "Section container",
    category: "layout",
    kind: "section",
    allowedParentTypes: ["layout.page-root", "layout.container"],
    slots: { default: { name: "default", allowedChildTypes: CONTAINER_CHILDREN } },
    defaultProps: {},
    propSchema: [],
    editableProps: [],
    renderer: { key: "container" },
    styleCapabilities: ALL_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "layout.container",
    version: 1,
    label: "Container",
    category: "layout",
    kind: "container",
    allowedParentTypes: ["layout.page-root", "layout.section", "layout.container", "layout.column"],
    slots: { default: { name: "default", allowedChildTypes: CONTAINER_CHILDREN } },
    defaultProps: {},
    propSchema: [],
    editableProps: [],
    renderer: { key: "container" },
    styleCapabilities: ALL_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "layout.columns",
    version: 1,
    label: "Columns",
    category: "layout",
    kind: "container",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column"],
    slots: { default: { name: "default", allowedChildTypes: ["layout.column"], minChildren: 1, maxChildren: 3 } },
    defaultProps: {},
    propSchema: [],
    editableProps: [],
    renderer: { key: "columns" },
    styleCapabilities: ["columns", "spacing", "width", "themeMode"],
    supportsVisibility: true,
  },
  {
    type: "layout.column",
    version: 1,
    label: "Column",
    category: "layout",
    kind: "container",
    allowedParentTypes: ["layout.columns"],
    slots: { default: { name: "default", allowedChildTypes: CONTAINER_CHILDREN } },
    defaultProps: {},
    propSchema: [],
    editableProps: [],
    renderer: { key: "column" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "component.heading",
    version: 1,
    label: "Heading",
    category: "content",
    kind: "component",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column", "section.*"],
    slots: LEAF_SLOTS,
    defaultProps: { text: "Heading", level: 2 },
    propSchema: [
      field("text", "Text", "rich-text", "string", "content", { required: true, inlineEditable: true }),
      field("level", "Heading level", "select", "number", "layout", {
        options: [
          { label: "Heading 1", value: 1 },
          { label: "Heading 2", value: 2 },
          { label: "Heading 3", value: 3 },
          { label: "Heading 4", value: 4 },
        ],
        defaultValue: 2,
      }),
    ],
    editableProps: [field("text", "Text", "rich-text", "string", "content", { required: true, inlineEditable: true })],
    renderer: { key: "heading" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "component.paragraph",
    version: 1,
    label: "Paragraph",
    category: "content",
    kind: "component",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column", "section.*"],
    slots: LEAF_SLOTS,
    defaultProps: { text: "" },
    propSchema: [field("text", "Text", "rich-text", "string", "content", { required: true, inlineEditable: true })],
    editableProps: [field("text", "Text", "rich-text", "string", "content", { required: true, inlineEditable: true })],
    renderer: { key: "paragraph" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "component.button",
    version: 1,
    label: "Button",
    category: "content",
    kind: "component",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column", "section.*"],
    slots: LEAF_SLOTS,
    defaultProps: { label: "Learn more", href: "#" },
    propSchema: [
      field("label", "Label", "text", "string", "actions", { required: true, inlineEditable: true }),
      field("href", "Destination", "url", "url", "actions"),
      field("target", "Link target", "link-target", "link-target", "actions"),
    ],
    editableProps: [
      field("label", "Label", "text", "string", "actions", { required: true, inlineEditable: true }),
      field("href", "Destination", "url", "url", "actions"),
      field("target", "Link target", "link-target", "link-target", "actions"),
    ],
    renderer: { key: "button" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "component.list",
    version: 1,
    label: "List",
    category: "content",
    kind: "component",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column", "section.*"],
    slots: LEAF_SLOTS,
    defaultProps: { items: [] },
    propSchema: [field("items", "Items", "list", "list", "content", { required: true })],
    editableProps: [field("items", "Items", "list", "list", "content", { required: true })],
    renderer: { key: "list" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "component.card",
    version: 1,
    label: "Card",
    category: "content",
    kind: "component",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column", "section.*"],
    slots: LEAF_SLOTS,
    defaultProps: { title: "", body: "" },
    propSchema: [
      field("title", "Title", "text", "string", "content", { inlineEditable: true }),
      field("body", "Body", "textarea", "string", "content", { inlineEditable: true }),
    ],
    editableProps: [
      field("title", "Title", "text", "string", "content", { inlineEditable: true }),
      field("body", "Body", "textarea", "string", "content", { inlineEditable: true }),
    ],
    renderer: { key: "card" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "component.image",
    version: 1,
    label: "Image",
    category: "media",
    kind: "component",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column", "section.*"],
    slots: LEAF_SLOTS,
    defaultProps: { src: "", alt: "" },
    propSchema: [
      field("src", "Image source", "media", "media", "media", { required: true }),
      field("alt", "Alternative text", "text", "string", "media", { required: true, inlineEditable: true }),
    ],
    editableProps: [
      field("src", "Image source", "media", "media", "media", { required: true }),
      field("alt", "Alternative text", "text", "string", "media", { required: true, inlineEditable: true }),
    ],
    renderer: { key: "image" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
  },
  {
    type: "component.form",
    version: 1,
    label: "Legacy form",
    category: "content",
    kind: "component",
    allowedParentTypes: ["layout.section", "layout.container", "layout.column", "section.*"],
    slots: LEAF_SLOTS,
    defaultProps: {},
    propSchema: [],
    editableProps: [],
    renderer: { key: "legacy-fallback" },
    styleCapabilities: CONTENT_STYLE_CAPABILITIES,
    supportsVisibility: true,
    allowUnknownProps: true,
  },
  {
    type: "site.header",
    version: 1,
    label: "Site header",
    category: "global",
    kind: "global",
    slots: LEAF_SLOTS,
    defaultProps: { siteName: "" },
    propSchema: [
      field("siteName", "Site name", "text", "string", "content", { required: true, inherited: true }),
      field("tagline", "Tagline", "text", "string", "content", { inherited: true }),
    ],
    editableProps: [
      field("siteName", "Site name", "text", "string", "content", { required: true, inherited: true }),
      field("tagline", "Tagline", "text", "string", "content", { inherited: true }),
    ],
    renderer: { key: "global-header" },
    styleCapabilities: ["width", "spacing", "themeMode"],
    supportsVisibility: true,
  },
  {
    type: "site.footer",
    version: 1,
    label: "Site footer",
    category: "global",
    kind: "global",
    slots: LEAF_SLOTS,
    defaultProps: {},
    propSchema: [],
    editableProps: [],
    renderer: { key: "global-footer" },
    styleCapabilities: ["width", "spacing", "themeMode"],
    supportsVisibility: true,
  },
  ...marketingSections,
];

const definitionsByType = new Map(definitions.map((definition) => [definition.type, definition]));

export const editorComponentRegistry: ComponentRegistry = {
  get(type) {
    return definitionsByType.get(type);
  },
  list() {
    return definitions;
  },
};

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return editorComponentRegistry.get(type);
}

/** Returns a detached JSON clone suitable for creating a new editor node. */
export function getComponentDefaultProps(type: string): EditorValueObject | undefined {
  const definition = getComponentDefinition(type);
  return definition ? structuredClone(definition.defaultProps) : undefined;
}

export function isLegacyComponentType(type: string): boolean {
  return type.startsWith("legacy.section.") || type.startsWith("legacy.component.");
}

export function typeMatchesPattern(type: string, pattern: string): boolean {
  return pattern.endsWith(".*") ? type.startsWith(pattern.slice(0, -1)) : type === pattern;
}
