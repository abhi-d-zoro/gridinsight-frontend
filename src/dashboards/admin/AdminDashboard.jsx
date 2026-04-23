import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import UsersList from "./UserList";
import AuditLogs from "./AuditLogs";
import GridZoneList from "./GridZoneList";
import ActiveAlerts from "./ActiveAlerts";

import AssetManager from "./AssetManager";
import ThresholdManager from "./ThresholdManager";
import ReportManager from "./ReportManager";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("USERS");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "USERS", label: "Manage Users", icon: "👥", description: "Add, edit, or remove system users" },
    { id: "ZONES", label: "Grid Zones", icon: "⚡", description: "Manage electrical grid zones" },
    { id: "ASSETS", label: "Assets", icon: "🔋", description: "Manage renewable and grid assets" },
    { id: "THRESHOLDS", label: "Thresholds", icon: "📏", description: "Configure alert thresholds and rules" },
    { id: "REPORTS", label: "Reports", icon: "📊", description: "Generate and manage ESG and audit reports" },
    { id: "ALERTS", label: "Active Alerts", icon: "🚨", description: "Monitor system alerts" },
    { id: "AUDIT_LOGS", label: "Audit Logs", icon: "📋", description: "View system activity logs" },
  ];

  const sidebar = {
    navItems: tabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      description: tab.description,
      active: activeTab === tab.id,
      onClick: () => setActiveTab(tab.id)
    }))
  };

  // RBAC guard - AFTER all hooks
  if (role !== "ADMIN") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      onLogout={handleLogout}
      layout="sidebar"
      sidebar={sidebar}
    >
      <div className="admin-content">
        {activeTab === "USERS" && <UsersList />}

        {activeTab === "ZONES" && <GridZoneList />}


        {activeTab === "ASSETS" && <AssetManager />}

        {activeTab === "THRESHOLDS" && <ThresholdManager />}

        {activeTab === "REPORTS" && <ReportManager />}

        {activeTab === "ALERTS" && <ActiveAlerts />}

        {activeTab === "AUDIT_LOGS" && <AuditLogs />}
      </div>
    </DashboardLayout>
  );
}