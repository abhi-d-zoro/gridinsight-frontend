import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import "./AdminFeatureTable.css";

export default function AssetManager() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const fetchAssets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/v1/assets", { params: { pageable: { page: 0, size: 20 } } });
      setAssets(res.data.content || []);
    } catch (err) {
      setError("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <div>
      <h3 style={{marginTop:0, color:"#059669", fontWeight:700, fontSize:22}}>Asset Management</h3>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>}
      <button style={{marginBottom:16}} onClick={() => { setEditingAsset(null); setShowModal(true); }}>Add Asset</button>
      <table className="admin-feature-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Location</th>
            <th>Identifier</th>
            <th>Capacity (MW)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => (
            <tr key={asset.id}>
              <td>{asset.id}</td>
              <td>{asset.type}</td>
              <td>{asset.location}</td>
              <td>{asset.identifier}</td>
              <td>{asset.capacity}</td>
              <td>{asset.status}</td>
              <td>
                <button onClick={() => { setEditingAsset(asset); setShowModal(true); }}>Edit</button>
                <button style={{ background: '#ef4444', marginLeft: 8 }} onClick={async () => {
                  if (window.confirm('Delete this asset?')) {
                    try {
                      await axios.delete(`/api/v1/assets/${asset.id}`);
                      fetchAssets();
                    } catch (err) {
                      alert('Failed to delete asset');
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
            <h4>{editingAsset ? "Edit Asset" : "Add Asset"}</h4>
            <AssetForm
              asset={editingAsset}
              onClose={() => { setShowModal(false); setEditingAsset(null); }}
              onSuccess={() => { setShowModal(false); setEditingAsset(null); fetchAssets(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


// AssetForm component for add/edit (must be outside main component)
// import React, { useState } from "react"; // removed duplicate import
function AssetForm({ asset, onClose, onSuccess }) {
  const isEdit = !!asset;
  const [form, setForm] = useState({
    type: asset?.type || "SOLAR",
    location: asset?.location || "",
    identifier: asset?.identifier || "",
    capacity: asset?.capacity || "",
    commissionDate: asset?.commissionDate || "",
    status: asset?.status || "OPERATIONAL"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await axios.put(`/api/v1/assets/${asset.id}`, form);
      } else {
        await axios.post("/api/v1/assets", form);
      }
      onSuccess();
    } catch (err) {
      setError("Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label>
        Type
        <select name="type" value={form.type} onChange={handleChange} required>
          <option value="SOLAR">Solar</option>
          <option value="WIND">Wind</option>
          <option value="HYDRO">Hydro</option>
          <option value="BIOMASS">Biomass</option>
        </select>
      </label>
      <label>
        Location
        <input name="location" value={form.location} onChange={handleChange} required />
      </label>
      <label>
        Identifier
        <input name="identifier" value={form.identifier} onChange={handleChange} />
      </label>
      <label>
        Capacity (MW)
        <input name="capacity" type="number" step="0.01" value={form.capacity} onChange={handleChange} required />
      </label>
      <label>
        Commission Date
        <input name="commissionDate" type="date" value={form.commissionDate} onChange={handleChange} required />
      </label>
      <label>
        Status
        <select name="status" value={form.status} onChange={handleChange} required>
          <option value="OPERATIONAL">Operational</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </label>
      {error && <div style={{ color: "#ef4444" }}>{error}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : (isEdit ? "Update" : "Add")}</button>
        <button type="button" onClick={onClose} style={{ background: "#e5e7eb", color: "#111827" }}>Cancel</button>
      </div>
    </form>
  );
}
