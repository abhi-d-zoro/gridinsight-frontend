import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { AuthContext } from "../auth/AuthContext";

export default function AdminDashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();               // ✅ Clear tokens & role
    navigate("/login");     // ✅ Redirect to login
  };

  // ✅ Defensive UI guard (extra safety)
  if (role !== "ADMIN") {
    return (
      <div style={{ padding: "24px" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="GridInsight – Admin Dashboard"
        onLogout={handleLogout}
      />

      <div style={{ padding: "24px" }}>
        <h3>Welcome, Admin</h3>

        {/* ✅ Admin‑only features */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <div style={cardStyle}>Manage Users</div>
          <div style={cardStyle}>Manage Grid Zones</div>
          <div style={cardStyle}>View Alerts</div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "24px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  backgroundColor: "#f9fafb",
  textAlign: "center",
  cursor: "pointer",
};