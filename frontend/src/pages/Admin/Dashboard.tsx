import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { reportsApi, partnersApi, coursesApi, lmsApi } from '../../services/api';
import type { AdminStats, User, Course, LmsReport, LmsReportCourse, LmsReportPartner } from '../../types';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }

const STAGE_COLORS: Record<string, string> = {
  registrada: 'bg-blue-500', cualificada: 'bg-indigo-500',
  propuesta_enviada: 'bg-purple-500', negociacion: 'bg-orange-500',
  ganada: 'bg-emerald-500', perdida: 'bg-red-400',
};

function Donut({ values }: { values: { label: string; count: number; color: string }[] }) {
  const total = values.reduce((s, v) => s + v.count, 0);
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-4">—</p>;
  const r = 54; const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="130" height="130" viewBox="0 0 130 130" className="shrink-0">
        {values.map((v, i) => {
          const pct = v.count / total;
          const dash = c * pct;
          const el = (
            <circle key={i} cx="65" cy="65" r={r} fill="none" stroke={v.color} strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '65px 65px' }} />
          );
          offset += dash;
          return el;
        })}
        <text x="65" y="63" textAnchor="middle" className="fill-gray-900 text-lg font-bold" dominantBaseline="middle">{total}</text>
        <text x="65" y="78" textAnchor="middle" className="fill-gray-400 text-[10px]" dominantBaseline="middle">partners</text>
      </svg>
      <div className="space-y-2">
        {values.map((v) => (
          <div key={v.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
            <span className="text-sm text-gray-600 flex-1">{v.label}</span>
            <span className="text-sm font-semibold text-gray-900">{v.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarH({ label, sub, value, max, color }: { label: string; sub?: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-right">
        <div className="text-sm font-semibold text-gray-900 truncate">{label}</div>
        {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
      </div>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-900 w-20 text-right shrink-0">{fmt(value)}</span>
    </div>
  );
}

function CourseBar({ course, maxStarted }: { course: LmsReportCourse; maxStarted: number }) {
  const { t } = useTranslation();
  const pctS = maxStarted > 0 ? (course.started / maxStarted) * 100 : 0;
  const pctC = course.started > 0 ? (course.completed / course.started) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-900 truncate">{course.title || course.course_id}</span>
        <span className="text-gray-400 shrink-0 ml-2">{course.completion_rate}%</span>
      </div>
      <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-aconso-300 rounded-full" style={{ width: `${pctS}%` }} />
        <div className="absolute inset-y-0 left-0 bg-aconso-600 rounded-full" style={{ width: `${pctS * pctC / 100}%` }} />
      </div>
      <div className="flex gap-4 text-[11px] text-gray-400">
        <span>{course.started} {t('admin.started')}</span>
        <span>{course.completed} {t('admin.completed')}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentPartners, setRecentPartners] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lmsReport, setLmsReport] = useState<LmsReport | null>(null);

  useEffect(() => {
    reportsApi.adminStats().then((r) => setStats(r.data));
    partnersApi.list().then((r) => setRecentPartners(r.data.slice(0, 5)));
    coursesApi.list().then((r) => setCourses(r.data));
    lmsApi.report().then((r) => setLmsReport(r.data)).catch(() => {});
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

  /* ---- LMS derived data ---- */
  const lmsPartners = lmsReport?.partners || [];
  const lmsCourses = lmsReport?.courses || [];
  const certified = lmsPartners.filter((p) => p.cert_status === 'valid').length;
  const inTraining = lmsPartners.filter((p) => p.cert_status !== 'valid' && p.courses_started > 0).length;
  const notStarted = lmsPartners.length - certified - inTraining;
  const maxStarted = Math.max(1, ...lmsCourses.map((c) => c.started));

  return (
    <div className="animate-fade-in space-y-6">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-aconso-800 via-aconso-700 to-aconso-500 p-5 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('admin.welcomeBack')}, {user?.first_name || user?.username || user?.company_name || ''}</h1>
          <p className="text-aconso-200 text-base sm:text-lg">{t('admin.welcomeDashboardDesc')}</p>
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

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: t('admin.totalPartners'), value: String(stats.total_partners), cls: 'border-l-aconso-500 bg-aconso-50/30' },
          { label: t('admin.activePartners'), value: String(stats.active_partners), cls: 'border-l-emerald-500 bg-emerald-50/30' },
          { label: t('admin.totalDeals'), value: String(stats.total_deals), cls: 'border-l-blue-500 bg-blue-50/30' },
          { label: t('admin.pipelineValue'), value: fmt(stats.total_pipeline_value), cls: 'border-l-purple-500 bg-purple-50/30', click: () => navigate('/admin/pipeline') },
          { label: t('admin.activeOpportunities'), value: String(stats.active_opportunities), cls: 'border-l-teal-500 bg-teal-50/30', click: () => navigate('/admin/pipeline') },
          { label: t('admin.weightedPipeline'), value: fmt(stats.weighted_pipeline_value), cls: 'border-l-indigo-500 bg-indigo-50/30' },
        ].map((card) => (
          <div key={card.label} onClick={card.click} className={`card border-l-4 ${card.cls} p-4 ${card.click ? 'cursor-pointer hover:shadow-md' : ''} transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-extrabold text-gray-900">{card.value}</span>
            </div>
            <p className="text-xs font-medium text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline por etapa */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm"></span>
            {t('admin.pipelineTitle')}
          </h2>
          <button onClick={() => navigate('/admin/pipeline')} className="text-aconso-600 hover:text-aconso-700 font-semibold text-xs">{t('admin.goToPipeline')} →</button>
        </div>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500">{t('admin.activeOpportunities')}: <strong className="text-gray-900">{stats.active_opportunities}</strong></span>
          <span className="text-gray-500">{t('admin.weightedPipeline')}: <strong className="text-gray-900">{fmt(stats.weighted_pipeline_value)}</strong></span>
        </div>
        <div className="space-y-3">
          {Object.entries(stats.pipeline_by_stage || {}).map(([stage, data]) => (
            <div key={stage} className="flex items-start gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${STAGE_COLORS[stage] || 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between text-sm gap-x-3 gap-y-1">
                  <span className="text-gray-700 flex-1 min-w-[8rem]">{pipelineStages[stage] || stage}</span>
                  <span className="text-gray-900 font-semibold shrink-0">{data.count || 0}</span>
                  <span className="text-gray-500 shrink-0">{fmt(data.value || 0)}</span>
                </div>
                <div className="mt-1.5">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STAGE_COLORS[stage] || 'bg-gray-400'}`}
                      style={{ width: `${stats.active_opportunities > 0 ? ((data.count || 0) / stats.active_opportunities) * 100 : 0}%` }} />
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

      {/* Two-column: Top Partners by Revenue + Training Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Partners by Revenue (bar chart) */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm"></span>
            {t('admin.revenueByPartner')}
          </h2>
          <div className="space-y-3">
            {stats.top_partners.slice(0, 5).map((p) => (
              <BarH key={p.id} label={p.name} sub={t('admin.dealsCount', { n: p.deals })} value={p.revenue} max={stats.top_partners[0]?.revenue || 1} color="bg-emerald-500" />
            ))}
            {stats.top_partners.length === 0 && <p className="text-gray-400 text-sm text-center py-4">{t('admin.noActivity')}</p>}
          </div>
        </div>

        {/* Training Progress (donut + per-course bars) */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm"></span>
            {t('admin.trainingProgress')}
          </h2>
          {lmsReport ? (
            <div className="space-y-6">
              <Donut values={[
                { label: t('admin.certified'), count: certified, color: '#10b981' },
                { label: t('admin.inTraining'), count: inTraining, color: '#6366f1' },
                { label: t('admin.notStarted'), count: Math.max(0, notStarted), color: '#d1d5db' },
              ]} />
              {lmsCourses.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">{t('admin.courseProgress')}</h3>
                  {lmsCourses.slice(0, 4).map((c) => (
                    <CourseBar key={c.course_id} course={c} maxStarted={maxStarted} />
                  ))}
                </div>
              )}
              {lmsCourses.length === 0 && <p className="text-gray-400 text-sm text-center py-2">{t('admin.noCourses')}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: t('admin.totalCourses'), value: courses.length },
                { label: t('admin.totalVideos'), value: totalVideos },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-xl font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/admin/courses')} className="w-full mt-4 py-2.5 text-sm font-semibold text-aconso-600 hover:bg-aconso-50 rounded-xl transition-colors">
            {t('admin.goToCourses')} →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm"></span>
          {t('admin.quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { label: t('admin.goToPartners'), sub: `${stats.total_partners} ${t('admin.totalPartners').toLowerCase()}`, bg: 'bg-aconso-50', hoverBg: 'hover:bg-aconso-100', color: 'text-aconso-600', path: '/admin/partners' },
            { label: t('admin.goToPipeline'), sub: t('admin.opportunitiesCount', { n: stats.active_opportunities }), bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', color: 'text-purple-600', path: '/admin/pipeline' },
            { label: t('admin.goToCourses'), sub: `${courses.length} ${t('admin.totalCourses').toLowerCase()}`, bg: 'bg-emerald-50', hoverBg: 'hover:bg-emerald-100', color: 'text-emerald-600', path: '/admin/courses' },
            { label: t('admin.goToReports'), sub: t('admin.topPartnersCount', { n: stats.top_partners.length }), bg: 'bg-blue-50', hoverBg: 'hover:bg-blue-100', color: 'text-blue-600', path: '/admin/reports' },
            { label: t('admin.goToSecurity'), sub: stats.failed_logins_24h > 0 ? t('admin.failedLoginsCount', { n: stats.failed_logins_24h }) : t('admin.noAlerts'), bg: 'bg-red-50', hoverBg: 'hover:bg-red-100', color: 'text-red-600', path: '/admin/security' },
          ].map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className={`flex items-center gap-3 p-3 ${a.bg} ${a.hoverBg} rounded-xl transition-colors group text-left`}>
              <div>
                <div className="text-sm font-semibold text-gray-900">{a.label}</div>
                <div className={`text-xs font-medium ${a.color}`}>{a.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Partners */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm"></span>
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
