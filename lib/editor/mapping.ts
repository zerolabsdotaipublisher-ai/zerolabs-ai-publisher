export function getValueByPath(source: unknown, path: string): unknown {
  const keys = path.split(".").filter(Boolean);
  let current: unknown = source;

  for (const key of keys) {
    if (typeof current !== "object" || current === null || !(key in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function setValueByPath<T extends object>(source: T, path: string, value: unknown): T {
  const keys = path.split(".").filter(Boolean);
  if (!keys.length) {
    return source;
  }

  const clone = structuredClone(source);
  let current: Record<string, unknown> = clone as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const nextValue = current[key];

    if (typeof nextValue !== "object" || nextValue === null || Array.isArray(nextValue)) {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return clone;
}

export function reorderById<T extends { id: string; order: number }>(items: T[], orderedIds: string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const reordered: T[] = [];

  orderedIds.forEach((id, index) => {
    const item = byId.get(id);
    if (!item) {
      return;
    }
    reordered.push({
      ...item,
      order: index + 1,
    });
  });

  return reordered;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort());
}
