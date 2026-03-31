import { useState, useContext } from "react";
import { login as loginApi } from "../api/authApi";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    try {
      setError("");

      // ✅ Backend login
      const response = await loginApi(email, password);
      const token = response.accessToken;

      // ✅ Decode JWT
      const decoded = jwtDecode(token);

      // ✅ Safely extract role
      let role = null;
      if (Array.isArray(decoded.roles) && decoded.roles.length > 0) {
        role = decoded.roles[0].replace("ROLE_", "");
      }

      if (!role) {
        throw new Error("Role not found in token");
      }

      // ✅ Store accessToken + role + refreshToken
      login(token, role, response.refreshToken);

      // ✅ Role-based navigation
      if (role === "ADMIN") {
        navigate("/admin");
      } else if (role === "ANALYST") {
        navigate("/analyst");
      } else if (role === "ESG") {
        navigate("/esg");
      } else {
        navigate("/login");
      }

      console.log("LOGIN SUCCESS ✅", role);

    } catch (err) {
      console.error("LOGIN FAILED ❌", err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      style={{
        width: "320px",
        margin: "120px auto",
        padding: "24px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <h2>Login</h2>

      {error && (
        <p style={{ color: "red", fontSize: "14px" }}>
          {error}
        </p>
      )}

      <div style={{ marginBottom: "10px" }}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <button type="submit" style={{ width: "100%", padding: "8px" }}>
        Login
      </button>
    </form>
  );
}