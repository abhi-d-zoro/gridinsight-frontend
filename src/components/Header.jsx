import { useState, useEffect } from "react";
import "./Header.css";

export default function Header({
  title,
  onLogout,
  showAuditLogs = false,
  showNotifications = false,
}) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  });

  // Listen for theme changes from other components/tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save theme and apply to dashboard
  useEffect(() => {
    localStorage.setItem("theme", theme);
    const dashboardPage = document.querySelector(".dashboard-page");
    if (dashboardPage) {
      dashboardPage.classList.remove("dark", "light");
      dashboardPage.classList.add(theme);
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
