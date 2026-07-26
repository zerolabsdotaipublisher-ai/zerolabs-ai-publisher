import type { VercelIntegrationDiagnostic } from "@/lib/admin/vercel";

interface AdminDiagnosticsProps {
  diagnostics: VercelIntegrationDiagnostic[];
}

function getDiagnosticClass(tone: VercelIntegrationDiagnostic["tone"]): string {
  if (tone === "error") {
    return "admin-diagnostic admin-diagnostic-error";
  }

  if (tone === "warning") {
    return "admin-diagnostic admin-diagnostic-warning";
  }

  return "admin-diagnostic admin-diagnostic-info";
}

export function AdminDiagnostics({ diagnostics }: AdminDiagnosticsProps) {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <ul className="admin-diagnostic-list" aria-label="Vercel diagnostics">
      {diagnostics.map((diagnostic) => (
        <li key={diagnostic.code} className={getDiagnosticClass(diagnostic.tone)}>
          <code>{diagnostic.code}</code>
          <strong>{diagnostic.label}</strong>
          <span>{diagnostic.detail}</span>
        </li>
      ))}
    </ul>
  );
}
