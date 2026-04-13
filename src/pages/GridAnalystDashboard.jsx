import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import GridStability from "../dashboards/analyst/GridStability";
import AnomalyDetection from "../dashboards/analyst/AnomalyDetection";
import LoadForecasting from "../dashboards/analyst/LoadForecasting";
import ReportsGenerator from "../dashboards/analyst/ReportsGenerator";
import "../dashboards/analyst/AnalystComponents.css";
import "./GridAnalystDashboard.css";

export default function GridAnalystDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("STABILITY");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Sidebar configuration
  const tabs = [
    {
      id: "stability",
      label: "Grid Stability",
      icon: "⚡",
      description: "Load vs generation analysis"
    },
    {
      id: "anomalies",
      label: "Anomaly Detection",
      icon: "⚠️",
      description: "Review threshold alerts"
    },
    {
      id: "forecasting",
      label: "Load Forecasting",
      icon: "📈",
      description: "Analyze demand predictions"
    },
    {
      id: "reports",
      label: "Generate Reports",
      icon: "📋",
      description: "Export analytics"
    }
  ];

  const sidebar = {
    navItems: tabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      description: tab.description,
      active: activeView === tab.id.toUpperCase(),
      onClick: () => setActiveView(tab.id.toUpperCase())
    }))
  };

  // Security Check - AFTER all hooks
  if (role !== "OPERATOR" && role !== "ANALYST" && role !== "ADMIN") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Grid Analyst Dashboard"
      onLogout={handleLogout}
      layout="sidebar"
      sidebar={sidebar}
    >
      <div className="analyst-content">
        <div className="analyst-content-area">
          {/* Grid Stability View */}
          {activeView === "STABILITY" && <GridStability />}

          {/* Anomaly Detection View */}
          {activeView === "ANOMALIES" && <AnomalyDetection />}

          {/* Load Forecasting View */}
          {activeView === "FORECASTING" && <LoadForecasting />}

          {/* Reports View */}
          {activeView === "REPORTS" && <ReportsGenerator />}
        </div>
      </div>
    </DashboardLayout>
  );
}