import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import "./AdminFeatureTable.css";

export default function ReportManager() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ reportingStandard: "ESG", period: "" });

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/v1/reports");
      setReports(res.data || []);
    } catch (err) {
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div>
      <h3 style={{marginTop:0, color:"#059669", fontWeight:700, fontSize:22}}>Reports</h3>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>}
      <button style={{marginBottom:16}} onClick={() => { console.log('ReportManager: open modal'); setShowModal(true); }}>Generate Report</button>
      <table className="admin-feature-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Standard</th>
            <th>Period</th>
            <th>Generated Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.reportId}>
              <td>{report.reportId}</td>
              <td>{report.reportingStandard}</td>
              <td>{report.period}</td>
              <td>{report.generatedDate}</td>
              <td>{report.status}</td>
              <td>
                {/* Add export/download actions here */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay admin-feature-modal">
          <div className="modal-card">
            <h4>Generate ESG Report</h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                console.log('ReportManager: submit', form);
                setSaving(true);
                setError("");
                try {
                  const res = await axios.post("/api/v1/reports", form);
                  console.log('ReportManager: generate response', res?.data);
                  setShowModal(false);
                  setForm({ reportingStandard: "ESG", period: "" });
                  fetchReports();
                } catch (err) {
                  console.error('ReportManager: generate error', err);
                  setError("Failed to generate report");
                } finally {
                  setSaving(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <label>
                Reporting Standard
                <select
                  value={form.reportingStandard}
                  onChange={(e) => setForm(f => ({ ...f, reportingStandard: e.target.value }))}
                >
                  <option value="ESG">ESG</option>
                  <option value="AUDIT">Audit</option>
                </select>
              </label>

              <label>
                Period
                <input
                  type="month"
                  value={form.period}
                  onChange={(e) => setForm(f => ({ ...f, period: e.target.value }))}
                  required
                />
              </label>

              {error && <div style={{ color: "#ef4444" }}>{error}</div>}

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? "Generating..." : "Generate"}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: "#e5e7eb", color: "#111827" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
