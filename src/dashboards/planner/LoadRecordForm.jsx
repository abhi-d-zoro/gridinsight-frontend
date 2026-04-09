import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function LoadRecordForm() {
  const [zoneId, setZoneId] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [demandMw, setDemandMw] = useState("");
  const [demandType, setDemandType] = useState("ACTUAL");

  const handleSubmit = async () => {
    try {
      await axiosInstance.post("/api/v1/forecast/load-records", {
        zoneId,
        tsUtc: timestamp,   
        demandMw,
        demandType
      });
      alert("Load record inserted successfully!");
      setZoneId(""); setTimestamp(""); setDemandMw("");
    } catch (err) {
      console.error("Error inserting record:", err);
      alert("Failed to insert record");
    }
  };

  return (
    <section>
      <h2 className="section-title">Add Load Record</h2>
      <div className="insert-plan">
        <div className="form-group">
          <label>Zone ID</label>
          <input type="text" placeholder="Zone ID" value={zoneId} onChange={e => setZoneId(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Timestamp</label>
          <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Demand (MW)</label>
          <input type="number" placeholder="Demand MW" value={demandMw} onChange={e => setDemandMw(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Demand Type</label>
          <select value={demandType} onChange={e => setDemandType(e.target.value)}>
            <option value="ACTUAL">ACTUAL</option>
            <option value="FORECAST">FORECAST</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleSubmit}>Insert Record</button>
      </div>
    </section>
  );
}
