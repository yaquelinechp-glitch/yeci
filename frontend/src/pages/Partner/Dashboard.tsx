import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportsApi, conflictsApi } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import type { PartnerStats, ConflictStats } from '../../types';

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [error, setError] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictStats | null>(null);
  useEffect(() => {
    reportsApi.partnerStats().then((r) => setStats(r.data)).catch(() => setError(true));
    conflictsApi.stats().then((r) => setConflicts(r.data)).catch(() => { });
  }, []);
  if (error) return <div className="text-red-500">{t('common.error')}</div>;
  if (!stats) return <div className="text-gray-400">{t('common.loading')}</div>;

  const cards = [
    { label: t('partner.activeDeals'), value: stats.active_deals, icon: '💼', color: 'border-aconso-500', bg: 'bg-aconso-50', iconBg: 'bg-aconso-100' },
    { label: t('partner.completedDeals'), value: stats.completed_deals, icon: '✅', color: 'border-emerald-500', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
    { label: t('partner.totalRevenue'), value: `$${stats.total_revenue.toLocaleString()}`, icon: '💰', color: 'border-purple-500', bg: 'bg-purple-50', iconBg: 'bg-purple-100' },
    { label: t('partner.commissionsEarned'), value: `$${stats.commissions_earned.toLocaleString()}`, icon: '📊', color: 'border-orange-500', bg: 'bg-orange-50', iconBg: 'bg-orange-100' },
    { label: t('partner.coursesEnrolled'), value: stats.courses_enrolled, icon: '📚', color: 'border-indigo-500', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100' },
    { label: t('partner.completionRate'), value: `${stats.completion_rate}%`, icon: '🎯', color: 'border-accent-500', bg: 'bg-accent-50', iconBg: 'bg-accent-100' },
  ];

  const programCards = [
    { label: t('dash.openConflicts'), value: conflicts ? String(conflicts.open ?? 0) : '—', icon: '⚔️', color: 'border-red-500', bg: 'bg-red-50', iconBg: 'bg-red-100', path: '/partner/conflicts' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('partner.welcome')} {user?.first_name || user?.username || user?.contact_name || 'Partner'} 👋</h1>
        <p className="text-gray-500 mt-1">{t('partner.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`kpi-card border-l-4 ${c.color}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center text-xl`}>
                {c.icon}
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-0.5">{c.label}</div>
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Program KPIs */}
      <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-aconso-100 flex items-center justify-center text-sm">🚀</span>
        {t('dash.program')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {programCards.map((c) => (
          <Link key={c.label} to={c.path} className={`kpi-card border-l-4 ${c.color} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center text-xl`}>
                {c.icon}
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-0.5">{c.label}</div>
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending Commission Alert */}
      {stats.pending_commissions > 0 && (
        <div className="card p-5 mb-6 border-l-4 border-amber-500 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-amber-800">{t('partner.pendingCommission')}</div>
              <div className="text-amber-700 text-2xl font-bold mt-1">${stats.pending_commissions.toLocaleString()}</div>
            </div>
            <Link to="/partner/commissions" className="btn-primary !py-2 !px-4 text-sm">
              {t('commissions.title')} →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/partner/courses" className="card card-interactive p-6 text-center group">
          <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center text-2xl mx-auto mb-3 group-hover:bg-accent-200 transition-colors">
            📚
          </div>
          <div className="font-semibold text-gray-800">{t('nav.courses')}</div>
          <div className="text-sm text-gray-500 mt-1">{t('partner.continueLearning')}</div>
        </Link>
      </div>
    </div>
  );
}
