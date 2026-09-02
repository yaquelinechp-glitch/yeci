import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lmsApi } from '../../services/api';
import { TRACKS, CERT_LEVELS, CERT_STATUS_COLORS } from '../../constants';

interface ReportCourse {
  course_id: string;
  title: string;
  track: string;
  started: number;
  completed: number;
  completion_rate: number;
  pass_rate: number;
  pass_mark: number;
  validity_months: number;
}

interface ReportPartner {
  partner_id: string;
  company_name: string;
  track: string;
  courses_completed: number;
  certification: string | null;
  cert_status: string | null;
}

export default function AdminLmsReport() {
  const { t, i18n } = useTranslation();
  const [courses, setCourses] = useState<ReportCourse[]>([]);
  const [partners, setPartners] = useState<ReportPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lmsApi.report().then((r) => {
      setCourses(r.data.courses || []);
      setPartners(r.data.partners || []);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  const trackLabel = (tr: string) => TRACKS[tr]?.[i18n.language] || tr || '—';

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900"> {t('lms.reportTitle')}</h1>
        <p className="text-gray-500 mt-1">{t('lms.reportSubtitle')}</p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">{t('lms.courseCompletion')}</h2>
        {courses.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('courses.noCoursesYet')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-3 pr-4 font-semibold">{t('courses.courseTitle')}</th>
                  <th className="py-3 pr-4 font-semibold">{t('lms.tracks')}</th>
                  <th className="py-3 pr-4 font-semibold text-center">{t('lms.started')}</th>
                  <th className="py-3 pr-4 font-semibold text-center">{t('lms.completed')}</th>
                  <th className="py-3 pr-4 font-semibold text-center">{t('lms.completionRate')}</th>
                  <th className="py-3 pr-4 font-semibold text-center">{t('lms.passRate')}</th>
                  <th className="py-3 pr-4 font-semibold text-center">{t('lms.passMark')}</th>
                  <th className="py-3 font-semibold text-center">{t('lms.validity')}</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.course_id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">{c.title}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-aconso-50 text-aconso-700">{trackLabel(c.track)}</span>
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-600">{c.started}</td>
                    <td className="py-3 pr-4 text-center text-gray-600">{c.completed}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.completion_rate >= 80 ? 'bg-emerald-500' : c.completion_rate > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${c.completion_rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8 text-right">{c.completion_rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-600">{c.pass_rate}%</td>
                    <td className="py-3 pr-4 text-center text-gray-600">{c.pass_mark}%</td>
                    <td className="py-3 text-center text-gray-600">{c.validity_months}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4">{t('lms.partnerCertification')}</h2>
        {partners.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('common.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-3 pr-4 font-semibold">{t('common.company')}</th>
                  <th className="py-3 pr-4 font-semibold">{t('lms.tracks')}</th>
                  <th className="py-3 pr-4 font-semibold text-center">{t('lms.completedCourses')}</th>
                  <th className="py-3 font-semibold text-center">{t('lms.certification')}</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.partner_id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">{p.company_name}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-aconso-50 text-aconso-700">{trackLabel(p.track)}</span>
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-600">{p.courses_completed}</td>
                    <td className="py-3 text-center">
                      {p.certification ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-gray-900">{CERT_LEVELS[p.certification]?.[i18n.language] || p.certification}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${CERT_STATUS_COLORS[p.cert_status] || 'bg-gray-100 text-gray-600'}`}>
                            {p.cert_status ? t(`lms.statuses.${p.cert_status}`) : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{t('lms.none')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
