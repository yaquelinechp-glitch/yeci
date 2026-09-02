import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../../services/api';
import type { QuizBankQuestion, CourseVideo } from '../../../types';
import { TRACKS } from '../../../constants';

const LANGS = ['en', 'es', 'de'] as const;
const LANG_LABELS: Record<string, string> = { en: 'EN', es: 'ES', de: 'DE' };
const QUESTION_TYPES = [
  { key: 'single', i18n: 'quiz.typeSingle' },
  { key: 'multiple', i18n: 'quiz.typeMultiple' },
  { key: 'true_false', i18n: 'quiz.typeTrueFalse' },
  { key: 'fill', i18n: 'quiz.typeFill' },
] as const;

interface Props {
  courseVideos: CourseVideo[];
  courseId: string;
  onRefresh: () => void;
}

export default function QuestionBank({ courseVideos, courseId, onRefresh }: Props) {
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState<QuizBankQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuizBankQuestion | null>(null);
  const [lang, setLang] = useState('en');
  const [form, setForm] = useState<any>({
    question_type: 'single', track: 'todas',
    question: { en: '', es: '', de: '' },
    options: [{ en: '', es: '', de: '' }, { en: '', es: '', de: '' }, { en: '', es: '', de: '' }, { en: '', es: '', de: '' }],
    correct_index: 0, correct_indices: [0],
    fill_answer: { en: '', es: '', de: '' },
  });
  const [assignVideoId, setAssignVideoId] = useState('');
  const [assignCount, setAssignCount] = useState(3);
  const [assigning, setAssigning] = useState(false);

  const loadBank = async () => {
    try { const r = await coursesApi.quizBank(); setQuestions(r.data || []); } catch { setQuestions([]); }
  };
  useEffect(() => { loadBank(); }, []);

  const filtered = questions.filter(q => {
    const text = (q.question?.en || q.question?.es || q.question?.de || '').toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchType = !filterType || q.question_type === filterType;
    return matchSearch && matchType;
  });

  const fillLangs = (texts: Record<string, string>) => {
    const base = texts.en || texts.es || texts.de || '';
    return { en: texts.en || base, es: texts.es || base, de: texts.de || base };
  };

  const saveBank = async () => {
    const payload = {
      question: fillLangs(form.question),
      options: form.question_type === 'fill' ? [] : form.options.map((o: any) => fillLangs(o || {})).filter((o: any) => o.en || o.es || o.de),
      question_type: form.question_type,
      correct_index: form.question_type === 'multiple' ? (form.correct_indices?.[0] ?? 0) : form.correct_index,
      correct_indices: form.question_type === 'multiple' ? (form.correct_indices || []) : [form.correct_index],
      fill_answer: fillLangs(form.fill_answer || {}),
      track: form.track,
    };
    if (editing) await coursesApi.updateBankQuestion(editing.id, payload);
    else await coursesApi.createBankQuestion(payload);
    setShowForm(false); setEditing(null); loadBank();
  };

  const delBank = async (id: string) => {
    if (!confirm(t('quiz.deleteConfirm'))) return;
    await coursesApi.deleteBankQuestion(id);
    loadBank();
  };

  const startEdit = (q: QuizBankQuestion) => {
    setEditing(q); setShowForm(true); setLang('en');
    setForm({
      question_type: q.question_type || 'single', track: q.track || 'todas',
      question: q.question || { en: '', es: '', de: '' },
      options: (q.options || []).length >= 2 ? q.options : [{ en: '', es: '', de: '' }, { en: '', es: '', de: '' }, { en: '', es: '', de: '' }, { en: '', es: '', de: '' }],
      correct_index: q.correct_index, correct_indices: q.correct_indices || [q.correct_index || 0],
      fill_answer: q.fill_answer || { en: '', es: '', de: '' },
    });
  };

  const handleAssign = async (bankId: string) => {
    if (!assignVideoId || !courseId) return;
    setAssigning(true);
    try {
      await coursesApi.addBankToVideo(courseId, assignVideoId, bankId);
      onRefresh();
    } catch { /* */ } finally { setAssigning(false); }
  };

  const getVideoLabel = (v: CourseVideo) => {
    const title = typeof v.title === 'string' ? v.title : v.title?.en || v.title?.es || v.title?.de || '';
    return `P${v.phase || 1}·D${v.day || 1} — ${title}`;
  };

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none"
          placeholder={t('courses.searchQuestions') || 'Buscar...'} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-aconso-500">
          <option value="">{t('courses.allTypes') || 'Todos'}</option>
          {QUESTION_TYPES.map(qt => <option key={qt.key} value={qt.key}>{t(qt.i18n)}</option>)}
        </select>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.map((q, qi) => {
          const qText = q.question?.en || q.question?.es || q.question?.de || '';
          return (
            <div key={q.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-aconso-100 text-aconso-600 flex items-center justify-center text-[10px] font-bold shrink-0">{qi + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{qText}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    {t((QUESTION_TYPES.find(qt => qt.key === (q.question_type || 'single'))?.i18n || 'quiz.typeSingle') as any)}
                  </span>
                  <button onClick={() => startEdit(q)} className="text-[11px] text-gray-400 hover:text-aconso-600 px-1.5 py-0.5 rounded hover:bg-aconso-50 opacity-0 group-hover:opacity-100 transition-opacity">{t('common.edit')}</button>
                  <button onClick={() => delBank(q.id)} className="text-[11px] text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">{t('common.delete')}</button>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-7">
                <span className="text-[10px] text-gray-400">{t('courses.bankTrack')}: {q.track || 'todas'}</span>
                <div className="flex-1" />
                <select value={assignVideoId} onChange={e => setAssignVideoId(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-[11px] outline-none max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity">
                  <option value="">{t('courses.selectVideoQuiz')}</option>
                  {courseVideos.map(v => <option key={v.id} value={v.id}>{getVideoLabel(v)}</option>)}
                </select>
                <button onClick={() => handleAssign(q.id)} disabled={!assignVideoId || assigning}
                  className="text-[11px] text-aconso-600 hover:text-aconso-700 font-medium px-2 py-1 rounded hover:bg-aconso-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                  → {t('courses.assignToVideo') || 'Asignar'}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">{t('quiz.noQuestions')}</div>
        )}
      </div>

      {/* Inline form */}
      {showForm ? (
        <div className="border-2 border-aconso-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">{editing ? t('quiz.editQuestion') : t('courses.addToBank')}</h4>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5">
                {LANGS.map(l => (
                  <button key={l} type="button" onClick={() => setLang(l)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${lang === l ? 'bg-white text-aconso-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 text-sm"></button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">{t('quiz.questionType')}</label>
              <select value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-aconso-500">
                {QUESTION_TYPES.map(qt => <option key={qt.key} value={qt.key}>{t(qt.i18n)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">{t('courses.bankTrack')}</label>
              <select value={form.track} onChange={e => setForm({ ...form, track: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-aconso-500">
                {Object.keys(TRACKS).map(tr => <option key={tr} value={tr}>{TRACKS[tr][i18n.language] || tr}</option>)}
              </select>
            </div>
          </div>

          <input value={form.question[lang] || ''}
            onChange={e => setForm({ ...form, question: { ...form.question, [lang]: e.target.value } })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none"
            placeholder={`${t('quiz.question')} (${LANG_LABELS[lang]})`} />

          {form.question_type === 'fill' ? (
            <input value={form.fill_answer.en || ''}
              onChange={e => setForm({ ...form, fill_answer: { ...form.fill_answer, en: e.target.value } })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none"
              placeholder={t('quiz.fillAnswer') || 'Respuesta'} />
          ) : (
            <div className="space-y-1.5">
              {[0, 1, 2, 3].map(oi => {
                const isCorrect = form.question_type === 'multiple' ? (form.correct_indices || []).includes(oi) : form.correct_index === oi;
                return (
                  <div key={oi} className="flex items-center gap-2">
                    <button type="button" onClick={() => {
                      if (form.question_type === 'multiple') {
                        const cur = form.correct_indices || [];
                        setForm({ ...form, correct_indices: isCorrect ? cur.filter((x: number) => x !== oi) : [...cur, oi] });
                      } else { setForm({ ...form, correct_index: oi }); }
                    }} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 hover:border-aconso-400'
                    }`}>
                      {isCorrect
                        ? <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        : <span className="text-[9px] font-bold text-gray-400">{String.fromCharCode(65 + oi)}</span>}
                    </button>
                    <input value={form.options[oi]?.[lang] || ''}
                      onChange={e => setForm({ ...form, options: form.options.map((o: any, i: number) => i === oi ? { ...o, [lang]: e.target.value } : o) })}
                      className={`flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none transition-all ${
                        isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 focus:border-aconso-500'
                      }`}
                      placeholder={`${t('quiz.option')} ${oi + 1}`} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={saveBank} className="btn-primary text-sm">{editing ? t('common.save') : t('courses.addToBank')}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary text-sm">{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setShowForm(true); setEditing(null); }}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-aconso-300 hover:text-aconso-600 hover:bg-aconso-50/50 transition-all">
          + {t('courses.addToBank')}
        </button>
      )}
    </div>
  );
}
