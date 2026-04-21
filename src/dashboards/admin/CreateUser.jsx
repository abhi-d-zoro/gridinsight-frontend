import { useState } from "react";
import { createPortal } from "react-dom";
import adminApi from "../../api/adminApi";

export default function CreateUser({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [tempPassword, setTempPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Do not render anything if modal is closed
  if (!open) return null;

  // Email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Password validation (8+ chars, upper, lower, digit, special)
  const isValidPassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);

  const handleCreate = async () => {
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!tempPassword.trim()) {
      setError("Temporary password is required");
      return;
    }
    if (!isValidPassword(tempPassword)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return;
    }

    const payload = {
      name,
      email,
      phone,
      role,
      tempPassword,
    };

    try {
      setSaving(true);
      await adminApi.post("/users", payload);

      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setRole("OPERATOR");
      setTempPassword("");
      setError("");

      onCreated(); // refresh list
      onClose();   // close modal
    } catch (err) {
      console.error("Create user failed", err);
      setError(err.response?.data?.message || "Failed to create user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError("");
    setName("");
    setEmail("");
    setPhone("");
    setRole("OPERATOR");
    setTempPassword("");
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create User</h3>
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
            <label>Name <span className="required">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Role <span className="required">*</span></label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={saving}
            >
              <option value="ADMIN">Admin</option>
              <option value="ASSET_MANAGER">Asset Manager</option>
              <option value="ESG">ESG</option>
              <option value="OPERATOR">Operator</option>
              <option value="PLANNER">Planner</option>
            </select>
          </div>

          <div className="form-group">
            <label>Temporary Password <span className="required">*</span></label>
            <input
              type="password"
              placeholder="Min 8 chars with upper, lower, number, special"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              disabled={saving}
            />
            <small className="form-hint">User must change this on first login</small>
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
            {saving ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}