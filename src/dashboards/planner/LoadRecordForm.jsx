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
      <h2>Add Load Record</h2>
      <input type="text" placeholder="Zone ID" value={zoneId} onChange={e => setZoneId(e.target.value)} />
      <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
      <input type="number" placeholder="Demand MW" value={demandMw} onChange={e => setDemandMw(e.target.value)} />
      <select value={demandType} onChange={e => setDemandType(e.target.value)}>
        <option value="ACTUAL">ACTUAL</option>
        <option value="FORECAST">FORECAST</option>
      </select>
      <button onClick={handleSubmit}>Insert Record</button>
    </section>
  );
}
