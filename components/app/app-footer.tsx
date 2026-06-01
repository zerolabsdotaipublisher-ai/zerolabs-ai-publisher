export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer-surface app-container">
        <div className="app-footer-brand">
          <strong className="app-footer-title">Zero Labs AI Publisher</strong>
          <p className="app-footer-copy">A calm, premium workspace footer for authenticated publishing flows.</p>
        </div>

        <nav className="app-footer-links" aria-label="Workspace footer">
          <span>Terms</span>
          <span>Privacy</span>
          <span>Support</span>
        </nav>

        <p className="app-footer-copy app-footer-meta">© {currentYear} Zero Labs AI Publisher</p>
      </div>
    </footer>
  );
}
