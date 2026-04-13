import { useState, useEffect, useCallback, useRef } from "react";
import auditApi from "../../api/auditApi";
import "./AuditLogs.css";

export default function AuditLogs() {
  const [allLogs, setAllLogs] = useState([]); // Store all logs from API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Client-side pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [actionFilter, setActionFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  // Fetch all logs from API
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await auditApi.get("");
      
      if (Array.isArray(response.data)) {
        setAllLogs(response.data);
      } else {
        setAllLogs([]);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError(err.response?.data?.message || "Failed to fetch audit logs. Please try again.");
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch logs on mount
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to first page when filters change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [userSearch, actionFilter]);

  // Parse metadata to extract user identifier
  const getUserFromLog = (log) => {
    if (log.userEmail) return log.userEmail;
    
    if (log.metadata) {
      try {
        const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
        if (meta.identifier) return meta.identifier;
        if (meta.email) return meta.email;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return log.userId ? `User ID: ${log.userId}` : "N/A";
  };

  // Parse metadata to extract details
  const getDetailsFromLog = (log) => {
    if (log.metadata) {
      try {
        const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
        
        // Build a readable details string
        const parts = [];
        if (meta.name) parts.push(`Name: ${meta.name}`);
        if (meta.email && !meta.identifier) parts.push(`Email: ${meta.email}`);
        if (meta.role) parts.push(`Role: ${meta.role}`);
        if (meta.reason) parts.push(`Reason: ${meta.reason}`);
        if (meta.success === false) parts.push("Failed");
        if (meta.success === true && !parts.length) parts.push("Success");
        
        if (parts.length > 0) return parts.join(" | ");
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return log.resource || "N/A";
  };

  // Client-side filtering
  const filteredLogs = allLogs.filter(log => {
    // Exclude READ actions (view/access logs not needed)
    if (log.action === "READ") return false;
    
    // Action filter
    if (actionFilter && log.action !== actionFilter) return false;
    
    // User search
    if (userSearch) {
      const user = getUserFromLog(log).toLowerCase();
      if (!user.includes(userSearch.toLowerCase())) return false;
    }
    
    return true;
  });

  // Client-side pagination
  const totalRecords = filteredLogs.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);

  const clearFilters = () => {
    setActionFilter("");
    setUserSearch("");
    setPage(0);
  };

  const getActionBadgeClass = (action) => {
    if (!action) return "badge-default";
    
    if (action.includes("SUCCESS") || action === "LOGIN_SUCCESS") return "badge-success";
    if (action.includes("FAILURE") || action === "LOGIN_FAILURE") return "badge-danger";
    if (action.includes("CREATE") || action === "USER_CREATED") return "badge-primary";
    if (action.includes("UPDATE") || action === "USER_UPDATED") return "badge-warning";
    if (action.includes("DELETE") || action === "USER_DELETED") return "badge-danger";
    if (action.includes("PASSWORD") || action.includes("OTP")) return "badge-secondary";
    if (action === "LOGOUT") return "badge-info";
    
    return "badge-default";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAction = (action) => {
    if (!action) return "N/A";
    return action.replace(/_/g, " ");
  };

  return (
    <div className="audit-logs">
      {/* Filters */}
      <div className="audit-filters">
        <div className="filter-group">
          <label htmlFor="action-filter">Action</label>
          <select
            id="action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            disabled={loading}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILURE">Login Failure</option>
            <option value="LOGOUT">Logout</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DELETED">User Deleted</option>
            <option value="PASSWORD_RESET_SUCCESS">Password Reset Success</option>
            <option value="PASSWORD_RESET_REQUEST">Password Reset Request</option>
            <option value="PASSWORD_OTP_SENT">Password OTP Sent</option>
            <option value="PASSWORD_OTP_REQUEST">Password OTP Request</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="user-filter">User</label>
          <input
            type="text"
            id="user-filter"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by email..."
            disabled={loading}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="pageSize">Show:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <button className="btn-clear" onClick={clearFilters} disabled={loading}>
          Clear Filters
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
          <button className="error-close" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading audit logs...</p>
        </div>
      )}

      {/* Logs Table */}
      {!loading && (
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
                      <td className="user-cell">{getUserFromLog(log)}</td>
                      <td>
                        <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="details-cell">{getDetailsFromLog(log)}</td>
                      <td className="ip-cell">{log.ipAddress || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <p>No audit logs found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span className="record-count">Total: {totalRecords} records</span>
            <span className="page-info">Page {page + 1} of {totalPages}</span>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setPage(prev => prev - 1)}
              disabled={page === 0}
              aria-label="Previous page"
            >
              ← Previous
            </button>
            <button
              className="pagination-btn"
              onClick={() => setPage(prev => prev + 1)}
              disabled={page + 1 >= totalPages}
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
