import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../services/api';
import type { Course } from '../../types';
import CourseEditor from './course-builder/CourseEditor';

const CATEGORY_I18N: Record<string, string> = {
  fundamentals: 'courses.catFundamentals', document_management: 'courses.catDocumentManagement',
  integrations: 'courses.catIntegrations', automation: 'courses.catAutomation',
  advanced: 'courses.catAdvanced', other: 'courses.catOther',
};

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
          <div className="text-5xl mb-4">📚</div>
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
                          <span className="flex items-center gap-1">🎬 {c.video_count} {t('courses.videos')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(c)} className="flex-1 text-xs text-aconso-600 hover:bg-aconso-50 py-1.5 rounded-lg font-medium transition-colors">{t('courses.manageContent')}</button>
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
    </div>
  );
}
