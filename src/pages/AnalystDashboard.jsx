import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from "../api/axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalystDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [gridMetrics, setGridMetrics] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ RBAC guard
  if (role !== "ANALYST") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError("");
    try {
      // Mock data since backend might not have these endpoints
      const mockMetrics = {
        gridFrequency: 49.98,
        voltageStability: 98.5,
        powerFactor: 0.96,
        renewablePercentage: 42.3,
        gridLosses: 3.2,
        demandForecastAccuracy: 94.8,
      };

      const mockPerformance = {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
        datasets: [
          {
            label: "Load Demand (MW)",
            data: [2500, 2300, 3100, 4200, 3800, 3200, 2800],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
          },
          {
            label: "Renewable Supply (MW)",
            data: [800, 600, 1200, 1800, 1600, 900, 500],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
          },
        ],
      };

      setGridMetrics(mockMetrics);
      setPerformanceData(mockPerformance);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const MetricCard = ({ label, value, unit, icon, status }) => (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">
        {typeof value === "number" ? value.toFixed(2) : value}
        <span className="metric-unit">{unit}</span>
      </div>
      <div className={`metric-status ${status}`}>
        {status === "good" && "✓ Optimal"}
        {status === "warning" && "⚠ Check"}
        {status === "critical" && "✗ Alert"}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Analyst Dashboard"
      onLogout={handleLogout}
      layout="simple"
    >
      <div className="analyst-dashboard">
        <div className="dashboard-header">
          <h2>GridInsight Analytics</h2>
          <p>Real-time grid performance analysis and insights</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Section */}
            <section className="metrics-section">
              <h3>Key Grid Metrics</h3>
              <div className="metrics-grid">
                <MetricCard
                  label="Grid Frequency"
                  value={gridMetrics?.gridFrequency}
                  unit="Hz"
                  icon="⚡"
                  status={gridMetrics?.gridFrequency > 49.95 ? "good" : "warning"}
                />
                <MetricCard
                  label="Voltage Stability"
                  value={gridMetrics?.voltageStability}
                  unit="%"
                  icon="📈"
                  status={gridMetrics?.voltageStability > 95 ? "good" : "warning"}
                />
                <MetricCard
                  label="Power Factor"
                  value={gridMetrics?.powerFactor}
                  unit=""
                  icon="⚙️"
                  status={gridMetrics?.powerFactor > 0.95 ? "good" : "warning"}
                />
                <MetricCard
                  label="Renewable %"
                  value={gridMetrics?.renewablePercentage}
                  unit="%"
                  icon="🌱"
                  status="good"
                />
                <MetricCard
                  label="Grid Losses"
                  value={gridMetrics?.gridLosses}
                  unit="%"
                  icon="📉"
                  status={gridMetrics?.gridLosses < 5 ? "good" : "warning"}
                />
                <MetricCard
                  label="Forecast Accuracy"
                  value={gridMetrics?.demandForecastAccuracy}
                  unit="%"
                  icon="🎯"
                  status={gridMetrics?.demandForecastAccuracy > 90 ? "good" : "warning"}
                />
              </div>
            </section>

            {/* Performance Chart */}
            <section className="chart-section">
              <h3>Load & Renewable Supply Trends</h3>
              <div className="chart-container">
                {performanceData && (
                  <Line
                    data={performanceData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        title: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: "Power (MW)" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </section>

            {/* Report Section */}
            <section className="report-section">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn primary">
                  📊 Generate Report
                </button>
                <button className="action-btn secondary">
                  📥 Export Data
                </button>
                <button className="action-btn secondary">
                  🔍 Anomaly Detection
                </button>
                <button className="action-btn secondary">
                  ⚙️ Configure Alerts
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      <style>{`
        .analyst-dashboard {
          padding: 20px;
          max-width: 1400px;
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

        .error-banner {
          background: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          border-left: 4px solid #c33;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 20px;
        }

        .spinner {
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .metrics-section {
          margin-bottom: 40px;
        }

        .metrics-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .metric-icon {
          font-size: 20px;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .metric-unit {
          font-size: 14px;
          color: #9ca3af;
          margin-left: 4px;
        }

        .metric-status {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .metric-status.good {
          background: #d1fae5;
          color: #065f46;
        }

        .metric-status.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .metric-status.critical {
          background: #fee2e2;
          color: #991b1b;
        }

        .chart-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 40px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .chart-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .chart-container {
          height: 300px;
          position: relative;
        }

        .report-section {
          margin-bottom: 20px;
        }

        .report-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
