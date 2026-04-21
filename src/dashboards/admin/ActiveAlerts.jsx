import { useState, useEffect } from "react";
import {
  fetchAllAlerts,
  acknowledgeAlert,
  closeAlert,
} from "../../api/gridAnalystApi";
import "./ActiveAlerts.css";

export default function ActiveAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("open"); // open, all
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAllAlerts();
      let alertsData = response.data || [];
      
      // Filter by status if not showing all
      if (filter === "open") {
        alertsData = alertsData.filter(a => a.status === "OPEN");
      } else if (filter === "acknowledged") {
        alertsData = alertsData.filter(a => a.status === "ACKNOWLEDGED");
      }
      // 'all' shows everything
      
      setAlerts(alertsData);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError(err.response?.data?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    setActionLoading(true);
    try {
      await acknowledgeAlert(alertId);
      loadAlerts();
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
      alert("Failed to acknowledge alert");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!selectedAlert || !resolveNotes.trim()) {
      alert("Resolution note is required");
      return;
    }
    setActionLoading(true);
    try {
      await closeAlert(selectedAlert.id, resolveNotes);
      setSelectedAlert(null);
      setResolveNotes("");
      loadAlerts();
    } catch (err) {
      console.error("Failed to close alert:", err);
      alert("Failed to close alert");
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "severity-critical";
      case "HIGH":
        return "severity-high";
      case "MEDIUM":
        return "severity-medium";
      case "LOW":
        return "severity-low";
      default:
        return "severity-low";
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "status-open";
      case "ACKNOWLEDGED":
        return "status-acknowledged";
      case "CLOSED":
        return "status-closed";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="alerts-container">
        <div className="alerts-loading">
          <div className="loading-spinner"></div>
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alerts-container">
        <div className="alerts-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={loadAlerts} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      {/* Header */}
      <div className="alerts-header">
        <div className="alerts-title">
          <h2>🚨 Active Alerts</h2>
          <span className="alerts-count">{alerts.length} alerts</span>
        </div>
        <div className="alerts-actions">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === "open" ? "active" : ""}`}
              onClick={() => setFilter("open")}
            >
              Open
            </button>
            <button
              className={`filter-tab ${filter === "acknowledged" ? "active" : ""}`}
              onClick={() => setFilter("acknowledged")}
            >
              Acknowledged
            </button>
            <button
              className={`filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
          </div>
          <button onClick={loadAlerts} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="no-alerts">
          <span className="no-alerts-icon">✅</span>
          <h3>No {filter === "open" ? "Open " : filter === "acknowledged" ? "Acknowledged " : ""}Alerts</h3>
          <p>
            {filter === "open"
              ? "All systems are operating normally."
              : filter === "acknowledged"
              ? "No acknowledged alerts pending resolution."
              : "No alerts have been recorded."}
          </p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-card ${getSeverityClass(alert.severity)}`}>
              <div className="alert-header">
                <div className="alert-info">
                  <span className={`alert-severity ${getSeverityClass(alert.severity)}`}>
                    {alert.severity || "UNKNOWN"}
                  </span>
                  <span className={`alert-status ${getStatusClass(alert.status)}`}>
                    {alert.status || "UNKNOWN"}
                  </span>
                </div>
                <span className="alert-time">{formatDate(alert.createdAt)}</span>
              </div>

              <div className="alert-body">
                <h4 className="alert-title">{alert.metricName || "Untitled Alert"}</h4>
                <p className="alert-message">{alert.message || "No description available"}</p>

                <div className="alert-meta">
                  {alert.zoneId && (
                    <span className="meta-item">
                      <strong>Zone ID:</strong> {alert.zoneId}
                    </span>
                  )}
                  {alert.assetId && (
                    <span className="meta-item">
                      <strong>Asset ID:</strong> {alert.assetId}
                    </span>
                  )}
                  <span className="meta-item">
                    <strong>Actual:</strong> {alert.actualValue} | <strong>Threshold:</strong> {alert.thresholdValue}
                  </span>
                </div>
              </div>

              <div className="alert-footer">
                {alert.status === "OPEN" && (
                  <button
                    className="action-btn acknowledge-btn"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={actionLoading}
                  >
                    ✓ Acknowledge
                  </button>
                )}
                {(alert.status === "OPEN" || alert.status === "ACKNOWLEDGED") && (
                  <button
                    className="action-btn resolve-btn"
                    onClick={() => setSelectedAlert(alert)}
                    disabled={actionLoading}
                  >
                    ✓ Close
                  </button>
                )}
                {alert.status === "CLOSED" && (
                  <span className="resolved-info">
                    Closed: {formatDate(alert.closedAt)}
                    {alert.resolutionNote && ` - ${alert.resolutionNote}`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Close Alert</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedAlert(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Alert:</strong> {selectedAlert.metricName}
              </p>
              <p className="alert-detail">
                {selectedAlert.message}
              </p>
              <label>
                Resolution Note: <span className="required">*</span>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Enter resolution note (required)..."
                  rows={4}
                  required
                />
              </label>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setSelectedAlert(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleClose}
                disabled={actionLoading || !resolveNotes.trim()}
              >
                {actionLoading ? "Closing..." : "Close Alert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
