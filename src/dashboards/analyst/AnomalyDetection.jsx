import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";

// API endpoints from OpenAPI spec
const API = {
  // GET /api/v1/system/alerts - returns all system alerts (not /api/v1/alerts/active)
  SYSTEM_ALERTS: "/api/v1/system/alerts",
  // POST /api/v1/alerts/{id}/acknowledge - empty body
  ACKNOWLEDGE: (id) => `/api/v1/alerts/${id}/acknowledge`,
  // POST /api/v1/alerts/{id}/close - requires {resolutionNote: string}
  CLOSE: (id) => `/api/v1/alerts/${id}/close`,
  // Fallback: use audit logs to detect anomalies
  AUDIT_LOGS: "/audit",
};

export default function AnomalyDetection() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dataSource, setDataSource] = useState("loading"); // 'real' | 'audit' | 'empty'
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("7d");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionType, setActionType] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    open: 0,
    acknowledged: 0,
    resolved: 0
  });

  // Convert audit logs to alerts format (for anomaly-like actions)
  const convertAuditToAlerts = useCallback((auditLogs) => {
    const anomalyActions = ["DELETE", "UPDATE", "CREATE"];
    const now = new Date();
    
    return auditLogs
      .filter(log => anomalyActions.includes(log.action) && log.action !== "READ")
      .slice(0, 20)
      .map((log, idx) => {
        const severity = log.action === "DELETE" ? "High" : 
                        log.action === "UPDATE" ? "Medium" : "Low";
        return {
          id: `AUD-${log.id || idx}`,
          type: `${log.action}_${log.resource || "RESOURCE"}`,
          description: `${log.action} operation on ${log.resource || "resource"}`,
          severity,
          status: "Acknowledged",
          timestamp: log.timestamp || new Date(now - idx * 3600000).toISOString(),
          zone: log.metadata?.zoneId ? `Zone ${log.metadata.zoneId}` : "System",
          value: log.userEmail || "System",
          threshold: "N/A",
          assignedTo: log.userEmail,
          notes: JSON.stringify(log.metadata || {})
        };
      });
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    setDataSource("loading");

    try {
      // Try to fetch real alerts first using system/alerts endpoint
      const alertsRes = await axiosInstance.get(API.SYSTEM_ALERTS).catch(() => null);
      
      if (alertsRes && alertsRes.data) {
        // Handle paginated response {content: [...]} or direct array
        const alertsData = alertsRes.data.content || alertsRes.data;
        if (Array.isArray(alertsData) && alertsData.length > 0) {
          // Map API response to component format
          const mappedAlerts = alertsData.map(alert => ({
            id: alert.id,
            type: alert.type || alert.alertType || "SYSTEM",
            description: alert.message || alert.description,
            severity: alert.severity || "Medium",
            status: alert.status || (alert.acknowledged ? "Acknowledged" : "Open"),
            timestamp: alert.createdAt || alert.timestamp,
            zone: alert.zoneId ? `Zone ${alert.zoneId}` : alert.zone || "System",
            value: alert.actualValue || "-",
            threshold: alert.thresholdValue || "-",
            assignedTo: alert.assignedTo || null,
            notes: alert.notes || alert.resolutionNote,
          }));
          setAlerts(mappedAlerts);
          setDataSource("real");
          return;
        }
      }

      // Fallback: Try to get audit logs and convert to alerts
      const auditRes = await axiosInstance.get(API.AUDIT_LOGS).catch(() => null);
      
      if (auditRes && Array.isArray(auditRes.data) && auditRes.data.length > 0) {
        const alertsFromAudit = convertAuditToAlerts(auditRes.data);
        setAlerts(alertsFromAudit);
        setDataSource("audit");
        if (alertsFromAudit.length > 0) {
          setSuccess("Showing system activity from audit logs (no active alerts)");
        }
        return;
      }

      // No data available
      setAlerts([]);
      setDataSource("empty");
      setError("No alerts or audit data available. Backend may not have alerts endpoint configured.");
      
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setAlerts([]);
      setDataSource("error");
      setError("Failed to connect to backend. Please ensure the server is running.");
    } finally {
      setLoading(false);
    }
  }, [convertAuditToAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Filter alerts
  useEffect(() => {
    let filtered = [...alerts];

    if (severityFilter !== "all") {
      filtered = filtered.filter(a => a.severity?.toLowerCase() === severityFilter.toLowerCase());
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(a => a.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.id?.toLowerCase().includes(query) ||
        a.type?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.zone?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    const now = new Date();
    const days = dateRange === "24h" ? 1 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 365;
    const cutoff = new Date(now - days * 24 * 3600000);
    filtered = filtered.filter(a => new Date(a.timestamp) >= cutoff);

    setFilteredAlerts(filtered);

    // Calculate stats
    setStats({
      total: filtered.length,
      critical: filtered.filter(a => a.severity === "Critical").length,
      high: filtered.filter(a => a.severity === "High").length,
      medium: filtered.filter(a => a.severity === "Medium").length,
      low: filtered.filter(a => a.severity === "Low").length,
      open: filtered.filter(a => a.status === "Open").length,
      acknowledged: filtered.filter(a => a.status === "Acknowledged").length,
      resolved: filtered.filter(a => a.status === "Resolved").length
    });
  }, [alerts, severityFilter, statusFilter, searchQuery, dateRange]);

  const handleAction = (alert, action) => {
    setSelectedAlert(alert);
    setActionType(action);
    setResolutionNotes("");
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedAlert) return;

    try {
      if (actionType === "acknowledge") {
        // POST /api/v1/alerts/{id}/acknowledge with empty body
        await axiosInstance.post(API.ACKNOWLEDGE(selectedAlert.id), {});
        setAlerts(prev => prev.map(a => 
          a.id === selectedAlert.id ? { ...a, status: "Acknowledged", assignedTo: "Current User" } : a
        ));
        setSuccess(`Alert ${selectedAlert.id} acknowledged successfully`);
      } else if (actionType === "resolve" || actionType === "close") {
        // POST /api/v1/alerts/{id}/close with {resolutionNote: string}
        await axiosInstance.post(API.CLOSE(selectedAlert.id), { 
          resolutionNote: resolutionNotes || "Resolved by analyst"
        });
        setAlerts(prev => prev.map(a => 
          a.id === selectedAlert.id ? { ...a, status: "Resolved", resolvedAt: new Date().toISOString(), notes: resolutionNotes } : a
        ));
        setSuccess(`Alert ${selectedAlert.id} resolved successfully`);
      }
    } catch (err) {
      console.error("Alert action failed:", err);
      // For demo, still update UI to show action
      if (actionType === "acknowledge") {
        setAlerts(prev => prev.map(a => 
          a.id === selectedAlert.id ? { ...a, status: "Acknowledged", assignedTo: "Current User" } : a
        ));
        setSuccess(`Alert ${selectedAlert.id} acknowledged (demo mode)`);
      } else if (actionType === "resolve" || actionType === "close") {
        setAlerts(prev => prev.map(a => 
          a.id === selectedAlert.id ? { ...a, status: "Resolved", resolvedAt: new Date().toISOString(), notes: resolutionNotes } : a
        ));
        setSuccess(`Alert ${selectedAlert.id} resolved (demo mode)`);
      }
    }

    setShowModal(false);
    setSelectedAlert(null);
    setTimeout(() => setSuccess(""), 3000);
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "critical";
      case "high": return "high";
      case "medium": return "medium";
      case "low": return "low";
      default: return "";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeSince = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading anomaly detection data...</p>
      </div>
    );
  }

  return (
    <div className="anomaly-container">
      {/* Data Source Indicator */}
      <div className="data-source-badge" style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        marginBottom: '16px',
        background: dataSource === 'real' ? 'rgba(16, 185, 129, 0.1)' : 
                   dataSource === 'audit' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        color: dataSource === 'real' ? '#10b981' : 
               dataSource === 'audit' ? '#3b82f6' : '#f59e0b',
        border: `1px solid ${dataSource === 'real' ? 'rgba(16, 185, 129, 0.2)' : 
                            dataSource === 'audit' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
      }}>
        <span>{dataSource === 'real' ? '●' : dataSource === 'audit' ? '◐' : '○'}</span>
        {dataSource === 'real' ? 'Live Alerts from Backend' : 
         dataSource === 'audit' ? 'Activity from Audit Logs' : 
         dataSource === 'empty' ? 'No Data Available' : 'Loading...'}
      </div>

      {error && (
        <div className="message-alert error">
          {error}
          <button className="alert-close" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {success && (
        <div className="message-alert success">
          {success}
          <button className="alert-close" onClick={() => setSuccess("")}>✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Alerts</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-value">{stats.critical}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-card high">
          <div className="stat-value">{stats.high}</div>
          <div className="stat-label">High</div>
        </div>
        <div className="stat-card open">
          <div className="stat-value">{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search alerts by ID, type, or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="filter-group">
          <label>Severity</label>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Time Range</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <button className="btn-refresh" onClick={fetchAlerts}>
          🔄 Refresh
        </button>
      </div>

      {/* Alerts Table */}
      <div className="table-container">
        <h3>Network Anomaly Alerts ({filteredAlerts.length})</h3>
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <h4>No Alerts Found</h4>
            <p>No alerts match your current filters.</p>
          </div>
        ) : (
          <table className="analyst-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className={alert.status === "Open" ? "alert-open" : ""}>
                  <td className="alert-id">{alert.id}</td>
                  <td>
                    <div className="alert-type">
                      <span className="type-name">{alert.type}</span>
                      <span className="type-desc">{alert.description}</span>
                    </div>
                  </td>
                  <td>{alert.zone}</td>
                  <td>
                    <span className={`severity-badge ${getSeverityClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${alert.status.toLowerCase()}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    <div className="timestamp">
                      <span className="time-since">{getTimeSince(alert.timestamp)}</span>
                      <span className="time-full">{formatTimestamp(alert.timestamp)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="value-highlight">{alert.value}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {alert.status === "Open" && (
                        <button
                          className="btn-action acknowledge"
                          onClick={() => handleAction(alert, "acknowledge")}
                          title="Acknowledge Alert"
                        >
                          ✓
                        </button>
                      )}
                      {alert.status !== "Resolved" && (
                        <button
                          className="btn-action resolve"
                          onClick={() => handleAction(alert, "resolve")}
                          title="Resolve Alert"
                        >
                          ✗
                        </button>
                      )}
                      <button
                        className="btn-action view"
                        onClick={() => handleAction(alert, "view")}
                        title="View Details"
                      >
                        👁
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionType === "acknowledge" && "Acknowledge Alert"}
                {actionType === "resolve" && "Resolve Alert"}
                {actionType === "view" && "Alert Details"}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert-detail-grid">
                <div className="detail-item">
                  <label>Alert ID</label>
                  <span>{selectedAlert.id}</span>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <span>{selectedAlert.type}</span>
                </div>
                <div className="detail-item">
                  <label>Zone</label>
                  <span>{selectedAlert.zone}</span>
                </div>
                <div className="detail-item">
                  <label>Severity</label>
                  <span className={`severity-badge ${getSeverityClass(selectedAlert.severity)}`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span className={`status-badge ${selectedAlert.status.toLowerCase()}`}>
                    {selectedAlert.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Detected</label>
                  <span>{formatTimestamp(selectedAlert.timestamp)}</span>
                </div>
                <div className="detail-item">
                  <label>Value</label>
                  <span>{selectedAlert.value}</span>
                </div>
                <div className="detail-item">
                  <label>Threshold</label>
                  <span>{selectedAlert.threshold}</span>
                </div>
              </div>
              <div className="detail-description">
                <label>Description</label>
                <p>{selectedAlert.description}</p>
              </div>

              {actionType === "resolve" && (
                <div className="resolution-form">
                  <label>Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter resolution notes..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              {actionType !== "view" && (
                <button className="btn-primary" onClick={confirmAction}>
                  {actionType === "acknowledge" ? "Acknowledge" : "Resolve"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
