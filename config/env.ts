const required = (key: string, value?: string): string => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "AI Publisher",
    env: process.env.NODE_ENV || "development",
  },

  supabase: {
    url: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  openai: {
    apiKey: required("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
  },

  qdrant: {
    url: required("QDRANT_URL", process.env.QDRANT_URL),
    apiKey: process.env.QDRANT_API_KEY,
    collection: process.env.QDRANT_COLLECTION || "ai_publisher_default",
  },

  wasabi: {
    accessKey: process.env.WASABI_ACCESS_KEY_ID,
    secretKey: process.env.WASABI_SECRET_ACCESS_KEY,
    bucket: process.env.WASABI_BUCKET,
    region: process.env.WASABI_REGION,
  },

  zeroflow: {
    apiUrl: process.env.ZEROFLOW_API_URL,
    apiKey: process.env.ZEROFLOW_API_KEY,
  },
};
