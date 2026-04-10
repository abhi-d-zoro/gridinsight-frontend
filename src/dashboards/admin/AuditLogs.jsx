import { useState, useEffect } from "react";
import adminApi from "../../api/adminApi";
import "./AuditLogs.css";

// Mock data for when API is not available
const MOCK_LOGS = [
  { id: 1, timestamp: "2026-04-10T14:32:00", user: "admin@gridinsight.com", action: "LOGIN", details: "User logged in successfully", ipAddress: "192.168.1.100" },
  { id: 2, timestamp: "2026-04-10T14:28:00", user: "admin@gridinsight.com", action: "CREATE_USER", details: "Created user: operator@gridinsight.com", ipAddress: "192.168.1.100" },
  { id: 3, timestamp: "2026-04-10T13:45:00", user: "planner@gridinsight.com", action: "LOGIN", details: "User logged in successfully", ipAddress: "192.168.1.105" },
  { id: 4, timestamp: "2026-04-10T12:30:00", user: "admin@gridinsight.com", action: "UPDATE_USER", details: "Updated role for: analyst@gridinsight.com", ipAddress: "192.168.1.100" },
  { id: 5, timestamp: "2026-04-10T11:15:00", user: "esg@gridinsight.com", action: "LOGIN", details: "User logged in successfully", ipAddress: "192.168.1.110" },
  { id: 6, timestamp: "2026-04-10T10:00:00", user: "admin@gridinsight.com", action: "DELETE_USER", details: "Deleted user: temp@gridinsight.com", ipAddress: "192.168.1.100" },
  { id: 7, timestamp: "2026-04-09T16:45:00", user: "operator@gridinsight.com", action: "LOGIN", details: "User logged in successfully", ipAddress: "192.168.1.108" },
  { id: 8, timestamp: "2026-04-09T15:30:00", user: "admin@gridinsight.com", action: "PASSWORD_RESET", details: "Password reset for: planner@gridinsight.com", ipAddress: "192.168.1.100" },
  { id: 9, timestamp: "2026-04-09T14:20:00", user: "analyst@gridinsight.com", action: "LOGOUT", details: "User logged out", ipAddress: "192.168.1.102" },
  { id: 10, timestamp: "2026-04-09T12:00:00", user: "admin@gridinsight.com", action: "CREATE_USER", details: "Created user: newuser@gridinsight.com", ipAddress: "192.168.1.100" },
  { id: 11, timestamp: "2026-04-09T10:30:00", user: "admin@gridinsight.com", action: "LOGIN", details: "User logged in successfully", ipAddress: "192.168.1.100" },
  { id: 12, timestamp: "2026-04-08T17:00:00", user: "planner@gridinsight.com", action: "LOGOUT", details: "User logged out", ipAddress: "192.168.1.105" },
];

export default function AuditLogs() {
  const [logs, setLogs] = useState(MOCK_LOGS); // Initialize with mock data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    action: "",
    user: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch from API on mount (will fallback to mock data if fails)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await adminApi.get("/audit-logs");
        if (response.data && response.data.length > 0) {
          setLogs(response.data.content || response.data);
        }
      } catch (err) {
        console.warn("Audit logs API not available, using mock data");
        // Keep using mock data (already set as initial state)
      }
    };
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter.action && log.action !== filter.action) return false;
    if (filter.user && !log.user.toLowerCase().includes(filter.user.toLowerCase())) return false;
    return true;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilter({ action: "", user: "" });
    setCurrentPage(1);
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case "LOGIN":
        return "badge-success";
      case "LOGOUT":
        return "badge-info";
      case "CREATE_USER":
        return "badge-primary";
      case "UPDATE_USER":
        return "badge-warning";
      case "DELETE_USER":
        return "badge-danger";
      case "PASSWORD_RESET":
        return "badge-secondary";
      default:
        return "badge-default";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="audit-logs">
      {/* Filters */}
      <div className="audit-filters">
        <div className="filter-group">
          <label htmlFor="action-filter">Action</label>
          <select
            id="action-filter"
            name="action"
            value={filter.action}
            onChange={handleFilterChange}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE_USER">Create User</option>
            <option value="UPDATE_USER">Update User</option>
            <option value="DELETE_USER">Delete User</option>
            <option value="PASSWORD_RESET">Password Reset</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="user-filter">User</label>
          <input
            type="text"
            id="user-filter"
            name="user"
            value={filter.user}
            onChange={handleFilterChange}
            placeholder="Search by email..."
          />
        </div>

        <button className="btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="table-container">
        <div className="table-scroll-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="timestamp-cell">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="user-cell">{log.user}</td>
                    <td>
                      <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                        {log.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="details-cell">{log.details}</td>
                    <td className="ip-cell">{log.ipAddress}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    <div className="empty-state">
                      <span className="empty-icon">📭</span>
                      <p>No audit logs found for the selected filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Match UserList styling */}
      {totalPages > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span className="record-count">Total: {filteredLogs.length} records</span>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ← Previous
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
