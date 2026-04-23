import axiosInstance from "./axiosInstance";

export const login = async (email, password) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/login",
    { email, password }
  );
  return response.data;
};


export const refreshAccessToken = async (refreshToken) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/refresh",
    { refreshToken }
  );
  return response.data;
};


export const requestPasswordReset = async (email) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/otp",
    { email }
  );
  return response.data;
};


export const resetPassword = async (email, otp, newPassword) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/password/reset",
    { email, otp, newPassword }
  );
  return response.data;
};