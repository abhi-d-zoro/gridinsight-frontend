import axiosInstance from "./axiosInstance";

// ✅ Login
export const login = async (email, password) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/login",
    { email, password }
  );
  return response.data;
};

// ✅ Refresh token
export const refreshAccessToken = async (refreshToken) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/refresh",
    { refreshToken }
  );
  return response.data;
};

// ✅ Forgot Password (OTP request)
export const requestPasswordReset = async (identifier) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/otp",
    { identifier }
  );
  return response.data;
};