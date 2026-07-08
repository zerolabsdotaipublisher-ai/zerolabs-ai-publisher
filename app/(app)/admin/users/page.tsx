import { routes } from "@/config/routes";
import { formatAdminDate, getAdminDashboardData, listAdminUsers } from "@/lib/admin/data";
import {
  findAdminUserRecordByEmail,
  getAdminUsersDiagnostics,
  listCurrentAdminUsers,
  normalizeAdminUserEmailInput,
} from "@/lib/admin/users";
import { promoteAdminUserAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

function renderMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function getResultMessage(result: string | undefined, email: string | undefined) {
  switch (result) {
    case "promoted":
      return {
        tone: "success",
        title: "Admin access granted",
        detail: `${email ?? "The selected account"} can now access /admin after signing in again or refreshing the session.`,
      };
    case "already-admin":
      return {
        tone: "info",
        title: "This user already has admin access.",
        detail: `${email ?? "That account"} already has the admin role.`,
      };
    case "no-user":
      return {
        tone: "error",
        title: "No existing account found",
        detail: "No existing account found for this email. Ask the user to sign up first.",
      };
    case "service-role-missing":
      return {
        tone: "error",
        title: "Service-role key missing",
        detail: "Admin promotion is blocked because the server-side Supabase service-role key is missing.",
      };
    case "service-role-invalid":
      return {
        tone: "error",
        title: "Service-role configuration invalid",
        detail: "Admin promotion is blocked because the server-side Supabase service-role key is invalid or pointed at a different project.",
      };
    case "profile-repair-failed":
      return {
        tone: "error",
        title: "Profile repair failed",
        detail: `${email ?? "That account"} exists in Auth, but the matching profile row could not be created or loaded safely.`,
      };
    case "role-update-failed":
      return {
        tone: "error",
        title: "Role update failed",
        detail: `${email ?? "That account"} was found, but the admin role update could not be completed safely.`,
      };
    case "unauthorized":
      return {
        tone: "error",
        title: "Unauthorized",
        detail: "Only current admins can grant admin access.",
      };
    case "invalid-email":
      return {
        tone: "error",
        title: "Enter a valid email",
        detail: "Provide the email address of an existing user account before submitting the form.",
      };
    default:
      return null;
  }
}

function formatDiagnosticStatus(value: string): string {
  return value.replace(/-/g, " ");
}

function normalizeRequestId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function formatBooleanStatus(value: boolean | null): string {
  if (value === null) {
    return "unknown";
  }

  return value ? "yes" : "no";
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const queryParams = searchParams ? await searchParams : {};
  const query = normalizeAdminUserEmailInput(queryParams.query);
  const result = queryParams.result;
  const resultEmail = normalizeAdminUserEmailInput(queryParams.email);
  const requestId = normalizeRequestId(queryParams.requestId);
  const feedback = getResultMessage(result, resultEmail || query);
  const [dashboard, users, currentAdmins, lookupUser, diagnostics] = await Promise.all([
    getAdminDashboardData(),
    listAdminUsers(24),
    listCurrentAdminUsers(12),
    query ? findAdminUserRecordByEmail(query) : Promise.resolve(null),
    getAdminUsersDiagnostics(query || resultEmail || undefined),
  ]);

  return (
    <section className="admin-page-shell" aria-label="Admin users page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Admin access control</span>
          <h1>Admin Users</h1>
          <p>
            Protected admin-only user management. Existing users can be granted admin access by email through a
            server-side role update.
          </p>
        </div>
      </header>

      <div className="admin-stat-grid" aria-label="Admin user summary cards">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Total users</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.users.total)}</strong>
          <span className="admin-stat-hint">{renderMetric(dashboard.users.recentSignups)} recent signups in 7 days</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Current admins</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.users.admins)}</strong>
          <span className="admin-stat-hint">Admin access is enforced server-side</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Published websites</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.websites.published)}</strong>
          <span className="admin-stat-hint">Customer dashboard behavior remains unchanged</span>
        </article>
      </div>

      {feedback ? (
        <div className={`admin-form-message admin-form-message-${feedback.tone}`} role="status" aria-live="polite">
          <strong>{feedback.title}</strong>
          <p>{feedback.detail}</p>
          {requestId ? <p>Request ID: {requestId}</p> : null}
        </div>
      ) : null}

      <section className="admin-panel" aria-label="Admin diagnostics">
        <header className="admin-panel-header">
          <div>
            <span className="admin-panel-kicker">Diagnostics</span>
            <h2>Safe admin diagnostics</h2>
            <p>These checks stay server-side and surface only safe configuration categories.</p>
          </div>
        </header>

        <div className="admin-content-grid">
          <div className="admin-surface-card">
            <span className="admin-surface-label">Service role</span>
            <strong>{formatDiagnosticStatus(diagnostics.serviceRole.status)}</strong>
            <p>
              Project match:{" "}
              {diagnostics.serviceRole.keyProjectRef && diagnostics.serviceRole.configuredProjectRef
                ? diagnostics.serviceRole.keyProjectRef === diagnostics.serviceRole.configuredProjectRef
                  ? "matches public project"
                  : "mismatch"
                : "unknown"}
            </p>
            <p>Role claim: {diagnostics.serviceRole.roleClaim ?? "unknown"}</p>
          </div>

          <div className="admin-surface-card">
            <span className="admin-surface-label">Profile reads</span>
            <strong>{diagnostics.profileReads.status}</strong>
            <p>Total users: {diagnostics.profileReads.totalUsers ?? "unknown"}</p>
            <p>Current admins: {diagnostics.profileReads.currentAdmins ?? "unknown"}</p>
          </div>

          <div className="admin-surface-card">
            <span className="admin-surface-label">Auth diagnostics</span>
            <strong>{diagnostics.authReads.status}</strong>
            <p>Suspected issue: {formatDiagnosticStatus(diagnostics.suspectedIssue)}</p>
            <p>Request ID: {diagnostics.requestId}</p>
          </div>
        </div>

        {diagnostics.targetUser ? (
          <div className="admin-empty-state">
            <strong>Target user diagnostics for {diagnostics.targetUser.email}</strong>
            <p>Exists in Auth: {formatBooleanStatus(diagnostics.targetUser.existsInAuth)}</p>
            <p>Exists in profile: {formatBooleanStatus(diagnostics.targetUser.existsInProfile)}</p>
          </div>
        ) : null}
      </section>

      <div className="admin-content-grid">
        <section className="admin-panel" aria-label="Promote user to admin">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Grant access</span>
              <h2>Promote an existing user</h2>
              <p>Only existing accounts can be promoted. Normal users cannot reach or run this action.</p>
            </div>
          </header>

          <form action={promoteAdminUserAction} className="admin-form">
            <label htmlFor="promote-email" className="admin-field">
              <span>Email address</span>
              <input
                id="promote-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                defaultValue={resultEmail || query}
                required
              />
            </label>
            <button type="submit" className="admin-page-action-link">
              Grant admin access
            </button>
          </form>

          <div className="admin-empty-state">
            <strong>Security guardrails</strong>
            <p>
              This action runs only on the server, re-checks the current user role, and never exposes Supabase service
              credentials to the browser.
            </p>
          </div>
        </section>

        <section className="admin-panel" aria-label="Search user by email">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Search</span>
              <h2>Find a user by email</h2>
              <p>Look up an existing account before granting access.</p>
            </div>
          </header>

          <form action={routes.adminUsers} method="get" className="admin-form">
            <label htmlFor="lookup-email" className="admin-field">
              <span>Search email</span>
              <input
                id="lookup-email"
                name="query"
                type="email"
                autoComplete="email"
                placeholder="Search an existing account"
                defaultValue={query}
              />
            </label>
            <button type="submit" className="admin-page-action-link admin-page-action-link-secondary">
              Search user
            </button>
          </form>

          {query ? (
            lookupUser ? (
              <div className="admin-surface-card">
                <span className="admin-surface-label">Search result</span>
                <strong>{lookupUser.email}</strong>
                <p>{lookupUser.fullName ?? "Name unavailable"}</p>
                <p>
                  Role: {lookupUser.role} · {lookupUser.status}
                </p>
                <p>Created {formatAdminDate(lookupUser.createdAt)}</p>
              </div>
            ) : (
              <div className="admin-empty-state">
                <strong>No existing account found for {query}.</strong>
                <p>
                  {diagnostics.targetUser?.existsInAuth
                    ? "Auth has this user, but the matching profile row is missing or unreadable."
                    : "No existing account found for this email. Ask the user to sign up first."}
                </p>
              </div>
            )
          ) : (
            <div className="admin-empty-state">
              <strong>Search an existing account</strong>
              <p>Enter an email address to verify the account exists before promoting it.</p>
            </div>
          )}
        </section>
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel" aria-label="Current admin users">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Current admins</span>
              <h2>Existing admin accounts</h2>
              <p>Visible admin list pulled from the existing profile role field.</p>
            </div>
          </header>

          {currentAdmins.length > 0 ? (
            <ul className="admin-list">
              {currentAdmins.map((record) => (
                <li key={record.id} className="admin-list-item">
                  <div>
                    <strong>{record.email}</strong>
                    <p>{record.status}</p>
                  </div>
                  <span className="admin-list-meta">Created {formatAdminDate(record.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty-state">
              <strong>No admin profiles were found.</strong>
              <p>At least one existing admin account is required to manage this area.</p>
            </div>
          )}
        </section>

        <section className="admin-panel" aria-label="Recent user directory">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Recent accounts</span>
              <h2>User directory</h2>
              <p>Recent user records with role and auth status details.</p>
            </div>
          </header>

          {users.length > 0 ? (
            <ul className="admin-list">
              {users.map((record) => (
                <li key={record.id} className="admin-list-item">
                  <div>
                    <strong>{record.email}</strong>
                    <p>
                      {record.role} · {record.status}
                    </p>
                  </div>
                  <span className="admin-list-meta">Created {formatAdminDate(record.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty-state">
              <strong>No user records are available.</strong>
              <p>The admin directory will appear once user profile data is available.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
