import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { reportsApi } from '../../services/api';
import type { AdminStats } from '../../types';

const COLORS = ['#0070ad', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

const DEAL_STATUS_KEYS: Record<string, string> = {
  necesita_acceso: 'deals.statuses.necesita_acceso',
  en_revision: 'deals.statuses.en_revision',
  en_implementacion: 'deals.statuses.en_implementacion',
  acceso_otorgado: 'deals.statuses.acceso_otorgado',
  completado: 'deals.statuses.completado',
  perdido: 'deals.statuses.perdido',
};

export default function AdminReports() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => { reportsApi.adminStats().then((r) => setStats(r.data)); }, []);

  if (!stats) return <div className="text-white/60">{t('common.loading')}</div>;

  const dealData = Object.entries(stats.deals_by_status || {}).map(([status, value]) => ({
    name: t(DEAL_STATUS_KEYS[status] || `deals.statuses.${status}`),
    value,
  }));

  const partnerData = stats.top_partners.map((p) => ({
    name: p.name,
    revenue: p.revenue,
    deals: p.deals,
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('reports.title')}</h1>
        <p className="text-white/70 mt-1">{t('reports.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="kpi-card border-l-4 border-aconso-500">
          <div className="text-sm text-gray-500 mb-1">{t('admin.totalPartners')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_partners}</div>
        </div>
        <div className="kpi-card border-l-4 border-emerald-500">
          <div className="text-sm text-gray-500 mb-1">{t('admin.totalRevenue')}</div>
          <div className="text-2xl font-bold text-gray-900">${stats.total_revenue.toLocaleString()}</div>
        </div>
        <div className="kpi-card border-l-4 border-purple-500">
          <div className="text-sm text-gray-500 mb-1">{t('admin.totalDeals')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_deals}</div>
        </div>
        <div className="kpi-card border-l-4 border-amber-500">
          <div className="text-sm text-gray-500 mb-1">{t('admin.pendingCommissions')}</div>
          <div className="text-2xl font-bold text-gray-900">${stats.pending_commissions.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Deal Status Distribution */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('reports.dealDistribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dealData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {dealData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Partner */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('reports.revenueByPartner')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partnerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#0070ad" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Partners Table */}
      <div className="table-container">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{t('admin.topPartners')}</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('common.company')}</th>
              <th>{t('admin.totalDeals')}</th>
              <th>{t('admin.totalRevenue')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.top_partners.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-aconso-100 text-aconso-600 flex items-center justify-center text-sm font-bold">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                </td>
                <td className="text-gray-600">{p.deals}</td>
                <td className="font-semibold text-emerald-600">${p.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
