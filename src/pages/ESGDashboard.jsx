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

  // ESG Data States
  const [carbonData, setCarbonData] = useState([]);
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState(null);
  const [complianceReports, setComplianceReports] = useState([]);
  const [dataLoaded, setDataLoaded] = useState({ carbon: false, metrics: false, compliance: false });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Mock data fallbacks
  const mockCarbonData = [
    { id: 1, region: "Bengaluru South", co2SavedTons: 450.2, treesEquivalent: 12500, period: "Q1 2026" },
    { id: 2, region: "Tamil Nadu Coastal", co2SavedTons: 890.5, treesEquivalent: 24000, period: "Q1 2026" },
    { id: 3, region: "Karnataka North", co2SavedTons: 320.8, treesEquivalent: 8900, period: "Q1 2026" },
    { id: 4, region: "Andhra Pradesh", co2SavedTons: 675.3, treesEquivalent: 18200, period: "Q1 2026" }
  ];

  const mockMetrics = {
    overallScore: 88.5,
    environmental: 92.0,
    social: 85.0,
    governance: 88.5,
    waterUsageReductionPct: 15.2,
    communityInvestment: "$250,000"
  };

  const mockComplianceReports = [
    { id: "REP-001", title: "Annual Sustainability Report 2025", status: "APPROVED", date: "2026-01-15" },
    { id: "REP-002", title: "Q1 Grid Emissions Audit", status: "PENDING_REVIEW", date: "2026-04-01" },
    { id: "REP-003", title: "Renewable Energy Certificates (REC) Log", status: "VERIFIED", date: "2026-03-28" },
    { id: "REP-004", title: "Carbon Credit Trading Records", status: "APPROVED", date: "2026-03-15" }
  ];

  // Fetch Carbon Offset Data
  const fetchCarbonData = useCallback(async () => {
    if (dataLoaded.carbon) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/v1/esg/carbon-offset");
      setCarbonData(response.data || mockCarbonData);
      setDataLoaded(prev => ({ ...prev, carbon: true }));
    } catch (error) {
      console.error("Error fetching carbon data:", error);
      setCarbonData(mockCarbonData);
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
      const response = await axiosInstance.get("/api/v1/esg/metrics");
      setSustainabilityMetrics(response.data || mockMetrics);
      setDataLoaded(prev => ({ ...prev, metrics: true }));
    } catch (error) {
      console.error("Error fetching ESG metrics:", error);
      setSustainabilityMetrics(mockMetrics);
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
      const response = await axiosInstance.get("/api/v1/esg/compliance");
      setComplianceReports(response.data || mockComplianceReports);
      setDataLoaded(prev => ({ ...prev, compliance: true }));
    } catch (error) {
      console.error("Error fetching ESG compliance reports:", error);
      setComplianceReports(mockComplianceReports);
      setDataLoaded(prev => ({ ...prev, compliance: true }));
    } finally {
      setLoading(false);
    }
  }, [dataLoaded.compliance]);

  // Fetch data based on active view
  useEffect(() => {
    // Skip if user doesn't have access
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

  // Calculate total carbon savings
  const totalCO2Saved = carbonData.reduce((sum, item) => sum + item.co2SavedTons, 0);
  const totalTrees = carbonData.reduce((sum, item) => sum + item.treesEquivalent, 0);

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

          {/* ================= CARBON OFFSET VIEW ================= */}
          {!loading && activeView === "carbon" && (
            <div>
              <h3>Carbon Offset Tracking</h3>
              
              {/* Summary KPIs */}
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
                  <span className="kpi-value">{carbonData.length}</span>
                  <span className="kpi-unit">Zones</span>
                </div>
              </div>

              <div className="table-container">
                {carbonData.length === 0 ? (
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
                      {carbonData.map((data) => (
                        <tr key={data.id}>
                          <td>{data.region}</td>
                          <td>{data.period}</td>
                          <td style={{color: '#10b981', fontWeight: 'bold'}}>{data.co2SavedTons} t</td>
                          <td>🌲 {data.treesEquivalent.toLocaleString()}</td>
                        </tr>
                      ))}
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

              {sustainabilityMetrics ? (
                <>
                  <div className="kpi-grid">
                    <div className="kpi-card highlight">
                      <h5>Overall ESG Score</h5>
                      <span className="kpi-value">{sustainabilityMetrics.overallScore}</span>
                      <span className="kpi-unit">/100</span>
                    </div>
                    <div className="kpi-card">
                      <h5>🌍 Environmental</h5>
                      <span className="kpi-value" style={{color: '#4ade80'}}>{sustainabilityMetrics.environmental}</span>
                    </div>
                    <div className="kpi-card">
                      <h5>👥 Social</h5>
                      <span className="kpi-value" style={{color: '#fbbf24'}}>{sustainabilityMetrics.social}</span>
                    </div>
                    <div className="kpi-card">
                      <h5>🏛️ Governance</h5>
                      <span className="kpi-value" style={{color: '#a78bfa'}}>{sustainabilityMetrics.governance}</span>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="metrics-additional" style={{ marginTop: '24px' }}>
                    <div className="kpi-grid">
                      <div className="kpi-card">
                        <h5>💧 Water Usage Reduction</h5>
                        <span className="kpi-value" style={{color: '#3b82f6'}}>{sustainabilityMetrics.waterUsageReductionPct}%</span>
                        <span className="kpi-unit">Year over Year</span>
                      </div>
                      <div className="kpi-card">
                        <h5>🤝 Community Investment</h5>
                        <span className="kpi-value" style={{color: '#8b5cf6'}}>{sustainabilityMetrics.communityInvestment}</span>
                        <span className="kpi-unit">FY 2025-26</span>
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
              
              {/* Compliance Summary */}
              <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <h5>Total Reports</h5>
                  <span className="kpi-value">{complianceReports.length}</span>
                </div>
                <div className="kpi-card">
                  <h5>Approved</h5>
                  <span className="kpi-value" style={{ color: '#22c55e' }}>
                    {complianceReports.filter(r => r.status === 'APPROVED').length}
                  </span>
                </div>
                <div className="kpi-card">
                  <h5>Pending Review</h5>
                  <span className="kpi-value" style={{ color: '#f59e0b' }}>
                    {complianceReports.filter(r => r.status === 'PENDING_REVIEW').length}
                  </span>
                </div>
              </div>

              <div className="table-container">
                {complianceReports.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Compliance Reports</h3>
                    <p>Compliance reports will appear here once submitted.</p>
                  </div>
                ) : (
                  <table className="esg-table">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>Title</th>
                        <th>Submission Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceReports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>{report.title}</td>
                          <td>{report.date}</td>
                          <td>
                            <span className={`status-badge ${
                              report.status === 'APPROVED' ? 'approved' : 
                              report.status === 'VERIFIED' ? 'verified' : 
                              report.status === 'PENDING_REVIEW' ? 'pending-review' : 'rejected'
                            }`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <button className="action-btn" title="View report details">
                              View
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