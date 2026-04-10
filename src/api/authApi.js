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

// ✅ Request Password Reset OTP (Step 1: Send OTP to email)
// Backend generates OTP and sends via email, returns generic success message
export const requestPasswordReset = async (email) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/otp",
    { email }
  );
  return response.data;
};

// ✅ Reset Password with OTP (Step 2: Verify OTP + Reset password)
// Single endpoint that handles both OTP verification and password reset
export const resetPassword = async (email, otp, newPassword) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/reset",
    { email, otp, newPassword }
  );
  return response.data;
};