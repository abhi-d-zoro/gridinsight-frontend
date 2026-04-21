import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import axiosInstance from "../../api/axiosInstance";

// API endpoints from OpenAPI spec
const API = {
  LOAD_OVERLAY: "/api/v1/load/overlay",
  LOAD_RECORDS: "/api/v1/load/records",
  LOAD_PEAKS: "/api/v1/load/peaks",
  TOPOLOGY_ZONES: "/api/v1/topology/zones",
  GRID_ZONES: "/api/v1/admin/grid-zones",
  DASHBOARD: "/api/v1/dashboard",
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GridStability() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpis, setKpis] = useState({
    currentLoad: 0,
    currentGeneration: 0,
    deficit: 0,
    peakLoad: 0,
    avgLoad: 0,
    capacityUtilization: 0,
    thresholdMW: 0,
    alertCount: 0,
  });
  const [overlayData, setOverlayData] = useState([]);
  const [peakEvents, setPeakEvents] = useState([]);
  const [gridZones, setGridZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [granularity, setGranularity] = useState("MIN_15");
  const [dataSource, setDataSource] = useState("loading");

  // Calculate time range parameters
  const getTimeParams = useCallback(() => {
    const now = new Date();
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const from = new Date(now - hours * 3600000);
    return {
      from: from.toISOString(),
      to: now.toISOString(),
    };
  }, [timeRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setDataSource("loading");

    try {
      // First fetch zones to get zone IDs
      const zonesRes = await axiosInstance.get(API.TOPOLOGY_ZONES, { params: { page: 0, size: 50 } });
      
      let zonesList = [];
      if (zonesRes.data?.items && zonesRes.data.items.length > 0) {
        zonesList = zonesRes.data.items;
        setGridZones(zonesList);
        
        // Set default zone if not selected
        if (!selectedZone && zonesList[0]) {
          setSelectedZone(String(zonesList[0].id));
        }
      } else {
        // Try fallback endpoint
        const fallbackRes = await axiosInstance.get(API.GRID_ZONES);
        if (Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          zonesList = fallbackRes.data;
          setGridZones(zonesList);
          if (!selectedZone && zonesList[0]) {
            setSelectedZone(String(zonesList[0].id));
          }
        }
      }

      if (zonesList.length === 0) {
        setError("No grid zones found. Please create zones in Admin Dashboard first.");
        setDataSource("no-data");
        setLoading(false);
        return;
      }

      const zoneId = selectedZone || String(zonesList[0]?.id);
      const { from, to } = getTimeParams();

      // Fetch load/generation overlay data - THE KEY API
      const [overlayRes, peaksRes, dashboardRes] = await Promise.allSettled([
        axiosInstance.get(API.LOAD_OVERLAY, {
          params: { zoneId, from, to, granularity }
        }),
        axiosInstance.get(API.LOAD_PEAKS, {
          params: { zoneId, page: 0, size: 10 }
        }),
        axiosInstance.get(API.DASHBOARD, { params: { period: timeRange } })
      ]);

      let hasRealData = false;

      // Process overlay data (demandMW, generatedMW, deficitMW, red)
      if (overlayRes.status === "fulfilled" && overlayRes.value.data?.points) {
        const overlay = overlayRes.value.data;
        const points = overlay.points;
        setOverlayData(points);
        hasRealData = true;

        // Calculate KPIs from overlay data
        const demands = points.map(p => p.demandMW || 0);
        const generations = points.map(p => p.generatedMW || 0);
        const deficits = points.map(p => p.deficitMW || 0);
        const alertPoints = points.filter(p => p.red).length;

        const currentDemand = demands[demands.length - 1] || 0;
        const currentGen = generations[generations.length - 1] || 0;
        const maxCapacity = overlay.thresholdMW || Math.max(...generations) * 1.2;

        setKpis({
          currentLoad: currentDemand.toFixed(1),
          currentGeneration: currentGen.toFixed(1),
          deficit: (currentGen - currentDemand).toFixed(1),
          peakLoad: Math.max(...demands).toFixed(1),
          avgLoad: (demands.reduce((a, b) => a + b, 0) / demands.length).toFixed(1),
          capacityUtilization: ((currentDemand / maxCapacity) * 100).toFixed(1),
          thresholdMW: overlay.thresholdMW || 0,
          alertCount: alertPoints,
        });
      }

      // Process peak events
      if (peaksRes.status === "fulfilled" && peaksRes.value.data?.content) {
        setPeakEvents(peaksRes.value.data.content);
        hasRealData = true;
      }

      // Process dashboard summary
      if (dashboardRes.status === "fulfilled" && dashboardRes.value.data) {
        const dashboard = dashboardRes.value.data;
        setKpis(prev => ({
          ...prev,
          renewableShare: dashboard.avgRenewableShare,
          emissionsAvoided: dashboard.totalEmissionsAvoided,
        }));
      }

      setDataSource(hasRealData ? "real" : "no-data");

    } catch (err) {
      console.error("Error fetching grid stability data:", err);
      setError("Failed to connect to backend. Please ensure the server is running.");
      setDataSource("error");
      setGridZones([]);
      setOverlayData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, timeRange, granularity, getTimeParams]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Chart configuration using overlay data
  const chartData = {
    labels: overlayData.slice(-48).map(d => {
      const ts = new Date(d.ts);
      return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: "Generation (MW)",
        data: overlayData.slice(-48).map(d => d.generatedMW || 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: "Demand (MW)",
        data: overlayData.slice(-48).map(d => d.demandMW || 0),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: "Threshold (MW)",
        data: overlayData.slice(-48).map(() => kpis.thresholdMW || 0),
        borderColor: "#ef4444",
        borderDash: [5, 5],
        borderWidth: 2,
        fill: false,
        tension: 0,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'var(--text-primary)',
        },
      },
      tooltip: {
        backgroundColor: 'var(--card-bg)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-light)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} MW`
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'var(--border-light)',
        },
        ticks: {
          color: 'var(--text-secondary)',
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: {
          color: 'var(--border-light)',
        },
        ticks: {
          color: 'var(--text-secondary)',
          callback: (value) => `${value} MW`,
        },
        min: 0,
      },
    },
  };

  // Capacity utilization doughnut
  const capacityData = {
    labels: ["Used", "Available"],
    datasets: [
      {
        data: [parseFloat(kpis.capacityUtilization || 0), 100 - parseFloat(kpis.capacityUtilization || 0)],
        backgroundColor: [
          parseFloat(kpis.capacityUtilization || 0) > 90 ? "#ef4444" : 
          parseFloat(kpis.capacityUtilization || 0) > 75 ? "#f59e0b" : "#10b981",
          "rgba(148, 163, 184, 0.2)"
        ],
        borderWidth: 0,
        cutout: "75%",
      },
    ],
  };

  const balance = parseFloat(kpis.currentGeneration || 0) - parseFloat(kpis.currentLoad || 0);
  const isBalanced = balance >= 0;

  if (loading && overlayData.length === 0) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading grid stability data...</p>
      </div>
    );
  }

  // No data state
  if (dataSource === "no-data" || dataSource === "error") {
    return (
      <div className="stability-container">
        {error && (
          <div className="message-alert error">
            {error}
            <button className="alert-close" onClick={() => setError("")}>✕</button>
          </div>
        )}
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>No Grid Data Available</h4>
          <p>Please ensure the backend is running and grid zones are configured.</p>
          <button className="btn-primary" onClick={fetchData} style={{ marginTop: '16px' }}>
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stability-container">
      {/* Data Source Indicator */}
      <div className="data-source-badge" style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        marginBottom: '16px',
        background: dataSource === 'real' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        color: dataSource === 'real' ? '#10b981' : '#f59e0b',
        border: `1px solid ${dataSource === 'real' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
      }}>
        <span>{dataSource === 'real' ? '●' : '◐'}</span>
        {dataSource === 'real' ? 'Live Data from Backend' : 'Data derived from measurement points'}
      </div>

      {error && (
        <div className="message-alert warning">
          {error}
          <button className="alert-close" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-group">
          <label>Grid Zone</label>
          <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
            <option value="">All Zones</option>
            {gridZones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Time Range</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Granularity</label>
          <select value={granularity} onChange={(e) => setGranularity(e.target.value)}>
            <option value="MIN_1">1 Minute</option>
            <option value="MIN_5">5 Minutes</option>
            <option value="MIN_15">15 Minutes</option>
            <option value="HOUR">Hourly</option>
          </select>
        </div>
        <button className="btn-refresh" onClick={fetchData} disabled={loading}>
          {loading ? "⏳" : "🔄"} Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-content">
            <div className="kpi-label">Current Load</div>
            <div className="kpi-value">{kpis.currentLoad}</div>
            <div className="kpi-unit">MW</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🔋</div>
          <div className="kpi-content">
            <div className="kpi-label">Current Generation</div>
            <div className="kpi-value">{kpis.currentGeneration}</div>
            <div className="kpi-unit">MW</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <div className="kpi-label">Peak Load</div>
            <div className="kpi-value">{kpis.peakLoad}</div>
            <div className="kpi-unit">MW (24h)</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <div className="kpi-label">Avg Load</div>
            <div className="kpi-value">{kpis.avgLoad}</div>
            <div className="kpi-unit">MW (24h)</div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>Load vs Generation Trend</h3>
          <div className="chart-legend">
            <span className="legend-item generation">● Generation</span>
            <span className="legend-item load">● Load</span>
          </div>
        </div>
        <div className="chart-wrapper" style={{ height: "350px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-grid">
        {/* Capacity Utilization */}
        <div className="capacity-card">
          <h3>Capacity Utilization</h3>
          <div className="doughnut-wrapper">
            <Doughnut data={capacityData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
            <div className="doughnut-center">
              <span className="doughnut-value">{kpis.capacityUtilization}%</span>
              <span className="doughnut-label">Used</span>
            </div>
          </div>
          <div className="capacity-status">
            {parseFloat(kpis.capacityUtilization) > 90 ? (
              <span className="status-critical">⚠️ Critical Load</span>
            ) : parseFloat(kpis.capacityUtilization) > 75 ? (
              <span className="status-warning">⚡ High Load</span>
            ) : (
              <span className="status-normal">✓ Normal Load</span>
            )}
          </div>
        </div>

        {/* Grid Balance */}
        <div className="balance-card">
          <h3>Grid Balance Status</h3>
          <div className={`balance-indicator ${isBalanced ? 'balanced' : 'deficit'}`}>
            <div className="balance-icon">{isBalanced ? '✓' : '⚠'}</div>
            <div className="balance-text">
              {isBalanced ? 'Grid Balanced' : 'Generation Deficit'}
            </div>
            <div className="balance-value">
              {isBalanced ? '+' : ''}{balance.toFixed(1)} MW
            </div>
          </div>
          <div className="balance-bars">
            <div className="bar-item">
              <span className="bar-label">Generation</span>
              <div className="bar-track">
                <div className="bar-fill generation" style={{ width: `${Math.min((kpis.currentGeneration / 600) * 100, 100)}%` }}></div>
              </div>
              <span className="bar-value">{kpis.currentGeneration} MW</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">Load</span>
              <div className="bar-track">
                <div className="bar-fill load" style={{ width: `${Math.min((kpis.currentLoad / 600) * 100, 100)}%` }}></div>
              </div>
              <span className="bar-value">{kpis.currentLoad} MW</span>
            </div>
          </div>
        </div>

        {/* Zone Status */}
        <div className="zones-card">
          <h3>Zone Status Overview</h3>
          <div className="zones-list">
            {gridZones.slice(0, 5).map(zone => (
              <div key={zone.id} className={`zone-item ${zone.status?.toLowerCase()}`}>
                <span className="zone-status-dot"></span>
                <span className="zone-name">{zone.name}</span>
                <span className={`zone-badge ${zone.status?.toLowerCase()}`}>{zone.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
