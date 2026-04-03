import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { AuthContext } from "../auth/AuthContext";

export default function ESGDashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <Header
        title="GridInsight – ESG Dashboard"
        onLogout={handleLogout}
      />

      <div style={{ padding: "24px" }}>
        <h2>ESG Dashboard</h2>
      </div>
    </div>
  );
}
