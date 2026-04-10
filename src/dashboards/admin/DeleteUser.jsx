import { useState } from "react";
import { createPortal } from "react-dom";
import adminApi from "../../api/adminApi";

export default function DeleteUser({ user, open, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!open || !user) return null;

  const handleDelete = async () => {
    setError("");
    try {
      setDeleting(true);
      await adminApi.delete(`/users/${user.id}`);
      onDeleted();  // refresh user list
      onClose();    // close modal
    } catch (err) {
      console.error("Delete failed", err);
      setError(err.response?.data?.message || "Failed to delete user. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal-delete" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete User</h3>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {error && (
          <div className="modal-error" role="alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="modal-body">
          <div className="delete-warning">
            <div className="warning-icon">⚠️</div>
            <p>
              Are you sure you want to delete user{" "}
              <strong>{user.name}</strong> ({user.email})?
            </p>
            <p className="warning-text">
              This action cannot be undone. All data associated with this user will be permanently removed.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleClose} disabled={deleting}>
            Cancel
          </button>
          <button
            className="btn-danger"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Yes, Delete User"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}