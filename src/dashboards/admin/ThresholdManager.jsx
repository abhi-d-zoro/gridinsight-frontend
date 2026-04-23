import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import "./AdminFeatureTable.css";

export default function ThresholdManager() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/v1/admin/threshold-rules");
      setRules(res.data || []);
    } catch (err) {
      setError("Failed to fetch threshold rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div>
      <h3 style={{ marginTop: 0, color: "#059669", fontWeight: 700, fontSize: 22 }}>Thresholds & Alert Rules</h3>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>}

      <button style={{ marginBottom: 16 }} onClick={() => { setEditingRule(null); setShowModal(true); }}>
        Add Rule
      </button>

      <table className="admin-feature-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Metric</th>
            <th>Scope</th>
            <th>Value</th>
            <th>Comparison</th>
            <th>Unit</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => (
            <tr key={rule.id}>
              <td>{rule.id}</td>
              <td>{rule.metricName}</td>
              <td>{rule.scope}</td>
              <td>{rule.thresholdValue}</td>
              <td>{rule.comparison}</td>
              <td>{rule.unit}</td>
              <td>{rule.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => { setEditingRule(rule); setShowModal(true); }}>Edit</button>
                <button style={{ background: '#ef4444', marginLeft: 8 }} onClick={async () => {
                  if (window.confirm('Delete this rule?')) {
                    try {
                      await axios.delete(`/api/v1/admin/threshold-rules/${rule.id}`);
                      fetchRules();
                    } catch {
                      alert('Failed to delete rule');
                    }
                  }
                }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay admin-feature-modal">
          <div className="modal-card">
            <h4>{editingRule ? "Edit Rule" : "Add Rule"}</h4>
            <ThresholdRuleForm
              rule={editingRule}
              onClose={() => { setShowModal(false); setEditingRule(null); }}
              onSuccess={() => { setShowModal(false); setEditingRule(null); fetchRules(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ThresholdRuleForm({ rule, onClose, onSuccess }) {
  const isEdit = !!rule;
  const [form, setForm] = useState({
    metricName: rule?.metricName || "",
    scope: rule?.scope || "ZONE",
    zoneId: rule?.zoneId || "",
    assetId: rule?.assetId || "",
    thresholdValue: rule?.thresholdValue || "",
    comparison: rule?.comparison || "GREATER_THAN",
    unit: rule?.unit || "MW",
    active: rule?.active ?? true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await axios.put(`/api/v1/admin/threshold-rules/${rule.id}`, form);
      } else {
        await axios.post("/api/v1/admin/threshold-rules", form);
      }
      onSuccess();
    } catch (err) {
      setError("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label>
        Metric Name
        <input name="metricName" value={form.metricName} onChange={handleChange} required />
      </label>
      <label>
        Scope
        <select name="scope" value={form.scope} onChange={handleChange} required>
          <option value="ZONE">Zone</option>
          <option value="ASSET">Asset</option>
          <option value="METRIC">Metric</option>
        </select>
      </label>
      {form.scope === "ZONE" && (
        <label>
          Zone ID
          <input name="zoneId" value={form.zoneId} onChange={handleChange} required />
        </label>
      )}
      {form.scope === "ASSET" && (
        <label>
          Asset ID
          <input name="assetId" value={form.assetId} onChange={handleChange} required />
        </label>
      )}
      <label>
        Threshold Value
        <input name="thresholdValue" type="number" step="0.01" value={form.thresholdValue} onChange={handleChange} required />
      </label>
      <label>
        Comparison
        <select name="comparison" value={form.comparison} onChange={handleChange} required>
          <option value="GREATER_THAN">Greater Than</option>
          <option value="LESS_THAN">Less Than</option>
          <option value="GREATER_OR_EQUAL">Greater Or Equal</option>
          <option value="LESS_OR_EQUAL">Less Or Equal</option>
        </select>
      </label>
      <label>
        Unit
        <input name="unit" value={form.unit} onChange={handleChange} required />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input name="active" type="checkbox" checked={form.active} onChange={handleChange} /> Active
      </label>
      {error && <div style={{ color: "#ef4444" }}>{error}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : (isEdit ? "Update" : "Add")}</button>
        <button type="button" onClick={onClose} style={{ background: "#e5e7eb", color: "#111827" }}>Cancel</button>
      </div>
    </form>
  );
}
 
