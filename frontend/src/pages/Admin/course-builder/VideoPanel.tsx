import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseVideo, QuizQuestion } from '../../../types';
import { coursesApi } from '../../../services/api';
import { IconClipboard, IconPlay } from '../../../components/icons';
import QuizEditor from './QuizEditor';
import VideoPlayer from '../../../components/VideoPlayer';

type Tab = 'info' | 'quiz';

interface Props {
  courseId: string;
  video: CourseVideo;
  onClose: () => void;
}

export default function VideoPanel({ courseId, video, onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('quiz');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const loadQuiz = async () => {
    setLoadingQuiz(true);
    try { const r = await coursesApi.getQuizQuestions(courseId, video.id); setQuestions(r.data || []); } catch { setQuestions([]); }
    finally { setLoadingQuiz(false); }
  };

  useEffect(() => { loadQuiz(); }, [video.id]);

  const getVideoTitle = (v: CourseVideo) => {
    if (!v.title) return t('courses.untitled');
    if (typeof v.title === 'string') return v.title;
    return v.title.en || v.title.es || v.title.de || t('courses.untitled');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border-t xl:border-t-0 xl:border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-aconso-50 text-aconso-600 flex items-center justify-center text-[11px] font-bold shrink-0">
              {video.video_order}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{getVideoTitle(video)}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t('courses.phase')} {video.phase || 1} · {t('courses.day')} {video.day || 1}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 shrink-0 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
            aria-label={t('common.cancel')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {(['info', 'quiz'] as const).map(t2 => {
            const active = tab === t2;
            return (
              <button key={t2} onClick={() => setTab(t2)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  active ? 'bg-white text-aconso-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t2 === 'info'
                  ? <><IconPlay className="w-3 h-3" />{t('courses.info')}</>
                  : <><IconClipboard className="w-3 h-3" />{t('quiz.title')}{questions.length > 0 && ` (${questions.length})`}</>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4">
        {tab === 'info' ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden ring-1 ring-black/5">
              <VideoPlayer src={video.video_url} className="w-full h-full" controls />
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 divide-y divide-gray-100 text-xs">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-500">{t('courses.phase')}</span>
                <span className="font-semibold text-gray-800">{video.phase || 1}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-500">{t('courses.day')}</span>
                <span className="font-semibold text-gray-800">{video.day || 1}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-500">{t('courses.videoOrder') || 'Orden'}</span>
                <span className="font-semibold text-gray-800">{video.video_order}</span>
              </div>
              {video.duration_seconds > 0 && (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-gray-500">{t('courses.duration') || 'Duración'}</span>
                  <span className="font-semibold text-gray-800">{Math.round(video.duration_seconds / 60)} min</span>
                </div>
              )}
            </div>
          </div>
        ) : loadingQuiz ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        ) : (
          <QuizEditor courseId={courseId} videoId={video.id} questions={questions} onRefresh={loadQuiz} />
        )}
      </div>
    </div>
  );
}