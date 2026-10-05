import type { EditorDocument, EditorDocumentValidationError, EditorNode, EditorValue } from "@/lib/editor/document/types";
import { editorComponentRegistry, isLegacyComponentType, typeMatchesPattern } from "./definitions";
import { isSafeDocumentUrl } from "./urls";
import type { ComponentDefinition, ComponentRegistry, EditablePropDefinition, RegistryPropValueType } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function push(
  errors: EditorDocumentValidationError[],
  path: string,
  message: string,
  nodeId?: string,
): void {
  errors.push({ path, message, ...(nodeId ? { nodeId } : {}) });
}

function getValueAtPath(value: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);
}

function isMissingRequiredValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function isLinkTarget(value: unknown, document: EditorDocument): boolean {
  if (typeof value === "string") return isSafeDocumentUrl(value);
  if (!isRecord(value) || typeof value.kind !== "string") return false;

  if (value.kind === "page") {
    return typeof value.pageId === "string" && document.pages.some((page) => page.id === value.pageId);
  }
  if (value.kind === "node") {
    return typeof value.nodeId === "string" && Boolean(document.nodes[value.nodeId]);
  }
  return value.kind === "external" && isSafeDocumentUrl(value.url);
}

function matchesValueType(
  value: unknown,
  valueType: RegistryPropValueType,
  document: EditorDocument,
): boolean {
  switch (valueType) {
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "object":
      return isRecord(value);
    case "list":
      return Array.isArray(value);
    case "url":
      return isSafeDocumentUrl(value);
    case "link-target":
      return isLinkTarget(value, document);
    case "media":
      return (typeof value === "string" && (isSafeDocumentUrl(value) || Boolean(document.assets[value]))) || isRecord(value);
  }
}

function validateProperty(
  document: EditorDocument,
  node: EditorNode,
  definition: EditablePropDefinition,
  path: string,
  errors: EditorDocumentValidationError[],
): void {
  const value = getValueAtPath(node.props, definition.path);
  if (definition.required && isMissingRequiredValue(value)) {
    push(errors, `${path}.props.${definition.path}`, "Required property is missing.", node.id);
    return;
  }
  if (value === undefined || value === null) return;

  if (!matchesValueType(value, definition.valueType, document)) {
    push(errors, `${path}.props.${definition.path}`, `Property must be a valid ${definition.valueType}.`, node.id);
    return;
  }

  if (typeof value === "string") {
    const validation = definition.validation;
    if (validation?.minLength !== undefined && value.length < validation.minLength) {
      push(errors, `${path}.props.${definition.path}`, "Property is shorter than the minimum length.", node.id);
    }
    if (validation?.maxLength !== undefined && value.length > validation.maxLength) {
      push(errors, `${path}.props.${definition.path}`, "Property is longer than the maximum length.", node.id);
    }
    if (validation?.pattern && !new RegExp(validation.pattern).test(value)) {
      push(errors, `${path}.props.${definition.path}`, "Property does not match the required format.", node.id);
    }
  }
  if (typeof value === "number") {
    const validation = definition.validation;
    if (validation?.min !== undefined && value < validation.min) {
      push(errors, `${path}.props.${definition.path}`, "Property is below the minimum value.", node.id);
    }
    if (validation?.max !== undefined && value > validation.max) {
      push(errors, `${path}.props.${definition.path}`, "Property is above the maximum value.", node.id);
    }
  }
  if (definition.options?.length && !definition.options.some((option) => option.value === value)) {
    push(errors, `${path}.props.${definition.path}`, "Property is not one of the supported options.", node.id);
  }
}

function validateNodeAgainstDefinition(
  document: EditorDocument,
  node: EditorNode,
  definition: ComponentDefinition,
  path: string,
  registry: ComponentRegistry,
  errors: EditorDocumentValidationError[],
): void {
  if (node.kind !== definition.kind) {
    push(errors, `${path}.kind`, `Node kind must be '${definition.kind}'.`, node.id);
  }
  if (!definition.supportsVisibility && node.visibility.base !== true) {
    push(errors, `${path}.visibility`, "This component does not support visibility overrides.", node.id);
  }

  const knownTopLevelKeys = new Set(definition.propSchema.map((property) => property.path.split(".")[0]));
  if (!definition.allowUnknownProps) {
    Object.keys(node.props).forEach((key) => {
      if (!knownTopLevelKeys.has(key)) {
        push(errors, `${path}.props.${key}`, "Property is not supported by this component type.", node.id);
      }
    });
  }
  definition.propSchema.forEach((property) => validateProperty(document, node, property, path, errors));

  Object.keys(node.styles ?? {}).forEach((styleKey) => {
    if (!definition.styleCapabilities.includes(styleKey as keyof EditorNode["styles"])) {
      push(errors, `${path}.styles.${styleKey}`, "Style token is not supported by this component type.", node.id);
    }
  });

  Object.entries(node.slots).forEach(([slotName, slot]) => {
    const slotDefinition = definition.slots[slotName];
    if (!slotDefinition) {
      push(errors, `${path}.slots.${slotName}`, "Slot is not supported by this component type.", node.id);
      return;
    }
    if (slotDefinition.minChildren !== undefined && slot.childIds.length < slotDefinition.minChildren) {
      push(errors, `${path}.slots.${slotName}`, "Slot has fewer children than required.", node.id);
    }
    if (slotDefinition.maxChildren !== undefined && slot.childIds.length > slotDefinition.maxChildren) {
      push(errors, `${path}.slots.${slotName}`, "Slot has more children than allowed.", node.id);
    }
    slot.childIds.forEach((childId, index) => {
      const child = document.nodes[childId];
      if (!child) return;
      if (!slotDefinition.allowedChildTypes.some((pattern) => typeMatchesPattern(child.type, pattern))) {
        push(errors, `${path}.slots.${slotName}.childIds.${index}`, "Child type is not allowed in this slot.", node.id);
      }
      const childDefinition = registry.get(child.type);
      if (
        childDefinition?.allowedParentTypes &&
        !childDefinition.allowedParentTypes.some((pattern) => typeMatchesPattern(node.type, pattern))
      ) {
        push(errors, `${path}.slots.${slotName}.childIds.${index}`, "Child type is not allowed under this parent.", child.id);
      }
    });
  });

  Object.values(definition.slots).forEach((slotDefinition) => {
    if (slotDefinition.minChildren && !node.slots[slotDefinition.name]) {
      push(errors, `${path}.slots.${slotDefinition.name}`, "Required slot is missing.", node.id);
    }
  });
}

/**
 * Adds registry-level validation to the base document graph validation.
 * It reads only document data and returns path- and node-addressable issues.
 */
export function validateEditorDocumentRegistry(
  document: EditorDocument,
  registry: ComponentRegistry = editorComponentRegistry,
): EditorDocumentValidationError[] {
  const errors: EditorDocumentValidationError[] = [];

  Object.entries(document.nodes).forEach(([nodeId, node]) => {
    const path = `nodes.${nodeId}`;
    const definition = registry.get(node.type);
    if (!definition) {
      if (!isLegacyComponentType(node.type)) {
        push(errors, `${path}.type`, "Node type is not registered.", nodeId);
      } else if (node.kind !== "legacy" || !node.legacy) {
        push(errors, `${path}.legacy`, "Legacy nodes require legacy metadata and kind.", nodeId);
      }
      return;
    }
    validateNodeAgainstDefinition(document, node, definition, path, registry, errors);

    node.assetIds?.forEach((assetId, assetIndex) => {
      if (!document.assets[assetId]) {
        push(errors, `${path}.assetIds.${assetIndex}`, "Node references a missing asset.", nodeId);
      }
    });
  });

  document.pages.forEach((page, pageIndex) => {
    page.rootNodeIds.forEach((rootNodeId, rootIndex) => {
      const definition = registry.get(document.nodes[rootNodeId]?.type ?? "");
      if (document.nodes[rootNodeId] && !definition?.allowedAsPageRoot) {
        push(errors, `pages.${pageIndex}.rootNodeIds.${rootIndex}`, "Page root type is not allowed.", rootNodeId);
      }
    });
  });

  const validateNavigationUrl = (value: EditorValue, path: string): void => {
    if (typeof value !== "string" || !isSafeDocumentUrl(value)) {
      push(errors, path, "Navigation URL is unsafe.");
    }
  };
  const visitNavigation = (items: EditorDocument["navigation"]["menus"][number]["items"], path: string): void => {
    items.forEach((item, index) => {
      const itemPath = `${path}.${index}`;
      if (item.target.kind === "external") validateNavigationUrl(item.target.url, `${itemPath}.target.url`);
      if (item.children.length) {
        visitNavigation(item.children, `${itemPath}.children`);
      }
    });
  };
  document.navigation.menus.forEach((menu, menuIndex) => {
    visitNavigation(menu.items, `navigation.menus.${menuIndex}.items`);
  });

  return errors;
}
