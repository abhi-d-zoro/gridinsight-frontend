import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
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
} from "chart.js";
import axiosInstance from "../../api/axiosInstance";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Overview() {
  const [dayAhead, setDayAhead] = useState(null);
  const [monthAhead, setMonthAhead] = useState(null);
  const [capacityPlans, setCapacityPlans] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(false);

  // Default date + zone
  const [selectedDate, setSelectedDate] = useState("2026-04-07");
  const [zoneId, setZoneId] = useState("101");

  useEffect(() => {
    if (!selectedDate || !zoneId) return;

    const loadOverviewData = async () => {
      setLoading(true);

      const results = await Promise.allSettled([
        axiosInstance.get("/api/v1/forecast/day-ahead", { params: { zoneId, date: selectedDate } }),
        axiosInstance.get("/api/v1/forecast/month-ahead", { params: { assetType: "SOLAR" } }),
        axiosInstance.get("/api/v1/capacity-plans"),
        axiosInstance.get("/api/v1/forecast/accuracy", { params: { zoneId, date: selectedDate } }),
      ]);

      const [dayRes, monthRes, capRes, accRes] = results;

      if (dayRes.status === "fulfilled") setDayAhead(dayRes.value.data);
      if (monthRes.status === "fulfilled") setMonthAhead(monthRes.value.data);
      if (capRes.status === "fulfilled") setCapacityPlans(capRes.value.data);
      if (accRes.status === "fulfilled") setAccuracy(accRes.value.data);

      setLoading(false);
    };

    loadOverviewData();
  }, [selectedDate, zoneId]);

  return (
    <section>
      <h2 className="section-title">Forecast Overview</h2>

      {/* Filters */}
      <div className="filters">
        <label>Date: </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <label>Zone: </label>
        <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
          <option value="101">Zone 101</option>
          <option value="102">Zone 102</option>
        </select>
      </div>

      {loading && <p>Loading overview data...</p>}

      {/* KPI Cards */}
      {(accuracy || capacityPlans.length > 0 || dayAhead) && (
        <div className="kpi-cards">
          <div className="kpi-card">
            <h3>Overall MAPE</h3>
            <p>{accuracy?.overallMape ?? "N/A"}%</p>
          </div>
          <div className="kpi-card">
            <h3>Capacity Plans</h3>
            <p>{capacityPlans.length} plans</p>
          </div>
          <div className="kpi-card">
            <h3>Day-Ahead Forecast</h3>
            <p>{dayAhead ? "Available" : "No data"}</p>
          </div>
        </div>
      )}

      {/* Day-Ahead Forecast Chart */}
      {Array.isArray(dayAhead?.hourlyData) && (
        <Line
          data={{
            labels: dayAhead.hourlyData.map((row) => `Hour ${row.hour}`),
            datasets: [
              {
                label: "Forecast (MW)",
                data: dayAhead.hourlyData.map((row) => row.forecastValueMW ?? 0),
                borderColor: "rgba(75,192,192,1)",
                tension: 0.3,
              },
              {
                label: "Actual (MW)",
                data: dayAhead.hourlyData.map((row) => row.actualValueMW ?? 0),
                borderColor: "rgba(255,99,132,1)",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: "Day-Ahead Forecast vs Actual" },
            },
          }}
        />
      )}

      {/* Month-Ahead Forecast Chart */}
      {Array.isArray(monthAhead?.dailyData) && (
        <Bar
          data={{
            labels: monthAhead.dailyData.map((row) => row.date),
            datasets: [
              {
                label: "Forecast (MW)",
                data: monthAhead.dailyData.map((row) => row.forecastValueMW ?? 0),
                backgroundColor: "rgba(54,162,235,0.6)",
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: "Month-Ahead Forecast" },
            },
          }}
        />
      )}

      {/* Capacity Plan Snapshot */}
      {capacityPlans.length > 0 && (
        <div className="capacity-summary">
          <h3>Latest Capacity Plan</h3>
          <p>
            Zone: {capacityPlans[capacityPlans.length - 1].zoneId} | Horizon:{" "}
            {capacityPlans[capacityPlans.length - 1].horizon} | Capacity:{" "}
            {capacityPlans[capacityPlans.length - 1].recommendedCapacityMw} MW
          </p>
        </div>
      )}

      {/* Capacity Plans Chart */}
      {Array.isArray(capacityPlans) && capacityPlans.length > 0 && (
        <Bar
          data={{
            labels: capacityPlans.map((plan) => plan.horizon),
            datasets: [
              {
                label: "Recommended Capacity (MW)",
                data: capacityPlans.map((plan) => plan.recommendedCapacityMw ?? 0),
                backgroundColor: "rgba(153,102,255,0.6)",
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: "Capacity Plans Overview" },
            },
          }}
        />
      )}

      {/* Forecast Accuracy Trend */}
      {Array.isArray(accuracy?.hourlyData) && (
        <Line
          data={{
            labels: accuracy.hourlyData.map((row) => `Hour ${row.hour}`),
            datasets: [
              {
                label: "Error %",
                data: accuracy.hourlyData.map((row) => row.errorPercentage ?? 0),
                borderColor: "rgba(255,206,86,1)",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: "Forecast Accuracy Trend" },
            },
          }}
        />
      )}

      {!loading &&
        !dayAhead &&
        !monthAhead &&
        capacityPlans.length === 0 &&
        !accuracy && <p>No overview data available</p>}
    </section>
  );
}
