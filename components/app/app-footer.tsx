export function AppFooter() {
  const currentYear = new Date().getFullYear();
  const footerItems = ["Terms", "Privacy", "Support"] as const;

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <strong className="app-footer-title">Zero Labs AI Publisher</strong>
          <p className="app-footer-copy">Calm publishing infrastructure for your authenticated workspace.</p>
        </div>

        <nav className="app-footer-links" aria-label="Footer">
          {footerItems.map((item) => (
            <a key={item} className="app-footer-link" href={`/${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>

        <p className="app-footer-copy app-footer-meta">© {currentYear} Zero Labs AI Publisher. All rights reserved.</p>
      </div>
    </footer>
  );
}
