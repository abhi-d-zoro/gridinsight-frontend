import { useState, useEffect } from "react";
import "./Header.css";

export default function Header({
  title,
  onLogout,
  showAuditLogs = false,
  showNotifications = false,
}) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const loadTheme = () => {
      const savedTheme = localStorage.getItem("dashboardTheme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    localStorage.setItem("dashboardTheme", theme);
    const dashboardPage = document.querySelector(".dashboard-page");
    if (dashboardPage) {
      dashboardPage.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <header className="app-header">
      {/* LEFT - Logo & Title */}
      <div className="header-left">
        <a href="/" className="header-brand" title="GridInsight - Go Home">
          
          <div className="brand-info">
            <span className="brand-text">GridInsight</span>
            
          </div>
        </a>
        {title && (
          <>
            <div className="header-divider"></div>
            <span className="page-title">{title}</span>
          </>
        )}
      </div>

      {/* RIGHT - Actions */}
      <div className="header-right">
        {showAuditLogs && (
          <button className="header-btn header-btn-secondary" title="View audit logs">
            📋 Audit Logs
          </button>
        )}

        {showNotifications && (
          <button className="header-btn header-btn-secondary" title="View notifications">
            🔔 Notifications
          </button>
        )}

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Toggle dark and light mode"
          aria-label="Toggle dark and light mode"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <button className="logout-btn" onClick={onLogout} title="Logout from account">
          🚪 Logout
        </button>
      </div>
    </header>
  );
}
