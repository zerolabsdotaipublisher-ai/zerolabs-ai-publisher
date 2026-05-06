import Link from "next/link";
import { routes } from "@/config/routes";
import type { DashboardContentSummary } from "@/lib/dashboard";

interface DashboardContentSummaryProps {
  summary: DashboardContentSummary;
}

export function DashboardContentSummarySection({ summary }: DashboardContentSummaryProps) {
  return (
    <section className="dashboard-panel-shell" aria-label="Content summary">
      <header>
        <h2>Content summary</h2>
        <p>Generated and scheduled content state from existing content storage and scheduling systems.</p>
        <Link className="dashboard-inline-link" href={routes.contentLibrary}>
          Open content library
        </Link>
      </header>
      <dl className="dashboard-definition-grid">
        <div>
          <dt>Total generated</dt>
          <dd>{summary.totalGenerated}</dd>
        </div>
        <div>
          <dt>Website content</dt>
          <dd>{summary.websiteGenerated}</dd>
        </div>
        <div>
          <dt>Blog content</dt>
          <dd>{summary.blogGenerated}</dd>
        </div>
        <div>
          <dt>Article content</dt>
          <dd>{summary.articleGenerated}</dd>
        </div>
        <div>
          <dt>Published content</dt>
          <dd>{summary.publishedContent}</dd>
        </div>
        <div>
          <dt>Scheduled content</dt>
          <dd>{summary.scheduledContent}</dd>
        </div>
      </dl>
    </section>
  );
}
