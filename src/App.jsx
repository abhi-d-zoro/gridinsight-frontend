import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

// Dashboards
import AdminDashboard from "./dashboards/admin/AdminDashboard";
import AnalystDashboard from "./pages/AnalystDashboard";
import PlannerDashboard from "./pages/PlannerDashboard";
import ESGDashboard from "./pages/ESGDashboard";

// Role-based Route Guard
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Analyst Dashboard */}
        <Route
          path="/analyst"
          element={
            <RoleProtectedRoute allowedRoles={["ANALYST"]}>
              <AnalystDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Planner Dashboard */}
        <Route
          path="/planner"
          element={
            <RoleProtectedRoute allowedRoles={["PLANNER"]}>
              <PlannerDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* ESG Dashboard */}
        <Route
          path="/esg"
          element={
            <RoleProtectedRoute allowedRoles={["ESG"]}>
              <ESGDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
