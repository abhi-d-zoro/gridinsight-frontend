import axiosInstance from "./axiosInstance";

// ✅ Login API (already working)
export const login = async (email, password) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/login",
    { email, password }
  );
  return response.data;
};

// ✅ Refresh Access Token API (STEP 15.3)
export const refreshAccessToken = async (refreshToken) => {
  const response = await axiosInstance.post(
    "/api/v1/auth/refresh",
    { refreshToken }
  );
  return response.data;
};