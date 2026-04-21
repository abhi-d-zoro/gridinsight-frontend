import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import axiosInstance from "../../api/axiosInstance";

// API endpoints (same as Planner Dashboard)
const API = {
  GRID_ZONES: "/api/v1/admin/grid-zones",
  TOPOLOGY_ZONES: "/api/v1/topology/zones",
  DAY_AHEAD: "/api/v1/forecast/day-ahead",
  MONTH_AHEAD: "/api/v1/forecast/month-ahead",
  ACCURACY: "/api/v1/forecast/accuracy",
  FORECAST_JOBS: "/api/v1/forecast/jobs",
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LoadForecasting() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dayAhead");
  const [dataSource, setDataSource] = useState("loading"); // 'real' | 'partial' | 'unavailable'
  
  // Filters
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [assetType, setAssetType] = useState("SOLAR");
  
  // Data states
  const [dayAheadForecast, setDayAheadForecast] = useState(null);
  const [monthAheadForecast, setMonthAheadForecast] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [zones, setZones] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setDataSource("loading");

    try {
      let hasRealData = false;
      let partialData = false;

      // Fetch zones first (required for other queries)
      const [topologyRes, zonesRes] = await Promise.allSettled([
        axiosInstance.get(API.TOPOLOGY_ZONES, { params: { page: 0, size: 50 } }),
        axiosInstance.get(API.GRID_ZONES)
      ]);

      // Process zones
      let zonesList = [];
      if (topologyRes.status === "fulfilled" && topologyRes.value.data?.items) {
        zonesList = topologyRes.value.data.items;
        hasRealData = true;
      } else if (zonesRes.status === "fulfilled" && Array.isArray(zonesRes.value.data)) {
        zonesList = zonesRes.value.data;
        hasRealData = true;
      }
      
      if (zonesList.length > 0) {
        setZones(zonesList);
        // Set first zone as default if not set
        if (!selectedZone && zonesList[0]) {
          setSelectedZone(String(zonesList[0].id));
        }
      } else {
        setZones([]);
        setError("No grid zones found. Please create zones in Admin Dashboard first.");
        setDataSource("unavailable");
        setLoading(false);
        return;
      }

      // Use selected zone or first available
      const zoneId = selectedZone || String(zonesList[0]?.id);

      // Fetch forecast data
      const [dayAheadRes, monthAheadRes, accuracyRes] = await Promise.allSettled([
        axiosInstance.get(API.DAY_AHEAD, { params: { zoneId, date: selectedDate } }),
        axiosInstance.get(API.MONTH_AHEAD, { params: { assetType } }),
        axiosInstance.get(API.ACCURACY, { params: { zoneId, date: selectedDate } })
      ]);

      // Day-ahead forecast (real data from backend)
      if (dayAheadRes.status === "fulfilled" && dayAheadRes.value.data) {
        setDayAheadForecast(dayAheadRes.value.data);
        hasRealData = true;
      } else {
        // No day-ahead data available
        setDayAheadForecast(null);
        partialData = true;
      }

      // Month-ahead forecast (real data from backend)
      if (monthAheadRes.status === "fulfilled" && monthAheadRes.value.data) {
        setMonthAheadForecast(monthAheadRes.value.data);
        hasRealData = true;
      } else {
        // No month-ahead data available
        setMonthAheadForecast(null);
        partialData = true;
      }

      // Accuracy (real data from backend)
      if (accuracyRes.status === "fulfilled" && accuracyRes.value.data) {
        setAccuracy(accuracyRes.value.data);
        hasRealData = true;
      } else {
        // No accuracy data available
        setAccuracy(null);
        partialData = true;
      }

      // Set data source status
      if (hasRealData && !partialData) {
        setDataSource("real");
      } else if (hasRealData && partialData) {
        setDataSource("partial");
        setError("Some forecast data is not available. Run forecasts from Planner Dashboard first.");
      } else {
        setDataSource("unavailable");
        setError("No forecast data available. Please run forecasts from the Planner Dashboard.");
      }

    } catch (err) {
      console.error("Error fetching forecast data:", err);
      setError("Failed to connect to backend. Please ensure the server is running.");
      setDataSource("error");
    } finally {
      setLoading(false);
    }
  }, [selectedZone, selectedDate, assetType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Day-ahead chart configuration
  const dayAheadChartData = {
    labels: dayAheadForecast?.hourlyData?.map(d => d.hour) || [],
    datasets: [
      {
        label: "Forecast Load (MW)",
        data: dayAheadForecast?.hourlyData?.map(d => d.forecastLoad) || [],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: "Actual Load (MW)",
        data: dayAheadForecast?.hourlyData?.map(d => d.actualLoad) || [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderDash: [5, 5],
      },
    ],
  };

  // Month-ahead chart configuration
  const monthAheadChartData = {
    labels: monthAheadForecast?.dailyData?.slice(0, 14).map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: "Forecast Load (MW)",
        data: monthAheadForecast?.dailyData?.slice(0, 14).map(d => d.forecastLoad) || [],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        padding: 12,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y?.toFixed(1) || 'N/A'} MW`
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 12 },
      },
      y: {
        grid: { color: 'var(--border-light)' },
        ticks: {
          callback: (value) => `${value} MW`,
        },
        min: 0,
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
  };

  // Export forecast data
  const handleExport = (type) => {
    let data, filename;
    
    if (type === "dayAhead" && dayAheadForecast) {
      const header = ["Hour", "Forecast (MW)", "Actual (MW)", "Confidence %", "Temperature"];
      const rows = dayAheadForecast.hourlyData.map(h => [
        h.hour, h.forecastLoad, h.actualLoad || "N/A", h.confidence?.toFixed(1), h.temperature?.toFixed(1)
      ]);
      data = [header, ...rows].map(r => r.join(",")).join("\n");
      filename = `day_ahead_forecast_${selectedZone}_${selectedDate}.csv`;
    } else if (type === "monthAhead" && monthAheadForecast) {
      const header = ["Date", "Forecast (MW)", "Min (MW)", "Max (MW)", "Peak Hour", "Confidence %"];
      const rows = monthAheadForecast.dailyData.map(d => [
        d.date, d.forecastLoad, d.minLoad, d.maxLoad, d.peakHour, d.confidence?.toFixed(1)
      ]);
      data = [header, ...rows].map(r => r.join(",")).join("\n");
      filename = `month_ahead_forecast_${assetType}.csv`;
    }

    if (data) {
      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading forecast data...</p>
      </div>
    );
  }

  return (
    <div className="forecast-container">
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
        background: dataSource === 'real' ? 'rgba(16, 185, 129, 0.1)' : 
                   dataSource === 'partial' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: dataSource === 'real' ? '#10b981' : 
               dataSource === 'partial' ? '#f59e0b' : '#ef4444',
        border: `1px solid ${dataSource === 'real' ? 'rgba(16, 185, 129, 0.2)' : 
                            dataSource === 'partial' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
      }}>
        <span>{dataSource === 'real' ? '●' : dataSource === 'partial' ? '◐' : '○'}</span>
        {dataSource === 'real' ? 'Live Forecast Data' : 
         dataSource === 'partial' ? 'Partial Data Available' : 
         'No Forecast Data - Run Forecasts in Planner'}
      </div>

      {error && (
        <div className="message-alert warning">
          {error}
          <button className="alert-close" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="forecast-tabs">
        <button
          className={`tab-btn ${activeTab === "dayAhead" ? "active" : ""}`}
          onClick={() => setActiveTab("dayAhead")}
        >
          📅 Day-Ahead Forecast
        </button>
        <button
          className={`tab-btn ${activeTab === "monthAhead" ? "active" : ""}`}
          onClick={() => setActiveTab("monthAhead")}
        >
          📈 Month-Ahead Forecast
        </button>
        <button
          className={`tab-btn ${activeTab === "accuracy" ? "active" : ""}`}
          onClick={() => setActiveTab("accuracy")}
        >
          🎯 Forecast Accuracy
        </button>
      </div>

      {/* Day-Ahead Tab */}
      {activeTab === "dayAhead" && (
        <div className="forecast-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Zone</label>
              <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                {zones.length === 0 && <option value="">No zones available</option>}
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button className="btn-secondary" onClick={() => handleExport("dayAhead")} disabled={!dayAheadForecast}>
              📥 Export CSV
            </button>
          </div>

          {/* No Data State */}
          {!dayAheadForecast && (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h4>No Day-Ahead Forecast Available</h4>
              <p>Run a day-ahead forecast from the Planner Dashboard for zone {selectedZone} on {selectedDate}.</p>
            </div>
          )}

          {/* Summary Cards */}
          {dayAheadForecast?.summary && (
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">📈</div>
                <div className="kpi-content">
                  <div className="kpi-label">Peak Load</div>
                  <div className="kpi-value">{dayAheadForecast.summary.peakLoad}</div>
                  <div className="kpi-unit">MW @ {dayAheadForecast.summary.peakHour}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">📉</div>
                <div className="kpi-content">
                  <div className="kpi-label">Min Load</div>
                  <div className="kpi-value">{dayAheadForecast.summary.minLoad}</div>
                  <div className="kpi-unit">MW @ {dayAheadForecast.summary.minHour}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">📊</div>
                <div className="kpi-content">
                  <div className="kpi-label">Avg Load</div>
                  <div className="kpi-value">{dayAheadForecast.summary.avgLoad}</div>
                  <div className="kpi-unit">MW</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">⚡</div>
                <div className="kpi-content">
                  <div className="kpi-label">Total Energy</div>
                  <div className="kpi-value">{dayAheadForecast.summary.totalEnergy}</div>
                  <div className="kpi-unit">MWh</div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>Hourly Load Forecast - {selectedDate}</h3>
            </div>
            <div className="chart-wrapper" style={{ height: "350px" }}>
              <Line data={dayAheadChartData} options={chartOptions} />
            </div>
          </div>

          {/* Hourly Data Table */}
          <div className="table-container">
            <h3>Hourly Breakdown</h3>
            <table className="analyst-table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Forecast (MW)</th>
                  <th>Actual (MW)</th>
                  <th>Confidence</th>
                  <th>Temperature</th>
                </tr>
              </thead>
              <tbody>
                {dayAheadForecast?.hourlyData?.slice(0, 12).map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.hour}</td>
                    <td className="value-highlight">{row.forecastLoad}</td>
                    <td>{row.actualLoad || "—"}</td>
                    <td>{row.confidence?.toFixed(1)}%</td>
                    <td>{row.temperature?.toFixed(1)}°C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Month-Ahead Tab */}
      {activeTab === "monthAhead" && (
        <div className="forecast-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Asset Type</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                <option value="SOLAR">Solar</option>
                <option value="WIND">Wind</option>
                <option value="HYDRO">Hydro</option>
                <option value="THERMAL">Thermal</option>
              </select>
            </div>
            <button className="btn-secondary" onClick={() => handleExport("monthAhead")} disabled={!monthAheadForecast}>
              📥 Export CSV
            </button>
          </div>

          {/* No Data State */}
          {!monthAheadForecast && (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <h4>No Month-Ahead Forecast Available</h4>
              <p>Run a month-ahead forecast from the Planner Dashboard for asset type {assetType}.</p>
            </div>
          )}

          {/* Summary Cards */}
          {monthAheadForecast?.summary && (
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">📊</div>
                <div className="kpi-content">
                  <div className="kpi-label">Avg Daily Load</div>
                  <div className="kpi-value">{monthAheadForecast.summary.avgDailyLoad}</div>
                  <div className="kpi-unit">MW</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">📈</div>
                <div className="kpi-content">
                  <div className="kpi-label">Max Peak Load</div>
                  <div className="kpi-value">{monthAheadForecast.summary.maxPeakLoad}</div>
                  <div className="kpi-unit">MW</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">📉</div>
                <div className="kpi-content">
                  <div className="kpi-label">Min Base Load</div>
                  <div className="kpi-value">{monthAheadForecast.summary.minBaseLoad}</div>
                  <div className="kpi-unit">MW</div>
                </div>
              </div>
              <div className="kpi-card trend">
                <div className="kpi-icon">📈</div>
                <div className="kpi-content">
                  <div className="kpi-label">Monthly Trend</div>
                  <div className="kpi-value" style={{ color: "#10b981" }}>{monthAheadForecast.summary.trend}</div>
                  <div className="kpi-unit">vs last month</div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {monthAheadForecast && (
            <div className="chart-container">
              <div className="chart-header">
                <h3>14-Day Load Forecast - {assetType}</h3>
              </div>
              <div className="chart-wrapper" style={{ height: "350px" }}>
                <Bar data={monthAheadChartData} options={barOptions} />
              </div>
            </div>
          )}

          {/* Daily Data Table */}
          {monthAheadForecast && (
          <div className="table-container">
            <h3>Daily Breakdown</h3>
            <table className="analyst-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Forecast (MW)</th>
                  <th>Min (MW)</th>
                  <th>Max (MW)</th>
                  <th>Peak Hour</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {monthAheadForecast?.dailyData?.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.date}</td>
                    <td className="value-highlight">{row.forecastLoad}</td>
                    <td>{row.minLoad}</td>
                    <td>{row.maxLoad}</td>
                    <td>{row.peakHour}:00</td>
                    <td>{row.confidence?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Accuracy Tab */}
      {activeTab === "accuracy" && (
        <div className="forecast-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Zone</label>
              <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                {zones.length === 0 && <option value="">No zones available</option>}
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button className="btn-refresh" onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>

          {/* No Data State */}
          {!accuracy && (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h4>No Forecast Accuracy Data Available</h4>
              <p>Run a forecast and wait for actual data to compare for zone {selectedZone} on {selectedDate}.</p>
            </div>
          )}

          {/* Accuracy KPIs */}
          {accuracy && (
            <div className="accuracy-summary">
              <div className="accuracy-card main">
                <div className="accuracy-label">Overall MAPE</div>
                <div className="accuracy-value" style={{ color: accuracy.overallMape < 5 ? "#10b981" : accuracy.overallMape < 10 ? "#f59e0b" : "#ef4444" }}>
                  {accuracy.overallMape}%
                </div>
                <div className="accuracy-indicator">
                  {accuracy.overallMape < 5 ? "✓ Excellent" : accuracy.overallMape < 10 ? "◐ Good" : "⚠ Needs Improvement"}
                </div>
              </div>
              <div className="accuracy-card">
                <div className="accuracy-label">RMSE</div>
                <div className="accuracy-value">{accuracy.overallRmse}</div>
                <div className="accuracy-unit">MW</div>
              </div>
              <div className="accuracy-card">
                <div className="accuracy-label">Zone</div>
                <div className="accuracy-value">{accuracy.zoneId}</div>
              </div>
              <div className="accuracy-card">
                <div className="accuracy-label">Date</div>
                <div className="accuracy-value">{accuracy.targetDate}</div>
              </div>
            </div>
          )}

          {/* Accuracy Table */}
          {accuracy && (
          <div className="table-container">
            <h3>Hourly Accuracy Breakdown</h3>
            <table className="analyst-table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Forecast (MW)</th>
                  <th>Actual (MW)</th>
                  <th>Error %</th>
                </tr>
              </thead>
              <tbody>
                {accuracy?.hourlyData?.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.hour}</td>
                    <td>{row.forecastLoad}</td>
                    <td>{row.actualLoad}</td>
                    <td>
                      <span className={`error-badge ${row.errorPercentage < 5 ? 'low' : row.errorPercentage < 10 ? 'medium' : 'high'}`}>
                        {row.errorPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
