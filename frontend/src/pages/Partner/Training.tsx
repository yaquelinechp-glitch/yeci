import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lmsApi } from '../../services/api';
import type { LmsOverview, TrainingResult, OnboardingSnapshot } from '../../types';
import { TRACKS, CERT_LEVELS, CERT_STATUS_COLORS } from '../../constants';

const TRACK_ORDER = ['cumplimiento', 'ventas', 'tecnica'];

export default function PartnerTraining() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<LmsOverview | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    lmsApi.overview().then((r) => setData(r.data)).catch(() => setData(null));
    lmsApi.onboarding().then((r) => setOnboarding(r.data)).catch(() => setOnboarding(null));
    setLoading(false);
  }, [i18n.language]);

  const downloadCertificate = async (courseId: string, courseTitle: string) => {
    setDownloading(courseId);
    setMsg(null);
    try {
      const r = await lmsApi.certificate(courseId);
      const url = r.data.certificate_url || r.data.url;
      if (!url) throw new Error('no-url');
      window.open(url, '_blank');
      setMsg({ ok: true, text: `${t('lms.certificateGenerated')}: ${courseTitle}` });
      lmsApi.overview().then((ov) => setData(ov.data)).catch(() => { });
    } catch {
      setMsg({ ok: false, text: t('common.error') });
    } finally {
      setDownloading(null);
    }
  };

  const startOnboarding = async () => {
    setStarting(true);
    try {
      const r = await lmsApi.startOnboarding();
      setOnboarding(r.data);
    } catch {
      setMsg({ ok: false, text: t('common.error') });
    } finally {
      setStarting(false);
    }
  };

  const toggleStep = async (key: string, done: boolean) => {
    setToggling(key);
    try {
      const r = await lmsApi.setOnboardingStep(key, done);
      setOnboarding(r.data);
    } catch {
      setMsg({ ok: false, text: t('common.error') });
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-16 text-center">
        <div className="text-5xl mb-4"></div>
        <p className="text-gray-500">{t('common.error')}</p>
      </div>
    );
  }

  const { certifications, training_results, tracks, completed_courses, won_opportunities, next_level } = data;
  const bestCert = certifications[0];
  const resultsByCourse = new Map<string, TrainingResult[]>();
  for (const r of training_results) {
    if (!resultsByCourse.has(r.course_id)) resultsByCourse.set(r.course_id, []);
    resultsByCourse.get(r.course_id)!.push(r);
  }

  let phaseStart = 0;
  const phasesWithRange = (onboarding?.phases || []).map((p) => {
    const start = phaseStart + 1;
    phaseStart = p.days;
    return { ...p, start, end: p.days };
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900"> {t('lms.title')}</h1>
        <p className="text-gray-500 mt-1">{t('lms.subtitle')}</p>
      </div>

      {msg && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Onboarding checklist */}
      <div className="card mb-6 p-6">
        <h2 className="font-bold text-gray-900 mb-1"> {t('lms.onboardingTitle')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('lms.onboardingSubtitle')}</p>

        {!onboarding || !onboarding.started ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="text-4xl mb-3"></div>
            <p className="text-gray-500 text-sm max-w-md mb-4">{t('lms.onboardingSubtitle')}</p>
            <button onClick={startOnboarding} disabled={starting} className="btn-primary">
              {starting ? t('common.loading') : '▶ ' + t('lms.startOnboarding')}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex-1 min-w-[220px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{t('lms.onboardingProgress', { done: onboarding.phases.reduce((a, p) => a + p.done, 0), total: onboarding.phases.reduce((a, p) => a + p.total, 0) })}</span>
                  <span className="font-bold">{onboarding.progress_pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${onboarding.progress_pct >= 100 ? 'bg-emerald-500' : 'bg-aconso-500'}`} style={{ width: `${onboarding.progress_pct}%` }} />
                </div>
              </div>
              {onboarding.next_milestone && (
                <div className="text-xs text-gray-500 bg-aconso-50 border border-aconso-100 rounded-lg px-3 py-1.5">
                   {t('lms.nextMilestone', { n: onboarding.next_milestone.days_left })}
                </div>
              )}
            </div>

            {onboarding.completed && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                 {t('lms.onboardingDone')} {t('lms.onboardingDoneSub')}
              </div>
            )}

            {onboarding.reminders.length > 0 && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-800 border border-amber-200">
                <div className="font-semibold mb-1"> {t('lms.remindersTitle')}</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {onboarding.reminders.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {phasesWithRange.map((phase) => (
                <div key={phase.key} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-800">
                      {t('lms.phaseDays', { start: phase.start, end: phase.end })}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                      {phase.done}/{phase.total}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {phase.steps.map((step) => (
                      <div key={step.key} className={`flex items-start gap-2.5 rounded-lg p-2 -mx-2 ${step.overdue ? 'bg-red-50' : ''}`}>
                        {step.auto ? (
                          <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${step.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {step.done ? '' : '·'}
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleStep(step.key, !step.done)}
                            disabled={toggling === step.key}
                            className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center text-[11px] font-bold transition-colors ${step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-aconso-400'}`}
                          >
                            
                          </button>
                        )}
                        <div className="min-w-0">
                          <div className={`text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{step.label}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${step.auto ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                              {step.auto ? t('lms.autoStep') : t('lms.manualStep')}
                            </span>
                            {step.overdue && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600"> {t('lms.overdue')}</span>
                            )}
                            {!step.done && !step.overdue && step.days_left !== null && step.days_left !== undefined && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-aconso-50 text-aconso-600">
                                {t('lms.daysLeft', { n: step.days_left })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certification card */}
      <div className="card mb-6 p-6">
        <h2 className="font-bold text-gray-900 mb-4">{t('lms.certificationTitle')}</h2>
        {bestCert ? (
          <div className="flex flex-wrap items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl shadow-md"></div>
            <div>
              <div className="text-sm text-gray-500">{t('lms.level')}: <span className="font-semibold text-gray-900">{CERT_LEVELS[bestCert.level]?.[i18n.language] || bestCert.level}</span></div>
              <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${CERT_STATUS_COLORS[bestCert.status] || 'bg-gray-100 text-gray-600'}`}>
                {t(`lms.statuses.${bestCert.status}`)}
              </div>
              <div className="text-sm text-gray-500 mt-2"> {t('lms.validUntil')}: {new Date(bestCert.valid_until).toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="text-2xl"></span> {t('lms.noCertification')}
          </div>
        )}

        {next_level && next_level.requirements && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="text-sm font-semibold text-gray-800 mb-2">
              {t('lms.nextLevelTitle')}: <span className="text-aconso-700">{CERT_LEVELS[next_level.level]?.[i18n.language] || next_level.level}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {next_level.requirements.map((req) => (
                <span key={req.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${req.done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${req.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{req.done ? '' : '·'}</span>
                  {req.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Track progress */}
      <div className="card mb-6 p-6">
        <h2 className="font-bold text-gray-900 mb-4">{t('lms.tracks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRACK_ORDER.map((tr) => {
            const st = tracks[tr];
            const pct = st && st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0;
            const trackKey = tr === 'cumplimiento' ? 'trackCumplimiento' : tr === 'ventas' ? 'trackVentas' : 'trackTecnica';
            return (
              <div key={tr} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{t(`lms.${trackKey}`)}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tr === 'ventas' ? 'bg-aconso-100 text-aconso-700' : tr === 'tecnica' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{TRACKS[tr]?.[i18n.language] || tr}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{t('lms.completedCount', { completed: st?.completed || 0, total: st?.total || 0 })}</span>
                  <span className="font-bold">{pct}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-aconso-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-5 text-sm">
          <div className="rounded-lg bg-aconso-50 border border-aconso-100 px-4 py-2">
            <span className="text-gray-500">{t('lms.completedCourses')}: </span>
            <span className="font-bold text-aconso-700">{completed_courses}</span>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-2">
            <span className="text-gray-500">{t('lms.wonOpportunities')}: </span>
            <span className="font-bold text-emerald-700">{won_opportunities}</span>
          </div>
          {won_opportunities < 2 && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-2 text-amber-700">
              {t('lms.requiredForExpert', { n: 2 - won_opportunities })}
            </div>
          )}
        </div>
      </div>

      {/* Course results */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4">{t('lms.courseResults')}</h2>
        {training_results.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('courses.noContentYet')}</p>
        ) : (
          <div className="space-y-4">
            {Array.from(resultsByCourse.entries()).map(([courseId, results]) => {
              const best = results.reduce((a, b) => (b.score > a.score ? b : a), results[0]);
              const latest = results[0];
              const passed = results.some((r) => r.passed);
              return (
                <div key={courseId} className="rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium text-gray-900 text-sm">{latest.course_title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {results.length} {results.length === 1 ? t('quiz.attempt') : t('quiz.attempts')} ·  {t('quiz.score')}: {best.score}%
                    </div>
                    <div className="mt-2 flex gap-1">
                      {results.slice(0, 5).map((r) => (
                        <span key={r.id} title={`${r.score}%`} className={`w-2.5 h-2.5 rounded-full ${r.passed ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <span className="badge bg-emerald-500 text-white border border-emerald-600"></span>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">{t('quiz.failed')}</span>
                    )}
                    {latest.certificate_url && (
                      <a href={latest.certificate_url} target="_blank" rel="noreferrer" className="btn-secondary !py-1.5 text-xs">
                         {t('lms.downloadCertificate')}
                      </a>
                    )}
                    {!latest.certificate_url && passed && (
                      <button onClick={() => downloadCertificate(courseId, latest.course_title)} disabled={downloading === courseId} className="btn-secondary !py-1.5 text-xs">
                        {downloading === courseId ? t('common.loading') : ' ' + t('lms.downloadCertificate')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
