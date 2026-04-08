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

// ✅ Request Password Reset (OTP)
export const requestPasswordReset = async (identifier) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/otp",
    { identifier }
  );
  return response.data;
};

// ✅ Verify OTP for password reset
export const verifyPasswordResetOtp = async (email, otp) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/verify-otp",
    { email, otp }
  );
  return response.data;
};

// ✅ Reset Password with verified OTP
export const resetPassword = async (email, otp, newPassword) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/reset",
    { email, otp, newPassword }
  );
  return response.data;
};