import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

export default function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role } = useContext(AuthContext);

  // ✅ Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged in but wrong role
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Authorized
  return children;
}
