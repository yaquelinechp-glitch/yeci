import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../../services/api';
import { TRACKS, PRODUCTS } from '../../../constants';
import type { Course } from '../../../types';

const CATEGORY_VALUES = ['fundamentals', 'document_management', 'integrations', 'automation', 'advanced', 'other'] as const;
const CATEGORY_I18N: Record<string, string> = {
  fundamentals: 'courses.catFundamentals', document_management: 'courses.catDocumentManagement',
  integrations: 'courses.catIntegrations', automation: 'courses.catAutomation',
  advanced: 'courses.catAdvanced', other: 'courses.catOther',
};
const LANGS = ['en', 'es', 'de'] as const;
const LANG_LABELS: Record<string, string> = { en: 'EN', es: 'ES', de: 'DE' };
const COURSE_STATUSES = [{ key: 'borrador', i18n: 'courses.statusDraft' }, { key: 'publicado', i18n: 'courses.statusPublished' }, { key: 'archivado', i18n: 'courses.statusArchived' }] as const;
const COURSE_LEVELS = [{ key: 'beginner', i18n: 'courses.levelBeginner' }, { key: 'intermediate', i18n: 'courses.levelIntermediate' }, { key: 'advanced', i18n: 'courses.levelAdvanced' }] as const;

interface Props {
  course: Course | null;
  existingCourses: Course[];
  onCreated: (course: Course) => void;
  onCancel: () => void;
}

export default function CourseInfoStep({ course, existingCourses, onCreated, onCancel }: Props) {
  const { t, i18n } = useTranslation();
  const [formLang, setFormLang] = useState<string>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const thumbRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState<Record<string, string>>(() => {
    if (!course) return { en: '', es: '', de: '' };
    const raw = course.title;
    return typeof raw === 'string' ? { en: raw, es: '', de: '' } : { en: raw?.en || '', es: raw?.es || '', de: raw?.de || '' };
  });
  const [desc, setDesc] = useState<Record<string, string>>(() => {
    if (!course) return { en: '', es: '', de: '' };
    const raw = course.description;
    return typeof raw === 'string' ? { en: raw, es: '', de: '' } : { en: raw?.en || '', es: raw?.es || '', de: raw?.de || '' };
  });
  const [category, setCategory] = useState(course?.category || '');
  const [level, setLevel] = useState(course?.level || 'beginner');
  const [track, setTrack] = useState(course?.track || '');
  const [status, setStatus] = useState(course?.status || 'publicado');
  const [passMark, setPassMark] = useState(course?.pass_mark || 80);
  const [validity, setValidity] = useState(course?.validity_months || 12);
  const [prereq, setPrereq] = useState(course?.prerequisite_course_id || '');
  const [products, setProducts] = useState<string[]>(course?.related_products || []);
  const [thumbnail, setThumbnail] = useState(course?.thumbnail_url || '');
  const [thumbUploading, setThumbUploading] = useState(false);

  const defaultPhaseDays = 3;
  const [phases, setPhases] = useState<{ phase: number; days: number }[]>(
    course?.phase_config?.length ? course.phase_config : [{ phase: 1, days: defaultPhaseDays }]
  );

  const handleThumbFile = async (file: File) => {
    setThumbUploading(true);
    try {
      const r = await coursesApi.uploadThumbnail(file);
      setThumbnail(r.data.url);
      if (thumbRef.current) thumbRef.current.value = '';
    } catch { /* */ } finally { setThumbUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.en && !title.es && !title.de) { setError(t('courses.titleRequired')); return; }
    setSaving(true); setError('');
    const payload: any = {
      title, description: desc, category, level, track, status,
      pass_mark: passMark, validity_months: validity,
      prerequisite_course_id: prereq || '',
      related_products: products, thumbnail_url: thumbnail,
      phase_config: phases, quiz_questions_count: 8, exam_questions_count: 5,
    };
    try {
      let r;
      if (course) {
        r = await coursesApi.update(course.id, payload);
      } else {
        r = await coursesApi.create(payload);
      }
      const full = await coursesApi.get(r.data.id);
      onCreated(full.data);
    } catch (err: any) {
      setError(`Error ${err?.response?.status || '???'}: ${err?.response?.data ? JSON.stringify(err.response.data) : err?.message || ''}`);
    } finally { setSaving(false); }
  };

  const addPhase = () => {
    const maxPhase = Math.max(1, ...phases.map(p => p.phase));
    setPhases(prev => [...prev, { phase: maxPhase + 1, days: defaultPhaseDays }]);
  };
  const removePhase = (idx: number) => setPhases(prev => prev.filter((_, i) => i !== idx));
  const updatePhase = (idx: number, patch: Partial<{ phase: number; days: number }>) =>
    setPhases(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course ? t('courses.editCourse') : t('courses.createCourse')}</h1>
          <p className="text-gray-500 mt-1">{course ? t('courses.editCourseDesc') : t('courses.createCourseDesc')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language tabs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t('courses.courseIdentity')}</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {LANGS.map(l => (
                <button key={l} type="button" onClick={() => setFormLang(l)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${formLang === l ? 'bg-white text-aconso-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('courses.courseTitle')} ({LANG_LABELS[formLang]})</label>
              <input value={title[formLang] || ''} onChange={e => setTitle({ ...title, [formLang]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" placeholder={t('courses.courseTitlePlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('courses.courseDescription')} ({LANG_LABELS[formLang]})</label>
              <textarea value={desc[formLang] || ''} onChange={e => setDesc({ ...desc, [formLang]: e.target.value })} rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none resize-none" placeholder={t('courses.courseDescriptionPlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('courses.thumbnail')}</label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <input value={thumbnail} onChange={e => setThumbnail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" placeholder={t('courses.thumbnailPlaceholder')} />
                </div>
                <button type="button" onClick={() => thumbRef.current?.click()} disabled={thumbUploading}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                  {thumbUploading ? '...' : '⬆ ' + t('courses.uploadFromPc')}
                </button>
                <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleThumbFile(e.target.files[0]); }} />
              </div>
              {thumbnail && (
                <div className="mt-3 h-24 w-40 rounded-xl overflow-hidden bg-gray-100 relative">
                  <img src={thumbnail} alt=""
                    className="w-full h-full object-cover"
                    onError={e => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector('.thumb-error')) {
                        const err = document.createElement('div');
                        err.className = 'thumb-error absolute inset-0 flex items-center justify-center text-[10px] text-red-400 bg-gray-50';
                        err.textContent = '⚠ URL inválida';
                        parent.appendChild(err);
                      }
                    }}
                    onLoad={e => {
                      const img = e.target as HTMLImageElement;
                      const parent = img.parentElement;
                      const err = parent?.querySelector('.thumb-error');
                      if (err) err.remove();
                      img.style.display = '';
                    }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Config grid */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t('courses.courseConfig')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('courses.category')}</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-aconso-500">
                <option value="">{t('courses.selectCategory')}</option>
                {CATEGORY_VALUES.map(c => <option key={c} value={c}>{t(CATEGORY_I18N[c])}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('courses.courseLevel')}</label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-aconso-500">
                {COURSE_LEVELS.map(l => <option key={l.key} value={l.key}>{t(l.i18n)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('lms.tracks')}</label>
              <select value={track} onChange={e => setTrack(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-aconso-500">
                <option value="">{t('courses.selectCategory')}</option>
                {Object.keys(TRACKS).map(tr => <option key={tr} value={tr}>{TRACKS[tr][i18n.language] || tr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('courses.status')}</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-aconso-500">
                {COURSE_STATUSES.map(s => <option key={s.key} value={s.key}>{t(s.i18n)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Phases inline */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">{t('courses.phaseConfig')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t('courses.phaseConfigDesc')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {phases.map((p, pi) => (
              <div key={pi} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-aconso-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{pi + 1}</div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{t('courses.phase')} {p.phase}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 5, 7, 10, 14].map(d => (
                    <button key={d} type="button" onClick={() => updatePhase(pi, { days: d })}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${
                        p.days === d ? 'border-aconso-500 bg-aconso-50 text-aconso-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>{d}</button>
                  ))}
                  <input type="number" min={1} max={30} value={p.days}
                    onChange={e => updatePhase(pi, { days: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) })}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none ml-1" />
                  <span className="text-xs text-gray-400">{t('courses.days')}</span>
                </div>
                {phases.length > 1 && (
                  <button type="button" onClick={() => removePhase(pi)}
                    className="text-gray-400 hover:text-red-500 px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors text-xs">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addPhase}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-aconso-300 text-aconso-600 hover:bg-aconso-50 text-sm font-medium transition-all">
              + {t('courses.addPhase')}
            </button>
          </div>
        </div>

        {/* Advanced settings */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t('courses.advancedSettings')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('lms.passMark')} (%)</label>
              <input type="number" min={1} max={100} value={passMark}
                onChange={e => setPassMark(Math.max(1, Math.min(100, parseInt(e.target.value) || 80)))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('courses.validityMonths')}</label>
              <input type="number" min={1} max={60} value={validity}
                onChange={e => setValidity(Math.max(1, Math.min(60, parseInt(e.target.value) || 12)))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('courses.prerequisite')}</label>
              <select value={prereq} onChange={e => setPrereq(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-aconso-500">
                <option value="">{t('courses.noPrerequisite')}</option>
                {existingCourses.filter(c => !course || c.id !== course.id).map(c => {
                  const ttl = typeof c.title === 'string' ? c.title : c.title?.en || c.title?.es || c.title?.de || '';
                  return <option key={c.id} value={c.id}>{ttl}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('courses.quizCount')}</label>
              <input type="number" min={1} max={20} value={8} disabled
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">{t('lms.relatedProducts')}</label>
            <div className="flex flex-wrap gap-2">
              {PRODUCTS.map(p => {
                const active = products.includes(p);
                return (
                  <button key={p} type="button" onClick={() => setProducts(prev => active ? prev.filter(x => x !== p) : [...prev, p])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? 'border-aconso-500 bg-aconso-50 text-aconso-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {t(`pipeline.productChoices.${p}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div className="flex justify-between pt-2">
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? '...' : course ? t('courses.saveAndContinue') : t('courses.createAndContinue')} →
          </button>
        </div>
      </form>
    </div>
  );
}
