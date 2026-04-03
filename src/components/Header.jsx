import "./Header.css";

export default function Header({
  title,
  onLogout,
  showAuditLogs = false,
  showNotifications = false,
}) {
  return (
    <header className="app-header">
      {/* LEFT */}
      <div className="header-left">
        <span className="app-logo">GridInsight</span>
        <h1 className="header-title"> | {title}</h1>
      </div>

      {/* RIGHT */}
      <div className="header-right">
        {showAuditLogs && (
          <button className="header-btn">Audit Logs</button>
        )}

        {showNotifications && (
          <button className="header-btn">Notifications</button>
        )}

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
