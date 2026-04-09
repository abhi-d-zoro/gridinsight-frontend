import { useCallback, useEffect, useRef, useState } from "react";
import adminApi from "../../api/adminApi";
import EditUser from "./EditUser";
import CreateUser from "./CreateUser";
import DeleteUser from "./DeleteUser";
import "./UserList.css";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // ✅ LOADING & ERROR STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ✅ LIVE SEARCH + FILTER STATE
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const searchTimeoutRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.get("/users", {
        params: {
          page,
          size: 5,
          search: searchText || undefined,
          role: roleFilter || undefined,
        },
      });
      setUsers(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch users. Please try again.";
      setError(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, searchText]);

  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setPage(0);
      fetchUsers();
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, roleFilter, fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  return (
    <>
      <div className="users-list-wrapper">
        {/* ✅ ERROR MESSAGE */}
        {error && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
            <button
              className="alert-close"
              onClick={() => setError(null)}
              aria-label="Close error message"
            >
              ✕
            </button>
          </div>
        )}

        {/* ✅ SUCCESS MESSAGE */}
        {successMessage && (
          <div className="alert alert-success" role="status">
            <span className="alert-icon">✓</span>
            <span className="alert-text">{successMessage}</span>
            <button
              className="alert-close"
              onClick={() => setSuccessMessage(null)}
              aria-label="Close success message"
            >
              ✕
            </button>
          </div>
        )}

        {/* ✅ USER TOOLBAR */}
        <div className="user-toolbar">
          <input
            type="text"
            placeholder="Search users..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search users by name or email"
            disabled={loading}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter users by role"
            disabled={loading}
          >
            <option value="">Filter by Role</option>
            <option value="ADMIN">Admin</option>
            <option value="GRID_ANALYST">Grid Analyst</option>
            <option value="ASSET_MANAGER">Asset Manager</option>
            <option value="PLANNER">Planner</option>
            <option value="ESG">ESG</option>
            <option value="OPERATOR">Operator</option>
            <option value="TECHNICIAN">Technician</option>
          </select>

          <button
            className="action-btn user-create-btn"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            aria-label="Add new user"
          >
            + Add User
          </button>
        </div>

        {/* ✅ LOADING STATE */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        )}

        {/* ✅ USERS TABLE */}
        {!loading && (
        <table className="users-table">
          <thead>
            <tr className="userlist-col">
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No Users Found</h3>
                    <p>No users match your search criteria. Try adjusting your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
              <tr key={u.id}>
                <td colSpan={5}>
                  <div
                    className={`user-row ${
                      hoveredRow === u.id ? "hovered" : ""
                    }`}
                    onMouseEnter={() => setHoveredRow(u.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <div className="name-cell">
                      <div className="avatar">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      {u.name}
                    </div>

                    <div className="email">{u.email}</div>
                    <span className="role-badge">{u.role}</span>

                    <span
                      className={`status-badge ${
                        u.status === "ACTIVE" ? "active" : "inactive"
                      }`}
                    >
                      ● {u.status}
                    </span>

                    <div className="row-actions">
                      <button
                        className="action-btn user-edit-btn"
                        onClick={() => setEditingUser(u)}
                      >
                        Edit
                      </button>

                      <button
                        className="action-btn user-delete-btn"
                        onClick={() => setDeletingUser(u)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
        )}

        {/* ✅ PAGINATION */}
        {!loading && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
        )}
      </div>

      {/* ✅ MODALS (rendered via portal internally) */}
      <EditUser
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onUpdated={fetchUsers}
      />

      <CreateUser
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchUsers}
      />

      <DeleteUser
        user={deletingUser}
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onDeleted={fetchUsers}
      />
    </>
  );
}
