import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { reportsApi, partnersApi, coursesApi } from '../../services/api';
import type { AdminStats, User, Course } from '../../types';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }

const STAGE_GRADIENTS: Record<string, string> = {
  registrada: 'linear-gradient(90deg, #00d4aa, #00a896)',
  cualificada: 'linear-gradient(90deg, #4a90d9, #357abd)',
  propuesta_enviada: 'linear-gradient(90deg, #9b59b6, #8e44ad)',
  negociacion: 'linear-gradient(90deg, #ff8c42, #f57c00)',
  ganada: 'linear-gradient(90deg, #2ecc71, #27ae60)',
  perdida: 'linear-gradient(90deg, #ff6b6b, #ee5a6f)',
};

const KPI_GRADIENTS: string[] = [
  'linear-gradient(135deg, #00d4aa 0%, #4a90d9 100%)',
  'linear-gradient(135deg, #2ecc71 0%, #00a896 100%)',
  'linear-gradient(135deg, #ff8c42 0%, #ff6b6b 100%)',
  'linear-gradient(135deg, #4a90d9 0%, #9b59b6 100%)',
  'linear-gradient(135deg, #ffd700 0%, #ff8c42 100%)',
  'linear-gradient(135deg, #00a896 0%, #2ecc71 100%)',
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentPartners, setRecentPartners] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    reportsApi.adminStats().then((r) => setStats(r.data));
    partnersApi.list().then((r) => setRecentPartners(r.data.slice(0, 5)));
    coursesApi.list().then((r) => setCourses(r.data));
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-[#00d4aa] border-t-transparent rounded-full"></div>
    </div>
  );

  const totalVideos = courses.reduce((acc, c) => acc + (c.video_count || 0), 0);

  const pipelineStages: Record<string, string> = {
    registrada: t('pipeline.registrada'), cualificada: t('pipeline.cualificada'),
    propuesta_enviada: t('pipeline.propuestaEnviada'), negociacion: t('pipeline.negociacion'),
    ganada: t('pipeline.ganada'), perdida: t('pipeline.perdida'),
  };

  const statusBadge: Record<string, string> = {
    activo: 'bg-emerald-100 text-emerald-700',
    solicitado: 'bg-blue-100 text-blue-700',
    en_revision: 'bg-amber-100 text-amber-700',
    contrato_pendiente: 'bg-purple-100 text-purple-700',
    inactivo: 'bg-red-100 text-red-700',
  };
  const statusLabel: Record<string, string> = {
    activo: t('admin.statuses.activo'),
    solicitado: t('admin.statuses.solicitado'),
    en_revision: t('admin.statuses.en_revision'),
    contrato_pendiente: t('admin.statuses.contrato_pendiente'),
    inactivo: t('admin.statuses.inactivo'),
  };

  return (
    <div className="animate-fade-in space-y-6">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl text-white p-5 sm:p-8 animate-gradient shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0a3d5c 0%, #00d4aa 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('admin.welcomeBack')}, {user?.first_name || user?.username || user?.company_name || ''}</h1>
          <p className="text-white/80 text-base sm:text-lg">{t('admin.welcomeDashboardDesc')}</p>
          <div className="flex gap-4 mt-6 flex-wrap">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-4 min-w-[150px]">
              <div className="text-white text-[28px] font-bold leading-none">{stats.total_partners}</div>
              <div className="text-white/80 text-sm mt-1">{t('admin.totalPartners')}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-4 min-w-[150px]">
              <div className="text-white text-[28px] font-bold leading-none">{stats.active_partners}</div>
              <div className="text-white/80 text-sm mt-1">{t('admin.activePartners')}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-4 min-w-[150px]">
              <div className="text-white text-[28px] font-bold leading-none">{fmt(stats.total_revenue)}</div>
              <div className="text-white/80 text-sm mt-1">{t('admin.totalRevenue')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: t('admin.totalPartners'), value: String(stats.total_partners), click: () => navigate('/admin/partners') },
          { label: t('admin.activePartners'), value: String(stats.active_partners) },
          { label: t('admin.totalDeals'), value: String(stats.total_deals) },
          { label: t('admin.pipelineValue'), value: fmt(stats.total_pipeline_value), click: () => navigate('/admin/pipeline') },
          { label: t('admin.activeOpportunities'), value: String(stats.active_opportunities), click: () => navigate('/admin/pipeline') },
          { label: t('admin.weightedPipeline'), value: fmt(stats.weighted_pipeline_value) },
        ].map((card, i) => (
          <div key={card.label} onClick={card.click}
            className={`rounded-2xl p-4 text-white shadow-xl transition-all duration-300 animate-gradient ${card.click ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl' : 'hover:-translate-y-0.5'}`}
            style={{ background: KPI_GRADIENTS[i % KPI_GRADIENTS.length] }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xl font-bold ${card.value.length > 10 ? 'text-base' : 'text-2xl'}`}>{card.value}</span>
            </div>
            <p className="text-xs font-semibold text-white/90">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Global */}
      <div className="pm-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="pm-section-title flex items-center gap-2">
            {t('admin.pipelineTitle')}
          </h2>
          <button onClick={() => navigate('/admin/pipeline')} className="text-[#00a896] hover:text-[#00796b] font-semibold text-xs">{t('admin.goToPipeline')} →</button>
        </div>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500">{t('admin.activeOpportunities')}: <strong className="text-gray-900">{stats.active_opportunities}</strong></span>
          <span className="text-gray-500">{t('admin.weightedPipeline')}: <strong className="text-gray-900">{fmt(stats.weighted_pipeline_value)}</strong></span>
        </div>
        <div className="space-y-4">
          {Object.entries(stats.pipeline_by_stage || {}).map(([stage, data]) => (
            <div key={stage} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between text-sm gap-x-3 gap-y-1">
                  <span className="text-gray-700 flex-1 min-w-[8rem] font-medium">{pipelineStages[stage] || stage}</span>
                  <span className="text-gray-500 shrink-0">{data.count || 0} ·</span>
                  <span className="text-gray-900 font-bold shrink-0">{fmt(data.value || 0)}</span>
                </div>
                <div className="mt-2">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full rounded-full"
                      style={{ width: `${stats.active_opportunities > 0 ? ((data.count || 0) / stats.active_opportunities) * 100 : 0}%`, background: STAGE_GRADIENTS[stage] || 'linear-gradient(90deg, #9ca3af, #6b7280)' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!stats.pipeline_by_stage || Object.keys(stats.pipeline_by_stage).length === 0) && (
            <p className="text-gray-400 text-sm text-center py-4">{t('pipeline.noOpportunities')}</p>
          )}
        </div>
      </div>

      {/* Zona 3 · Contexto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top Partners */}
        <div className="pm-card p-6">
          <h2 className="pm-section-title mb-4 flex items-center gap-2">
            {t('admin.topPartners')}
          </h2>
          <div className="space-y-4">
            {stats.top_partners.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0"
                  style={{ background: KPI_GRADIENTS[i % KPI_GRADIENTS.length] }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                    <span className="text-sm font-bold text-[#00a896] shrink-0">{fmt(p.revenue)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{t('admin.dealsCount', { n: p.deals })}</div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${stats.top_partners.length > 0 ? ((p.revenue || 0) / Math.max(...stats.top_partners.map((x) => x.revenue || 0), 1)) * 100 : 0}%`, background: 'linear-gradient(90deg, #00d4aa, #00a896)' }} />
                  </div>
                </div>
              </div>
            ))}
            {stats.top_partners.length === 0 && <p className="text-gray-400 text-sm text-center py-4">{t('admin.noActivity')}</p>}
          </div>
        </div>

        {/* Training */}
        <div className="pm-card p-6">
          <h2 className="pm-section-title mb-4 flex items-center gap-2">
            {t('admin.trainingOverview')}
          </h2>
          <div className="space-y-3">
            {[
              { label: t('admin.totalCourses'), value: courses.length, color: '#00a896' },
              { label: t('admin.totalVideos'), value: totalVideos, color: '#2ecc71' },
              { label: t('courses.phase'), value: courses.reduce((s, c) => s + ((c.phase_config || []).length), 0), color: '#00d4aa' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/admin/courses')} className="w-full mt-4 py-2.5 text-sm font-semibold text-[#00a896] hover:bg-[rgba(0,212,170,0.1)] rounded-xl transition-colors">
            {t('admin.goToCourses')} →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="pm-card p-6">
          <h2 className="pm-section-title mb-4 flex items-center gap-2">
            {t('admin.quickActions')}
          </h2>
          <div className="space-y-2.5">
            {[
              { label: t('admin.goToPartners'), sub: `${stats.total_partners} ${t('admin.totalPartners').toLowerCase()}`, path: '/admin/partners' },
              { label: t('admin.goToPipeline'), sub: t('admin.opportunitiesCount', { n: stats.active_opportunities }), path: '/admin/pipeline' },
              { label: t('admin.goToCourses'), sub: `${courses.length} ${t('admin.totalCourses').toLowerCase()}`, path: '/admin/courses' },
              { label: t('admin.goToReports'), sub: t('admin.topPartnersCount', { n: stats.top_partners.length }), path: '/admin/reports' },
              { label: t('admin.goToSecurity'), sub: stats.failed_logins_24h > 0 ? t('admin.failedLoginsCount', { n: stats.failed_logins_24h }) : t('admin.noAlerts'), path: '/admin/security' },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 bg-gray-50 hover:bg-[rgba(0,212,170,0.15)] group text-left">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{a.label}</div>
                  <div className="text-xs font-medium text-[#00a896]">{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Partners */}
      <div className="pm-card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="pm-section-title flex items-center gap-2">
            {t('admin.recentActivity')}
          </h2>
          <button onClick={() => navigate('/admin/partners')} className="text-sm font-semibold text-[#00a896] hover:text-[#00796b] transition-colors">
            {t('admin.goToPartners')} →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recentPartners.map((p) => (
            <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-[rgba(0,212,170,0.06)] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg, #00d4aa, #4a90d9)' }}>
                  {p.company_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{p.company_name}</div>
                  <div className="text-xs text-gray-400">{p.contact_name} · {new Date(p.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <span className={`badge text-xs font-medium ${statusBadge[p.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabel[p.status] || p.status}
              </span>
            </div>
          ))}
          {recentPartners.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">{t('admin.noActivity')}</div>
          )}
        </div>
      </div>
    </div>
  );
}