import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function ForecastAccuracy({ zoneFilter, setZoneFilter, dateFilter, setDateFilter, setAccuracy, accuracy }) {
  const [loading, setLoading] = useState(false);

  const handleCheckAccuracy = () => {
    if (!zoneFilter || !dateFilter) {
      alert("Please enter Zone ID and Date");
      return;
    }
    setLoading(true);
    axiosInstance.get("/api/v1/forecast/accuracy", {
      params: { zoneId: zoneFilter, date: dateFilter }
    })
      .then(res => {
        console.log("Accuracy response:", res.data);
        setAccuracy(res.data);
      })
      .catch(err => console.error("Error fetching accuracy:", err))
      .finally(() => setLoading(false));
  };

  // 🔑 New: Export accuracy data as CSV
  const handleExportCSV = () => {
    if (!accuracy || !accuracy.hourlyData || accuracy.hourlyData.length === 0) {
      alert("No accuracy data available to export");
      return;
    }

    // Build CSV header + rows
    const header = ["Hour", "Forecast (MW)", "Actual (MW)", "Error %"];
    const rows = accuracy.hourlyData.map(row => [
      row.hour,
      row.forecastLoad,
      row.actualLoad,
      row.errorPercentage
    ]);

    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `forecast_accuracy_${accuracy.zoneId}_${accuracy.targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section>
      <h2 className="section-title">Forecast Accuracy</h2>
      <div className="search-bar">
        <input type="text" placeholder="Zone ID" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        <button className="btn-primary" onClick={handleCheckAccuracy}>{loading ? "Checking..." : "Check Accuracy"}</button>
        {accuracy && <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>}
      </div>

      {loading && <p>Loading accuracy data...</p>}

      {accuracy && (
        <div className="accuracy-summary">
          <p>Zone: {accuracy.zoneId}</p>
          <p>Date: {accuracy.targetDate}</p>
          <p>Overall MAPE: {accuracy.overallMape}%</p>
        </div>
      )}

      <table className="planner-table">
        <thead>
          <tr><th>Hour</th><th>Forecast (MW)</th><th>Actual (MW)</th><th>Error %</th></tr>
        </thead>
        <tbody>
          {accuracy?.hourlyData?.length > 0 ? (
            accuracy.hourlyData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.hour}</td>
                <td>{row.forecastLoad}</td>
                <td>{row.actualLoad}</td>
                <td>{row.errorPercentage}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4">No accuracy data available</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
