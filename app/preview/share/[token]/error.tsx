"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { PreviewErrorState } from "@/components/preview/preview-error-state";
import { logPreviewClientDiagnostic } from "@/lib/preview/client-diagnostics";

interface SharedPreviewErrorPageProps {
  error: Error & { digest?: string };
}

function decodeStructureIdFromToken(token: string | undefined): string | undefined {
  if (!token) {
    return undefined;
  }

  const [payloadEncoded] = token.split(".");
  if (!payloadEncoded) {
    return undefined;
  }

  try {
    const base64 = payloadEncoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as { sid?: unknown };
    return typeof payload.sid === "string" && payload.sid.trim() ? payload.sid : undefined;
  } catch {
    return undefined;
  }
}

export default function SharedPreviewErrorPage({ error }: SharedPreviewErrorPageProps) {
  const params = useParams<{ token?: string }>();
  const structureId = decodeStructureIdFromToken(params?.token);

  useEffect(() => {
    logPreviewClientDiagnostic({
      message: "Shared preview route failed to render",
      failedStage: "preview-render",
      safeErrorCategory: "preview-render-failed",
      routeKind: "shared",
      structureId,
      error,
      digest: error.digest,
    });
  }, [error, structureId]);

  return <PreviewErrorState title="Shared preview unavailable" />;
}
