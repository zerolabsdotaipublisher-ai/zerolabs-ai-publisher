export class InstagramIntegrationError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code: string;
      retryable?: boolean;
      statusCode?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "InstagramIntegrationError";
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
    this.metadata = options.metadata;
  }
}

export function toInstagramIntegrationError(error: unknown): InstagramIntegrationError {
  if (error instanceof InstagramIntegrationError) {
    return error;
  }

  if (error instanceof Error) {
    return new InstagramIntegrationError(error.message, {
      code: "instagram_unknown_error",
      retryable: true,
    });
  }

  return new InstagramIntegrationError("Unknown Instagram integration error", {
    code: "instagram_unknown_error",
    retryable: true,
  });
}
