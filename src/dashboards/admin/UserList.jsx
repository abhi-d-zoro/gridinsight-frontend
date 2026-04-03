import { useEffect, useState } from "react";
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

  // ✅ LIVE SEARCH + FILTER STATE
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [page, searchText, roleFilter]);

  const fetchUsers = async () => {
    try {
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
      console.error("Failed to fetch users", err);
    }
  };

  return (
    <>
      {/* ✅ USER TOOLBAR */}
      <div className="user-toolbar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(0);
          }}
        />

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(0);
          }}
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
        >
          + Add User
        </button>
      </div>

      {/* ✅ USERS TABLE */}
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
          {users.map((u) => (
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
          ))}
        </tbody>
      </table>

      {/* ✅ PAGINATION */}
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
