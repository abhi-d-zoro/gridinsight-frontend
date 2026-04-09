import { useState } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );

  const [role, setRole] = useState(
    localStorage.getItem("role")
  );

  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken")
  );

  const login = (token, userRole, userRefreshToken) => {
    setAccessToken(token);
    setRole(userRole);
    setRefreshToken(userRefreshToken);

    localStorage.setItem("accessToken", token);
    localStorage.setItem("role", userRole);
    localStorage.setItem("refreshToken", userRefreshToken);
  };

  const logout = () => {
    setAccessToken(null);
    setRole(null);
    setRefreshToken(null);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        role,
        login,
        logout,
        isAuthenticated: !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
