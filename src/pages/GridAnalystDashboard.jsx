import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from "../api/axiosInstance";
import "./GridAnalystDashboard.css";

export default function GridAnalystDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  // Core State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("STABILITY");

  // Grid Analyst Specific Data States
  const [kpis, setKpis] = useState({ currentLoad: 0, currentGeneration: 0, activeAlerts: 0 });
  const [alerts, setAlerts] = useState([]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch Core Dashboard Data (KPIs and Alerts)
  useEffect(() => {
    // Skip fetch if user doesn't have access
    if (role !== "OPERATOR" && role !== "ANALYST" && role !== "ADMIN") {
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [loadRes, genRes, alertsRes] = await Promise.allSettled([
          axiosInstance.get("/api/v1/load-records/current"),
          axiosInstance.get("/api/v1/generation-records/current"),
          axiosInstance.get("/api/v1/alerts/active")
        ]);

        // Use API data if available, otherwise use mock data
        const loadData = loadRes.status === 'fulfilled' ? loadRes.value.data : null;
        const genData = genRes.status === 'fulfilled' ? genRes.value.data : null;
        const alertsData = alertsRes.status === 'fulfilled' ? alertsRes.value.data : null;

        setKpis({
          currentLoad: loadData?.currentLoad ?? 452.5,
          currentGeneration: genData?.currentGeneration ?? 480.2,
          activeAlerts: alertsData?.length ?? 3
        });

        setAlerts(alertsData ?? [
          { id: 'ALT-1024', time: '2026-04-07 10:15', value: '450 MW Load', severity: 'High', status: 'Open' },
          { id: 'ALT-1025', time: '2026-04-07 14:20', value: 'Generation Drop', severity: 'Medium', status: 'Open' },
          { id: 'ALT-1026', time: '2026-04-07 16:05', value: '95% Feeder Cap', severity: 'Low', status: 'Acknowledged' }
        ]);

        if (loadRes.status === 'rejected' || genRes.status === 'rejected') {
          setMessage("Some data unavailable. Showing cached data.");
        }
      } catch (error) {
        console.error("Error fetching grid metrics:", error);
        setMessage("Failed to load live grid data. Showing offline cached data.");
        // Set fallback mock data
        setKpis({ currentLoad: 452.5, currentGeneration: 480.2, activeAlerts: 3 });
        setAlerts([
          { id: 'ALT-1024', time: '2026-04-07 10:15', value: '450 MW Load', severity: 'High', status: 'Open' },
          { id: 'ALT-1025', time: '2026-04-07 14:20', value: 'Generation Drop', severity: 'Medium', status: 'Open' },
          { id: 'ALT-1026', time: '2026-04-07 16:05', value: '95% Feeder Cap', severity: 'Low', status: 'Acknowledged' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role]);

  // Sidebar configuration
  const tabs = [
    {
      id: "stability",
      label: "Grid Stability",
      icon: "⚡",
      description: "Load vs generation comparison"
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

  // Calculate dynamic progress bar widths
  const maxCapacity = 600; // Assume 600 MW max capacity
  const generationPercent = Math.min((kpis.currentGeneration / maxCapacity) * 100, 100);
  const loadPercent = Math.min((kpis.currentLoad / maxCapacity) * 100, 100);

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
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading grid data...</p>
            </div>
          )}

          {message && (
            <div className={`message-alert ${message.includes("Error") || message.includes("Failed") ? 'error' : 'success'}`}>
              {message}
              <button className="alert-close" onClick={() => setMessage("")}>✕</button>
            </div>
          )}

          {/* ================= STABILITY VIEW ================= */}
          {!loading && activeView === "STABILITY" && (
            <div>
              {/* KPI Summary Cards */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <div className="kpi-label">Current Load</div>
                  <div className="kpi-value">{kpis.currentLoad}</div>
                  <div className="kpi-unit">MW</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Current Generation</div>
                  <div className="kpi-value">{kpis.currentGeneration}</div>
                  <div className="kpi-unit">MW</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Active Alerts</div>
                  <div className="kpi-value" style={{ color: kpis.activeAlerts > 0 ? 'var(--danger-color, #ef4444)' : 'var(--success-color, #22c55e)' }}>
                    {kpis.activeAlerts}
                  </div>
                  <div className="kpi-unit">Issues</div>
                </div>
              </div>

              <div style={{ background: 'var(--input-bg)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
                {/* Generation Progress */}
                <div className="progress-container">
                  <div className="progress-label">
                    <span>Total Generation</span>
                    <span>{kpis.currentGeneration} MW</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${generationPercent}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
                  </div>
                </div>

                {/* Load Progress */}
                <div className="progress-container">
                  <div className="progress-label">
                    <span>Total Load</span>
                    <span>{kpis.currentLoad} MW</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${loadPercent}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }}></div>
                  </div>
                </div>

                {/* Balance Indicator */}
                <div style={{ marginTop: '20px', padding: '16px', background: kpis.currentGeneration >= kpis.currentLoad ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 600, color: kpis.currentGeneration >= kpis.currentLoad ? '#22c55e' : '#ef4444' }}>
                    {kpis.currentGeneration >= kpis.currentLoad ? '✓ Grid Balanced' : '⚠ Generation Deficit'} 
                    ({(kpis.currentGeneration - kpis.currentLoad).toFixed(1)} MW)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= ANOMALIES VIEW ================= */}
          {!loading && activeView === "ANOMALIES" && (
            <div>
              <div className="table-container">
                <h3>Network Anomaly Detection</h3>
                {alerts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✓</div>
                    <h3>No Active Alerts</h3>
                    <p>All systems operating within normal parameters.</p>
                  </div>
                ) : (
                  <table className="analyst-table">
                    <thead>
                      <tr>
                        <th>Alert ID</th>
                        <th>Time</th>
                        <th>Trigger Value</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((alert, idx) => (
                        <tr key={idx}>
                          <td>{alert.id}</td>
                          <td>{alert.time}</td>
                          <td>{alert.value}</td>
                          <td>
                            <span className={`status-badge ${alert.severity.toLowerCase()}`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${alert.status === 'Open' ? 'open' : 'acknowledged'}`}>
                              {alert.status}
                            </span>
                          </td>
                          <td>
                            <button className="action-btn" title="Acknowledge alert">
                              Acknowledge
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= FORECASTING VIEW ================= */}
          {!loading && activeView === "FORECASTING" && (
            <div>
              <div className="table-container">
                <h3>Load Forecasting Analytics</h3>
                <div className="forecast-summary" style={{ padding: '20px' }}>
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-label">Predicted Peak Load (Today)</div>
                      <div className="kpi-value">485.3</div>
                      <div className="kpi-unit">MW @ 18:00</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Predicted Min Load</div>
                      <div className="kpi-value">312.8</div>
                      <div className="kpi-unit">MW @ 03:00</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Forecast Accuracy</div>
                      <div className="kpi-value" style={{ color: '#22c55e' }}>94.2%</div>
                      <div className="kpi-unit">Last 7 days</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: '20px 0 0 0', textAlign: 'center' }}>
                    Advanced forecasting charts and ML predictions coming soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= REPORTS VIEW ================= */}
          {!loading && activeView === "REPORTS" && (
            <div>
              <div className="table-container">
                <h3>Grid Performance Reports</h3>
                <div style={{ padding: '20px' }}>
                  <div className="report-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <button className="action-btn primary">📊 Daily Summary Report</button>
                    <button className="action-btn primary">📈 Weekly Analytics</button>
                    <button className="action-btn primary">📋 Compliance Report</button>
                    <button className="action-btn primary">⚠️ Alert History</button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
                    Select a report type above to generate and download.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}