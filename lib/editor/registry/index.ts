export {
  editorComponentRegistry,
  getComponentDefaultProps,
  getComponentDefinition,
  isLegacyComponentType,
  typeMatchesPattern,
} from "./definitions";
export { isSafeDocumentUrl, toSafeDocumentUrl } from "./urls";
export { validateEditorDocumentRegistry } from "./validation";
export type {
  ComponentCategory,
  ComponentDefinition,
  ComponentRegistry,
  ComponentRendererKey,
  ComponentSlotDefinition,
  EditablePropDefinition,
  EditorControlOption,
  EditorControlType,
  NodeStyleCapability,
  PropertyValidationRule,
  PropertyVisibilityCondition,
  RegistryPropValueType,
  RegistryValidationContext,
} from "./types";
