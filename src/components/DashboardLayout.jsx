import Header from "./Header";
import "./DashboardLayout.css";

export default function DashboardLayout({
  title,
  onLogout,
  children,

  // optional admin-only flags (default OFF)
  showAuditLogs = false,
  showNotifications = false,

  // sidebar configuration
  sidebar = null, // { header: { icon, title }, navItems: [{ id, label, icon, active }] }

  // layout mode
  layout = "simple", // "simple" | "sidebar"
}) {
  return (
    <div className="dashboard-page">
      <Header
        title={title}
        onLogout={onLogout}
        showAuditLogs={showAuditLogs}
        showNotifications={showNotifications}
      />

      <main className="dashboard-content">
        {layout === "sidebar" && sidebar ? (
          <div className="dashboard-with-sidebar">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
              {sidebar.header && (
                <div className="sidebar-header">
                  <div className="sidebar-icon">{sidebar.header.icon}</div>
                  <h3>{sidebar.header.title}</h3>
                </div>
              )}

              <nav className="sidebar-nav">
                {sidebar.navItems?.map((item) => (
                  <button
                    key={item.id}
                    className={`nav-item ${item.active ? "active" : ""}`}
                    onClick={item.onClick}
                    title={item.description}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
              {children}
            </div>
          </div>
        ) : (
          // Simple layout without sidebar
          <div className="dashboard-simple">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}