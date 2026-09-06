import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { reportsApi, partnersApi, coursesApi, lmsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { AdminStats, User, Course, LmsReport, LmsReportCourse } from '../../types';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }

function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n}`;
}

const STAGE_COLORS: Record<string, string> = {
  registrada: 'bg-blue-500', cualificada: 'bg-indigo-500',
  propuesta_enviada: 'bg-purple-500', negociacion: 'bg-orange-500',
  ganada: 'bg-emerald-500', perdida: 'bg-red-400',
};

const ICONS: Record<string, React.ReactNode> = {
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  activity: (<path d="M22 12h-4l-3 9L9 3l-3 9H2" />),
  briefcase: (<><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>),
  filter: (<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />),
  target: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  gauge: (<><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></>),
  cap: (<><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>),
  dollar: (<><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></>),
  shield: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>),
};

function CardIcon({ name, bg, color }: { name: string; bg: string; color: string }) {
  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {ICONS[name]}
      </svg>
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
        <span className="text-xs font-bold text-aconso-600 bg-aconso-50 px-2 py-0.5 rounded-full shrink-0 ml-2">{course.completion_rate}%</span>
      </div>
      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-aconso-200 rounded-full" style={{ width: `${pctS}%` }} />
        <div className="absolute inset-y-0 left-0 bg-aconso-600 rounded-full" style={{ width: `${pctS * pctC / 100}%` }} />
      </div>
      <div className="flex gap-4 text-[11px] text-gray-400">
        <span>{course.started} {t('admin.started')}</span>
        <span>{course.completed} {t('admin.completed')}</span>
      </div>
    </div>
  );
}

function SectionHeader({ icon, bg, color, title, action, onAction, actionText }: {
  icon: string; bg: string; color: string; title: string;
  action?: string; onAction?: () => void; actionText?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-bold text-gray-900 flex items-center gap-3">
        <span className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{ICONS[icon]}</svg>
        </span>
        {title}
      </h2>
      {action && onAction && (
        <button onClick={onAction} className="text-xs font-semibold text-aconso-600 hover:text-aconso-700 transition-colors shrink-0">
          {actionText || action} →
        </button>
      )}
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

  const partnerData = stats.top_partners.map((p) => ({ name: p.name, revenue: p.revenue, deals: p.deals }));

  const lmsPartners = lmsReport?.partners || [];
  const lmsCourses = lmsReport?.courses || [];
  const certified = lmsPartners.filter((p) => p.cert_status === 'valid').length;
  const inTraining = lmsPartners.filter((p) => p.cert_status !== 'valid' && p.courses_started > 0).length;
  const notStarted = lmsPartners.length - certified - inTraining;
  const maxStarted = Math.max(1, ...lmsCourses.map((c) => c.started));

  const trainingData = [
    { name: t('admin.certified'), value: certified, color: '#10b981' },
    { name: t('admin.inTraining'), value: inTraining, color: '#6366f1' },
    { name: t('admin.notStarted'), value: Math.max(0, notStarted), color: '#e5e7eb' },
  ];

  const kpis = [
    { icon: 'users', label: t('admin.totalPartners'), value: String(stats.total_partners), bg: 'bg-aconso-50', color: 'text-aconso-600' },
    { icon: 'activity', label: t('admin.activePartners'), value: String(stats.active_partners), bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { icon: 'briefcase', label: t('admin.totalDeals'), value: String(stats.total_deals), bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: 'filter', label: t('admin.pipelineValue'), value: fmt(stats.total_pipeline_value), bg: 'bg-purple-50', color: 'text-purple-600', click: () => navigate('/admin/pipeline') },
    { icon: 'target', label: t('admin.activeOpportunities'), value: String(stats.active_opportunities), bg: 'bg-teal-50', color: 'text-teal-600', click: () => navigate('/admin/pipeline') },
    { icon: 'dollar', label: t('admin.pendingCommissions'), value: fmt(stats.pending_commissions), bg: 'bg-amber-50', color: 'text-amber-600' },
  ];

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('admin.dashboardSubtitle')}</p>
      </div>

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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((card) => (
          <div key={card.label} onClick={card.click}
            className={`card p-4 sm:p-5 ${card.click ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''} transition-all`}>
            <div className="flex items-center justify-between">
              <CardIcon name={card.icon} bg={card.bg} color={card.color} />
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-3">{card.value}</div>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts: Top Partners by Revenue + Training Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Partners by Revenue */}
        <div className="card p-6">
          <SectionHeader icon="dollar" bg="bg-emerald-100" color="text-emerald-600" title={t('admin.revenueByPartner')} />
          {partnerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={partnerData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtShort(v)} />
                <Tooltip cursor={{ fill: 'rgba(16,185,129,0.06)' }} formatter={(value: any) => [fmt(Number(value)), t('admin.totalRevenue')]} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-16">{t('admin.noActivity')}</p>
          )}
          <div className="pt-4 mt-1 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-400">{t('admin.topPartners')}</span>
            <button onClick={() => navigate('/admin/reports')} className="text-aconso-600 hover:text-aconso-700 font-semibold text-xs">{t('admin.goToReports')} →</button>
          </div>
        </div>

        {/* Training Progress */}
        <div className="card p-6">
          <SectionHeader icon="cap" bg="bg-blue-100" color="text-blue-600" title={t('admin.trainingProgress')} action="/admin/courses" onAction={() => navigate('/admin/courses')} actionText={t('admin.goToCourses')} />
          {lmsReport ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative shrink-0">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie data={trainingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                        {trainingData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => [String(value), t('admin.partners')]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-gray-900 leading-none">{lmsPartners.length}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{t('admin.partners')}</span>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1 w-full">
                  {trainingData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-gray-600 flex-1">{d.name}</span>
                      <span className="text-sm font-bold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {lmsCourses.length > 0 && (
                <div className="space-y-4 pt-5 border-t border-gray-100">
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
        </div>
      </div>

      {/* Pipeline por etapa */}
      <div className="card p-6">
        <SectionHeader icon="filter" bg="bg-purple-100" color="text-purple-600" title={t('admin.pipelineTitle')} action="/admin/pipeline" onAction={() => navigate('/admin/pipeline')} actionText={t('admin.goToPipeline')} />
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

      {/* Quick Actions + Recent Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="card p-6">
          <SectionHeader icon="target" bg="bg-amber-100" color="text-amber-600" title={t('admin.quickActions')} />
          <div className="space-y-2">
            {[
              { icon: 'users', label: t('admin.goToPartners'), sub: `${stats.total_partners} ${t('admin.totalPartners').toLowerCase()}`, bg: 'bg-aconso-50', hoverBg: 'hover:bg-aconso-100', color: 'text-aconso-600', path: '/admin/partners' },
              { icon: 'filter', label: t('admin.goToPipeline'), sub: t('admin.opportunitiesCount', { n: stats.active_opportunities }), bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', color: 'text-purple-600', path: '/admin/pipeline' },
              { icon: 'cap', label: t('admin.goToCourses'), sub: `${courses.length} ${t('admin.totalCourses').toLowerCase()}`, bg: 'bg-emerald-50', hoverBg: 'hover:bg-emerald-100', color: 'text-emerald-600', path: '/admin/courses' },
              { icon: 'dollar', label: t('admin.goToReports'), sub: t('admin.topPartnersCount', { n: stats.top_partners.length }), bg: 'bg-blue-50', hoverBg: 'hover:bg-blue-100', color: 'text-blue-600', path: '/admin/reports' },
              { icon: 'shield', label: t('admin.goToSecurity'), sub: stats.failed_logins_24h > 0 ? t('admin.failedLoginsCount', { n: stats.failed_logins_24h }) : t('admin.noAlerts'), bg: 'bg-red-50', hoverBg: 'hover:bg-red-100', color: 'text-red-600', path: '/admin/security' },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className={`w-full flex items-center gap-3 p-3 ${a.bg} ${a.hoverBg} rounded-xl transition-colors group text-left`}>
                <CardIcon name={a.icon} bg={a.bg} color={a.color} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{a.label}</div>
                  <div className={`text-xs font-medium ${a.color} truncate`}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Partners */}
        <div className="card lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{ICONS.users}</svg>
              </span>
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
    </div>
  );
}