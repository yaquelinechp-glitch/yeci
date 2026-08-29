import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatWidget from '../ChatWidget';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  if (!user) return <Navigate to="/login" />;

  return (
    <>
      <Header onMenuClick={openSidebar} />
      <div className="flex pt-16">
        <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen md:min-h-[calc(100vh-4rem)] overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </>
  );
}
