import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import "./AdminFeatureTable.css";

export default function RoleManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/v1/auth/admin/users", { params: { pageable: { page: 0, size: 20 } } });
      setUsers(res.data.content || []);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h3 style={{marginTop:0, color:"#059669", fontWeight:700, fontSize:22}}>Role Management</h3>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>}
      <table className="admin-feature-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>
                <button onClick={() => { setEditingUser(user); setShowModal(true); }}>Edit Role</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay admin-feature-modal">
          <div className="modal-card">
            <h4>Edit User Role</h4>
            {/* Role edit form goes here */}
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
