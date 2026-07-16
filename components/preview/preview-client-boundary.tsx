"use client";

import { Component, type ReactNode } from "react";
import { logPreviewClientDiagnostic } from "@/lib/preview/client-diagnostics";

interface PreviewClientBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  requestId?: string;
  boundaryName?: string;
  structureId?: string;
}

interface PreviewClientBoundaryState {
  hasError: boolean;
}

export class PreviewClientBoundary extends Component<
  PreviewClientBoundaryProps,
  PreviewClientBoundaryState
> {
  state: PreviewClientBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): PreviewClientBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logPreviewClientDiagnostic({
      message: "Preview interactive UI failed to render",
      failedStage: "preview-render",
      safeErrorCategory: "preview-render-failed",
      boundaryName: this.props.boundaryName,
      requestId: this.props.requestId,
      structureId: this.props.structureId,
      error,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
