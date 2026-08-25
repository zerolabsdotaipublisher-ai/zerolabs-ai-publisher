sed -i 's/.dashboard-home-shell {/.dashboard-home-shell {\n  --dashboard-left-sidebar-width: 220px;\n  --dashboard-right-sidebar-width: 300px;\n/g' app/globals.css

cat << 'STYLE' >> app/globals.css

/* Facebook inspired 3-column dashboard layout */
.dashboard-three-column-grid {
  display: grid;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  gap: clamp(1rem, 2vw, 1.5rem);
}

@media (min-width: 1024px) {
  .dashboard-three-column-grid {
    grid-template-columns: var(--dashboard-left-sidebar-width) minmax(0, 1fr) var(--dashboard-right-sidebar-width);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .dashboard-three-column-grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  }

  /* Right column moves to bottom in 2-col, or we just rearrange elements */
}

@media (max-width: 767px) {
  .dashboard-three-column-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-sidebar-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-sidebar-nav-link {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.15s ease;
}

.dashboard-sidebar-nav-link:hover {
  background-color: var(--surface-elevated);
}

.dashboard-sidebar-nav-link.active {
  background-color: var(--surface-elevated);
  font-weight: 600;
  color: var(--accent);
}

.dashboard-sidebar-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.8rem 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.dashboard-sidebar-profile-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.dashboard-sidebar-profile-info {
  display: flex;
  flex-direction: column;
}

.dashboard-sidebar-profile-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.dashboard-sidebar-profile-stats {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
STYLE
