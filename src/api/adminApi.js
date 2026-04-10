import axios from "axios";

const adminApi = axios.create({
  baseURL: "http://localhost:8081/api/v1/auth/admin",
});

// attach token automatically
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default adminApi;