import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../../services/api';
import type { VideoCheckpoint } from '../../../types';

const LANGS = ['en', 'es', 'de'] as const;
const LANG_LABELS: Record<string, string> = { en: 'EN', es: 'ES', de: 'DE' };

interface Props {
  courseId: string;
  video: { id: string; video_url: string; title: any };
  onRefresh?: () => void;
}

interface FormState {
  timestamp_seconds: number;
  on_wrong_timestamp: number;
  question_en: string;
  question_es: string;
  question_de: string;
  option0_en: string;
  option0_es: string;
  option0_de: string;
  option1_en: string;
  option1_es: string;
  option1_de: string;
  option2_en: string;
  option2_es: string;
  option2_de: string;
  option3_en: string;
  option3_es: string;
  option3_de: string;
  correct_index: number;
}

function emptyForm(timestamp = 0, wrongTimestamp = 0): FormState {
  return {
    timestamp_seconds: Math.round(timestamp),
    on_wrong_timestamp: Math.round(wrongTimestamp),
    question_en: '', question_es: '', question_de: '',
    option0_en: '', option0_es: '', option0_de: '',
    option1_en: '', option1_es: '', option1_de: '',
    option2_en: '', option2_es: '', option2_de: '',
    option3_en: '', option3_es: '', option3_de: '',
    correct_index: 0,
  };
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function CheckpointEditor({ courseId, video, onRefresh }: Props) {
  const { t } = useTranslation();
  const [checkpoints, setCheckpoints] = useState<VideoCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VideoCheckpoint | null>(null);
  const [lang, setLang] = useState('en');
  const [form, setForm] = useState<FormState>(emptyForm(0, 0));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await coursesApi.getCheckpoints(courseId, video.id);
      setCheckpoints(r.data || []);
    } catch {
      setCheckpoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [video.id]);

  const fillLangs = (texts: Record<string, string>) => {
    const base = texts.en || texts.es || texts.de || '';
    return { en: texts.en || base, es: texts.es || base, de: texts.de || base };
  };

  const handleAddAtCurrent = () => {
    const ts = videoRef.current?.currentTime || 0;
    setEditing(null);
    setForm(emptyForm(ts, 0));
    setShowForm(true);
  };

  const startEdit = (cp: VideoCheckpoint) => {
    setEditing(cp);
    setLang('en');
    const opts: any[] = cp.options || [];
    setForm({
      timestamp_seconds: cp.timestamp_seconds,
      on_wrong_timestamp: cp.on_wrong_timestamp || 0,
      question_en: (cp.question as any)?.en || cp.question as string || '',
      question_es: (cp.question as any)?.es || cp.question as string || '',
      question_de: (cp.question as any)?.de || cp.question as string || '',
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
      correct_index: cp.correct_index || 0,
    });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      timestamp_seconds: Math.max(0, form.timestamp_seconds),
      on_wrong_timestamp: Math.max(0, form.on_wrong_timestamp),
      question: fillLangs({ en: form.question_en, es: form.question_es, de: form.question_de }),
      options: [0, 1, 2, 3].map(oi => fillLangs({
        en: (form as any)[`option${oi}_en`] || '',
        es: (form as any)[`option${oi}_es`] || '',
        de: (form as any)[`option${oi}_de`] || '',
      })),
      correct_index: form.correct_index,
    };
    try {
      if (editing) await coursesApi.updateCheckpoint(courseId, video.id, editing.id, payload);
      else await coursesApi.createCheckpoint(courseId, video.id, payload);
      setShowForm(false); setEditing(null);
      await load();
    } catch { /* */ } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    await coursesApi.deleteCheckpoint(courseId, video.id, id);
    setConfirmDelete(null);
    await load();
  };

  const move = async (id: string, dir: number) => {
    const idx = checkpoints.findIndex(c => c.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= checkpoints.length) return;
    const arr = [...checkpoints];
    const [removed] = arr.splice(idx, 1);
    arr.splice(target, 0, removed);
    setCheckpoints(arr);
    await coursesApi.reorderCheckpoints(courseId, video.id, arr.map(c => c.id));
  };

  const questionText = (q: any) => {
    if (!q) return '';
    if (typeof q === 'string') return q;
    return q.en || q.es || q.de || '';
  };

  const optionText = (o: any) => {
    if (!o) return '';
    if (typeof o === 'string') return o;
    return o.en || o.es || o.de || '';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400 text-sm">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Video player with timeline markers */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
        <video
          ref={videoRef}
          className="w-full h-full"
          preload="metadata"
          controls
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        >
          <source src={video.video_url} />
        </video>
        {/* Timeline markers */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex pointer-events-none">
          {checkpoints.map(cp => (
            <div
              key={cp.id}
              title={`${fmtTime(cp.timestamp_seconds)} - ${questionText(cp.question)}`}
              className="absolute top-0 h-full w-0.5 bg-amber-400"
              style={{ left: `${videoRef.current?.duration ? (cp.timestamp_seconds / videoRef.current.duration) * 100 : 0}%` }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleAddAtCurrent}
        className="w-full py-2.5 border-2 border-dashed border-amber-300 rounded-xl text-sm font-medium text-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-all"
      >
        + {t('checkpoints.addCheckpoint')} ({fmtTime(currentTime)})
      </button>

      {/* Existing checkpoints */}
      {checkpoints.length > 0 && (
        <div className="space-y-2">
          {checkpoints.map((cp) => (
            <div key={cp.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{fmtTime(cp.timestamp_seconds)}</span>
                  <span className="text-sm font-medium text-gray-900">{questionText(cp.question)}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => move(cp.id, -1)} className="text-gray-400 hover:text-gray-700 px-1">↑</button>
                  <button onClick={() => move(cp.id, 1)} className="text-gray-400 hover:text-gray-700 px-1">↓</button>
                  <button onClick={() => startEdit(cp)} className="text-[11px] text-gray-400 hover:text-aconso-600 px-1.5 py-0.5 rounded hover:bg-aconso-50">{t('common.edit')}</button>
                  <button onClick={() => setConfirmDelete(cp.id)} className="text-[11px] text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50">{t('common.delete')}</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-6 text-[11px] text-gray-400">
                <span onClick={() => { if (videoRef.current) { videoRef.current.currentTime = cp.on_wrong_timestamp || 0; videoRef.current.play(); } }} className="cursor-pointer hover:text-amber-600">{t('checkpoints.onWrong')}: {fmtTime(cp.on_wrong_timestamp || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {checkpoints.length === 0 && !showForm && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400">{t('checkpoints.noCheckpointsHint')}</p>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">{t('checkpoints.deleteCheckpoint')}</h3>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm">{t('common.cancel')}</button>
              <button onClick={() => del(confirmDelete)} className="btn-danger text-sm">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="border-2 border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">{editing ? t('checkpoints.editCheckpoint') : t('checkpoints.addCheckpoint')}</h4>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5">
                {LANGS.map(l => (
                  <button key={l} type="button" onClick={() => setLang(l)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${lang === l ? 'bg-white text-aconso-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">
              {t('checkpoints.timestamp')}
              <input type="number" min={0} value={form.timestamp_seconds}
                onChange={e => setForm({ ...form, timestamp_seconds: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
            </label>
            <label className="text-xs text-gray-500">
              {t('checkpoints.rewatchPoint')}
              <input type="number" min={0} value={form.on_wrong_timestamp}
                onChange={e => setForm({ ...form, on_wrong_timestamp: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
            </label>
          </div>

          <input value={(form as any)[`question_${lang}`] || ''}
            onChange={e => setForm({ ...form, [`question_${lang}`]: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            placeholder={`${t('checkpoints.questionText')} (${LANG_LABELS[lang]})`} />

          <div className="space-y-2">
            {[0, 1, 2, 3].map(oi => {
              const isCorrect = form.correct_index === oi;
              return (
                <div key={oi} className="flex items-center gap-2">
                  <button type="button" onClick={() => setForm({ ...form, correct_index: oi })}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 hover:border-amber-400'
                    }`}>
                    {isCorrect
                      ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : <span className="text-[10px] font-bold text-gray-400">{String.fromCharCode(65 + oi)}</span>}
                  </button>
                  <input value={(form as any)[`option${oi}_${lang}`] || ''}
                    onChange={e => setForm({ ...form, [`option${oi}_${lang}`]: e.target.value })}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                      isCorrect ? 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-500/20' : 'border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                    }`}
                    placeholder={`${t('quiz.option')} ${oi + 1}`} />
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="btn-primary text-sm">
              {saving ? '...' : editing ? t('common.save') : t('checkpoints.addCheckpoint')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary text-sm">{t('common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
