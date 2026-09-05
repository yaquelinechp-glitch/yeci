import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { partnersApi, coursesApi, partnerTypesApi } from '../../services/api';
import type { User } from '../../types';

interface PartnerCourseProgress {
  course_id: string;
  title: string;
  level: string;
  completed: boolean;
  video_count: number;
  progress_pct: number;
  phase_config: { phase: number; days: number }[];
  videos: { id: string; phase: number; day: number }[];
  completed_videos: string[];
}

interface PartnerType {
  key: string;
  label: string;
  default_commission_rate: number;
  is_active: boolean;
  sort_order: number;
}

export default function PartnersList({ partners, filter }: { partners: User[]; filter: string }) {
  const { t } = useTranslation();
  const [types, setTypes] = useState<PartnerType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);
  const [partnerProgress, setPartnerProgress] = useState<PartnerCourseProgress[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => { partnerTypesApi.list().then((r) => setTypes(r.data || [])).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedPartner) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedPartner(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPartner]);

  const handleDoubleClick = async (p: User) => {
    setSelectedPartner(p);
    setProgressLoading(true);
    setPartnerProgress([]);
    try {
      const r = await coursesApi.getPartnerProgress(p.id);
      setPartnerProgress(r.data || []);
    } catch {
      setPartnerProgress([]);
    } finally {
      setProgressLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'activo') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (s === 'solicitado') return 'bg-amber-100 text-amber-700 border border-amber-200';
    if (s === 'en_revision') return 'bg-blue-100 text-blue-700 border border-blue-200';
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const handleTypeChange = async (p: User, next: string) => {
    const pt = types.find((x) => x.key === next);
    const row = document.getElementById(`row-${p.id}`);
    row?.classList.add('opacity-60');
    const nextRate = pt ? pt.default_commission_rate : p.commission_rate;
    setPartners((ps) => ps.map((x) => x.id === p.id ? { ...x, partner_type: next, commission_rate: nextRate } : x));
    try {
      await partnersApi.update(p.id, { partner_type: next, commission_rate: nextRate });
    } catch {
      setPartners((ps) => ps.map((x) => x.id === p.id ? { ...x, partner_type: p.partner_type, commission_rate: p.commission_rate } : x));
    }
    row?.classList.remove('opacity-60');
  };

  const handleRateBlur = async (p: User, next: number | null) => {
    if (next === null || next === p.commission_rate) return;
    const prev = p.commission_rate;
    setPartners((ps) => ps.map((x) => x.id === p.id ? { ...x, commission_rate: next } : x));
    try {
      await partnersApi.update(p.id, { commission_rate: next });
    } catch {
      setPartners((ps) => ps.map((x) => x.id === p.id ? { ...x, commission_rate: prev } : x));
    }
  };

  const filteredPartners = partners.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.company_name.toLowerCase().includes(search.toLowerCase()) ||
      p.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filteredPartners.length}</span> de {partners.length} {t('admin.partners')}
        </div>
        <div className="flex-1"></div>
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 w-64"
          />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('common.company')}</th>
              <th>{t('common.contact')}</th>
              <th>{t('common.email')}</th>
              <th>{t('common.status')}</th>
              <th>{t('admin.partnerTypeLabel')}</th>
              <th>{t('common.commission')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPartners.map((p) => (
              <tr
                key={p.id}
                id={`row-${p.id}`}
                onDoubleClick={() => handleDoubleClick(p)}
                className="cursor-pointer hover:bg-aconso-50/50 transition-colors"
                title={t('admin.doubleClickToView')}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-aconso-500 to-aconso-700 text-white flex items-center justify-center text-sm font-bold">
                      {p.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{p.company_name}</span>
                  </div>
                </td>
                <td className="text-gray-600">{p.contact_name}</td>
                <td className="text-gray-500">{p.email}</td>
                <td>
                  <span className={`badge ${statusColor(p.status)}`}>{t(`admin.statuses.${p.status}`)}</span>
                </td>
                <td>
                  <select
                    value={p.partner_type || ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleTypeChange(p, e.target.value)}
                    className="text-xs font-medium rounded-md px-2 py-1 bg-aconso-50 text-aconso-700 border border-aconso-200 focus:outline-none focus:ring-2 focus:ring-aconso-500/20 cursor-pointer max-w-[140px]"
                  >
                    {types.map((pt) => (
                      <option key={pt.key} value={pt.key}>{pt.label}</option>
                    ))}
                  </select>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      defaultValue={p.commission_rate}
                      onBlur={(e) => handleRateBlur(p, e.target.value === '' ? null : parseFloat(e.target.value))}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      className="w-20 font-medium text-gray-900 text-right border border-transparent hover:border-gray-200 focus:border-aconso-500 focus:outline-none focus:ring-2 focus:ring-aconso-500/20 rounded-md px-2 py-1"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPartners.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">{t('common.noData')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={() => setSelectedPartner(null)}>
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-200 mt-16" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aconso-500 to-aconso-700 text-white flex items-center justify-center font-bold text-lg">
                  {selectedPartner.company_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedPartner.company_name}</h2>
                  <p className="text-sm text-gray-500">{selectedPartner.contact_name} · {selectedPartner.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {progressLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
                </div>
              ) : partnerProgress.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3"></div>
                  <p className="text-gray-400">{t('courses.noCourses')}</p>
                </div>
              ) : (() => {
                const totalVids = partnerProgress.reduce((s, c) => s + (c.videos?.length || 0), 0);
                const doneVids = partnerProgress.reduce((s, c) => s + (c.completed_videos?.length || 0), 0);
                const overallPct = totalVids > 0 ? Math.round((doneVids / totalVids) * 100) : 0;
                const doneCourses = partnerProgress.filter((c) => c.completed).length;
                const totalCourses = partnerProgress.length;

                const allVidsFlat = partnerProgress.flatMap((c) => c.videos || []);
                const allPhases = [...new Set(allVidsFlat.map((v) => v.phase).filter(Boolean))].sort((a, b) => a - b);
                const completedVidsSet = new Set(partnerProgress.flatMap((c) => c.completed_videos || []));

                return (
                  <>
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: t('admin.totalCourses'), value: `${doneCourses}/${totalCourses}`, color: 'text-aconso-600', bg: 'bg-aconso-50' },
                        { label: t('admin.totalVideos'), value: `${doneVids}/${totalVids}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: t('courses.progress'), value: `${overallPct}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
                      ].map((s) => (
                        <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Donut + overview */}
                    <div className="flex items-center gap-8 mb-8 p-5 bg-gray-50 rounded-xl">
                      <div className="relative w-28 h-28 shrink-0">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke={overallPct >= 70 ? '#059669' : overallPct >= 40 ? '#f59e0b' : '#0070AD'} strokeWidth="3" strokeDasharray={`${overallPct} ${100 - overallPct}`} strokeLinecap="round" className="transition-all duration-700" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-xl font-bold ${overallPct >= 70 ? 'text-emerald-600' : overallPct >= 40 ? 'text-amber-600' : 'text-aconso-600'}`}>{overallPct}%</div>
                            <div className="text-[10px] text-gray-400">{t('admin.overallProgress')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 mb-2">{t('admin.trainingOverview')}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {allPhases.map((ph) => {
                            const phaseVids = allVidsFlat.filter((v) => v.phase === ph);
                            const phaseDone = phaseVids.filter((v) => completedVidsSet.has(v.id)).length;
                            const pDone = phaseVids.length > 0 ? Math.round((phaseDone / phaseVids.length) * 100) : 0;
                            const isComplete = pDone === 100;
                            const isActive = pDone > 0 && pDone < 100;
                            return (
                              <div key={ph} className="flex items-center gap-1.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                                  isComplete ? 'bg-emerald-500' : isActive ? 'bg-aconso-500' : 'bg-gray-300'
                                }`}>
                                  {isComplete ? '' : ph}
                                </div>
                                {ph < allPhases[allPhases.length - 1] && (
                                  <div className={`w-4 h-0.5 ${isComplete ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Per-course timeline */}
                    <div className="space-y-4">
                      {partnerProgress.map((course) => {
                        const phaseConfig = course.phase_config?.length ? course.phase_config : [];
                        if (phaseConfig.length === 0) return null;
                        const cvids = course.completed_videos || [];
                        const courseDoneVids = cvids.length;
                        const courseTotalVids = course.videos?.length || 0;
                        const coursePct = courseTotalVids > 0 ? Math.round((courseDoneVids / courseTotalVids) * 100) : 0;
                        return (
                          <div key={course.course_id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-5 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                                  course.completed ? 'bg-emerald-500' : 'bg-aconso-500'
                                }`}>
                                  {course.completed ? '' : course.title.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-gray-900">{course.title}</div>
                                  <div className="text-xs text-gray-400">{courseDoneVids}/{courseTotalVids} videos · {coursePct}%</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${
                                    course.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-aconso-500 to-accent-500'
                                  }`} style={{ width: `${coursePct}%` }} />
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-gray-25">
                              <div className="relative pl-8 space-y-0">
                                {phaseConfig.map((pc, idx) => {
                                  const phaseVids = (course.videos || []).filter((v) => (v.phase || 1) === pc.phase);
                                  const phaseDone = phaseVids.filter((v) => cvids.includes(v.id)).length;
                                  const phaseComplete = phaseDone === phaseVids.length && phaseVids.length > 0;
                                  const phaseActive = phaseDone > 0 && !phaseComplete;
                                  const isLast = idx === phaseConfig.length - 1;
                                  return (
                                    <div key={pc.phase} className="relative pb-5 last:pb-0">
                                      {!isLast && (
                                        <div className={`absolute left-[7px] top-5 bottom-0 w-0.5 ${phaseComplete ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                                      )}
                                      <div className="flex items-start gap-4">
                                        <div className={`relative mt-0.5 w-4 h-4 rounded-full shrink-0 border-2 flex items-center justify-center ${
                                          phaseComplete ? 'bg-emerald-500 border-emerald-500' : phaseActive ? 'bg-aconso-500 border-aconso-500' : 'bg-white border-gray-300'
                                        }`}>
                                          {phaseComplete && (
                                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                          )}
                                          {phaseActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1">
                                            <div>
                                              <span className={`text-xs font-semibold ${phaseComplete ? 'text-emerald-700' : phaseActive ? 'text-aconso-700' : 'text-gray-400'}`}>
                                                {t('courses.phase')} {pc.phase}
                                              </span>
                                              <span className="text-xs text-gray-400 ml-2">{pc.days} {t('courses.days')}</span>
                                            </div>
                                            <span className={`text-[11px] font-medium ${phaseComplete ? 'text-emerald-600' : phaseActive ? 'text-aconso-600' : 'text-gray-400'}`}>
                                              {phaseComplete ? t('courses.completed') : phaseActive ? `${Math.round((phaseDone / phaseVids.length) * 100)}%` : `${phaseVids.length} ${t('courses.videos')}`}
                                            </span>
                                          </div>
                                          {phaseVids.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {phaseVids.map((v) => {
                                                const done = cvids.includes(v.id);
                                                return (
                                                  <div key={v.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                    done ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                                                  }`}>
                                                    {t('courses.day')} {v.day}{done ? ' ' : ''}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
