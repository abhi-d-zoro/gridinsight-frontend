import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function MonthAheadForecast({ assetType, setAssetType }) {
  const [monthForecast, setMonthForecast] = useState([]);

  // Normalize API response: support multiple shapes, handle nulls, dedupe by date
  const normalizeForecasts = (rawArray) => {
    if (!Array.isArray(rawArray)) return [];
    const byDate = {};
    rawArray.forEach((item) => {
      const date = item.date || item.forecastDate || item.day || null;
      if (!date) return;

      // prefer explicit numeric forecast fields, fall back to other names
      const rawValue = item.forecastValueMW ?? item.forecastValue ?? item.forecastValueMw ?? null;
      const forecastValue = rawValue === null || rawValue === undefined ? null : Number(rawValue);

      const lower = item.confidenceIntervalLower ?? item.lowerBound ?? item.lower ?? null;
      const upper = item.confidenceIntervalUpper ?? item.upperBound ?? item.upper ?? null;

      // keep last occurrence for a date (so later API rows overwrite earlier ones)
      byDate[date] = {
        date,
        forecastValue,
        lowerBound: lower === null || lower === undefined ? null : Number(lower),
        upperBound: upper === null || upper === undefined ? null : Number(upper),
      };
    });

    // sort by date string
    return Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // form states
  const [forecastDate, setForecastDate] = useState("");
  const [forecastValue, setForecastValue] = useState("");
  const [zoneId, setZoneId] = useState("101");

  // 🔹 Fetch forecasts
  useEffect(() => {
    axiosInstance
  .get("/api/v1/forecast/month-ahead", { params: { assetType } })
  .then((res) => {
    console.log("Month-ahead response:", res.data);
    const data = res.data?.dailyForecasts ?? (Array.isArray(res.data) ? res.data : []);
    console.log("Parsed forecasts:", Array.isArray(data) ? data.length : 0, "records");
    setMonthForecast(normalizeForecasts(data));
  })
  .catch((err) =>
    console.error("Error fetching month-ahead forecast:", err)
  );
      
  }, [assetType]);

  // 🔹 Insert new forecast
  const handleInsertForecast = () => {
    if (!assetType || !forecastDate || !forecastValue) {
      alert("Please fill required fields");
      return;
    }

    axiosInstance
      .post("/api/v1/forecast/month-ahead", {
        assetType,
        zoneId,
        forecastDate,
        forecastValue: forecastValue
      })
      .then(() =>
        axiosInstance.get("/api/v1/forecast/month-ahead", { params: { assetType } })
      )
      .then((res) => {
        console.log("Updated month-ahead response:", res.data); // Debug log
        const data = res.data?.dailyForecasts ?? (Array.isArray(res.data) ? res.data : []);
        setMonthForecast(normalizeForecasts(data));
      })
      .catch((err) => console.error("Error inserting forecast:", err));

    // reset form
    setForecastDate("");
    setForecastValue("");
  };

    const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : "—");

  return (
    <section>
      <h2 className="section-title">Month-Ahead Forecast</h2>

      {/* Asset selector */}
      <div className="asset-selector">
        <label>Select Asset Type: </label>
        <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
          <option value="SOLAR">Solar</option>
          <option value="WIND">Wind</option>
          <option value="THERMAL">Thermal</option>
        </select>
      </div>

      {/* Insert form */}
      <div className="insert-forecast">
        <h3>Add New Forecast</h3>
        <input
          type="date"
          value={forecastDate}
          onChange={(e) => setForecastDate(e.target.value)}
        />
        <input
          type="number"
          placeholder="Forecast MW"
          value={forecastValue}
          onChange={(e) => setForecastValue(e.target.value)}
        />
        <input
          type="text"
          placeholder="Zone ID"
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
        />
        <button className="btn-primary" onClick={handleInsertForecast}>
          Add Forecast
        </button>
      </div>

      {/* Forecast table */}
      <table className="planner-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Forecast (MW)</th>
            <th>Lower Bound</th>
            <th>Upper Bound</th>
          </tr>
        </thead>
        <tbody>
          {monthForecast.length > 0 ? (
            monthForecast.map((day, idx) => (
              <tr key={`${day.date}-${idx}`}>
                <td>{day.date}</td>
                <td>{fmt(day.forecastValue)}</td>
                <td>{fmt(day.lowerBound)}</td>
                <td>{fmt(day.upperBound)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No forecast data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
