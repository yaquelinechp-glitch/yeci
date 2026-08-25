import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatWidget from '../ChatWidget';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;

  return (
    <>
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </>
  );
}
