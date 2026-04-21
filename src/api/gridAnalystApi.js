import axios from "axios";

/* ===============================
   GRID ANALYST API INSTANCE
================================ */
const gridAnalystApi = axios.create({
  baseURL: "http://localhost:8081/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===============================
   REQUEST INTERCEPTOR
   Adds access token to requests
================================ */
gridAnalystApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ===============================
   API ENDPOINTS
================================ */

// Grid Stability APIs
export const fetchCurrentLoad = () => gridAnalystApi.get("/load-records/current");
export const fetchLoadHistory = (params) => gridAnalystApi.get("/load-records/history", { params });
export const fetchCurrentGeneration = () => gridAnalystApi.get("/generation-records/current");
export const fetchGenerationHistory = (params) => gridAnalystApi.get("/generation-records/history", { params });
export const fetchGridZones = () => gridAnalystApi.get("/admin/grid-zones");

// Alerts APIs
export const fetchAllAlerts = () => gridAnalystApi.get("/system/alerts");
export const fetchAlertById = (alertId) => gridAnalystApi.get(`/system/alerts/${alertId}`);
export const acknowledgeAlert = (alertId) => gridAnalystApi.post(`/alerts/${alertId}/acknowledge`, {});
export const closeAlert = (alertId, resolutionNote) => gridAnalystApi.post(`/alerts/${alertId}/close`, { resolutionNote });
export const fetchAlertActivity = (alertId) => gridAnalystApi.get(`/alerts/${alertId}/activity`);

// Forecasting APIs
export const fetchDayAheadForecast = (params) => gridAnalystApi.get("/forecast/day-ahead", { params });
export const fetchMonthAheadForecast = (params) => gridAnalystApi.get("/forecast/month-ahead", { params });
export const fetchForecastAccuracy = (params) => gridAnalystApi.get("/forecast/accuracy", { params });
export const fetchForecastJobs = () => gridAnalystApi.get("/forecast/jobs");

// Reports APIs
export const generateReport = (reportType, params) => gridAnalystApi.post(`/reports/${reportType}`, params);
export const fetchReportHistory = () => gridAnalystApi.get("/reports/history");
export const downloadReport = (reportId) => gridAnalystApi.get(`/reports/${reportId}/download`, { responseType: 'blob' });

export default gridAnalystApi;
