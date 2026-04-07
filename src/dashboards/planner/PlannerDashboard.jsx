import React, { useState } from "react";
import "./PlannerDashboard.css";
import Overview from "./Overview";
import DayAheadJobs from "./DayAheadJobs";
import MonthAheadForecast from "./MonthAheadForecast";
import CapacityPlans from "./CapacityPlans";
import ForecastAccuracy from "./ForecastAccuracy";

export default function PlannerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [zoneFilter, setZoneFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [assetType, setAssetType] = useState("SOLAR");
  const [accuracy, setAccuracy] = useState(null);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "dayAhead", label: "Day-Ahead Forecast" },
    { id: "monthAhead", label: "Month-Ahead Forecast" },
    { id: "capacity", label: "Capacity Plans" },
    { id: "accuracy", label: "Forecast Accuracy" },
  ];

  // ✅ Logout handler
  const handleLogout = () => {
    // Clear any stored auth token/session
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <div className="planner-dashboard">
      <aside className="sidebar">
        <h2>Planner Dashboard</h2>
        <ul>
          {tabs.map(tab => (
            <li
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      </aside>

      <main className="content">
        <header className="planner-header">
          <h1>GridInsight | Planner Dashboard</h1>
          {/* ✅ Wire logout handler */}
          <button onClick={handleLogout}>Logout</button>
        </header>

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
      </main>
    </div>
  );
}
