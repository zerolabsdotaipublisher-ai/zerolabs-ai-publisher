export interface PreviewScenario {
  id: string;
  name: string;
  description: string;
  expected: string[];
}

export const websitePreviewScenarios: PreviewScenario[] = [
  {
    id: "preview-multipage-navigation",
    name: "Multi-page navigation",
    description: "Switch between generated pages from both toolbar controls and renderer navigation links.",
    expected: [
      "Current page updates via query param",
      "Renderer displays selected page sections",
      "Navigation active state matches selected page",
    ],
  },
  {
    id: "preview-device-modes",
    name: "Responsive device modes",
    description: "Switch preview canvas between desktop, tablet, and mobile frame widths.",
    expected: [
      "Toolbar updates selected mode",
      "Preview canvas class changes by mode",
      "No full route crash or blank states while switching",
    ],
  },
  {
    id: "preview-loading-error",
    name: "Loading and error states",
    description: "Ensure loading fallback and safe error handling are shown during fetch/render failures.",
    expected: [
      "Loading UI appears while route fetch resolves",
      "Error UI appears on route failure",
      "No raw stack traces shown to user",
    ],
  },
  {
    id: "preview-sharing-security",
    name: "Share flow and access isolation",
    description: "Generate share links as owner and open share route with valid and invalid tokens.",
    expected: [
      "Share API rejects unauthorized requests",
      "Invalid/expired share token denies access",
      "Valid token renders read-only shared preview",
    ],
  },
  {
    id: "preview-route-resolution",
    name: "Preview route resolution",
    description: "Preview page query values resolve through generated website routing records.",
    expected: [
      "Unknown page route falls back to first visible generated page",
      "Preview page list uses generated route mapping",
      "Navigation and preview route state stay synchronized",
    ],
  },
];
