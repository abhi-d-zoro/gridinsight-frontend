import axios from "axios";

const auditApi = axios.create({
  baseURL: "http://localhost:8081/audit",
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token automatically
auditApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default auditApi;
