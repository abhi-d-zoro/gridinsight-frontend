import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

export default function PlannerDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [planningMetrics, setPlanningMetrics] = useState(null);

  // ✅ RBAC guard
  if (role !== "PLANNER") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  useEffect(() => {
    loadPlanningData();
  }, []);

  const loadPlanningData = () => {
    const mockData = {
      capacityPlans: [
        {
          id: 1,
          name: "Q2 2026 Capacity Plan",
          startDate: "2026-04-01",
          endDate: "2026-06-30",
          status: "In Progress",
          progress: 35,
          targetCapacity: 5000,
          currentCapacity: 4200,
        },
        {
          id: 2,
          name: "H2 2026 Expansion",
          startDate: "2026-07-01",
          endDate: "2026-12-31",
          status: "Planning",
          progress: 15,
          targetCapacity: 6500,
          currentCapacity: 4200,
        },
      ],
      forecasts: [
        { period: "Day-Ahead", accuracy: 94.2, lastUpdate: "2 hours ago" },
        { period: "Week-Ahead", accuracy: 91.5, lastUpdate: "12 hours ago" },
        { period: "Month-Ahead", accuracy: 87.8, lastUpdate: "3 days ago" },
      ],
      maintenanceSchedule: [
        {
          id: 1,
          equipment: "Transformer Unit A",
          scheduledDate: "2026-04-15",
          duration: "8 hours",
          impact: "Medium",
        },
        {
          id: 2,
          equipment: "Circuit Breaker B2",
          scheduledDate: "2026-04-22",
          duration: "4 hours",
          impact: "Low",
        },
      ],
    };
    setPlanningMetrics(mockData);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const CapacityPlan = ({ plan }) => (
    <div className="plan-card">
      <div className="plan-header">
        <div>
          <h4>{plan.name}</h4>
          <p className="plan-date">
            {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`status-badge ${plan.status.toLowerCase().replace(" ", "-")}`}>
          {plan.status}
        </span>
      </div>
      <div className="plan-content">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${plan.progress}%` }}></div>
        </div>
        <p className="progress-text">{plan.progress}% Complete</p>
        <div className="capacity-info">
          <span>{plan.currentCapacity} MW / {plan.targetCapacity} MW</span>
        </div>
      </div>
    </div>
  );

  const ForecastCard = ({ forecast }) => (
    <div className="forecast-card">
      <div className="forecast-header">
        <h4>{forecast.period} Forecast</h4>
      </div>
      <div className="forecast-content">
        <div className="accuracy-display">
          <span className="accuracy-value">{forecast.accuracy}%</span>
          <span className="accuracy-label">Accuracy</span>
        </div>
        <p className="last-update">Updated {forecast.lastUpdate}</p>
      </div>
    </div>
  );

  const MaintenanceItem = ({ item }) => (
    <div className="maintenance-row">
      <div className="maintenance-info">
        <h4>{item.equipment}</h4>
        <p>{new Date(item.scheduledDate).toLocaleDateString()} • {item.duration}</p>
      </div>
      <span className={`impact-badge impact-${item.impact.toLowerCase()}`}>
        {item.impact}
      </span>
    </div>
  );

  return (
    <DashboardLayout
      title="Planner Dashboard"
      onLogout={handleLogout}
      layout="simple"
    >
      <div className="planner-dashboard">
        <div className="dashboard-header">
          <h2>Capacity Planning & Scheduling</h2>
          <p>Manage forecasts, capacity plans, and maintenance schedules</p>
        </div>

        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "capacity" ? "active" : ""}`}
            onClick={() => setActiveTab("capacity")}
          >
            ⚡ Capacity Plans
          </button>
          <button
            className={`tab-btn ${activeTab === "forecast" ? "active" : ""}`}
            onClick={() => setActiveTab("forecast")}
          >
            📈 Forecasts
          </button>
          <button
            className={`tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
            onClick={() => setActiveTab("maintenance")}
          >
            🔧 Maintenance
          </button>
        </div>

        {planningMetrics && (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <section className="tab-content">
                <div className="overview-stats">
                  <div className="stat-box">
                    <div className="stat-value">
                      {planningMetrics.capacityPlans.length}
                    </div>
                    <div className="stat-label">Active Plans</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">
                      {planningMetrics.forecasts[0].accuracy}%
                    </div>
                    <div className="stat-label">Day-Ahead Accuracy</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">
                      {planningMetrics.maintenanceSchedule.length}
                    </div>
                    <div className="stat-label">Scheduled Tasks</div>
                  </div>
                </div>

                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn primary">➕ New Capacity Plan</button>
                  <button className="action-btn secondary">📊 Run Forecast</button>
                  <button className="action-btn secondary">📋 Schedule Maintenance</button>
                  <button className="action-btn secondary">📥 Export Report</button>
                </div>
              </section>
            )}

            {/* Capacity Plans Tab */}
            {activeTab === "capacity" && (
              <section className="tab-content">
                <h3>Capacity Planning</h3>
                <div className="plans-grid">
                  {planningMetrics.capacityPlans.map((plan) => (
                    <CapacityPlan key={plan.id} plan={plan} />
                  ))}
                </div>
              </section>
            )}

            {/* Forecasts Tab */}
            {activeTab === "forecast" && (
              <section className="tab-content">
                <h3>Demand Forecasts</h3>
                <div className="forecasts-grid">
                  {planningMetrics.forecasts.map((forecast, idx) => (
                    <ForecastCard key={idx} forecast={forecast} />
                  ))}
                </div>
              </section>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <section className="tab-content">
                <h3>Maintenance Schedule</h3>
                <div className="maintenance-list">
                  {planningMetrics.maintenanceSchedule.map((item) => (
                    <MaintenanceItem key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <style>{`
        .planner-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 30px;
        }

        .dashboard-header h2 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .dashboard-header p {
          color: #6b7280;
          font-size: 14px;
        }

        .tab-navigation {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .tab-btn {
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #6b7280;
        }

        .tab-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .tab-btn.active {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #3b82f6;
        }

        .tab-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .tab-content h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1f2937;
        }

        .overview-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .stat-box {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .action-btn {
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2563eb;
        }

        .action-btn.secondary {
          background: #f3f4f6;
          color: #1f2937;
          border: 1px solid #e5e7eb;
        }

        .action-btn.secondary:hover {
          background: #e5e7eb;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .plan-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .plan-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .plan-date {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .status-badge {
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge.in-progress {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-badge.planning {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.completed {
          background: #d1fae5;
          color: #065f46;
        }

        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .capacity-info {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .forecasts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .forecast-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .forecast-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px 0;
        }

        .accuracy-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .accuracy-value {
          font-size: 32px;
          font-weight: 700;
          color: #0369a1;
        }

        .accuracy-label {
          font-size: 12px;
          color: #0c4a6e;
          margin-top: 4px;
        }

        .last-update {
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }

        .maintenance-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .maintenance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .maintenance-info h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .maintenance-info p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .impact-badge {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .impact-low {
          background: #d1fae5;
          color: #065f46;
        }

        .impact-medium {
          background: #fef3c7;
          color: #92400e;
        }

        .impact-high {
          background: #fee2e2;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .tab-navigation {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}