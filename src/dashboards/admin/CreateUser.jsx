import { useState } from "react";
import { createPortal } from "react-dom";
import adminApi from "../../api/adminApi";

export default function CreateUser({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("GRID_ANALYST");
  const [tempPassword, setTempPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ Do not render anything if modal is closed
  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !tempPassword.trim()) {
      alert("Name, Email, and Temporary Password are required");
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

      // ✅ Reset form
      setName("");
      setEmail("");
      setPhone("");
      setRole("GRID_ANALYST");
      setTempPassword("");

      onCreated(); // ✅ refresh list
      onClose();   // ✅ close modal
    } catch (err) {
      console.error("Create user failed", err);
      alert(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  // ✅ MODAL IS RENDERED VIA PORTAL (THIS IS THE FIX)
  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create User</h3>

        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
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

        <label>Temporary Password</label>
        <input
          type="password"
          placeholder="User must change on first login"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
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