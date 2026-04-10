import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function MonthAheadForecast({ assetType, setAssetType }) {
  const [monthForecast, setMonthForecast] = useState([]);

  useEffect(() => {
    axiosInstance.get("/api/v1/forecast/month-ahead", { params: { assetType } })
      .then(res => setMonthForecast(res.data.dailyForecasts || res.data))
      .catch(err => console.error("Error fetching month-ahead forecast:", err));
  }, [assetType]);

  return (
    <section>
      <h2 className="section-title">Month-Ahead Forecast</h2>
      <div className="asset-selector">
        <label>Select Asset Type: </label>
        <select value={assetType} onChange={e => setAssetType(e.target.value)}>
          <option value="SOLAR">Solar</option>
          <option value="WIND">Wind</option>
          <option value="THERMAL">Thermal</option>
        </select>
      </div>
      <table className="planner-table">
        <thead>
          <tr><th>Date</th><th>Forecast (MW)</th><th>Lower Bound</th><th>Upper Bound</th></tr>
        </thead>
        <tbody>
          {monthForecast.length > 0 ? monthForecast.map((day, idx) => (
            <tr key={idx}>
              <td>{day.date}</td><td>{day.forecastValueMW}</td>
              <td>{day.confidenceIntervalLower}</td><td>{day.confidenceIntervalUpper}</td>
            </tr>
          )) : <tr><td colSpan="4">No forecast data available</td></tr>}
        </tbody>
      </table>
    </section>
  );
}