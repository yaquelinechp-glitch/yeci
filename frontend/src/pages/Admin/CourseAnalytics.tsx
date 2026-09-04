import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lmsApi } from '../../services/api';
import type { LmsAnalytics } from '../../types';

const FUNNEL_STEPS = [
  { key: 'enrolled', color: 'bg-blue-500', labelKey: 'Enrolled' },
  { key: 'started', color: 'bg-indigo-500', labelKey: 'Started' },
  { key: 'quiz_passed', color: 'bg-purple-500', labelKey: 'Quiz Passed' },
  { key: 'completed', color: 'bg-emerald-500', labelKey: 'Completed' },
  { key: 'exam_passed', color: 'bg-emerald-700', labelKey: 'Exam Passed' },
] as const;

export default function CourseAnalytics() {
  const { t } = useTranslation();
  const [data, setData] = useState<LmsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lmsApi.analytics().then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  const courses = data?.courses || [];

  const totalEnrolled = courses.reduce((s, c) => s + c.enrolled, 0);
  const totalStarted = courses.reduce((s, c) => s + c.started, 0);
  const totalQuizPassed = courses.reduce((s, c) => s + c.quiz_passed, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.completed, 0);
  const totalExamPassed = courses.reduce((s, c) => s + c.exam_passed, 0);

  const totals = [totalEnrolled, totalStarted, totalQuizPassed, totalCompleted, totalExamPassed];
  const maxVal = Math.max(...totals, 1);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.courseAnalytics')}</h1>
        <p className="text-gray-500 mt-1">Funnel analytics across all courses</p>
      </div>

      {courses.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400">{t('common.noData')}</p>
        </div>
      ) : (
        <>
          <div className="card p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Overall Funnel</h2>
            <div className="space-y-3">
              {FUNNEL_STEPS.map((step, i) => {
                const val = totals[i];
                const pct = totalEnrolled > 0 ? Math.round((val / totalEnrolled) * 100) : 0;
                const barWidth = maxVal > 0 ? (val / maxVal) * 100 : 0;
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-28 shrink-0">{step.labelKey}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${step.color} transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">{val}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Per-Course Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-3 pr-4 font-semibold">Course</th>
                    <th className="py-3 pr-4 font-semibold">Track</th>
                    <th className="py-3 pr-4 font-semibold text-center">Enrolled</th>
                    <th className="py-3 pr-4 font-semibold text-center">Started</th>
                    <th className="py-3 pr-4 font-semibold text-center">Quiz Passed</th>
                    <th className="py-3 pr-4 font-semibold text-center">Completed</th>
                    <th className="py-3 font-semibold text-center">Exam Passed</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.course_id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{c.title}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-aconso-50 text-aconso-700">{c.track || '—'}</span>
                      </td>
                      <td className="py-3 pr-4 text-center text-gray-600">{c.enrolled}</td>
                      <td className="py-3 pr-4 text-center text-gray-600">{c.started}</td>
                      <td className="py-3 pr-4 text-center text-gray-600">{c.quiz_passed}</td>
                      <td className="py-3 pr-4 text-center text-gray-600">{c.completed}</td>
                      <td className="py-3 text-center text-gray-600">{c.exam_passed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
