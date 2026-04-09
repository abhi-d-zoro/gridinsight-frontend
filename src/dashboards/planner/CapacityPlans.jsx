import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function CapacityPlans() {
  const [plans, setPlans] = useState([]);
  const [planZone, setPlanZone] = useState("");
  const [planHorizon, setPlanHorizon] = useState("");
  const [planCapacity, setPlanCapacity] = useState("");
  const [planVersion, setPlanVersion] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  useEffect(() => {
    axiosInstance.get("/api/v1/capacity-plans")
      .then(res => setPlans(res.data))
      .catch(err => console.error("Error fetching plans:", err));
  }, []);

  const handleInsertPlan = () => {
    if (!planZone || !planHorizon || !planCapacity || !planVersion) {
      alert("Please fill all fields for capacity plan");
      return;
    }
    axiosInstance.post("/api/v1/capacity-plans", {
      zoneId: planZone,
      horizon: planHorizon,
      recommendedCapacityMw: planCapacity,
      planVersion: planVersion,
      description: planDescription
    })
      .then(() => {
        axiosInstance.get("/api/v1/capacity-plans")
          .then(res => setPlans(res.data));
        setPlanZone("");
        setPlanHorizon("");
        setPlanCapacity("");
        setPlanVersion("");
        setPlanDescription("");
      })
      .catch(err => console.error("Error inserting plan:", err));
  };

  // 🔑 Export a single plan by ID
  const handleExportPdf = async (id) => {
    try {
      const response = await axiosInstance.get(`/api/v1/capacity-plans/${id}/export-pdf`, {
        responseType: "blob" // important: treat response as binary
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `capacity-plan-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF");
    }
  };

  return (
    <section>
      <h2 className="section-title">Capacity Plans</h2>
      <div className="insert-plan">
        <h3>Add New Capacity Plan</h3>
        <div className="form-group">
          <input type="text" placeholder="Zone ID" value={planZone} onChange={e => setPlanZone(e.target.value)} />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Horizon (e.g. 2026-Q2)" value={planHorizon} onChange={e => setPlanHorizon(e.target.value)} />
        </div>
        <div className="form-group">
          <input type="number" placeholder="Capacity MW" value={planCapacity} onChange={e => setPlanCapacity(e.target.value)} />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Version" value={planVersion} onChange={e => setPlanVersion(e.target.value)} />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Description" value={planDescription} onChange={e => setPlanDescription(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleInsertPlan}>Add Plan</button>
      </div>

      <table className="planner-table">
        <thead>
          <tr>
            <th>Plan ID</th><th>Zone</th><th>Horizon</th>
            <th>Capacity (MW)</th><th>Version</th><th>Description</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.length > 0 ? (
            plans.map(plan => (
              <tr key={plan.id}>
                <td>{plan.id}</td>
                <td>{plan.zoneId}</td>
                <td>{plan.horizon}</td>
                <td>{plan.recommendedCapacityMw}</td>
                <td>{plan.planVersion}</td>
                <td>{plan.description}</td>
                <td>
                  <button className="btn-secondary btn-sm" onClick={() => handleExportPdf(plan.id)}>Export PDF</button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="7">No capacity plans found</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
