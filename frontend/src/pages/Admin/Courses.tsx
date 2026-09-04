import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi, partnersApi } from '../../services/api';
import type { Course, CourseAssignment } from '../../types';
import CourseEditor from './course-builder/CourseEditor';

const CATEGORY_I18N: Record<string, string> = {
  fundamentals: 'courses.catFundamentals', document_management: 'courses.catDocumentManagement',
  integrations: 'courses.catIntegrations', automation: 'courses.catAutomation',
  advanced: 'courses.catAdvanced', other: 'courses.catOther',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function courseTitle(c: Course) {
  if (typeof c.title === 'string') return c.title;
  return c.title?.en || c.title?.es || c.title?.de || '';
}
function courseDesc(c: Course) {
  if (typeof c.description === 'string') return c.description;
  return c.description?.en || c.description?.es || c.description?.de || '';
}

const PHASE_COLORS = ['from-aconso-500 to-aconso-700', 'from-emerald-500 to-emerald-700', 'from-amber-500 to-amber-700', 'from-purple-500 to-purple-700', 'from-red-500 to-red-700', 'from-blue-500 to-blue-700'];

export default function AdminCourses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [assignCourse, setAssignCourse] = useState<Course | null>(null);
  const [partners, setPartners] = useState<{ id: string; company_name: string }[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const load = async () => { try { const r = await coursesApi.list(); setCourses(r.data); } catch { /* */ } };
  useEffect(() => { load(); }, []);

  const handleCreate = () => { setEditingCourse(null); setShowEditor(true); };
  const handleEdit = (c: Course) => { setEditingCourse(c); setShowEditor(true); };
  const handleBack = () => { setShowEditor(false); setEditingCourse(null); load(); };
  const handleDelete = async (id: string) => {
    if (!confirm(t('courses.confirmDelete'))) return;
    await coursesApi.delete(id);
    setCourses(prev => prev.filter(c => c.id !== id));
    if (editingCourse?.id === id) { setEditingCourse(null); setShowEditor(false); }
  };

  const openAssign = async (c: Course) => {
    setAssignCourse(c);
    setAssignPartnerId('');
    setAssignDeadline('');
    try {
      const [p, a] = await Promise.all([
        partnersApi.list(),
        coursesApi.getAssignments(c.id),
      ]);
      setPartners((p.data || []).map((x: any) => ({ id: x.id, company_name: x.company_name })));
      setAssignments(a.data || []);
    } catch { setPartners([]); setAssignments([]); }
  };

  const handleCreateAssignment = async () => {
    if (!assignCourse || !assignPartnerId) return;
    setAssignLoading(true);
    try {
      await coursesApi.createAssignment(assignCourse.id, assignPartnerId, assignDeadline || new Date(Date.now() + 30 * 86400000).toISOString());
      const a = await coursesApi.getAssignments(assignCourse.id);
      setAssignments(a.data || []);
      setAssignPartnerId('');
      setAssignDeadline('');
    } catch { /* */ } finally { setAssignLoading(false); }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!assignCourse) return;
    await coursesApi.deleteAssignment(assignCourse.id, assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  if (showEditor) {
    return (
      <div className="-m-8">
        <CourseEditor course={editingCourse} courses={courses} onBack={handleBack} onSaved={load} />
      </div>
    );
  }

  const sorted = [...courses].sort((a, b) => {
    const pa = a.phase_config?.[0]?.phase || 0;
    const pb = b.phase_config?.[0]?.phase || 0;
    return pa - pb;
  });
  const groups = new Map<number, Course[]>();
  for (const c of sorted) {
    const p = c.phase_config?.[0]?.phase || 0;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p)!.push(c);
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('courses.adminTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('courses.adminSubtitle')}</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">+ {t('courses.createCourse')}</button>
      </div>

      {courses.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4"></div>
          <p className="text-gray-500 text-lg mb-2">{t('courses.noCourses')}</p>
          <p className="text-gray-400 text-sm mb-6">{t('courses.createFirst')}</p>
          <button onClick={handleCreate} className="btn-primary">+ {t('courses.createCourse')}</button>
        </div>
      ) : (
        Array.from(groups.entries()).map(([phaseNum, phaseCourses]) => (
          <div key={phaseNum} className="mb-8 last:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PHASE_COLORS[(phaseNum - 1) % PHASE_COLORS.length]} text-white flex items-center justify-center text-sm font-bold shadow-md`}>
                {phaseNum}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('courses.phase')} {phaseNum}</h2>
                <p className="text-xs text-gray-400">{phaseCourses.length} {phaseCourses.length === 1 ? t('courses.courseTitle') : t('courses.courses')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {phaseCourses.map(c => {
                const pc = c.phase_config?.length ? c.phase_config : [];
                const days = pc.reduce((s, p) => s + (p.days || 0), 0) || '?';
                return (
                  <div key={c.id} className="card overflow-hidden hover:shadow-lg transition-all group cursor-default">
                    <div className="h-40 bg-gradient-to-br from-aconso-500 to-aconso-700 flex items-center justify-center relative">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span className="text-white text-5xl font-bold opacity-20">{courseTitle(c).charAt(0)}</span>
                      )}
                      <div className="absolute top-3 left-3 text-xs text-white font-bold bg-aconso-800/60 px-3 py-1 rounded-full">{t('courses.phase')} {phaseNum}</div>
                      <div className="absolute top-3 right-3 text-xs text-white/70 bg-black/20 px-2 py-0.5 rounded-full">{days} {t('courses.days')}</div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-1">{courseTitle(c) || t('courses.untitled')}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{courseDesc(c) || t('courses.noDescription')}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 text-xs text-gray-400">
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{(c.category && CATEGORY_I18N[c.category]) ? t(CATEGORY_I18N[c.category]) : t('courses.uncategorized')}</span>
                          <span className="flex items-center gap-1"> {c.video_count} {t('courses.videos')}</span>
                          {(c.total_duration || 0) > 0 && <span className="flex items-center gap-1"> {formatDuration(c.total_duration)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(c)} className="flex-1 text-xs text-aconso-600 hover:bg-aconso-50 py-1.5 rounded-lg font-medium transition-colors">{t('courses.manageContent')}</button>
                        <button onClick={() => openAssign(c)} className="flex-1 text-xs text-aconso-600 hover:bg-aconso-50 py-1.5 rounded-lg font-medium transition-colors">{t('courses.assign')}</button>
                        <button onClick={() => handleDelete(c.id)} className="flex-1 text-xs text-red-500 hover:bg-red-50 py-1.5 rounded-lg font-medium transition-colors">{t('common.delete')}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {assignCourse && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setAssignCourse(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">{t('courses.assignCourse')}: {courseTitle(assignCourse)}</h3>
              <button onClick={() => setAssignCourse(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">{t('common.selectPartner')}</label>
                <select value={assignPartnerId} onChange={e => setAssignPartnerId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none">
                  <option value="">--</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">{t('courses.deadline')}</label>
                <input type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" />
              </div>
              <button onClick={handleCreateAssignment} disabled={!assignPartnerId || assignLoading} className="btn-primary w-full disabled:opacity-50">
                {assignLoading ? t('common.loading') : t('courses.assign')}
              </button>
              <div>
                <h4 className="font-semibold text-sm text-gray-800 mb-3">{t('courses.existingAssignments')}</h4>
                {assignments.length === 0 ? (
                  <p className="text-xs text-gray-400">{t('courses.noAssignments')}</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <div className="text-sm font-medium text-gray-700">{a.partner_name}</div>
                          {a.deadline && <div className="text-xs text-gray-400">{t('courses.deadline')}: {a.deadline.slice(0, 10)}</div>}
                        </div>
                        <button onClick={() => handleDeleteAssignment(a.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">{t('common.delete')}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
