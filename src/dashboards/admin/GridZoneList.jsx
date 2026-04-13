import { useCallback, useEffect, useState } from "react";
import gridZoneApi from "../../api/gridZoneApi";
import CreateGridZone from "./CreateGridZone";
import EditGridZone from "./EditGridZone";
import DeleteGridZone from "./DeleteGridZone";
import "./GridZoneList.css";

export default function GridZoneList() {
  const [zones, setZones] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [editingZone, setEditingZone] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingZone, setDeletingZone] = useState(null);

  // Loading & Error State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filter State
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await gridZoneApi.get("");
      setZones(res.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch grid zones. Please try again.";
      setError(errorMsg);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Client-side filtering
  const filteredZones = zones.filter(zone => {
    if (searchText) {
      const search = searchText.toLowerCase();
      if (!zone.name?.toLowerCase().includes(search) && 
          !zone.region?.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (statusFilter && zone.status !== statusFilter) return false;
    if (regionFilter && zone.region !== regionFilter) return false;
    return true;
  });

  // Get unique regions for filter dropdown
  const uniqueRegions = [...new Set(zones.map(z => z.region).filter(Boolean))];

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "status-active";
      case "INACTIVE":
        return "status-inactive";
      case "MAINTENANCE":
        return "status-maintenance";
      default:
        return "status-default";
    }
  };

  const handleCreateSuccess = () => {
    setSuccessMessage("Grid zone created successfully!");
    fetchZones();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUpdateSuccess = () => {
    setSuccessMessage("Grid zone updated successfully!");
    fetchZones();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteSuccess = () => {
    setSuccessMessage("Grid zone deleted successfully!");
    fetchZones();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <>
      <div className="grid-zone-list-wrapper">
        {/* Error Message */}
        {error && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
            <button
              className="alert-close"
              onClick={() => setError(null)}
              aria-label="Close error message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success" role="status">
            <span className="alert-icon">✓</span>
            <span className="alert-text">{successMessage}</span>
            <button
              className="alert-close"
              onClick={() => setSuccessMessage(null)}
              aria-label="Close success message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="zone-toolbar">
          <input
            type="text"
            placeholder="Search zones..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search zones by name or region"
            disabled={loading}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter zones by status"
            disabled={loading}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            aria-label="Filter zones by region"
            disabled={loading}
          >
            <option value="">All Regions</option>
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <button
            className="action-btn zone-create-btn"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            aria-label="Add new grid zone"
          >
            + Add Zone
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading grid zones...</p>
          </div>
        )}

        {/* Zones Table */}
        {!loading && (
          <div className="table-scroll-container">
            <table className="zones-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Region</th>
                  <th>Voltage Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-icon">⚡</div>
                        <h3>No Grid Zones Found</h3>
                        <p>No zones match your search criteria or no zones exist yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((zone) => (
                    <tr
                      key={zone.id}
                      className={`zone-row ${hoveredRow === zone.id ? "hovered" : ""}`}
                      onMouseEnter={() => setHoveredRow(zone.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td>
                        <div className="name-cell">
                          <div className="zone-icon">⚡</div>
                          {zone.name}
                        </div>
                      </td>
                      <td>{zone.region}</td>
                      <td>
                        <span className="voltage-badge">{zone.voltageLevel}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(zone.status)}`}>
                          ● {zone.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="action-btn zone-edit-btn"
                            onClick={() => setEditingZone(zone)}
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn zone-delete-btn"
                            onClick={() => setDeletingZone(zone)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Record Count */}
        {!loading && filteredZones.length > 0 && (
          <div className="record-info">
            Showing {filteredZones.length} of {zones.length} zones
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGridZone
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreateSuccess}
      />

      <EditGridZone
        zone={editingZone}
        open={!!editingZone}
        onClose={() => setEditingZone(null)}
        onUpdated={handleUpdateSuccess}
      />

      <DeleteGridZone
        zone={deletingZone}
        open={!!deletingZone}
        onClose={() => setDeletingZone(null)}
        onDeleted={handleDeleteSuccess}
      />
    </>
  );
}
