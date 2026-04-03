import Header from "./Header";


export default function DashboardLayout({
  title,
  onLogout,
  children,

  // optional admin-only flags (default OFF)
  showAuditLogs = false,
  showNotifications = false,
}) {
  return (
    <div className="dashboard-page">
      <Header
        title={title}
        onLogout={onLogout}
      />

      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}