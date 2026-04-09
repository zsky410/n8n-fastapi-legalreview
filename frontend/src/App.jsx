import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout.jsx";
import ClientLayout from "./layouts/ClientLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import OperationsLog from "./pages/admin/OperationsLog.jsx";
import RoutingRules from "./pages/admin/RoutingRules.jsx";
import SystemMonitor from "./pages/admin/SystemMonitor.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import CaseDetail from "./pages/client/CaseDetail.jsx";
import ClientDashboard from "./pages/client/ClientDashboard.jsx";
import CreateCase from "./pages/client/CreateCase.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="cases/new" element={<CreateCase />} />
        <Route path="cases/:id" element={<CaseDetail />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="routing" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="routing" element={<RoutingRules />} />
        <Route path="logs" element={<OperationsLog />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="system" element={<SystemMonitor />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
