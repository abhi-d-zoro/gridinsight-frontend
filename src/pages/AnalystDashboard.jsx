import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { AuthContext } from "../auth/AuthContext";

export default function AnalystDashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();           // ✅ clear tokens & role
    navigate("/login"); // ✅ redirect
  };

  return (
    <div>
      <Header
        title="GridInsight – Analyst Dashboard"
        onLogout={handleLogout}
      />

      <div style={{ padding: "24px" }}>
        <h2>Analyst Dashboard</h2>
      </div>
    </div>
  );
}
