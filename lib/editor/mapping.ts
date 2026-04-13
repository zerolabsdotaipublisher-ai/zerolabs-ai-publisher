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
  let current: Record<string, unknown> | unknown[] = clone as Record<string, unknown>;

  const isArrayIndex = (entry: string): boolean => /^\d+$/.test(entry);

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const nextValue = (current as Record<string, unknown>)[key];
    const nextKey = keys[i + 1];

    if (nextValue === undefined || nextValue === null || typeof nextValue !== "object") {
      (current as Record<string, unknown>)[key] = isArrayIndex(nextKey) ? [] : {};
    }

    current = (current as Record<string, unknown>)[key] as Record<string, unknown> | unknown[];
  }

  (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
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
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  const sortDeep = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map(sortDeep);
    }

    if (input && typeof input === "object") {
      return Object.entries(input as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
          accumulator[key] = sortDeep(entry);
          return accumulator;
        }, {});
    }

    return input;
  };

  return JSON.stringify(sortDeep(value));
}
