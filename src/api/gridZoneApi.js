import axios from "axios";

const gridZoneApi = axios.create({
  baseURL: "http://localhost:8081/api/v1/admin/grid-zones",
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token automatically
gridZoneApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default gridZoneApi;
