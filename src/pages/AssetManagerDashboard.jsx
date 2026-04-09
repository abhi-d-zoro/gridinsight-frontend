import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { AuthContext } from "../auth/AuthContext";
import axiosInstance from "../api/axiosInstance";

export default function AssetManagerDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  // Core State
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("DASHBOARD"); 

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

  // 1. Fetch Assets (Used to populate tables and health monitor)
  const fetchAssets = async (viewName) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/v1/assets");
      const assetData = response.data.content || response.data || [];
      setAssets(assetData);
      setActiveView(viewName);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setMessage("Failed to load assets from backend.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Maintenance Request
  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.put(`/api/v1/assets/${selectedAssetId}/maintenance`, maintenanceForm);
      setMessage(`Asset ${selectedAssetId} successfully flagged for maintenance!`);
      setSelectedAssetId(null);
      fetchAssets("MAINTENANCE"); 
    } catch (error) {
      setMessage("Failed to schedule maintenance. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

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
      setMessage("Format Error! Use dd-mm-yyyy HH:mm (e.g. 05-04-2026 10:00)");
    } finally {
      setLoading(false);
    }
  };

  if (role !== "ASSET_MANAGER") {
    return <div style={{ padding: "24px", color: "white", background: "#0f172a", minHeight: "100vh" }}><h2>Access Denied</h2></div>;
  }

  return (
    <div style={pageContainerStyle}>
      <Header title="GridInsight – Asset Manager Dashboard" onLogout={handleLogout} />

      <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
        <h3 style={{ color: "white", fontSize: "24px", margin: "0 0 8px 0" }}>Welcome, Asset Manager</h3>
        <p style={{ color: "#9ca3af", margin: "0 0 24px 0" }}>Monitor renewable asset performance and scheduling.</p>

        {message && (
          <div style={message.includes("Error") || message.includes("Failed") ? errorAlertStyle : successAlertStyle}>
            {message}
          </div>
        )}

        {/* ================= DASHBOARD GRID VIEW ================= */}
        {activeView === "DASHBOARD" && (
          <div style={gridStyle}>
            <div style={{ ...cardStyle, borderLeft: "4px solid #22c55e" }} onClick={() => fetchAssets("ASSETS")}>
              <h4 style={cardTitleStyle}>Manage Assets</h4>
              <p style={cardDescStyle}>View and update renewable assets</p>
            </div>
            
            <div style={{ ...cardStyle, borderLeft: "4px solid #3b82f6" }} onClick={() => fetchAssets("TRENDS")}>
              <h4 style={{ ...cardTitleStyle, color: "#60a5fa" }}>Generation Trends</h4>
              <p style={cardDescStyle}>Analyze energy output history</p>
            </div>

            <div style={{ ...cardStyle, borderLeft: "4px solid #ef4444" }} onClick={() => fetchAssets("HEALTH")}>
              <h4 style={{ ...cardTitleStyle, color: "#f87171" }}>Asset Health</h4>
              <p style={cardDescStyle}>Monitor downtime and alerts</p>
            </div>

            <div style={{ ...cardStyle, borderLeft: "4px solid #f59e0b" }} onClick={() => fetchAssets("MAINTENANCE")}>
              <h4 style={{ ...cardTitleStyle, color: "#fbbf24" }}>Schedule Maintenance</h4>
              <p style={cardDescStyle}>Flag assets for inspection</p>
            </div>
          </div>
        )}

        {/* ================= GENERATION TRENDS VIEW ================= */}
        {activeView === "TRENDS" && (
          <div style={panelContainerStyle}>
            <button style={backButtonStyle} onClick={() => { setActiveView("DASHBOARD"); setTrendData(null); }}>← Back to Dashboard</button>
            <h4 style={{ color: "#60a5fa", marginBottom: "16px" }}>Generation Trends Analytics</h4>
            
            <form onSubmit={fetchTrends} style={trendFormRowStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Select Asset</label>
                <select required style={inputStyle} value={trendForm.assetId} onChange={(e) => setTrendForm({...trendForm, assetId: e.target.value})}>
                  <option value="">-- Choose --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.identifier} ({a.type})</option>
                  ))}
                </select>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Start (dd-mm-yyyy HH:mm)</label>
                <input type="text" placeholder="05-04-2026 00:00" required style={inputStyle} value={trendForm.start} onChange={(e) => setTrendForm({...trendForm, start: e.target.value})} />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>End (dd-mm-yyyy HH:mm)</label>
                <input type="text" placeholder="05-04-2026 23:59" required style={inputStyle} value={trendForm.end} onChange={(e) => setTrendForm({...trendForm, end: e.target.value})} />
              </div>

              <button type="submit" style={{ ...submitButtonStyle, background: "#3b82f6", color: "white", alignSelf: "flex-end", height: "40px" }}>Fetch Data</button>
            </form>

            {trendData && trendData.points && (
              <div style={{ marginTop: "24px" }}>
                <h5 style={{ color: "white", marginBottom: "12px" }}>Analytical Results:</h5>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Timestamp</th>
                      <th style={thStyle}>Energy (MWh)</th>
                      <th style={thStyle}>Availability (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.points.map((p, index) => (
                      <tr key={index}>
                        <td style={tdStyle}>{p.timestamp.replace('T', ' ')}</td>
                        <td style={{...tdStyle, color: '#4ade80', fontWeight: 'bold'}}>{p.energy}</td>
                        <td style={tdStyle}>{p.availability}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trendData.points.length === 0 && (
                  <p style={{ color: "#9ca3af", padding: "20px", textAlign: "center" }}>No data points found for this selection.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= MANAGE ASSETS VIEW ================= */}
        {activeView === "ASSETS" && (
           <div style={panelContainerStyle}>
             <button style={backButtonStyle} onClick={() => setActiveView("DASHBOARD")}>← Back to Dashboard</button>
             <h4 style={{ color: "white", marginBottom: "16px" }}>Asset Directory</h4>
             <table style={tableStyle}>
               <thead>
                 <tr><th style={thStyle}>ID</th><th style={thStyle}>Type</th><th style={thStyle}>Location</th><th style={thStyle}>Capacity (MW)</th><th style={thStyle}>Status</th></tr>
               </thead>
               <tbody>
                 {assets.map((asset) => (
                   <tr key={asset.id}>
                     <td style={tdStyle}>{asset.id}</td><td style={tdStyle}>{asset.type}</td><td style={tdStyle}>{asset.location}</td><td style={tdStyle}>{asset.capacity}</td>
                     <td style={tdStyle}><span style={statusBadgeStyle(asset.status)}>{asset.status}</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {/* ================= MAINTENANCE VIEW ================= */}
        {activeView === "MAINTENANCE" && (
          <div style={panelContainerStyle}>
            <button style={backButtonStyle} onClick={() => setActiveView("DASHBOARD")}>← Back to Dashboard</button>
            <h4 style={{ color: "white", marginBottom: "16px" }}>Maintenance Scheduling</h4>
            {selectedAssetId ? (
              <form onSubmit={handleScheduleMaintenance} style={formStyle}>
                <p style={{ color: "#fbbf24" }}>Flagging Asset ID: {selectedAssetId}</p>
                <label style={labelStyle}>Start Date</label><input type="date" required style={inputStyle} value={maintenanceForm.startDate} onChange={(e) => setMaintenanceForm({...maintenanceForm, startDate: e.target.value})} />
                <label style={labelStyle}>End Date</label><input type="date" required style={inputStyle} value={maintenanceForm.endDate} onChange={(e) => setMaintenanceForm({...maintenanceForm, endDate: e.target.value})} />
                <label style={labelStyle}>Note</label><textarea required style={{...inputStyle, height: "60px"}} value={maintenanceForm.note} onChange={(e) => setMaintenanceForm({...maintenanceForm, note: e.target.value})} />
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button type="submit" style={submitButtonStyle}>Confirm</button>
                  <button type="button" style={cancelButtonStyle} onClick={() => setSelectedAssetId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>ID</th><th style={thStyle}>Identifier</th><th style={thStyle}>Status</th><th style={thStyle}>Action</th></tr></thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}><td style={tdStyle}>{a.id}</td><td style={tdStyle}>{a.identifier}</td><td style={tdStyle}>{a.status}</td>
                      <td style={tdStyle}><button style={maintenanceButtonStyle} onClick={() => setSelectedAssetId(a.id)}>Flag Maintenance</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ================= ASSET HEALTH VIEW ================= */}
        {activeView === "HEALTH" && (
          <div style={panelContainerStyle}>
            <button style={backButtonStyle} onClick={() => setActiveView("DASHBOARD")}>← Back to Dashboard</button>
            <h4 style={{ color: "#f87171", marginBottom: "8px", fontSize: "20px" }}>Asset Health Monitor</h4>
            <p style={{ color: "#9ca3af", marginBottom: "24px" }}>Tracking assets with sub-optimal performance or non-operational status.</p>

            {assets.filter(a => a.status !== 'OPERATIONAL').length === 0 ? (
              <div style={{ padding: "30px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", borderRadius: "8px", textAlign: "center" }}>
                <h3 style={{ color: "#4ade80", margin: "0 0 12px 0", fontSize: "24px" }}>✅ All Systems Operational</h3>
                <p style={{ color: "#a7f3d0", margin: 0, fontSize: "16px" }}>No assets are currently reporting downtime or critical health alerts.</p>
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Identifier</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Current Status</th>
                    <th style={thStyle}>Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.filter(a => a.status !== 'OPERATIONAL').map((asset) => (
                    <tr key={asset.id}>
                      <td style={tdStyle}>{asset.id}</td>
                      <td style={tdStyle}>{asset.identifier}</td>
                      <td style={tdStyle}>{asset.type}</td>
                      <td style={tdStyle}>
                        <span style={{...statusBadgeStyle(asset.status), background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid #ef4444"}}>
                          {asset.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {asset.status === 'UNDER_MAINTENANCE' 
                          ? <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold' }}>⏳ Monitor Repair Progress</span>
                          : <button style={{...maintenanceButtonStyle, background: "#ef4444", color: "white"}} onClick={() => { setActiveView("MAINTENANCE"); setSelectedAssetId(asset.id); }}>
                              Schedule Repair
                            </button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ===================== STYLES ===================== */
const pageContainerStyle = { minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" };
const cardStyle = { padding: "20px", background: "#1e293b", borderRadius: "10px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)" };
const cardTitleStyle = { margin: "0 0 10px 0", color: "#4ade80" };
const cardDescStyle = { margin: 0, fontSize: "14px", color: "#9ca3af" };
const panelContainerStyle = { background: "#1e293b", padding: "25px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" };
const backButtonStyle = { background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "6px 12px", borderRadius: "5px", cursor: "pointer", marginBottom: "20px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "12px", borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: "14px" };
const tdStyle = { padding: "12px", borderBottom: "1px solid #334155", fontSize: "14px" };
const successAlertStyle = { padding: "12px", background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", border: "1px solid #22c55e", borderRadius: "6px", marginBottom: "20px" };
const errorAlertStyle = { padding: "12px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444", borderRadius: "6px", marginBottom: "20px" };
const trendFormRowStyle = { display: "flex", gap: "15px", flexWrap: "wrap", background: "#0f172a", padding: "20px", borderRadius: "8px", marginBottom: "20px" };
const inputGroupStyle = { display: "flex", flexDirection: "column", flex: "1" };
const labelStyle = { fontSize: "12px", color: "#94a3b8", marginBottom: "5px" };
const inputStyle = { padding: "8px", background: "#1e293b", border: "1px solid #334155", color: "white", borderRadius: "4px" };
const submitButtonStyle = { padding: "10px 20px", background: "#f59e0b", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" };
const cancelButtonStyle = { background: "none", border: "1px solid #334155", color: "white", padding: "10px", borderRadius: "4px", cursor: "pointer" };
const maintenanceButtonStyle = { background: "#f59e0b", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", color: "black", fontSize: "12px", fontWeight: "600" };

const formStyle = { display: "flex", flexDirection: "column", maxWidth: "400px", background: "rgba(15, 23, 42, 0.8)", padding: "24px", borderRadius: "8px" };

const statusBadgeStyle = (s) => ({
  padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
  background: s === "OPERATIONAL" ? "#064e3b" : "#78350f", color: s === "OPERATIONAL" ? "#34d399" : "#fbbf24"
});