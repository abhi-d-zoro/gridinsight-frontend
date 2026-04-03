import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import UsersList from "./UserList";
import adminApi from "../../api/adminApi";
import "./AdminDashboard.css";


export default function AdminDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("USERS");

  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalGridZones: 0,
    activeAlerts: 0,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ✅ RBAC guard
  if (role !== "ADMIN") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      const res = await adminApi.get("/kpis");
      setKpis(res.data);
    } catch (err) {
      console.error("Failed to fetch KPI data", err);
    }
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      onLogout={handleLogout}
      showAuditLogs
      showNotifications
    >
      {/* ✅ ADMIN-ONLY CONTENT BELOW */}

      {/* <div className="kpi-grid">
        <KpiCard icon="👥" value={kpis.totalUsers} label="Total Users" />
        <KpiCard icon="⚡" value={kpis.totalGridZones} label="Grid Zones" />
        <KpiCard icon="🚨" value={kpis.activeAlerts} label="Active Alerts" />
      </div> */}

      <div className="tabs">
        <TabButton
          label="Manage Users"
          active={activeTab === "USERS"}
          onClick={() => setActiveTab("USERS")}
        />
        <TabButton
          label="Manage Grid Zones"
          active={activeTab === "ZONES"}
          onClick={() => setActiveTab("ZONES")}
        />
        <TabButton
          label="View Alerts"
          active={activeTab === "ALERTS"}
          onClick={() => setActiveTab("ALERTS")}
        />
        <TabButton
          label="Audit Logs"
          active={activeTab === "AUDIT_LOGS"}
          onClick={() => setActiveTab("AUDIT_LOGS")}
        />
      </div>


      <div className="admin-panel">
        {activeTab === "USERS" && <UsersList />}

        {activeTab === "ZONES" && (
          <div className="placeholder">
            Grid Zones management UI will appear here.
          </div>
        )}

        {activeTab === "ALERTS" && (
          <div className="placeholder">
            Alerts monitoring UI will appear here.
          </div>
        )}

        {activeTab === "AUDIT_LOGS" && (
          <div className="placeholder">
            Audit Logs UI will appear here.
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}

/* ---------- Small Components ---------- */

function KpiCard({ icon, value, label }) {
  return (
    <div className="kpi-card">
      <div className="kpi-main">
        <span className="kpi-icon">{icon}</span>
        <span className="kpi-value">{value}</span>
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      className={`tab-btn ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}