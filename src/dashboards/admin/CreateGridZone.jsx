import { useState } from "react";
import { createPortal } from "react-dom";
import gridZoneApi from "../../api/gridZoneApi";
import "./GridZoneList.css";

export default function CreateGridZone({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [voltageLevel, setVoltageLevel] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleCreate = async () => {
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Zone name is required");
      return;
    }
    if (!region.trim()) {
      setError("Region is required");
      return;
    }
    if (!voltageLevel.trim()) {
      setError("Voltage level is required");
      return;
    }

    const payload = {
      name: name.trim(),
      region: region.trim(),
      voltageLevel: voltageLevel.trim(),
      status,
    };

    try {
      setSaving(true);
      await gridZoneApi.post("", payload);

      // Reset form
      setName("");
      setRegion("");
      setVoltageLevel("");
      setStatus("ACTIVE");
      setError("");

      onCreated();
      onClose();
    } catch (err) {
      console.error("Create zone failed", err);
      setError(err.response?.data?.message || err.response?.data || "Failed to create grid zone. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError("");
    setName("");
    setRegion("");
    setVoltageLevel("");
    setStatus("ACTIVE");
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Grid Zone</h3>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {error && (
          <div className="modal-error" role="alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="modal-body">
          <div className="form-group">
            <label>Zone Name <span className="required">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Zone A, North Grid"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Region <span className="required">*</span></label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., North, South, East, West"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Voltage Level <span className="required">*</span></label>
            <input
              value={voltageLevel}
              onChange={(e) => setVoltageLevel(e.target.value)}
              placeholder="e.g., 110kV, 220kV, 400kV"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Status <span className="required">*</span></label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={saving}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={saving}
            onClick={handleCreate}
          >
            {saving ? "Creating..." : "Create Zone"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
