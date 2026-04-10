import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from "../api/axiosInstance";
import "./AssetManagerDashboard.css";

export default function AssetManagerDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  // Core State
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("ASSETS");
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Maintenance Form State
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    note: "",
    startDate: "",
    endDate: ""
  });

  // Generation Trends State (Using dd-mm-yyyy HH:mm)
  const [trendForm, setTrendForm] = useState({
    assetId: "",
    start: "",
    end: ""
  });
  const [trendData, setTrendData] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Mock assets data for fallback
  const mockAssets = [
    { id: 1, identifier: "SOL-BLR-001", type: "SOLAR", location: "Bengaluru", capacity: 50, status: "ACTIVE" },
    { id: 2, identifier: "WND-TN-002", type: "WIND", location: "Tamil Nadu", capacity: 75, status: "ACTIVE" },
    { id: 3, identifier: "SOL-KA-003", type: "SOLAR", location: "Karnataka", capacity: 100, status: "MAINTENANCE" },
    { id: 4, identifier: "WND-AP-004", type: "WIND", location: "Andhra Pradesh", capacity: 60, status: "ACTIVE" }
  ];

  // 1. Fetch Assets (Used to populate tables and health monitor)
  const fetchAssets = useCallback(async () => {
    if (assetsLoaded) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/v1/assets");
      const assetData = response.data.content || response.data || mockAssets;
      setAssets(assetData.length > 0 ? assetData : mockAssets);
      setAssetsLoaded(true);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets(mockAssets);
      setAssetsLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [assetsLoaded]);

  // Fetch assets on initial load
  useEffect(() => {
    if (role !== "ASSET_MANAGER" && role !== "ADMIN") return;
    fetchAssets();
  }, [role, fetchAssets]);

  // 2. Submit Maintenance Request
  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      setMessage("Please select an asset first.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.put(`/api/v1/assets/${selectedAssetId}/maintenance`, maintenanceForm);
      setMessage(`Asset ${selectedAssetId} successfully flagged for maintenance!`);
      setSelectedAssetId(null);
      setMaintenanceForm({ note: "", startDate: "", endDate: "" });
      setAssetsLoaded(false); // Trigger re-fetch
    } catch (error) {
      setMessage("Failed to schedule maintenance. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  //patil
  // 2.5 Resolve Maintenance
  const handleResolveMaintenance = async (id) => {
    setLoading(true);
    setMessage("");
    try {
      await axiosInstance.put(`/api/v1/assets/${id}/resolve`);
      setMessage(`Asset ${id} maintenance resolved. System is Operational!`);
      setAssetsLoaded(false); // Trigger re-fetch so it vanishes from the warning list instantly
    } catch (error) {
      console.error("Resolve Error:", error);
      setMessage("Failed to resolve maintenance.");
    } finally {
      setLoading(false);
    }
  };
  //patil

  // 3. Fetch Generation Trends (Handles dd-mm-yyyy conversion)
  const fetchTrends = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setTrendData(null);

    try {
      // Helper: Converts "dd-mm-yyyy HH:mm" -> "yyyy-mm-ddTHH:mm:ss"
      const convertToIso = (dateStr) => {
        if (!dateStr.includes("-") || !dateStr.includes(" ")) {
          throw new Error("Invalid format");
        }
        const [datePart, timePart] = dateStr.trim().split(" ");
        const [day, month, year] = datePart.split("-");
        return `${year}-${month}-${day}T${timePart}:00`;
      };

      const params = new URLSearchParams({
        assetId: trendForm.assetId,
        start: convertToIso(trendForm.start),
        end: convertToIso(trendForm.end)
      });

      const response = await axiosInstance.get(`/api/v1/generation/trends?${params.toString()}`);
      setTrendData(response.data);
      setMessage("Generation trends successfully loaded!");
    } catch (error) {
      console.error("Trend Fetch Error:", error);
      // Show mock trend data on error
      setTrendData({
        points: [
          { timestamp: "2026-04-05 06:00", value: 25.5 },
          { timestamp: "2026-04-05 09:00", value: 45.2 },
          { timestamp: "2026-04-05 12:00", value: 68.8 },
          { timestamp: "2026-04-05 15:00", value: 52.3 },
          { timestamp: "2026-04-05 18:00", value: 28.1 }
        ],
        totalGeneration: 219.9,
        avgGeneration: 43.98
      });
      setMessage("Showing sample trend data. Backend unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "ASSETS", label: "Manage Assets", icon: "🏭", description: "View and update renewable assets" },
    { id: "TRENDS", label: "Generation Trends", icon: "📈", description: "Analyze energy output history" },
    { id: "HEALTH", label: "Asset Health", icon: "❤️", description: "Monitor downtime and alerts" },
    { id: "MAINTENANCE", label: "Schedule Maintenance", icon: "🔧", description: "Flag assets for inspection" },
  ];

  const sidebar = {
    navItems: tabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      description: tab.description,
      active: activeTab === tab.id,
      onClick: () => setActiveTab(tab.id)
    }))
  };

  // RBAC guard - AFTER all hooks
  if (role !== "ASSET_MANAGER" && role !== "ADMIN") {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Asset Manager Dashboard"
      onLogout={handleLogout}
      layout="sidebar"
      sidebar={sidebar}
    >
      <div className="asset-manager-content">
        {message && (
          <div className={`message-alert ${message.includes("Error") || message.includes("Failed") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        {/* ================= MANAGE ASSETS VIEW ================= */}
        {activeTab === "ASSETS" && (
          <div className="content-section">
            <div className="section-header">
              <h3>Asset Directory</h3>
              <p>View and manage all renewable assets in the system</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Identifier</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Capacity (MW)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length > 0 ? (
                    assets.map((asset) => (
                      <tr key={asset.id}>
                        <td>{asset.id}</td>
                        <td>{asset.identifier}</td>
                        <td>{asset.type}</td>
                        <td>{asset.location}</td>
                        <td>{asset.capacity}</td>
                        <td>
                          <span className={`status-badge status-${asset.status.toLowerCase().replace(/_/g, '-')}`}>
                            {asset.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">No assets found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= GENERATION TRENDS VIEW ================= */}
        {activeTab === "TRENDS" && (
          <div className="content-section">
            <div className="section-header">
              <h3>Generation Trends Analytics</h3>
              <p>Query and analyze historical energy output data</p>
            </div>

            <form onSubmit={fetchTrends} className="trend-form">
              <div className="form-group">
                <label>Select Asset</label>
                <select
                  required
                  value={trendForm.assetId}
                  onChange={(e) => setTrendForm({ ...trendForm, assetId: e.target.value })}
                >
                  <option value="">-- Choose an asset --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.identifier} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Start Date & Time (dd-mm-yyyy HH:mm)</label>
                <input
                  type="text"
                  placeholder="05-04-2026 00:00"
                  required
                  value={trendForm.start}
                  onChange={(e) => setTrendForm({ ...trendForm, start: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>End Date & Time (dd-mm-yyyy HH:mm)</label>
                <input
                  type="text"
                  placeholder="05-04-2026 23:59"
                  required
                  value={trendForm.end}
                  onChange={(e) => setTrendForm({ ...trendForm, end: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Fetch Data
              </button>
            </form>

            {trendData && trendData.points && (
              <div className="results-container">
                <h4>Analytical Results</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Energy (MWh)</th>
                      <th>Availability (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.points.map((p, index) => (
                      <tr key={index}>
                        <td>{p.timestamp.replace("T", " ")}</td>
                        <td className="value-energy">{p.energy}</td>
                        <td>{p.availability}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trendData.points.length === 0 && (
                  <p className="no-data">No data points found for this selection.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= ASSET HEALTH VIEW ================= */}
        {activeTab === "HEALTH" && (
          <div className="content-section">
            <div className="section-header">
              <h3>Asset Health Monitor</h3>
              <p>Track assets with sub-optimal performance or non-operational status</p>
            </div>

            {assets.filter((a) => a.status !== "OPERATIONAL").length === 0 ? (
              <div className="all-operational">
                <div className="operational-icon">✅</div>
                <h4>All Systems Operational</h4>
                <p>No assets are currently reporting downtime or critical health alerts.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Identifier</th>
                      <th>Type</th>
                      <th>Current Status</th>
                      <th>Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets
                      .filter((a) => a.status !== "OPERATIONAL")
                      .map((asset) => (
                        <tr key={asset.id}>
                          <td>{asset.id}</td>
                          <td>{asset.identifier}</td>
                          <td>{asset.type}</td>
                          <td>
                            <span className="status-badge status-error">
                              {asset.status}
                            </span>
                          </td>
                          <td>
                            {/* patil */}
                            {asset.status === "UNDER_MAINTENANCE" ? (
                              <button
                                className="btn btn-sm btn-success"
                                style={{ background: "#10b981", color: "white", borderColor: "#10b981", fontWeight: "bold" }}
                                onClick={() => handleResolveMaintenance(asset.id)}
                              >
                                ✔ Mark Resolved
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  setActiveTab("MAINTENANCE");
                                  setSelectedAssetId(asset.id);
                                }}
                              >
                                Schedule Repair
                              </button>
                            )}
                            {/* patil */}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= MAINTENANCE SCHEDULING VIEW ================= */}
        {activeTab === "MAINTENANCE" && (
          <div className="content-section">
            <div className="section-header">
              <h3>Maintenance Scheduling</h3>
              <p>Flag assets for preventive or corrective maintenance</p>
            </div>

            {selectedAssetId ? (
              <form onSubmit={handleScheduleMaintenance} className="maintenance-form">
                <p className="selected-asset-label">Flagging Asset ID: <strong>{selectedAssetId}</strong></p>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.startDate}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, startDate: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.endDate}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, endDate: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Maintenance Note</label>
                  <textarea
                    required
                    value={maintenanceForm.note}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, note: e.target.value })
                    }
                    placeholder="Describe the maintenance work..."
                    rows="4"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Confirm Maintenance
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedAssetId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Identifier</th>
                      <th>Type</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.length > 0 ? (
                      assets.map((a) => (
                        <tr key={a.id}>
                          <td>{a.id}</td>
                          <td>{a.identifier}</td>
                          <td>{a.type}</td>
                          <td>
                            <span className={`status-badge status-${a.status.toLowerCase().replace(/_/g, '-')}`}>
                              {a.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => setSelectedAssetId(a.id)}
                            >
                              Flag Maintenance
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          No assets available. Load assets first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}