import { useEffect, useState } from "react";
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

  // ✅ CRITICAL FIX: sync form state when `user` changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phone || "");
      setEditRole(user.role || "");
      setEditStatus(user.status || "");
      setEditPassword("");
    }
  }, [user]);

  if (!open || !user) return null;

  const handleUpdate = async () => {
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
      alert(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Edit User</h3>

        <label>Name</label>
        <input value={editName} onChange={(e) => setEditName(e.target.value)} />

        <label>Email</label>
        <input
          value={editEmail}
          onChange={(e) => setEditEmail(e.target.value)}
        />

        <label>Phone</label>
        <input
          value={editPhone}
          onChange={(e) => setEditPhone(e.target.value)}
        />

        <label>Role</label>
        <select
          value={editRole}
          onChange={(e) => setEditRole(e.target.value)}
        >
          <option value="ADMIN">ADMIN</option>
          <option value="GRID_ANALYST">GRID_ANALYST</option>
          <option value="ASSET_MANAGER">ASSET_MANAGER</option>
          <option value="PLANNER">PLANNER</option>
          <option value="ESG">ESG</option>
          <option value="OPERATOR">OPERATOR</option>
          <option value="TECHNICIAN">TECHNICIAN</option>
          <option value="ANALYST">ANALYST</option>
        </select>

        <label>Status</label>
        <select
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value)}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <label>New Password (optional)</label>
        <input
          type="password"
          placeholder="Leave blank to keep existing password"
          value={editPassword}
          onChange={(e) => setEditPassword(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            disabled={saving}
            onClick={handleUpdate}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
