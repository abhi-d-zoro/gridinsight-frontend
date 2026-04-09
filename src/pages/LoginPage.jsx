import { useState, useContext } from "react";
import { login as loginApi, requestPasswordReset } from "../api/authApi";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../styles/login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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

      const response = await loginApi(email, password);
      const token = response.accessToken;
      const decoded = jwtDecode(token);

      const role = decoded.roles?.[0]?.replace("ROLE_", "");
      if (!role) throw new Error("Role missing");

      login(token, role, response.refreshToken);

      switch (role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "ANALYST":
          navigate("/analyst");
          break;
        case "PLANNER":
          navigate("/planner");
          break;
        case "ESG":
          navigate("/esg");
          break;
        case "ASSET_MANAGER":
          navigate("/asset-manager"); // Fixed path
          break;                      // Added missing break
        default:
          navigate("/login");
      }
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleLogin} style={glassCardStyle}>
        <h1 style={centeredTitle}>GridInsight Login</h1>

        {error && <p style={errorStyle}>{error}</p>}

        {/* Email */}
        <div style={fieldWrapper}>
          <label style={fieldLabel}>Email</label>
          <div style={inputLine}>
            <span style={icon}>👤</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={underlineInput}
            />
          </div>
        </div>

        {/* Password */}
        <div style={fieldWrapper}>
          <label style={fieldLabel}>Password</label>
          <div style={inputLine}>
            <span style={icon}>🔒</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={underlineInput}
            />
          </div>
        </div>

        {/* Forgot Password */}
        <div
          style={forgotWrapper}
          onClick={() => setShowForgotModal(true)}
        >
          Forgot password?
        </div>

        <button type="submit" style={loginButtonStyle}>
          LOGIN
        </button>
      </form>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div style={forgotOverlay}>
          <div style={forgotModal}>
            <h3 style={{ marginBottom: "16px" }}>Reset Password</h3>

            {forgotMessage ? (
              <p style={{ color: "#86efac", fontSize: "14px" }}>
                {forgotMessage}
              </p>
            ) : (
              <>
                <label style={fieldLabel}>Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{
                    ...underlineInput,
                    borderBottom: "1px solid rgba(255,255,255,0.35)",
                    paddingBottom: "6px",
                  }}
                />

                <button
                  style={{ ...loginButtonStyle, marginTop: "18px" }}
                  disabled={forgotLoading}
                  onClick={async () => {
                    if (!forgotEmail.trim()) return;

                    try {
                      setForgotLoading(true);
                      const res = await requestPasswordReset(forgotEmail);
                      setForgotMessage(res.message);
                    } catch {
                      setForgotMessage("Something went wrong.");
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}

            <button
              style={cancelBtn}
              onClick={() => {
                setShowForgotModal(false);
                setForgotEmail("");
                setForgotMessage("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== STYLES ===================== */

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #22c55e 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const glassCardStyle = {
  width: "100%",
  maxWidth: "340px",
  padding: "44px 36px",
  borderRadius: "18px",
  background: "rgba(15, 23, 42, 0.52)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 16px 32px rgba(0,0,0,0.4)",
};

const centeredTitle = {
  color: "#fff",
  textAlign: "center",
  marginBottom: "36px",
};

const errorStyle = {
  color: "#f87171",
  textAlign: "center",
  marginBottom: "16px",
};

const fieldWrapper = { marginBottom: "20px" };
const fieldLabel = { fontSize: "13px", color: "#e5e7eb" };

const inputLine = {
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid rgba(255,255,255,0.35)",
};

const icon = { marginRight: "8px" };

const underlineInput = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "#fff",
  outline: "none",
};

const forgotWrapper = {
  textAlign: "right",
  marginBottom: "28px",
  fontSize: "12px",
  cursor: "pointer",
  color: "#86efac",
};

const loginButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "30px",
  border: "none",
  background: "#22c55e",
  color: "#fff",
  cursor: "pointer",
};

const forgotOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const forgotModal = {
  width: "100%",
  maxWidth: "320px",
  padding: "28px",
  borderRadius: "16px",
  background: "rgba(15, 23, 42, 0.95)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
};

const cancelBtn = {
  marginTop: "12px",
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
};