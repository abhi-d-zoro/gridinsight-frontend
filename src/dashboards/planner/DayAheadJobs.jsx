import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function DayAheadJobs({ zoneFilter, setZoneFilter, dateFilter, setDateFilter }) {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [jobIdInput, setJobIdInput] = useState("");
  const [statusInput, setStatusInput] = useState("");

  useEffect(() => {
    axiosInstance.get("/api/v1/forecast/jobs")
      .then(res => setJobs(res.data))
      .catch(err => console.error("Error fetching jobs:", err));
  }, []);

  const handleSearch = () => {
    if (zoneFilter && dateFilter) {
      axiosInstance.get("/api/v1/forecast/jobs/by-zone-and-date", { params: { zoneId: zoneFilter, date: dateFilter } })
        .then(res => setJobs(res.data));
    } else if (zoneFilter) {
      axiosInstance.get("/api/v1/forecast/jobs/by-zone", { params: { zoneId: zoneFilter } })
        .then(res => setJobs(res.data));
    } else if (dateFilter) {
      axiosInstance.get("/api/v1/forecast/jobs/by-date", { params: { date: dateFilter } })
        .then(res => setJobs(res.data));
    }
  };

  const handleInsert = () => {
    if (!zoneFilter || !dateFilter) {
      alert("Please enter Zone ID and Date before running forecast");
      return;
    }
    axiosInstance.post("/api/v1/forecast/run", { zoneId: zoneFilter, targetDate: dateFilter })
      .then(() => axiosInstance.get("/api/v1/forecast/jobs").then(res => setJobs(res.data)));
  };

  const updateStatus = async () => {
    try {
      await axiosInstance.put(`/api/v1/forecast/job/${jobIdInput}/status`, null, {
        params: { status: statusInput }
      });
      alert(`Job ${jobIdInput} updated to ${statusInput}`);
      setShowModal(false);
      setJobIdInput("");
      setStatusInput("");
      axiosInstance.get("/api/v1/forecast/jobs").then(res => setJobs(res.data));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update job status");
    }
  };

  return (
    <section>
      <h2 className="section-title">Day-Ahead Forecast Jobs</h2>
      <div className="search-bar">
        <input type="text" placeholder="Zone ID" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        <button className="btn-secondary" onClick={() => {
          setZoneFilter(""); setDateFilter("");
          axiosInstance.get("/api/v1/forecast/jobs").then(res => setJobs(res.data));
        }}>Reset</button>
      </div>
      <div className="insert-job">
        <h3>Run New Forecast</h3>
        <button className="btn-success" onClick={handleInsert}>Run Forecast</button>
      </div>

      {/* NEW: Update Status Button */}
      <div className="sidebar-action">
        <button className="btn-warning" onClick={() => setShowModal(true)}>Update Status</button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Job Status</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Job ID:</label>
                <input type="text" value={jobIdInput} onChange={e => setJobIdInput(e.target.value)} placeholder="Enter Job ID" />
              </div>
              <div className="form-group">
                <label>New Status:</label>
                <select value={statusInput} onChange={e => setStatusInput(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="PENDING">PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={updateStatus}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <table className="planner-table">
        <thead>
          <tr>
            <th>Job ID</th><th>Zone</th><th>Target Date</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length > 0 ? jobs.map(job => (
            <tr key={job.id}>
              <td>{job.id}</td><td>{job.zoneId}</td><td>{job.targetDate}</td><td>{job.status}</td>
            </tr>
          )) : <tr><td colSpan="4">No jobs found</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
