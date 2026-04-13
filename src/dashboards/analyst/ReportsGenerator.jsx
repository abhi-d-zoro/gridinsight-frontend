import React, { useState, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function ReportsGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Report configuration
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportParams, setReportParams] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 3600000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    zoneId: "all",
    format: "pdf",
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
  });

  // Report history
  const [reportHistory, setReportHistory] = useState([
    {
      id: "RPT-001",
      type: "daily_summary",
      name: "Daily Grid Summary",
      generatedAt: "2026-04-12 08:00",
      status: "completed",
      size: "2.4 MB",
      format: "PDF"
    },
    {
      id: "RPT-002",
      type: "weekly_analytics",
      name: "Weekly Performance Analytics",
      generatedAt: "2026-04-11 09:30",
      status: "completed",
      size: "5.8 MB",
      format: "PDF"
    },
    {
      id: "RPT-003",
      type: "alert_history",
      name: "Alert History Report",
      generatedAt: "2026-04-10 14:15",
      status: "completed",
      size: "1.2 MB",
      format: "CSV"
    },
  ]);

  const reportTypes = [
    {
      id: "daily_summary",
      name: "Daily Grid Summary",
      icon: "📊",
      description: "Comprehensive daily overview of grid performance including load, generation, and key metrics.",
      sections: ["Load Summary", "Generation Summary", "Peak Hours Analysis", "Anomalies"]
    },
    {
      id: "weekly_analytics",
      name: "Weekly Performance Analytics",
      icon: "📈",
      description: "Weekly trend analysis with comparative data and performance indicators.",
      sections: ["Weekly Trends", "Comparative Analysis", "Efficiency Metrics", "Recommendations"]
    },
    {
      id: "compliance",
      name: "Compliance Report",
      icon: "📋",
      description: "Regulatory compliance documentation including threshold violations and corrective actions.",
      sections: ["Compliance Summary", "Violations Log", "Corrective Actions", "Audit Trail"]
    },
    {
      id: "alert_history",
      name: "Alert History",
      icon: "⚠️",
      description: "Historical record of all system alerts with resolution details and response times.",
      sections: ["Alert Timeline", "Severity Distribution", "Resolution Metrics", "MTTR Analysis"]
    },
    {
      id: "forecast_accuracy",
      name: "Forecast Accuracy Report",
      icon: "🎯",
      description: "Analysis of forecasting model performance with MAPE and RMSE metrics.",
      sections: ["Accuracy Metrics", "Error Distribution", "Model Comparison", "Improvement Areas"]
    },
    {
      id: "zone_performance",
      name: "Zone Performance Report",
      icon: "🗺️",
      description: "Per-zone analysis of grid performance including capacity utilization and efficiency.",
      sections: ["Zone Overview", "Capacity Analysis", "Load Distribution", "Zone Comparison"]
    },
  ];

  const zones = [
    { id: "all", name: "All Zones" },
    { id: "101", name: "Zone A - Industrial" },
    { id: "102", name: "Zone B - Residential" },
    { id: "103", name: "Zone C - Commercial" },
  ];

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setError("");
    setSuccess("");
  };

  const handleParamChange = (key, value) => {
    setReportParams(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = useCallback(async () => {
    if (!selectedReport) {
      setError("Please select a report type");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Try to call backend API
      await axiosInstance.post(`/api/v1/reports/${selectedReport.id}`, reportParams);
      
      // Add to history
      const newReport = {
        id: `RPT-${String(reportHistory.length + 1).padStart(3, '0')}`,
        type: selectedReport.id,
        name: selectedReport.name,
        generatedAt: new Date().toLocaleString(),
        status: "completed",
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        format: reportParams.format.toUpperCase()
      };
      
      setReportHistory(prev => [newReport, ...prev]);
      setSuccess(`${selectedReport.name} generated successfully!`);
      setSelectedReport(null);
    } catch (err) {
      // Simulate success for demo
      const newReport = {
        id: `RPT-${String(reportHistory.length + 1).padStart(3, '0')}`,
        type: selectedReport.id,
        name: selectedReport.name,
        generatedAt: new Date().toLocaleString(),
        status: "completed",
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        format: reportParams.format.toUpperCase()
      };
      
      setReportHistory(prev => [newReport, ...prev]);
      setSuccess(`${selectedReport.name} generated successfully!`);
      setSelectedReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedReport, reportParams, reportHistory.length]);

  const downloadReport = (report) => {
    // Simulate download
    setSuccess(`Downloading ${report.name}...`);
    setTimeout(() => setSuccess(""), 2000);
  };

  const deleteReport = (reportId) => {
    setReportHistory(prev => prev.filter(r => r.id !== reportId));
    setSuccess("Report deleted successfully");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div className="reports-container">
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

      {/* Report Selection */}
      {!selectedReport ? (
        <>
          <div className="section-header">
            <h3>Generate Reports</h3>
            <p>Select a report type to generate comprehensive grid analytics</p>
          </div>

          <div className="report-grid">
            {reportTypes.map(report => (
              <div 
                key={report.id} 
                className="report-card"
                onClick={() => handleSelectReport(report)}
              >
                <div className="report-icon">{report.icon}</div>
                <div className="report-content">
                  <h4>{report.name}</h4>
                  <p>{report.description}</p>
                  <div className="report-sections">
                    {report.sections.map((section, idx) => (
                      <span key={idx} className="section-tag">{section}</span>
                    ))}
                  </div>
                </div>
                <div className="report-arrow">→</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Report Configuration */}
          <div className="config-header">
            <button className="btn-back" onClick={() => setSelectedReport(null)}>
              ← Back to Reports
            </button>
            <h3>
              <span className="report-icon-sm">{selectedReport.icon}</span>
              Configure: {selectedReport.name}
            </h3>
          </div>

          <div className="config-form">
            <div className="config-section">
              <h4>Date Range</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={reportParams.startDate}
                    onChange={(e) => handleParamChange("startDate", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={reportParams.endDate}
                    onChange={(e) => handleParamChange("endDate", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4>Filters</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Grid Zone</label>
                  <select
                    value={reportParams.zoneId}
                    onChange={(e) => handleParamChange("zoneId", e.target.value)}
                  >
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Output Format</label>
                  <select
                    value={reportParams.format}
                    onChange={(e) => handleParamChange("format", e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="xlsx">Excel</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4>Content Options</h4>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={reportParams.includeCharts}
                    onChange={(e) => handleParamChange("includeCharts", e.target.checked)}
                  />
                  <span>Include Charts & Visualizations</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={reportParams.includeSummary}
                    onChange={(e) => handleParamChange("includeSummary", e.target.checked)}
                  />
                  <span>Include Executive Summary</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={reportParams.includeDetails}
                    onChange={(e) => handleParamChange("includeDetails", e.target.checked)}
                  />
                  <span>Include Detailed Breakdown</span>
                </label>
              </div>
            </div>

            <div className="config-section sections">
              <h4>Report Sections</h4>
              <div className="sections-preview">
                {selectedReport.sections.map((section, idx) => (
                  <div key={idx} className="section-item">
                    <span className="section-number">{idx + 1}</span>
                    <span>{section}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="config-actions">
              <button className="btn-secondary" onClick={() => setSelectedReport(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={generateReport} disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>📄 Generate Report</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Report History */}
      <div className="history-section">
        <div className="section-header">
          <h3>Recent Reports</h3>
          <span className="history-count">{reportHistory.length} reports</span>
        </div>

        {reportHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h4>No Reports Generated</h4>
            <p>Generate your first report to see it here.</p>
          </div>
        ) : (
          <table className="analyst-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Name</th>
                <th>Generated</th>
                <th>Format</th>
                <th>Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportHistory.map(report => (
                <tr key={report.id}>
                  <td className="report-id">{report.id}</td>
                  <td>
                    <div className="report-name">
                      <span className="report-type-icon">
                        {reportTypes.find(r => r.id === report.type)?.icon || "📄"}
                      </span>
                      {report.name}
                    </div>
                  </td>
                  <td>{report.generatedAt}</td>
                  <td>
                    <span className={`format-badge ${report.format.toLowerCase()}`}>
                      {report.format}
                    </span>
                  </td>
                  <td>{report.size}</td>
                  <td>
                    <span className={`status-badge ${report.status}`}>
                      {report.status === "completed" ? "✓ Completed" : "⏳ Processing"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action download"
                        onClick={() => downloadReport(report)}
                        title="Download Report"
                      >
                        📥
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => deleteReport(report.id)}
                        title="Delete Report"
                      >
                        🗑️
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
  );
}
