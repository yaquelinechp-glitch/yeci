import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { reportsApi, partnersApi, coursesApi } from '../../services/api';
import type { AdminStats, User, Course } from '../../types';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }

const STAGE_COLORS: Record<string, string> = {
  registrada: 'bg-blue-500', cualificada: 'bg-indigo-500',
  propuesta_enviada: 'bg-purple-500', negociacion: 'bg-orange-500',
  ganada: 'bg-emerald-500', perdida: 'bg-red-400',
};

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
      <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-aconso-800 via-aconso-700 to-aconso-500 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">{t('admin.welcomeBack')}, {user?.first_name || user?.username || user?.company_name || ''}</h1>
          <p className="text-aconso-200 text-lg">{t('admin.welcomeDashboardDesc')}</p>
          <div className="flex gap-6 mt-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.total_partners}</span>
              <span className="text-aconso-200 text-sm">{t('admin.totalPartners')}</span>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.active_partners}</span>
              <span className="text-aconso-200 text-sm">{t('admin.activePartners')}</span>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{fmt(stats.total_revenue)}</span>
              <span className="text-aconso-200 text-sm">{t('admin.totalRevenue')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zona 1 · Estado — KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: t('admin.totalPartners'), value: String(stats.total_partners), icon: '👥', cls: 'border-l-aconso-500 bg-aconso-50/30' },
          { label: t('admin.activePartners'), value: String(stats.active_partners), icon: '✅', cls: 'border-l-emerald-500 bg-emerald-50/30' },
          { label: t('admin.totalDeals'), value: String(stats.total_deals), icon: '📋', cls: 'border-l-blue-500 bg-blue-50/30' },
          { label: t('admin.pipelineValue'), value: fmt(stats.total_pipeline_value), icon: '🔀', cls: 'border-l-purple-500 bg-purple-50/30', click: () => navigate('/admin/pipeline') },
          { label: t('admin.activeOpportunities'), value: String(stats.active_opportunities), icon: '🧭', cls: 'border-l-teal-500 bg-teal-50/30', click: () => navigate('/admin/pipeline') },
          { label: t('admin.weightedPipeline'), value: fmt(stats.weighted_pipeline_value), icon: '⚖️', cls: 'border-l-indigo-500 bg-indigo-50/30' },
        ].map((card) => (
          <div key={card.label} onClick={card.click} className={`card border-l-4 ${card.cls} p-4 ${card.click ? 'cursor-pointer hover:shadow-md' : ''} transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-xl font-extrabold text-gray-900">{card.value}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Zona 1 · Estado — pipeline por etapa */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm">🔀</span>
              {t('admin.pipelineTitle')}
            </h2>
            <button onClick={() => navigate('/admin/pipeline')} className="text-aconso-600 hover:text-aconso-700 font-semibold text-xs">{t('admin.goToPipeline')} →</button>
          </div>
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-gray-500">{t('admin.activeOpportunities')}: <strong className="text-gray-900">{stats.active_opportunities}</strong></span>
            <span className="text-gray-500">{t('admin.weightedPipeline')}: <strong className="text-gray-900">{fmt(stats.weighted_pipeline_value)}</strong></span>
          </div>
          <div className="space-y-2">
            {Object.entries(stats.pipeline_by_stage || {}).map(([stage, data]) => (
              <div key={stage} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_COLORS[stage] || 'bg-gray-400'}`} />
                <div className="flex-1 flex items-center justify-between text-sm">
                  <span className="text-gray-700 w-36">{pipelineStages[stage] || stage}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${STAGE_COLORS[stage] || 'bg-gray-400'}`}
                        style={{ width: `${stats.active_opportunities > 0 ? ((data.count || 0) / stats.active_opportunities) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-gray-900 font-semibold w-16 text-right">{data.count || 0}</span>
                  <span className="text-gray-500 w-24 text-right">{fmt(data.value || 0)}</span>
                </div>
              </div>
            ))}
            {(!stats.pipeline_by_stage || Object.keys(stats.pipeline_by_stage).length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">{t('pipeline.noOpportunities')}</p>
            )}
          </div>
        </div>

      {/* Zona 3 · Contexto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Partners */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">🏆</span>
            {t('admin.topPartners')}
          </h2>
          <div className="space-y-3">
            {stats.top_partners.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-400">{t('admin.dealsCount', { n: p.deals })}</div>
                </div>
                <span className="text-sm font-bold text-emerald-600">{fmt(p.revenue)}</span>
              </div>
            ))}
            {stats.top_partners.length === 0 && <p className="text-gray-400 text-sm text-center py-4">{t('admin.noActivity')}</p>}
          </div>
        </div>

        {/* Training */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">📚</span>
            {t('admin.trainingOverview')}
          </h2>
          <div className="space-y-3">
            {[
              { icon: '📖', label: t('admin.totalCourses'), value: courses.length, bg: 'bg-aconso-100' },
              { icon: '🎬', label: t('admin.totalVideos'), value: totalVideos, bg: 'bg-emerald-100' },
              { icon: '🏆', label: t('courses.phase'), value: courses.reduce((s, c) => s + ((c.phase_config || []).length), 0), bg: 'bg-amber-100' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center text-lg`}>{item.icon}</div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/admin/courses')} className="w-full mt-4 py-2.5 text-sm font-semibold text-aconso-600 hover:bg-aconso-50 rounded-xl transition-colors">
            {t('admin.goToCourses')} →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm">⚡</span>
            {t('admin.quickActions')}
          </h2>
          <div className="space-y-2">
            {[
              { label: t('admin.goToPartners'), sub: `${stats.total_partners} ${t('admin.totalPartners').toLowerCase()}`, icon: '👥', bg: 'bg-aconso-50', hoverBg: 'hover:bg-aconso-100', color: 'text-aconso-600', path: '/admin/partners' },
              { label: t('admin.goToPipeline'), sub: t('admin.opportunitiesCount', { n: stats.active_opportunities }), icon: '🔀', bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', color: 'text-purple-600', path: '/admin/pipeline' },
              { label: t('admin.goToCourses'), sub: `${courses.length} ${t('admin.totalCourses').toLowerCase()}`, icon: '📚', bg: 'bg-emerald-50', hoverBg: 'hover:bg-emerald-100', color: 'text-emerald-600', path: '/admin/courses' },
              { label: t('admin.goToReports'), sub: t('admin.topPartnersCount', { n: stats.top_partners.length }), icon: '📈', bg: 'bg-blue-50', hoverBg: 'hover:bg-blue-100', color: 'text-blue-600', path: '/admin/reports' },
              { label: t('admin.goToSecurity'), sub: stats.failed_logins_24h > 0 ? t('admin.failedLoginsCount', { n: stats.failed_logins_24h }) : t('admin.noAlerts'), icon: '🔒', bg: 'bg-red-50', hoverBg: 'hover:bg-red-100', color: 'text-red-600', path: '/admin/security' },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className={`w-full flex items-center gap-3 p-3 ${a.bg} ${a.hoverBg} rounded-xl transition-colors group text-left`}>
                <div className={`w-9 h-9 rounded-xl ${a.bg.replace('50', '200')} flex items-center justify-center text-base group-hover:scale-110 transition-transform`}>{a.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{a.label}</div>
                  <div className={`text-xs font-medium ${a.color}`}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Partners */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm">🕐</span>
            {t('admin.recentActivity')}
          </h2>
          <button onClick={() => navigate('/admin/partners')} className="text-sm font-semibold text-aconso-600 hover:text-aconso-700 transition-colors">
            {t('admin.goToPartners')} →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recentPartners.map((p) => (
            <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aconso-500 to-aconso-700 text-white flex items-center justify-center text-sm font-bold">
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