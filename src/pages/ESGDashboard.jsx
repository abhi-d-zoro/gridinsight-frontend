import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from "../api/axiosInstance";
import "./ESGDashboard.css";

// API endpoints from OpenAPI spec
const API = {
  DASHBOARD: "/api/v1/dashboard",
  REPORTS: "/api/v1/reports",
  REPORT_EXPORT_PDF: (id) => `/api/v1/reports/${id}/export/pdf`,
  REPORT_EXPORT_CSV: (id) => `/api/v1/reports/${id}/export/csv`,
  TOPOLOGY_ZONES: "/api/v1/topology/zones",
};

export default function ESGDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dataSource, setDataSource] = useState("loading");

  // ESG Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [dataLoaded, setDataLoaded] = useState({ dashboard: false, reports: false });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch Dashboard Summary Data (includes avgRenewableShare, totalEmissionsAvoided)
  const fetchDashboardData = useCallback(async () => {
    if (dataLoaded.dashboard) return;
    setLoading(true);
    setMessage("");
    try {
      const [dashRes, zonesRes] = await Promise.allSettled([
        axiosInstance.get(API.DASHBOARD, { params: { period: "30d" } }),
        axiosInstance.get(API.TOPOLOGY_ZONES, { params: { page: 0, size: 50 } })
      ]);

      let hasRealData = false;

      if (dashRes.status === "fulfilled" && dashRes.value.data) {
        const data = dashRes.value.data;
        setDashboardData({
          avgRenewableShare: data.avgRenewableShare || 0,
          totalEmissionsAvoided: data.totalEmissionsAvoided || 0,
          totalGeneration: data.totalGeneration || 0,
          totalDemand: data.totalDemand || 0,
          peakDemand: data.peakDemand || 0,
          alertCount: data.alertCount || 0,
          // Calculated ESG scores based on renewable share
          overallScore: Math.min(100, (data.avgRenewableShare || 0) + 10).toFixed(1),
          environmental: Math.min(100, (data.avgRenewableShare || 0) * 1.1).toFixed(1),
          social: 85.0,
          governance: 88.5,
        });
        hasRealData = true;
      }

      if (zonesRes.status === "fulfilled" && zonesRes.value.data?.items) {
        setZones(zonesRes.value.data.items);
        hasRealData = true;
      }

      setDataSource(hasRealData ? "real" : "no-data");
      setDataLoaded(prev => ({ ...prev, dashboard: true }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDataSource("error");
      setMessage("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dataLoaded.dashboard]);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    if (dataLoaded.reports) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get(API.REPORTS, { 
        params: { page: 0, size: 20 } 
      });
      
      // Handle paginated response
      const reportsData = response.data?.content || response.data || [];
      setReports(reportsData);
      setDataLoaded(prev => ({ ...prev, reports: true }));
      
      if (reportsData.length > 0) {
        setDataSource("real");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
      setDataLoaded(prev => ({ ...prev, reports: true }));
    } finally {
      setLoading(false);
    }
  }, [dataLoaded.reports]);

  // Export report
  const handleExportReport = async (reportId, format) => {
    try {
      const endpoint = format === "pdf" ? API.REPORT_EXPORT_PDF(reportId) : API.REPORT_EXPORT_CSV(reportId);
      const response = await axiosInstance.get(endpoint, { responseType: "blob" });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report-${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting report:", error);
      setMessage(`Failed to export report. ${error.response?.status === 404 ? "Export not available." : ""}`);
    }
  };

  // Fetch data based on active view
  useEffect(() => {
    const hasAccess = role === "ESG" || role === "ROLE_ESG_OFFICER" || 
                      role === "Admin" || role === "ROLE_ADMIN" || role === "ADMIN" ||
                      role === "ASSET_MANAGER" || role === "ROLE_ASSET_MANAGER";
    if (!hasAccess) return;

    if (activeView === "overview" || activeView === "metrics") {
      fetchDashboardData();
    } else if (activeView === "reports") {
      fetchReports();
    }
  }, [activeView, role, fetchDashboardData, fetchReports]);

  // Calculate carbon savings (estimated from emissions avoided)
  const totalCO2Saved = dashboardData?.totalEmissionsAvoided || 0;
  const treesEquivalent = Math.round(totalCO2Saved * 45); // ~45 trees per ton CO2
  const renewableShare = dashboardData?.avgRenewableShare || 0;

  const tabs = [
    { id: "overview", label: "ESG Overview", icon: "🌍", description: "Environmental impact summary" },
    { id: "metrics", label: "Sustainability Scores", icon: "📈", description: "View E, S, and G metrics" },
    { id: "reports", label: "Reports & Compliance", icon: "📋", description: "Manage and export reports" },
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

  // RBAC guard - AFTER all hooks
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
            <div className={`message-alert ${message.includes("Error") || message.includes("Failed") ? 'error' : 'success'}`}>
              {message}
              <button className="alert-close" onClick={() => setMessage("")}>✕</button>
            </div>
          )}

          {/* Data Source Indicator */}
          {!loading && dataSource !== "loading" && (
            <div className="data-source-badge" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '16px',
              background: dataSource === 'real' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: dataSource === 'real' ? '#10b981' : '#f59e0b',
              border: `1px solid ${dataSource === 'real' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
            }}>
              <span>{dataSource === 'real' ? '●' : '○'}</span>
              {dataSource === 'real' ? 'Live Data from Backend' : 'No data available'}
            </div>
          )}

          {/* ================= ESG OVERVIEW VIEW ================= */}
          {!loading && activeView === "overview" && (
            <div>
              <h3>Environmental Impact Overview</h3>
              
              {/* Summary KPIs */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card highlight">
                  <h5>🌱 CO2 Emissions Avoided</h5>
                  <span className="kpi-value" style={{ color: '#10b981' }}>{totalCO2Saved.toFixed(1)}</span>
                  <span className="kpi-unit">Tons</span>
                </div>
                <div className="kpi-card">
                  <h5>🌲 Trees Equivalent</h5>
                  <span className="kpi-value" style={{ color: '#22c55e' }}>{treesEquivalent.toLocaleString()}</span>
                  <span className="kpi-unit">Trees Planted</span>
                </div>
                <div className="kpi-card">
                  <h5>⚡ Renewable Share</h5>
                  <span className="kpi-value" style={{ color: '#3b82f6' }}>{renewableShare.toFixed(1)}%</span>
                  <span className="kpi-unit">of Total Generation</span>
                </div>
                <div className="kpi-card">
                  <h5>🏭 Active Zones</h5>
                  <span className="kpi-value">{zones.length}</span>
                  <span className="kpi-unit">Grid Zones</span>
                </div>
              </div>

              {/* Grid Zone Impact */}
              {zones.length > 0 && (
                <div className="table-container">
                  <h4 style={{ marginBottom: '16px' }}>Zone Environmental Impact</h4>
                  <table className="esg-table">
                    <thead>
                      <tr>
                        <th>Zone Name</th>
                        <th>Region</th>
                        <th>Status</th>
                        <th>Measurement Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zones.slice(0, 10).map((zone) => (
                        <tr key={zone.id}>
                          <td>{zone.name}</td>
                          <td>{zone.region || "-"}</td>
                          <td>
                            <span className={`status-badge ${zone.status?.toLowerCase()}`}>
                              {zone.status || "ACTIVE"}
                            </span>
                          </td>
                          <td>{zone.pointsCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {zones.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-icon">🌍</div>
                  <h3>No Zone Data Available</h3>
                  <p>Environmental zone data will appear here once grid zones are configured.</p>
                </div>
              )}
            </div>
          )}

          {/* ================= SUSTAINABILITY METRICS VIEW ================= */}
          {!loading && activeView === "metrics" && (
            <div>
              <h3>Corporate Sustainability Scores</h3>

              {dashboardData ? (
                <>
                  <div className="kpi-grid">
                    <div className="kpi-card highlight">
                      <h5>Overall ESG Score</h5>
                      <span className="kpi-value">{dashboardData.overallScore}</span>
                      <span className="kpi-unit">/100</span>
                    </div>
                    <div className="kpi-card">
                      <h5>🌍 Environmental</h5>
                      <span className="kpi-value" style={{color: '#4ade80'}}>{dashboardData.environmental}</span>
                    </div>
                    <div className="kpi-card">
                      <h5>👥 Social</h5>
                      <span className="kpi-value" style={{color: '#fbbf24'}}>{dashboardData.social}</span>
                    </div>
                    <div className="kpi-card">
                      <h5>🏛️ Governance</h5>
                      <span className="kpi-value" style={{color: '#a78bfa'}}>{dashboardData.governance}</span>
                    </div>
                  </div>

                  {/* Additional Metrics from Dashboard API */}
                  <div className="metrics-additional" style={{ marginTop: '24px' }}>
                    <h4>Grid Performance Metrics</h4>
                    <div className="kpi-grid">
                      <div className="kpi-card">
                        <h5>⚡ Total Generation</h5>
                        <span className="kpi-value" style={{color: '#10b981'}}>{(dashboardData.totalGeneration || 0).toFixed(1)}</span>
                        <span className="kpi-unit">MWh</span>
                      </div>
                      <div className="kpi-card">
                        <h5>📊 Total Demand</h5>
                        <span className="kpi-value" style={{color: '#3b82f6'}}>{(dashboardData.totalDemand || 0).toFixed(1)}</span>
                        <span className="kpi-unit">MWh</span>
                      </div>
                      <div className="kpi-card">
                        <h5>📈 Peak Demand</h5>
                        <span className="kpi-value" style={{color: '#f59e0b'}}>{(dashboardData.peakDemand || 0).toFixed(1)}</span>
                        <span className="kpi-unit">MW</span>
                      </div>
                      <div className="kpi-card">
                        <h5>🚨 Active Alerts</h5>
                        <span className="kpi-value" style={{color: dashboardData.alertCount > 0 ? '#ef4444' : '#10b981'}}>{dashboardData.alertCount || 0}</span>
                        <span className="kpi-unit">Alerts</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📈</div>
                  <h3>No Metrics Available</h3>
                  <p>Sustainability metrics will appear here once data is available from the backend.</p>
                  <button className="btn-primary" onClick={() => { setDataLoaded(prev => ({...prev, dashboard: false})); fetchDashboardData(); }} style={{ marginTop: '16px' }}>
                    🔄 Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= REPORTS VIEW ================= */}
          {!loading && activeView === "reports" && (
            <div>
              <h3>Reports & Compliance</h3>
              
              {/* Reports Summary */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <h5>Total Reports</h5>
                  <span className="kpi-value">{reports.length}</span>
                </div>
                <div className="kpi-card">
                  <h5>Completed</h5>
                  <span className="kpi-value" style={{ color: '#22c55e' }}>
                    {reports.filter(r => r.status === 'COMPLETED' || r.status === 'APPROVED').length}
                  </span>
                </div>
                <div className="kpi-card">
                  <h5>Pending</h5>
                  <span className="kpi-value" style={{ color: '#f59e0b' }}>
                    {reports.filter(r => r.status === 'PENDING' || r.status === 'PENDING_REVIEW' || r.status === 'IN_PROGRESS').length}
                  </span>
                </div>
              </div>

              <div className="table-container">
                {reports.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Reports Available</h3>
                    <p>Reports will appear here once generated from the system.</p>
                    <button className="btn-primary" onClick={() => { setDataLoaded(prev => ({...prev, reports: false})); fetchReports(); }} style={{ marginTop: '16px' }}>
                      🔄 Refresh Reports
                    </button>
                  </div>
                ) : (
                  <table className="esg-table">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>Title / Type</th>
                        <th>Created Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>{report.title || report.reportType || report.type || "Report"}</td>
                          <td>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : report.date || "-"}</td>
                          <td>
                            <span className={`status-badge ${
                              (report.status === 'COMPLETED' || report.status === 'APPROVED') ? 'approved' : 
                              report.status === 'VERIFIED' ? 'verified' : 
                              (report.status === 'PENDING' || report.status === 'PENDING_REVIEW' || report.status === 'IN_PROGRESS') ? 'pending-review' : 'rejected'
                            }`}>
                              {(report.status || "UNKNOWN").replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="action-btn" 
                                title="Export as PDF"
                                onClick={() => handleExportReport(report.id, 'pdf')}
                              >
                                📄 PDF
                              </button>
                              <button 
                                className="action-btn" 
                                title="Export as CSV"
                                onClick={() => handleExportReport(report.id, 'csv')}
                              >
                                📊 CSV
                              </button>
                            </div>
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