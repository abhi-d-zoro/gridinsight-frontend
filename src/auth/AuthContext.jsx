import { createContext } from "react";

export const AuthContext = createContext({
  accessToken: null,
  role: null,
  refreshToken: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});
