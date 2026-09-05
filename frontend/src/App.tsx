import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import './i18n';

import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DashboardLayout from './components/layout/DashboardLayout';

import AdminDashboard from './pages/Admin/Dashboard';
import PartnersOverview from './pages/Admin/PartnersOverview';
import AdminPipeline from './pages/Admin/Pipeline';
import AdminCourses from './pages/Admin/Courses';
import AdminReports from './pages/Admin/Reports';
import AdminSecurity from './pages/Admin/Security';
import AdminLmsReport from './pages/Admin/LmsReport';
import AdminConflicts from './pages/Admin/Conflicts';
import AdminCostExport from './pages/Admin/CostExport';
import AdminCourseAnalytics from './pages/Admin/CourseAnalytics';

import PartnerDashboard from './pages/Partner/Dashboard';
import PartnerCourses from './pages/Partner/Courses';
import PartnerPipeline from './pages/Partner/Pipeline';
import PartnerTraining from './pages/Partner/Training';
import Commissions from './pages/Partner/Commissions';
import PartnerUsers from './pages/Partner/Users';
import PartnerConflicts from './pages/Partner/Conflicts';
import PartnerNotifications from './pages/Partner/Notifications';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="solicitudes" element={<Navigate to="/admin/partners" replace />} />
          <Route path="partners" element={<PartnersOverview />} />
          <Route path="pipeline" element={<AdminPipeline />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="reports" element={<AdminReports />} />
<Route path="security" element={<AdminSecurity />} />
<Route path="lms-report" element={<AdminLmsReport />} />
<Route path="conflicts" element={<AdminConflicts />} />
<Route path="cost-export" element={<AdminCostExport />} />
<Route path="course-analytics" element={<AdminCourseAnalytics />} />
</Route>

        <Route path="/partner" element={<ProtectedRoute role="socio"><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<PartnerDashboard />} />
          <Route path="pipeline" element={<PartnerPipeline />} />
          <Route path="courses" element={<PartnerCourses />} />
<Route path="training" element={<PartnerTraining />} />
<Route path="commissions" element={<Commissions />} />
<Route path="users" element={<PartnerUsers />} />
<Route path="conflicts" element={<PartnerConflicts />} />
<Route path="notifications" element={<PartnerNotifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
