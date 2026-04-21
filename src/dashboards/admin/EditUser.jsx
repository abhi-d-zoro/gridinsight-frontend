import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import adminApi from "../../api/adminApi";
import "./UserList.css";

export default function EditUser({ user, open, onClose, onUpdated }) {
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync form state when `user` changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phone || "");
      setEditRole(user.role || "");
      setEditStatus(user.status || "");
      setEditPassword("");
      setError("");
    }
  }, [user]);

  if (!open || !user) return null;

  // Email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Password validation (only if provided)
  const isValidPassword = (password) => !password || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);

  const handleUpdate = async () => {
    setError("");

    // Validation
    if (!editName.trim()) {
      setError("Name is required");
      return;
    }
    if (!editEmail.trim()) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(editEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    if (editPassword && !isValidPassword(editPassword)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return;
    }

    const payload = {
      name: editName,
      email: editEmail,
      phone: editPhone,
      role: editRole,
      status: editStatus,
    };

    if (editPassword.trim()) {
      payload.password = editPassword;
    }

    try {
      setSaving(true);
      await adminApi.put(`/users/${user.id}`, payload);
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Update failed", err);
      setError(err.response?.data?.message || "Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit User</h3>
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
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              disabled={saving}
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={saving}
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              disabled={saving}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="form-group">
            <label>Role <span className="required">*</span></label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
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
            <label>Status <span className="required">*</span></label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              disabled={saving}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <label>New Password (optional)</label>
            <input
              type="password"
              placeholder="Leave blank to keep existing password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              disabled={saving}
            />
            <small className="form-hint">Only fill if you want to change the password</small>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={saving}
            onClick={handleUpdate}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
