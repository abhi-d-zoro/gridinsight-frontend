import { createContext, useState } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ✅ Access Token
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );

  // ✅ Role
  const [role, setRole] = useState(
    localStorage.getItem("role")
  );

  // ✅ Refresh Token (NEW for STEP 15)
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken")
  );

  // ✅ Login now accepts refreshToken also
  const login = (token, userRole, userRefreshToken) => {
    console.log("Saving accessToken:", token);
    console.log("Saving role:", userRole);
    console.log("Saving refreshToken:", userRefreshToken);

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
        refreshToken,   // ✅ exposed
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
