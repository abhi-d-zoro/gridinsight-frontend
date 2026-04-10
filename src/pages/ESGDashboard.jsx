import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from "../api/axiosInstance";
import "./ESGDashboard.css";

export default function ESGDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("carbon");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Dynamic ESG Data States mapping to backend DTOs
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [metricsList, setMetricsList] = useState([]);
  const [complianceReports, setComplianceReports] = useState([]);
  const [dataLoaded, setDataLoaded] = useState({ carbon: false, metrics: false, compliance: false });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch Carbon Data / Dashboard Summary
  const fetchCarbonData = useCallback(async () => {
    if (dataLoaded.carbon) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/v1/dashboard");
      setDashboardSummary(response.data);
      setDataLoaded(prev => ({ ...prev, carbon: true }));
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      setMessage("Failed to load carbon offset data from database.");
      setDataLoaded(prev => ({ ...prev, carbon: true }));
    } finally {
      setLoading(false);
    }
  }, [dataLoaded.carbon]);

  // Fetch Sustainability Metrics
  const fetchMetrics = useCallback(async () => {
    if (dataLoaded.metrics) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/v1/metrics");
      setMetricsList(response.data || []);
      setDataLoaded(prev => ({ ...prev, metrics: true }));
    } catch (error) {
      console.error("Error fetching ESG metrics:", error);
      setMessage("Failed to load sustainability metrics from database.");
      setDataLoaded(prev => ({ ...prev, metrics: true }));
    } finally {
      setLoading(false);
    }
  }, [dataLoaded.metrics]);

  // Fetch Compliance Reports
  const fetchCompliance = useCallback(async () => {
    if (dataLoaded.compliance) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/v1/reports");
      setComplianceReports(response.data || []);
      setDataLoaded(prev => ({ ...prev, compliance: true }));
    } catch (error) {
      console.error("Error fetching ESG compliance reports:", error);
      setMessage("Failed to load compliance reports from database.");
      setDataLoaded(prev => ({ ...prev, compliance: true }));
    } finally {
      setLoading(false);
    }
  }, [dataLoaded.compliance]);

  // Fetch data based on active view
  useEffect(() => {
    const hasAccess = role === "ESG" || role === "ROLE_ESG_OFFICER" || 
                      role === "Admin" || role === "ROLE_ADMIN" || role === "ADMIN" ||
                      role === "ASSET_MANAGER" || role === "ROLE_ASSET_MANAGER";
    if (!hasAccess) return;

    if (activeView === "carbon") {
      fetchCarbonData();
    } else if (activeView === "metrics") {
      fetchMetrics();
    } else if (activeView === "compliance") {
      fetchCompliance();
    }
  }, [activeView, role, fetchCarbonData, fetchMetrics, fetchCompliance]);

  // Dynamic calculations derived from backend data
  const totalCO2Saved = dashboardSummary?.totalEmissionsAvoided || 0;
  // Approximating tree equivalency for UI continuity (approx 27.7 trees per ton of CO2)
  const totalTrees = Math.round(totalCO2Saved * 27.7); 
  const drillDownData = dashboardSummary?.drillDownMetrics || [];
  const latestMetric = metricsList.length > 0 ? metricsList[metricsList.length - 1] : null;

  const tabs = [
    { id: "carbon", label: "Carbon Offsets", icon: "🌱", description: "Track CO2 emissions reduced" },
    { id: "metrics", label: "Sustainability Scores", icon: "📈", description: "View E, S, and G metrics" },
    { id: "compliance", label: "Regulatory Compliance", icon: "📋", description: "Manage audits and reports" },
  ];

  const sidebar = {
    navItems: tabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      description: tab.description,
      active: activeView === tab.id,
      onClick: () => setActiveView(tab.id)
    }))
  };

  // RBAC guard
  if (
    role !== "ESG" &&
    role !== "ROLE_ESG_OFFICER" &&
    role !== "Admin" &&
    role !== "ROLE_ADMIN" &&
    role !== "ADMIN" &&
    role !== "ASSET_MANAGER" &&
    role !== "ROLE_ASSET_MANAGER"
  ) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="ESG Operations Dashboard"
      onLogout={handleLogout}
      layout="sidebar"
      sidebar={sidebar}
    >
      <div className="esg-content">
        <div className="esg-content-area">
          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading ESG data...</p>
            </div>
          )}

          {/* Message Alert */}
          {message && (
            <div className={`message-alert ${message.includes("Failed") ? 'error' : 'success'}`}>
              {message}
              <button className="alert-close" onClick={() => setMessage("")}>✕</button>
            </div>
          )}

          {/* ================= CARBON OFFSET VIEW ================= */}
          {!loading && activeView === "carbon" && (
            <div>
              <h3>Carbon Offset Tracking</h3>
              
              {/* Summary KPIs mapped to DashboardSummary DTO but keeping original theme */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <h5>Total CO2 Saved</h5>
                  <span className="kpi-value" style={{ color: '#10b981' }}>{totalCO2Saved.toFixed(1)}</span>
                  <span className="kpi-unit">Tons</span>
                </div>
                <div className="kpi-card">
                  <h5>Trees Equivalent</h5>
                  <span className="kpi-value" style={{ color: '#22c55e' }}>{totalTrees.toLocaleString()}</span>
                  <span className="kpi-unit">🌲 Trees</span>
                </div>
                <div className="kpi-card">
                  <h5>Active Regions</h5>
                  {/* Defaulting to System Wide since backend DTO doesn't track individual regions */}
                  <span className="kpi-value">System Wide</span> 
                  <span className="kpi-unit">Zones</span>
                </div>
              </div>

              <div className="table-container">
                {drillDownData.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🌱</div>
                    <h3>No Carbon Data</h3>
                    <p>Carbon offset data will appear here once available.</p>
                  </div>
                ) : (
                  <table className="esg-table">
                    <thead>
                      <tr>
                        <th>Region</th>
                        <th>Period</th>
                        <th>CO2 Saved (Tons)</th>
                        <th>Trees Equivalent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drillDownData.map((data) => {
                        // Calculate trees dynamically per row (approx 27.7 trees per ton of CO2)
                        const rowTrees = Math.round((data.emissionsAvoidedTons || 0) * 27.7); 
                        
                        return (
                          <tr key={data.metricId}>
                            <td>System Wide</td> {/* Placeholder for missing region data */}
                            <td>{data.period}</td>
                            <td style={{color: '#10b981', fontWeight: 'bold'}}>{data.emissionsAvoidedTons?.toFixed(1) || 0} t</td>
                            <td>🌲 {rowTrees.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= SUSTAINABILITY METRICS VIEW ================= */}
          {!loading && activeView === "metrics" && (
            <div>
              <h3>Corporate Sustainability Scores</h3>

              {metricsList.length > 0 || dashboardSummary ? (
                <>
                  <div className="kpi-grid">
                    <div className="kpi-card highlight">
                      <h5>Avg Renewable Share</h5>
                      <span className="kpi-value">{dashboardSummary?.avgRenewableShare?.toFixed(1) || 0}</span>
                      <span className="kpi-unit">%</span>
                    </div>
                    <div className="kpi-card">
                      <h5>🌍 Total CO2 Avoided</h5>
                      <span className="kpi-value" style={{color: '#4ade80'}}>{dashboardSummary?.totalEmissionsAvoided?.toFixed(1) || 0}</span>
                      <span className="kpi-unit">Tons</span>
                    </div>
                    <div className="kpi-card">
                      <h5>👥 Tracked Periods</h5>
                      <span className="kpi-value" style={{color: '#fbbf24'}}>{metricsList.length}</span>
                      <span className="kpi-unit">Quarters</span> {/* Updated to Quarters */}
                    </div>
                    <div className="kpi-card">
                      <h5>🏛️ Latest Renewable %</h5>
                      <span className="kpi-value" style={{color: '#a78bfa'}}>{latestMetric?.renewableSharePct?.toFixed(1) || 0}</span>
                      <span className="kpi-unit">%</span>
                    </div>
                  </div>

                  {/* Additional Metrics replacing mock data with real tracked figures */}
                  <div className="metrics-additional" style={{ marginTop: '24px' }}>
                    <div className="kpi-grid">
                      <div className="kpi-card">
                        <h5>💧 Latest Period Tracked</h5>
                        <span className="kpi-value" style={{color: '#3b82f6'}}>{latestMetric?.period || "N/A"}</span>
                      </div>
                      <div className="kpi-card">
                        <h5>🤝 Last Calculation Date</h5>
                        <span className="kpi-value" style={{color: '#8b5cf6', fontSize: '1.5rem'}}>{latestMetric?.generatedDate || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📈</div>
                  <h3>No Metrics Available</h3>
                  <p>Sustainability metrics will appear here once calculated.</p>
                </div>
              )}
            </div>
          )}

          {/* ================= COMPLIANCE VIEW ================= */}
          {!loading && activeView === "compliance" && (
            <div>
              <h3>Regulatory Compliance Reports</h3>
              
              {/* Compliance Summary mapped to ESGReportDTO list */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <h5>Total Reports</h5>
                  <span className="kpi-value">{complianceReports.length}</span>
                </div>
                <div className="kpi-card">
                  <h5>Published</h5>
                  <span className="kpi-value" style={{ color: '#22c55e' }}>
                    {complianceReports.filter(r => r.status?.toUpperCase() === 'PUBLISHED').length}
                  </span>
                </div>
                <div className="kpi-card">
                  <h5>Drafts / Pending</h5>
                  <span className="kpi-value" style={{ color: '#f59e0b' }}>
                    {complianceReports.filter(r => r.status?.toUpperCase() === 'DRAFT' || r.status?.toUpperCase() === 'PENDING').length}
                  </span>
                </div>
              </div>

              <div className="table-container">
                {complianceReports.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Compliance Reports</h3>
                    <p>Compliance reports will appear here once generated.</p>
                  </div>
                ) : (
                  <table className="esg-table">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>Standard</th>
                        <th>Period</th>
                        <th>Generated Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceReports.map((report) => (
                        <tr key={report.reportId}>
                          <td>#{report.reportId}</td>
                          <td>{report.reportingStandard}</td>
                          <td>{report.period}</td>
                          <td>{report.generatedDate}</td>
                          <td>
                            <span className={`status-badge ${
                              report.status?.toUpperCase() === 'PUBLISHED' ? 'approved' : 'pending-review'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="action-btn" 
                              title="Export CSV"
                              onClick={() => window.open(`/api/v1/reports/${report.reportId}/export/csv`, '_blank')}
                            >
                              Export
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
        </div>
      </div>
    </DashboardLayout>
  );
}