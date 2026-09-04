import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../services/api';
import type { Course, CourseVideo, QuizQuestion, QuizResult, PhaseConfig, VideoCheckpoint } from '../../types';
import { TRACKS } from '../../constants';

const TRACK_BADGE: Record<string, string> = {
  ventas: 'bg-aconso-100 text-aconso-700',
  tecnica: 'bg-indigo-100 text-indigo-700',
  cumplimiento: 'bg-amber-100 text-amber-700',
  todas: 'bg-gray-100 text-gray-600',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function deadlineBadge(deadline: string | null, t: any) {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) {
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-700">{t('courses.overdue')}</span>;
  }
  if (diffDays <= 3) {
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">{t('courses.dueInDays', { n: diffDays })}</span>;
  }
  return <span className="text-[11px] text-amber-600 font-medium">{deadline.slice(0, 10)}</span>;
}

export default function PartnerCourses() {
  const { t, i18n } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, number>>({});
  const [playingVideo, setPlayingVideo] = useState<CourseVideo | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [checkpoints, setCheckpoints] = useState<VideoCheckpoint[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<VideoCheckpoint | null>(null);
  const [checkpointAnswer, setCheckpointAnswer] = useState<number | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState<{ correct: boolean } | null>(null);
  const [checkpointDone, setCheckpointDone] = useState<Set<string>>(new Set());
  const [selPhase, setSelPhase] = useState(1);
  const [selDay, setSelDay] = useState(1);
  const [examOpen, setExamOpen] = useState(false);
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<string, any>>({});
  const [examResult, setExamResult] = useState<any>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingInfo, setRatingInfo] = useState<any>(null);
  const [ratingList, setRatingList] = useState<any[]>([]);

  useEffect(() => { coursesApi.list().then((r) => setCourses(r.data)).catch(() => setCourses([])); }, [i18n.language]);

  const openCourse = async (c: Course) => {
    const r = await coursesApi.get(c.id);
    setSelected(r.data);
    setQuizQuestions([]); setQuizAnswers({}); setQuizResult(null); setActiveVideoId(null);
    let prog: Record<string, boolean> = {};
    if (r.data.videos.length > 0) {
      try {
        const p = await coursesApi.getVideoProgress(c.id);
        prog = p.data || {};
      } catch { prog = {}; }
      setProgress(prog);
    }
    const pc: PhaseConfig[] = r.data.phase_config?.length ? r.data.phase_config : [{ phase: 1, days: 2 }];
    const vids = r.data.videos || [];
    let bestPhase = 1;
    for (const phase of pc) {
      const phaseVids = vids.filter((v: CourseVideo) => (v.phase || 1) === phase.phase);
      if (phaseVids.length === 0 || phaseVids.every((v: CourseVideo) => prog[v.id])) {
        bestPhase = phase.phase;
      } else {
        break;
      }
    }
    setSelPhase(bestPhase); setSelDay(1);
    loadRating(c.id);
  };

  const openPlayer = (v: CourseVideo) => {
    setPlayingVideo(v);
    setCheckpoints([]);
    setActiveCheckpoint(null);
    setCheckpointAnswer(null);
    setCheckpointFeedback(null);
    setCheckpointDone(new Set());
    if (selected) {
      coursesApi.getCheckpoints(selected.id, v.id).then((r) => {
        setCheckpoints(r.data || []);
      }).catch(() => setCheckpoints([]));
    }
  };

  const openExam = async () => {
    if (!selected) return;
    setExamOpen(true); setExamResult(null); setExamAnswers({}); setExamLoading(true);
    try { const r = await coursesApi.getExam(selected.id); setExamQuestions(r.data || []); } catch { setExamQuestions([]); } finally { setExamLoading(false); }
  };

  const submitExam = async () => {
    if (!selected) return;
    const answers = examQuestions.map((q) => {
      if (q.question_type === 'multiple') return { question_id: q.id, selected_indices: examAnswers[q.id] || [] };
      if (q.question_type === 'fill') return { question_id: q.id, answer: examAnswers[q.id] || '' };
      return { question_id: q.id, selected_index: examAnswers[q.id] };
    });
    const answered = answers.every((a) => (a.selected_indices !== undefined && a.selected_indices.length > 0) || a.answer !== undefined || a.selected_index !== undefined);
    if (!answered) { alert(t('quiz.required')); return; }
    try {
      const r = await coursesApi.submitExam(selected.id, answers);
      setExamResult(r.data);
      if (r.data.passed) {
        const updated = await coursesApi.get(selected.id);
        setCourses((prev) => prev.map((c) => c.id === selected.id ? { ...c, completed: updated.data.completed, progress_pct: updated.data.progress_pct } : c));
      }
    } catch { /* */ }
  };

  const loadRating = async (courseId?: string) => {
    if (!courseId && !selected) return;
    const id = courseId || selected!.id;
    try {
      const r = await coursesApi.getRating(id);
      setRatingInfo(r.data);
      setRatingStars(r.data.my_rating?.stars || 0);
      setRatingComment(r.data.my_rating?.comment || '');
      setRatingList(r.data.ratings || []);
    } catch { /* */ }
  };

  const submitRating = async () => {
    if (!selected || ratingStars < 1) return;
    try {
      await coursesApi.submitRating(selected.id, ratingStars, ratingComment);
      await loadRating();
      const updated = await coursesApi.get(selected.id);
      setCourses((prev) => prev.map((c) => c.id === selected.id ? { ...c, rating_avg: updated.data.rating_avg, rating_count: updated.data.rating_count, rated: true } : c));
    } catch { /* */ }
  };

  const closePlayer = () => {
    if (videoRef.current) { videoRef.current.pause(); }
    setPlayingVideo(null);
    setCheckpoints([]);
    setActiveCheckpoint(null);
    setCheckpointAnswer(null);
    setCheckpointFeedback(null);
  };

  const handleCheckpointSubmit = async (selectedIndex: number) => {
    if (!activeCheckpoint || !selected || !playingVideo) return;
    setCheckpointAnswer(selectedIndex);
    setCheckpointFeedback(null);
    try {
      const r = await coursesApi.submitCheckpoint(selected.id, playingVideo.id, activeCheckpoint.id, selectedIndex);
      const { correct, jump_to } = r.data;
      setCheckpointFeedback({ correct });
      if (correct) {
        setCheckpointDone((prev) => new Set(prev).add(activeCheckpoint.id));
        setTimeout(() => {
          setActiveCheckpoint(null);
          setCheckpointAnswer(null);
          setCheckpointFeedback(null);
          if (videoRef.current) videoRef.current.play();
        }, 1200);
      } else {
        setTimeout(() => {
          setActiveCheckpoint(null);
          setCheckpointAnswer(null);
          setCheckpointFeedback(null);
          if (videoRef.current) {
            videoRef.current.currentTime = jump_to || 0;
            videoRef.current.play();
          }
        }, 1500);
      }
    } catch { /* */ }
  };

  const handleCheckpointTimeUpdate = () => {
    if (!videoRef.current || !checkpoints.length || activeCheckpoint) return;
    const t = videoRef.current.currentTime;
    for (const cp of checkpoints) {
      if (cp.timestamp_seconds > 0 && Math.abs(t - cp.timestamp_seconds) < 0.4 && !checkpointDone.has(cp.id)) {
        videoRef.current.pause();
        setActiveCheckpoint(cp);
        setCheckpointAnswer(null);
        setCheckpointFeedback(null);
        break;
      }
    }
  };

  const loadQuiz = async (videoId: string) => {
    if (activeVideoId === videoId) { setActiveVideoId(null); setQuizQuestions([]); return; }
    setActiveVideoId(videoId); setQuizResult(null); setQuizAnswers({}); setQuizLoading(true); setQuizQuestions([]);
    try { const r = await coursesApi.getQuizQuestions(selected!.id, videoId); setQuizQuestions(r.data || []); } catch { setQuizQuestions([]); } finally { setQuizLoading(false); }
  };

  const submitQuiz = async () => {
    if (!selected || !activeVideoId) return;
    const answers = Object.entries(quizAnswers).map(([question_id, selected_index]) => ({ question_id, selected_index }));
    if (answers.length < quizQuestions.length) { alert(t('quiz.required')); return; }
    try {
      const r = await coursesApi.submitQuiz(selected.id, activeVideoId, answers);
      setQuizResult(r.data);
      setQuizAttempts((prev) => ({ ...prev, [activeVideoId]: (prev[activeVideoId] || 0) + 1 }));
      if (r.data.passed) {
        setProgress((prev) => ({ ...prev, [activeVideoId]: true }));
        const updated = await coursesApi.get(selected.id);
        setCourses((prev) => prev.map((c) => c.id === selected.id ? { ...c, completed: updated.data.completed, progress_pct: updated.data.progress_pct } : c));
      }
    } catch { /* */ }
  };

  const getLocalized = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val[i18n.language] || val.en || val.es || val.de || '';
  };

  const phaseVideos = (phase: number, day: number) => {
    if (!selected) return [];
    return selected.videos.filter((v: CourseVideo) => (v.phase || 1) === phase && (v.day || 1) === day);
  };

  const phaseCompleted = (phase: number, phaseConfig: PhaseConfig[]) => {
    if (!selected) return false;
    const pc = phaseConfig.find((p) => p.phase === phase);
    if (!pc) return false;
    for (let d = 1; d <= pc.days; d++) {
      const vids = phaseVideos(phase, d);
      if (vids.length > 0 && !vids.every((v) => progress[v.id])) return false;
    }
    return true;
  };

  const isPhaseUnlocked = (phase: number, phaseConfig: PhaseConfig[]) => {
    if (phase === 1) return true;
    return phaseCompleted(phase - 1, phaseConfig);
  };

  if (selected) {
    const phaseConfig: PhaseConfig[] = selected.phase_config?.length ? selected.phase_config : [{ phase: 1, days: 2 }];
    const totalVids = selected.videos.length;
    const completedVids = selected.videos.filter((v: CourseVideo) => progress[v.id]).length;
    const pct = totalVids > 0 ? Math.round((completedVids / totalVids) * 100) : 0;
    const curPhaseObj = phaseConfig.find((p) => p.phase === selPhase) || phaseConfig[0];

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button onClick={() => { setSelected(null); setQuizQuestions([]); setQuizResult(null); setActiveVideoId(null); }} className="text-sm text-gray-500 hover:text-aconso-600 mb-6 flex items-center gap-1 transition-colors">
          ← {t('courses.backToLibrary')}
        </button>

        <div className="card overflow-hidden mb-6">
          <div className="h-48 bg-gradient-to-br from-aconso-500 to-aconso-700 flex items-center justify-center">
            <span className="text-white text-6xl font-bold opacity-20">{(selected.title || '').charAt(0)}</span>
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{getLocalized(selected.title)}</h2>
            <p className="text-gray-500 mb-6">{getLocalized(selected.description)}</p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              {selected.deadline && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                   {t('courses.deadline')}: {selected.deadline.slice(0, 10)}
                </span>
              )}
              {selected.exam_questions_count > 0 && (
                <button onClick={openExam} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-aconso-600 text-white hover:bg-aconso-700 transition-colors">
                   {t('courses.takeExam')} ({selected.exam_questions_count})
                </button>
              )}
              {(selected.rating_count || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                  <span className="text-amber-400"></span> {selected.rating_avg} ({selected.rating_count})
                </span>
              )}
            </div>

            {totalVids > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">{completedVids}/{totalVids} {t('courses.quizzesPassed')}</span>
                  <span className="font-bold text-aconso-600">{pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-aconso-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {/* Phase Progress */}
            <div className="flex gap-2 mb-6">
              {phaseConfig.map((p) => {
                const done = phaseCompleted(p.phase, phaseConfig);
                const unlocked = isPhaseUnlocked(p.phase, phaseConfig);
                return (
                  <button
                    key={p.phase}
                    onClick={() => { if (unlocked) { setSelPhase(p.phase); setSelDay(1); } }}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selPhase === p.phase ? 'border-aconso-500 bg-aconso-50 text-aconso-700' :
                      done ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                      !unlocked ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed' :
                      'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {done ? '' : !unlocked ? '' : ''} {t('courses.phase')} {p.phase}
                  </button>
                );
              })}
            </div>

            {/* Day Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {Array.from({ length: curPhaseObj?.days || 1 }, (_, i) => i + 1).map((d) => (
                <button key={d} onClick={() => setSelDay(d)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${selDay === d ? 'bg-aconso-500 text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}>
                  {t('courses.day')} {d}
                </button>
              ))}
            </div>

            {/* Videos for current phase/day */}
            {phaseVideos(selPhase, selDay).length > 0 ? (
              <div className="space-y-4">
                {phaseVideos(selPhase, selDay).map((v: CourseVideo) => {
                  const done = progress[v.id];
                  const isQuizOpen = activeVideoId === v.id;
                  return (
                    <div key={v.id}>
                      <div className={`rounded-xl border transition-all overflow-hidden ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 hover:border-aconso-300'}`}>
                        <div className="flex items-center gap-4 p-4">
                          <div className="w-48 h-28 bg-gray-900 rounded-lg overflow-hidden shrink-0 cursor-pointer relative group" onClick={() => openPlayer(v)}>
                            <video className="w-full h-full object-cover" preload="metadata"><source src={v.video_url} type="video/mp4" /></video>
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-aconso-600 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{getLocalized(v.title)}</div>
                            {v.description && <div className="text-xs text-gray-500 mt-0.5">{getLocalized(v.description)}</div>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {done && <span className="text-xs text-emerald-600 font-medium"> {t('quiz.passed')}</span>}
                            <button onClick={() => loadQuiz(v.id)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${isQuizOpen ? 'bg-aconso-100 text-aconso-700' : 'text-aconso-600 hover:text-aconso-700 hover:bg-aconso-50'}`}>
                               {t('quiz.title')}
                            </button>
                          </div>
                        </div>
                        {isQuizOpen && (
                          <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-5">
                            {quizLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
                                <span className="ml-3 text-sm text-gray-400">{t('common.loading')}</span>
                              </div>
                            ) : quizQuestions.length === 0 ? (
                              <div className="text-center py-8">
                                <div className="text-3xl mb-2"></div>
                                <p className="text-sm text-gray-400">{t('quiz.noQuestions')}</p>
                              </div>
                            ) : !quizResult ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-sm text-gray-800">{t('quiz.title')}</div>
                                  {selected.pass_mark != null && <span className="text-xs font-medium text-gray-500"> {t('lms.passMark')}: {selected.pass_mark}%</span>}
                                </div>
                                {quizQuestions.map((q, qi) => {
                                  const qText = getLocalized(q.question);
                                  return (
                                    <div key={q.id} className="space-y-2">
                                      <div className="text-sm font-medium text-gray-700">{t('quiz.question')} {qi + 1}: {qText}</div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {(q.options || []).map((opt: any, oi: number) => {
                                          const optText = getLocalized(opt);
                                          const isSelected = quizAnswers[q.id] === oi;
                                          return (
                                            <button key={oi} onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))} className={`text-left text-sm px-4 py-2.5 rounded-lg border-2 transition-all ${isSelected ? 'border-aconso-500 bg-aconso-50 text-aconso-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                              {optText}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                                <button onClick={submitQuiz} className="btn-primary !py-2">{t('quiz.submitQuiz')}</button>
                              </>
                            ) : (
                              <div className="space-y-4">
                                <div className={`text-center p-4 rounded-xl ${quizResult.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                                  <div className="text-lg font-bold">{quizResult.passed ? t('quiz.passed') : t('quiz.failed')}</div>
                                  <div className="text-sm mt-1">{t('quiz.score')}: {quizResult.score}% ({quizResult.correct}/{quizResult.total})</div>
                                </div>
                                {quizResult.results.map((r) => {
                                  const q = quizQuestions.find((qq) => qq.id === r.question_id);
                                  const qText = q ? getLocalized(q.question) : '';
                                  return (
                                    <div key={r.question_id} className={`text-sm p-3 rounded-lg ${r.is_correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                      {r.is_correct ? '' : ''} {qText}
                                    </div>
                                  );
                                })}
                                <div className="flex gap-2">
                                  {(quizAttempts[activeVideoId] || 0) < 3 && (
                                    <button onClick={() => { setQuizResult(null); setQuizAnswers({}); }} className="btn-primary !py-2">{t('quiz.retakeQuiz')}</button>
                                  )}
                                  {(quizAttempts[activeVideoId] || 0) >= 3 && !quizResult?.passed && (
                                    <span className="text-sm text-amber-600 font-medium py-2">{t('quiz.maxAttempts')}</span>
                                  )}
                                  <button onClick={() => { setActiveVideoId(null); setQuizResult(null); setQuizQuestions([]); setQuizAnswers({}); }} className="btn-secondary !py-2">{t('quiz.complete')}</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3"></div>
                <p>{t('courses.noContentYet')}</p>
              </div>
            )}

            {selected.materials?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2"> {t('courses.materials')}</h4>
                    <ul className="space-y-1.5">
                      {selected.materials.map((m: any, mi: number) => (
                        <li key={m.id || mi}>
                          <a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-aconso-600 hover:text-aconso-700 hover:underline flex items-center gap-1.5">
                             {typeof m === 'string' ? m : (m.name || m.url)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
              </div>
            )}

            {/* Rating */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                 {t('courses.rating')}
                {(ratingInfo?.rating_count || 0) > 0 && <span className="text-xs font-normal text-gray-400">({ratingInfo.rating_avg} · {ratingInfo.rating_count})</span>}
              </h4>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRatingStars(s)} className={`text-2xl transition-colors ${s <= ratingStars ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}></button>
                ))}
                {ratingStars < 1 && <span className="text-xs text-gray-400 ml-2">{t('courses.yourRating')}</span>}
              </div>
              <div className="flex gap-2 mb-4">
                <input value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder={t('courses.ratingPlaceholder')} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" />
                <button onClick={submitRating} disabled={ratingStars < 1} className="btn-primary !py-2 !px-5 text-sm disabled:opacity-50">{t('courses.submitRating')}</button>
              </div>
              {ratingList.length > 0 ? (
                <div className="space-y-2">
                  {ratingList.map((r: any) => (
                    <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{r.partner_name}</span>
                        <span className="text-amber-400 text-xs">{''.repeat(r.stars)}<span className="text-gray-300">{''.repeat(5 - r.stars)}</span></span>
                      </div>
                      {r.comment && <p className="text-sm text-gray-500 mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">{t('courses.noRatings')}</p>
              )}
            </div>
          </div>
        </div>

          {playingVideo && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={closePlayer}>
              <div className="bg-black rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 bg-gray-900">
                  <h3 className="text-white font-semibold text-sm">{getLocalized(playingVideo.title)}</h3>
                  <button onClick={closePlayer} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <video ref={videoRef} className="w-full" controls autoPlay onTimeUpdate={handleCheckpointTimeUpdate}>
                  <source src={playingVideo.video_url} type="video/mp4" />
                  {t('courses.videoNotSupported')}
                </video>
                {playingVideo.description && (
                  <div className="px-6 py-3 bg-gray-900">
                    <p className="text-gray-400 text-sm">{getLocalized(playingVideo.description)}</p>
                  </div>
                )}

                {/* Checkpoint quiz overlay */}
                {activeCheckpoint && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{t('courses.exam') || t('checkpoints.title')}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">{getLocalized(activeCheckpoint.question)}</h4>
                      <div className="space-y-2">
                        {(activeCheckpoint.options || []).map((opt: any, oi: number) => {
                          const answered = checkpointAnswer !== null;
                          const isSel = checkpointAnswer === oi;
                          const isCorrect = checkpointFeedback?.correct && isSel;
                          const isWrong = checkpointFeedback && !checkpointFeedback.correct && isSel;
                          return (
                            <button
                              key={oi}
                              disabled={answered}
                              onClick={() => handleCheckpointSubmit(oi)}
                              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : isWrong ? 'border-red-500 bg-red-50 text-red-700'
                                : answered ? 'border-gray-200 text-gray-400'
                                : 'border-gray-200 text-gray-700 hover:border-amber-400 hover:bg-amber-50'
                              }`}
                            >
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-current mr-2 text-xs font-bold shrink-0">{String.fromCharCode(65 + oi)}</span>
                              {getLocalized(opt)}
                            </button>
                          );
                        })}
                      </div>
                      {checkpointFeedback && (
                        <div className={`mt-4 p-3 rounded-xl text-sm font-semibold text-center ${
                          checkpointFeedback.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {checkpointFeedback.correct ? t('checkpoints.correctAnswer') : t('checkpoints.wrongAnswer')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {examOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in" onClick={() => setExamOpen(false)}>
              <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2"> {t('courses.exam')}</h3>
                  <button onClick={() => setExamOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  {examLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-6 h-6 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
                      <span className="ml-3 text-sm text-gray-400">{t('common.loading')}</span>
                    </div>
                  ) : examQuestions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-3xl mb-2"></div>
                      <p className="text-sm text-gray-400">{t('quiz.noQuestions')}</p>
                    </div>
                  ) : !examResult ? (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-500">{t('courses.examIntro', { count: examQuestions.length })}</p>
                      {examQuestions.map((q, qi) => {
                        const qText = getLocalized(q.question);
                        return (
                          <div key={q.id} className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">{t('quiz.question')} {qi + 1}: {qText}</div>
                            {q.question_type === 'fill' ? (
                              <input value={examAnswers[q.id] || ''} onChange={(e) => setExamAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))} placeholder={t('quiz.selectAnswer')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none" />
                            ) : q.question_type === 'multiple' ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(q.options || []).map((opt: any, oi: number) => {
                                  const sel = (examAnswers[q.id] || []) as number[];
                                  const active = sel.includes(oi);
                                  return (
                                    <button key={oi} onClick={() => setExamAnswers((prev) => {
                                      const cur = (prev[q.id] || []) as number[];
                                      return { ...prev, [q.id]: active ? cur.filter((x) => x !== oi) : [...cur, oi] };
                                    })} className={`text-left text-sm px-4 py-2.5 rounded-lg border-2 transition-all ${active ? 'border-aconso-500 bg-aconso-50 text-aconso-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                       {getLocalized(opt)}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(q.options || []).map((opt: any, oi: number) => {
                                  const active = examAnswers[q.id] === oi;
                                  return (
                                    <button key={oi} onClick={() => setExamAnswers((prev) => ({ ...prev, [q.id]: oi }))} className={`text-left text-sm px-4 py-2.5 rounded-lg border-2 transition-all ${active ? 'border-aconso-500 bg-aconso-50 text-aconso-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                      {q.question_type === 'true_false' ? (oi === 0 ? ' ' + t('quiz.true') : ' ' + t('quiz.false')) : getLocalized(opt)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button onClick={submitExam} className="btn-primary w-full !py-3">{t('quiz.submitQuiz')}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={`text-center p-6 rounded-xl ${examResult.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                        <div className="text-xl font-bold">{examResult.passed ? t('quiz.passed') : t('quiz.failed')}</div>
                        <div className="text-sm mt-1">{t('quiz.score')}: {examResult.score}% ({examResult.correct}/{examResult.total})</div>
                      </div>
                      <button onClick={() => setExamOpen(false)} className="btn-primary w-full !py-3">{t('quiz.complete')}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('courses.libraryTitle')}</h1>
        <p className="text-gray-500 mt-1">{t('courses.phaseDescription')}</p>
      </div>
      {courses.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4"></div>
          <p className="text-gray-500 text-lg">{t('courses.noCoursesYet')}</p>
        </div>
      ) : (
        <>
          {(() => {
            const completedIds = new Set(courses.filter((c) => c.completed).map((c) => c.id));
            const sorted = [...courses].sort((a, b) => {
              const pa = a.phase_config?.[0]?.phase || 0;
              const pb = b.phase_config?.[0]?.phase || 0;
              return pa - pb;
            });
            const groups = new Map<number, typeof courses>();
            for (const c of sorted) {
              const p = c.phase_config?.[0]?.phase || 0;
              if (!groups.has(p)) groups.set(p, []);
              groups.get(p)!.push(c);
            }
            const PHASE_GRADIENTS = ['from-aconso-500 to-aconso-700', 'from-emerald-500 to-emerald-700', 'from-amber-500 to-amber-700', 'from-purple-500 to-purple-700', 'from-red-500 to-red-700', 'from-blue-500 to-blue-700'];
            return Array.from(groups.entries()).map(([phaseNum, phaseCourses]) => (
              <div key={phaseNum} className="mb-8 last:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PHASE_GRADIENTS[(phaseNum - 1) % PHASE_GRADIENTS.length]} text-white flex items-center justify-center text-sm font-bold shadow-md`}>
                    {phaseNum}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{t('courses.phase')} {phaseNum}</h2>
                    <p className="text-xs text-gray-400">{phaseCourses.length} {phaseCourses.length === 1 ? t('courses.courseTitle') : t('courses.courses')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {phaseCourses.map((c) => {
                    const phaseNum = c.phase_config?.[0]?.phase || 0;
                    const track = c.track || 'todas';
                    const locked = !!c.prerequisite && !completedIds.has(c.prerequisite.id);
                    return (
                      <div key={c.id} onClick={() => { if (!locked) openCourse(c); }} className={`card overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${locked ? 'opacity-70 pointer-events-auto' : ''}`}>
                        <div className="h-40 bg-gradient-to-br from-aconso-500 to-aconso-700 flex items-center justify-center relative">
                          {c.thumbnail_url ? (
                            <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span className="text-white text-5xl font-bold opacity-20">{(getLocalized(c.title) || '').charAt(0)}</span>
                          )}
                          <div className="absolute top-3 left-3 text-xs text-white font-bold bg-aconso-800/60 px-3 py-1 rounded-full">{t('courses.phase')} {phaseNum}</div>
                          <div className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${TRACK_BADGE[track]}`}>{TRACKS[track]?.[i18n.language] || track}</div>
                          {c.completed && (
                            <div className="absolute top-11 right-3"><span className="badge bg-emerald-500 text-white border border-emerald-600"></span></div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-gray-900 ${locked ? 'line-through' : ''}`}>{getLocalized(c.title)}</h3>
                            {locked && <span className="text-lg" title={t('lms.prerequisitesNotMet')}></span>}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{getLocalized(c.description) || t('courses.noDescription')}</p>
                          {locked && c.prerequisite && (
                            <p className="text-xs text-amber-600 font-medium mb-3">
                               {t('courses.prerequisite')}: {getLocalized(c.prerequisite.title)}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400 flex items-center gap-1"> {c.video_count} {t('courses.videos')}</span>
                            {c.completed ? (
                              <span className="text-emerald-600 font-medium"> {t('courses.completed')}</span>
                            ) : (
                              <span className="text-aconso-600 font-medium group-hover:text-aconso-700 transition-colors">{locked ? t('courses.locked') : t('courses.startLearning')} →</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {c.deadline && <span className="text-[11px] text-amber-600 font-medium"> {c.deadline.slice(0, 10)}</span>}
                            {(c.rating_count || 0) > 0 && <span className="text-[11px] text-gray-400"> {c.rating_avg} ({c.rating_count})</span>}
                            {c.exam_questions_count > 0 && <span className="text-[11px] text-gray-400"> {c.exam_questions_count}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </>
      )}
    </div>
  );
}
