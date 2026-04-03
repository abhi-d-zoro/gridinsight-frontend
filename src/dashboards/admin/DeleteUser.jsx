import { useState } from "react";
import adminApi from "../../api/adminApi";

export default function DeleteUser({ user, open, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  if (!open || !user) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await adminApi.delete(`/users/${user.id}`);

      onDeleted();  // refresh user list
      onClose();    // close modal
    } catch (err) {
      console.error("Delete failed", err);
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Delete User</h3>

        <p>
          Are you sure you want to delete{" "}
          <strong>{user.name}</strong>?
        </p>

        <p style={{ color: "#f87171", fontSize: "13px" }}>
          This action cannot be undone.
        </p>

        <div className="modal-actions">
          <button onClick={onClose}>No</button>

          <button
            className="action-btn user-delete-btn"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}