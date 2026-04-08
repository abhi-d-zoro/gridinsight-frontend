import { useReducer, useContext, useEffect, useRef, useCallback } from "react";
import { login as loginApi, requestPasswordReset, verifyPasswordResetOtp, resetPassword } from "../api/authApi";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../styles/login.css";

// Validation utilities
const validators = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  password: (password) => {
    return password && password.length >= 6;
  },
};

// Form state reducer
const initialFormState = {
  // Login form
  email: "",
  password: "",
  rememberMe: false,
  showPassword: false,
  
  // UI state
  error: "",
  isLoading: false,
  theme: "dark",
  
  // Forgot password modal
  showForgotModal: false,
  forgotStep: "email", // email, otp, newPassword
  forgotEmail: "",
  forgotOtp: "",
  forgotNewPassword: "",
  forgotConfirmPassword: "",
  forgotMessage: "",
  forgotLoading: false,
  forgotError: "",
  
  // Rate limiting
  loginAttempts: 0,
  lastAttemptTime: 0,
  isLocked: false,
};

function formReducer(state, action) {
  switch (action.type) {
    // Login form
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    case "SET_REMEMBER_ME":
      return { ...state, rememberMe: action.payload };
    case "TOGGLE_SHOW_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    
    // Forgot password
    case "OPEN_FORGOT_MODAL":
      return { ...state, showForgotModal: true, forgotStep: "email", forgotMessage: "", forgotError: "", forgotEmail: "", forgotOtp: "", forgotNewPassword: "", forgotConfirmPassword: "" };
    case "CLOSE_FORGOT_MODAL":
      return { ...state, showForgotModal: false, forgotMessage: "", forgotError: "", forgotEmail: "", forgotOtp: "", forgotNewPassword: "", forgotConfirmPassword: "", forgotStep: "email" };
    case "SET_FORGOT_EMAIL":
      return { ...state, forgotEmail: action.payload };
    case "SET_FORGOT_OTP":
      return { ...state, forgotOtp: action.payload };
    case "SET_FORGOT_NEW_PASSWORD":
      return { ...state, forgotNewPassword: action.payload };
    case "SET_FORGOT_CONFIRM_PASSWORD":
      return { ...state, forgotConfirmPassword: action.payload };
    case "SET_FORGOT_MESSAGE":
      return { ...state, forgotMessage: action.payload };
    case "SET_FORGOT_ERROR":
      return { ...state, forgotError: action.payload };
    case "SET_FORGOT_LOADING":
      return { ...state, forgotLoading: action.payload };
    case "SET_FORGOT_STEP":
      return { ...state, forgotStep: action.payload, forgotError: "" };
    
    // Rate limiting
    case "INCREMENT_LOGIN_ATTEMPTS":
      return { 
        ...state, 
        loginAttempts: state.loginAttempts + 1,
        lastAttemptTime: Date.now(),
        isLocked: state.loginAttempts + 1 >= 5
      };
    case "RESET_LOGIN_ATTEMPTS":
      return { ...state, loginAttempts: 0, isLocked: false };
    
    default:
      return state;
  }
}

export default function LoginPage() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const lockoutTimerRef = useRef(null);
  const rememberEmailRef = useRef(null);

  // Initialize theme and remember me
  useEffect(() => {
    const savedTheme = localStorage.getItem("loginTheme");
    if (savedTheme === "light" || savedTheme === "dark") {
      dispatch({ type: "SET_THEME", payload: savedTheme });
    }

    // Prefill email if remember me was enabled
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      dispatch({ type: "SET_EMAIL", payload: savedEmail });
      dispatch({ type: "SET_REMEMBER_ME", payload: true });
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("loginTheme", state.theme);
  }, [state.theme]);

  // Cleanup rate limiting timer on unmount
  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) {
        clearTimeout(lockoutTimerRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    dispatch({ 
      type: "SET_THEME", 
      payload: state.theme === "dark" ? "light" : "dark" 
    });
  };

  // Handle login with validation
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    dispatch({ type: "SET_ERROR", payload: "" });

    // Check lockout
    if (state.isLocked) {
      dispatch({ type: "SET_ERROR", payload: "Too many failed attempts. Please try again in 15 minutes." });
      return;
    }

    // Validation
    if (!state.email.trim()) {
      dispatch({ type: "SET_ERROR", payload: "Email is required" });
      return;
    }

    if (!validators.email(state.email)) {
      dispatch({ type: "SET_ERROR", payload: "Please enter a valid email address" });
      return;
    }

    if (!state.password.trim()) {
      dispatch({ type: "SET_ERROR", payload: "Password is required" });
      return;
    }

    if (!validators.password(state.password)) {
      dispatch({ type: "SET_ERROR", payload: "Password must be at least 6 characters" });
      return;
    }

    try {
      dispatch({ type: "SET_IS_LOADING", payload: true });

      const response = await loginApi(state.email, state.password);
      const token = response.accessToken;
      const decoded = jwtDecode(token);

      const role = decoded.roles?.[0]?.replace("ROLE_", "");
      if (!role) throw new Error("Role information missing from token");

      // Save email if remember me is checked
      if (state.rememberMe) {
        localStorage.setItem("rememberEmail", state.email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      // Note: In production, these should be httpOnly cookies
      // For now, using localStorage with a security warning
      login(token, role, response.refreshToken);
      dispatch({ type: "RESET_LOGIN_ATTEMPTS" });

      // Navigate based on role
      const roleRoutes = {
        "ADMIN": "/admin",
        "ANALYST": "/analyst",
        "PLANNER": "/planner",
        "ESG": "/esg",
        "ASSET_MANAGER": "/asset-manager",
      };

      navigate(roleRoutes[role] || "/login");
    } catch (err) {
      dispatch({ type: "INCREMENT_LOGIN_ATTEMPTS" });

      // Specific error messages
      let errorMsg = "Login failed. Please try again.";
      
      if (err.response?.status === 401) {
        errorMsg = "Invalid email or password";
      } else if (err.response?.status === 429) {
        errorMsg = "Too many login attempts. Please try again later.";
        dispatch({ type: "SET_IS_LOADING", payload: false });
        return;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message === "Network Error") {
        errorMsg = "Network error. Please check your connection and try again.";
      }

      dispatch({ type: "SET_ERROR", payload: errorMsg });

      // Set lockout timer if rate limited
      if (state.loginAttempts + 1 >= 5) {
        lockoutTimerRef.current = setTimeout(() => {
          dispatch({ type: "RESET_LOGIN_ATTEMPTS" });
        }, 15 * 60 * 1000); // 15 minutes
      }
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  }, [state.email, state.password, state.rememberMe, state.isLocked, state.loginAttempts, login, navigate]);

  // Handle forgot password - step 1: request OTP
  const handleRequestPasswordReset = useCallback(async () => {
    dispatch({ type: "SET_FORGOT_ERROR", payload: "" });

    if (!state.forgotEmail.trim()) {
      dispatch({ type: "SET_FORGOT_ERROR", payload: "Email is required" });
      return;
    }

    if (!validators.email(state.forgotEmail)) {
      dispatch({ type: "SET_FORGOT_ERROR", payload: "Please enter a valid email address" });
      return;
    }

    try {
      dispatch({ type: "SET_FORGOT_LOADING", payload: true });
      await requestPasswordReset(state.forgotEmail);
      dispatch({ type: "SET_FORGOT_MESSAGE", payload: "OTP sent to your email. Check your inbox (including spam folder)." });
      dispatch({ type: "SET_FORGOT_STEP", payload: "otp" });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send reset email. Please try again.";
      dispatch({ type: "SET_FORGOT_ERROR", payload: errorMsg });
    } finally {
      dispatch({ type: "SET_FORGOT_LOADING", payload: false });
    }
  }, [state.forgotEmail]);

  // Handle forgot password - step 2: verify OTP
  const handleVerifyOtp = useCallback(async () => {
    dispatch({ type: "SET_FORGOT_ERROR", payload: "" });

    if (!state.forgotOtp.trim()) {
      dispatch({ type: "SET_FORGOT_ERROR", payload: "OTP is required" });
      return;
    }

    if (state.forgotOtp.length !== 6) {
      dispatch({ type: "SET_FORGOT_ERROR", payload: "OTP must be 6 digits" });
      return;
    }

    try {
      dispatch({ type: "SET_FORGOT_LOADING", payload: true });
      await verifyPasswordResetOtp(state.forgotEmail, state.forgotOtp);
      dispatch({ type: "SET_FORGOT_MESSAGE", payload: "OTP verified! Please enter your new password." });
      dispatch({ type: "SET_FORGOT_STEP", payload: "newPassword" });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Invalid OTP. Please try again.";
      dispatch({ type: "SET_FORGOT_ERROR", payload: errorMsg });
    } finally {
      dispatch({ type: "SET_FORGOT_LOADING", payload: false });
    }
  }, [state.forgotEmail, state.forgotOtp]);

  // Handle forgot password - step 3: reset password
  const handleResetPassword = useCallback(async () => {
    dispatch({ type: "SET_FORGOT_ERROR", payload: "" });

    if (!state.forgotNewPassword.trim()) {
      dispatch({ type: "SET_FORGOT_ERROR", payload: "New password is required" });
      return;
    }

    if (!validators.password(state.forgotNewPassword)) {
      dispatch({ type: "SET_FORGOT_ERROR", payload: "Password must be at least 6 characters" });
      return;
    }

    if (state.forgotNewPassword !== state.forgotConfirmPassword) {
      dispatch({ type: "SET_FORGOT_ERROR", payload: "Passwords do not match" });
      return;
    }

    try {
      dispatch({ type: "SET_FORGOT_LOADING", payload: true });
      await resetPassword(state.forgotEmail, state.forgotOtp, state.forgotNewPassword);
      dispatch({ type: "SET_FORGOT_MESSAGE", payload: "Password reset successfully! You can now login with your new password." });
      setTimeout(() => {
        dispatch({ type: "CLOSE_FORGOT_MODAL" });
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reset password. Please try again.";
      dispatch({ type: "SET_FORGOT_ERROR", payload: errorMsg });
    } finally {
      dispatch({ type: "SET_FORGOT_LOADING", payload: false });
    }
  }, [state.forgotEmail, state.forgotOtp, state.forgotNewPassword, state.forgotConfirmPassword]);

  return (
    <div className={`login-container ${state.theme}`}>
      <div className={`login-card ${state.theme}`}>
        <div className="login-brand">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark and light mode"
            title={`Switch to ${state.theme === "dark" ? "light" : "dark"} mode`}
          >
            {state.theme === "dark" ? "☀️" : "🌙"}
          </button>
          <p className="login-eyebrow">Welcome back</p>
          <h1 className="login-title">GridInsight</h1>
          <p className="login-subtitle">Secure access for grid operations</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {state.error && (
            <div className="error-message" role="alert">
              <span className="error-icon">⚠️</span>
              {state.error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
              <span className="required">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              value={state.email}
              onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
              className="form-input"
              placeholder="john.doe@example.com"
              required
              disabled={state.isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
              <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={state.showPassword ? "text" : "password"}
                value={state.password}
                onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
                className="form-input"
                placeholder="Enter your password"
                required
                disabled={state.isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
                title={state.showPassword ? "Hide password" : "Show password"}
                disabled={state.isLoading}
                aria-label={state.showPassword ? "Hide password" : "Show password"}
              >
                {state.showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={state.rememberMe}
                onChange={(e) => dispatch({ type: "SET_REMEMBER_ME", payload: e.target.checked })}
                className="remember-checkbox"
                disabled={state.isLoading}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-link"
              onClick={() => dispatch({ type: "OPEN_FORGOT_MODAL" })}
              disabled={state.isLoading}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={state.isLoading || state.isLocked}
          >
            {state.isLoading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {state.isLocked && (
            <div className="lockout-warning" role="alert">
              <strong>Account temporarily locked</strong> - Too many failed attempts. Please try again in 15 minutes.
            </div>
          )}
        </form>
      </div>

      {/* Forgot Password Modal */}
      {state.showForgotModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          onClick={() => dispatch({ type: "CLOSE_FORGOT_MODAL" })}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="forgot-password-title">Reset Password</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => dispatch({ type: "CLOSE_FORGOT_MODAL" })}
                aria-label="Close modal"
                title="Close"
              >
                ✕
              </button>
            </div>

            {state.forgotMessage && (
              <div className="success-message" role="status">
                <span className="success-icon">✓</span>
                {state.forgotMessage}
              </div>
            )}

            {state.forgotError && (
              <div className="modal-error" role="alert">
                <span className="error-icon">⚠️</span>
                {state.forgotError}
              </div>
            )}

            {!state.forgotMessage && (
              <div className="modal-body">
                {/* STEP 1: Email */}
                {state.forgotStep === "email" && (
                  <>
                    <p className="modal-text">
                      Enter your email address and we'll send you a verification code.
                    </p>
                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-email">
                        Email Address
                        <span className="required">*</span>
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        value={state.forgotEmail}
                        onChange={(e) => dispatch({ type: "SET_FORGOT_EMAIL", payload: e.target.value })}
                        className="form-input"
                        placeholder="Enter your email address"
                        required
                        disabled={state.forgotLoading}
                        autoComplete="email"
                      />
                    </div>
                    <button
                      type="button"
                      className="modal-button primary"
                      disabled={state.forgotLoading}
                      onClick={handleRequestPasswordReset}
                    >
                      {state.forgotLoading ? "Sending..." : "Send Code"}
                    </button>
                  </>
                )}

                {/* STEP 2: OTP */}
                {state.forgotStep === "otp" && (
                  <>
                    <p className="modal-text">
                      Enter the 6-digit code sent to your email.
                    </p>
                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-otp">
                        Verification Code
                        <span className="required">*</span>
                      </label>
                      <input
                        id="forgot-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        value={state.forgotOtp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          dispatch({ type: "SET_FORGOT_OTP", payload: val });
                        }}
                        className="form-input otp-input"
                        placeholder="000000"
                        required
                        disabled={state.forgotLoading}
                      />
                    </div>
                    <div className="modal-buttons">
                      <button
                        type="button"
                        className="modal-button primary"
                        disabled={state.forgotLoading}
                        onClick={handleVerifyOtp}
                      >
                        {state.forgotLoading ? "Verifying..." : "Verify Code"}
                      </button>
                      <button
                        type="button"
                        className="modal-button secondary"
                        disabled={state.forgotLoading}
                        onClick={() => dispatch({ type: "SET_FORGOT_STEP", payload: "email" })}
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 3: New Password */}
                {state.forgotStep === "newPassword" && (
                  <>
                    <p className="modal-text">
                      Enter your new password (minimum 6 characters).
                    </p>
                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-new-password">
                        New Password
                        <span className="required">*</span>
                      </label>
                      <input
                        id="forgot-new-password"
                        type="password"
                        value={state.forgotNewPassword}
                        onChange={(e) => dispatch({ type: "SET_FORGOT_NEW_PASSWORD", payload: e.target.value })}
                        className="form-input"
                        placeholder="Enter new password"
                        required
                        disabled={state.forgotLoading}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-confirm-password">
                        Confirm Password
                        <span className="required">*</span>
                      </label>
                      <input
                        id="forgot-confirm-password"
                        type="password"
                        value={state.forgotConfirmPassword}
                        onChange={(e) => dispatch({ type: "SET_FORGOT_CONFIRM_PASSWORD", payload: e.target.value })}
                        className="form-input"
                        placeholder="Confirm new password"
                        required
                        disabled={state.forgotLoading}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="modal-buttons">
                      <button
                        type="button"
                        className="modal-button primary"
                        disabled={state.forgotLoading}
                        onClick={handleResetPassword}
                      >
                        {state.forgotLoading ? "Resetting..." : "Reset Password"}
                      </button>
                      <button
                        type="button"
                        className="modal-button secondary"
                        disabled={state.forgotLoading}
                        onClick={() => dispatch({ type: "SET_FORGOT_STEP", payload: "otp" })}
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}