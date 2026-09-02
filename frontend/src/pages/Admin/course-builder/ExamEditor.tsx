import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../../services/api';
import type { QuizQuestion } from '../../../types';

const LANGS = ['en', 'es', 'de'] as const;
const LANG_LABELS: Record<string, string> = { en: 'EN', es: 'ES', de: 'DE' };

interface Props {
  courseId: string;
  examCount: number;
  onRefresh?: () => void;
}

interface ExamQ extends QuizQuestion {
  course_id?: string;
}

export default function ExamEditor({ courseId, examCount, onRefresh }: Props) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<ExamQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExamQ | null>(null);
  const [lang, setLang] = useState<string>('en');
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(3);

  function emptyForm() {
    return {
      question_en: '', question_es: '', question_de: '',
      option0_en: '', option0_es: '', option0_de: '',
      option1_en: '', option1_es: '', option1_de: '',
      option2_en: '', option2_es: '', option2_de: '',
      option3_en: '', option3_es: '', option3_de: '',
      correct_index: 0,
    };
  }

  const load = async () => {
    setLoading(true);
    try {
      const r = await coursesApi.getExamQuestions(courseId);
      setQuestions(r.data || []);
    } catch { setQuestions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [courseId]);

  const fillLangs = (texts: Record<string, string>) => {
    const base = texts.en || texts.es || texts.de || '';
    return { en: texts.en || base, es: texts.es || base, de: texts.de || base };
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      question: fillLangs({ en: form.question_en, es: form.question_es, de: form.question_de }),
      options: [0, 1, 2, 3].map(oi => fillLangs({
        en: (form as any)[`option${oi}_en`] || '',
        es: (form as any)[`option${oi}_es`] || '',
        de: (form as any)[`option${oi}_de`] || '',
      })),
      correct_index: form.correct_index,
    };
    try {
      if (editing) await coursesApi.updateExamQuestion(courseId, editing.id, payload);
      else await coursesApi.createExamQuestion(courseId, payload);
      setShowForm(false); setEditing(null); setForm(emptyForm());
      await load();
      onRefresh?.();
    } catch { /* */ } finally { setSaving(false); }
  };

  const del = async (qid: string) => {
    if (!confirm(t('quiz.deleteConfirm'))) return;
    await coursesApi.deleteExamQuestion(courseId, qid);
    await load();
    onRefresh?.();
  };

  const startEdit = (q: ExamQ) => {
    setEditing(q); setShowForm(true); setLang('en');
    const opts: any[] = q.options || [];
    setForm({
      question_en: (q.question as any)?.en || q.question as string || '',
      question_es: (q.question as any)?.es || q.question as string || '',
      question_de: (q.question as any)?.de || q.question as string || '',
      option0_en: (opts[0] as any)?.en || opts[0] as string || '',
      option0_es: (opts[0] as any)?.es || opts[0] as string || '',
      option0_de: (opts[0] as any)?.de || opts[0] as string || '',
      option1_en: (opts[1] as any)?.en || opts[1] as string || '',
      option1_es: (opts[1] as any)?.es || opts[1] as string || '',
      option1_de: (opts[1] as any)?.de || opts[1] as string || '',
      option2_en: (opts[2] as any)?.en || opts[2] as string || '',
      option2_es: (opts[2] as any)?.es || opts[2] as string || '',
      option2_de: (opts[2] as any)?.de || opts[2] as string || '',
      option3_en: (opts[3] as any)?.en || opts[3] as string || '',
      option3_es: (opts[3] as any)?.es || opts[3] as string || '',
      option3_de: (opts[3] as any)?.de || opts[3] as string || '',
      correct_index: q.correct_index,
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await coursesApi.generateExamFromBank(courseId, genCount);
      await load();
    } catch { /* */ } finally { setGenerating(false); }
  };

  const moveQuestion = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const arr = [...questions];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setQuestions(arr);
    await coursesApi.reorderExamQuestions(courseId, arr.map(q => q.id));
  };

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">...</div>;

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">{t('courses.examCount')}:</span>
            <span className="text-sm font-bold text-gray-900">{questions.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">+</span>
          <input type="number" min={1} max={10} value={genCount}
            onChange={e => setGenCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" />
          <button onClick={handleGenerate} disabled={generating}
            className="text-xs bg-aconso-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-aconso-600 transition-colors disabled:opacity-50">
            {generating ? '...' : (t('courses.generateQuiz') || 'Desde banco')}
          </button>
        </div>
      </div>

      {/* Questions list */}
      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, qi) => {
            const qText = (q.question as any)?.en || q.question as string || '';
            const opts: any[] = q.options || [];
            return (
              <div key={q.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-aconso-100 text-aconso-600 flex items-center justify-center text-[10px] font-bold shrink-0">{qi + 1}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{qText}</span>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveQuestion(qi, -1)} disabled={qi === 0}
                      className="text-[11px] text-gray-400 hover:text-aconso-600 px-1.5 py-0.5 rounded disabled:opacity-30">▲</button>
                    <button onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1}
                      className="text-[11px] text-gray-400 hover:text-aconso-600 px-1.5 py-0.5 rounded disabled:opacity-30">▼</button>
                    <button onClick={() => startEdit(q)} className="text-[11px] text-gray-400 hover:text-aconso-600 px-1.5 py-0.5 rounded hover:bg-aconso-50">{t('common.edit')}</button>
                    <button onClick={() => del(q.id)} className="text-[11px] text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50">{t('common.delete')}</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 ml-7">
                  {opts.map((opt: any, oi: number) => {
                    const text = typeof opt === 'string' ? opt : (opt?.en || opt?.es || opt?.de || '');
                    const isCorrect = oi === q.correct_index;
                    return (
                      <div key={oi} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
                        isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-gray-500 border border-gray-200'
                      }`}>
                        <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {isCorrect && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </span>
                        <span className="truncate">{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {questions.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-gray-700 mb-1">{t('courses.noExamQuestions') || 'No hay preguntas en el examen'}</p>
          <p className="text-xs text-gray-400 mb-4">{t('courses.createFirstQuestion') || 'Crea una pregunta o genera desde el banco.'}</p>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm()); }}
            className="btn-primary text-sm px-6">
            + {t('quiz.createQuestion')}
          </button>
        </div>
      )}

      {/* Inline form */}
      {showForm ? (
        <div className="border-2 border-aconso-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">{editing ? t('quiz.editQuestion') : t('quiz.createQuestion')}</h4>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5">
                {LANGS.map(l => (
                  <button key={l} type="button" onClick={() => setLang(l)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${lang === l ? 'bg-white text-aconso-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm()); }}
                className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
          </div>

          <input value={(form as any)[`question_${lang}`] || ''}
            onChange={e => setForm({ ...form, [`question_${lang}`]: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none"
            placeholder={`${t('quiz.question')} (${LANG_LABELS[lang]})`} />

          <div className="space-y-2">
            {[0, 1, 2, 3].map(oi => {
              const isCorrect = form.correct_index === oi;
              return (
                <div key={oi} className="flex items-center gap-2">
                  <button type="button" onClick={() => setForm({ ...form, correct_index: oi })}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 hover:border-aconso-400'
                    }`}>
                    {isCorrect
                      ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : <span className="text-[10px] font-bold text-gray-400">{String.fromCharCode(65 + oi)}</span>}
                  </button>
                  <input value={(form as any)[`option${oi}_${lang}`] || ''}
                    onChange={e => setForm({ ...form, [`option${oi}_${lang}`]: e.target.value })}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                      isCorrect ? 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-500/20' : 'border-gray-200 focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500'
                    }`}
                    placeholder={`${t('quiz.option')} ${oi + 1}`} />
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="btn-primary text-sm">
              {saving ? '...' : editing ? t('common.save') : t('quiz.createQuestion')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm()); }}
              className="btn-secondary text-sm">{t('common.cancel')}</button>
          </div>
        </div>
      ) : questions.length > 0 ? (
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm()); }}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-aconso-300 hover:text-aconso-600 hover:bg-aconso-50/50 transition-all">
          + {t('quiz.createQuestion')}
        </button>
      ) : null}
    </div>
  );
}
