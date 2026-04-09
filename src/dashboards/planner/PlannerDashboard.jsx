import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import Overview from "./Overview";
import DayAheadJobs from "./DayAheadJobs";
import MonthAheadForecast from "./MonthAheadForecast";
import CapacityPlans from "./CapacityPlans";
import ForecastAccuracy from "./ForecastAccuracy";
import "./PlannerDashboard.css";

export default function PlannerDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [zoneFilter, setZoneFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [assetType, setAssetType] = useState("SOLAR");
  const [accuracy, setAccuracy] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊", description: "Dashboard overview and key metrics" },
    { id: "dayAhead", label: "Day-Ahead Forecast", icon: "📅", description: "Day-ahead forecasting and planning" },
    { id: "monthAhead", label: "Month-Ahead Forecast", icon: "📈", description: "Month-ahead forecasting analysis" },
    { id: "capacity", label: "Capacity Plans", icon: "⚡", description: "Capacity planning and management" },
    { id: "accuracy", label: "Forecast Accuracy", icon: "🎯", description: "Forecast accuracy analysis and reporting" },
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
  if (role !== "PLANNER" && role !== "ADMIN") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Planner Dashboard"
      onLogout={handleLogout}
      layout="sidebar"
      sidebar={sidebar}
    >
      <div className="planner-content">
        {/* Content Area */}
        <div className="planner-content-area">
          {activeTab === "overview" && <Overview accuracy={accuracy} />}
          {activeTab === "dayAhead" && (
            <DayAheadJobs
              zoneFilter={zoneFilter}
              setZoneFilter={setZoneFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
            />
          )}
          {activeTab === "monthAhead" && (
            <MonthAheadForecast assetType={assetType} setAssetType={setAssetType} />
          )}
          {activeTab === "capacity" && <CapacityPlans />}
          {activeTab === "accuracy" && (
            <ForecastAccuracy
              zoneFilter={zoneFilter}
              setZoneFilter={setZoneFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              setAccuracy={setAccuracy}
              accuracy={accuracy}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
