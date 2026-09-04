function stripWrappingQuotes(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const startsWithDoubleQuote = value.startsWith('"') && value.endsWith('"');
  const startsWithSingleQuote = value.startsWith("'") && value.endsWith("'");

  if (!startsWithDoubleQuote && !startsWithSingleQuote) {
    return value;
  }

  return value.slice(1, -1);
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const normalized = stripWrappingQuotes(trimmed).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function requiredPublic(key: string, value: string | undefined): string {
  const normalized = normalizeEnvValue(value);

  if (!normalized) {
    throw new Error(
      `Missing required public environment variable: ${key}\n` +
        `Copy .env.example to .env.local and set a value for ${key}.`
    );
  }

  return normalized;
}

export interface PublicAppConfig {
  name: string;
  url: string;
  supabase: {
    url: string;
    anonKey: string;
  };
}

export const publicAppConfig: PublicAppConfig = {
  name: requiredPublic("NEXT_PUBLIC_APP_NAME", process.env.NEXT_PUBLIC_APP_NAME),
  url: requiredPublic("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL),
  supabase: {
    url: requiredPublic("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requiredPublic("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
};
