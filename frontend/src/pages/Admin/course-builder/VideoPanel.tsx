import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseVideo, QuizQuestion } from '../../../types';
import { coursesApi } from '../../../services/api';
import QuizEditor from './QuizEditor';

type Tab = 'info' | 'quiz';

interface Props {
  courseId: string;
  video: CourseVideo;
  onRefresh: () => void;
  onClose: () => void;
}

export default function VideoPanel({ courseId, video, onRefresh, onClose }: Props) {
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
    <div className="border-l border-gray-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-full bg-aconso-100 text-aconso-600 flex items-center justify-center text-[10px] font-bold shrink-0">
              {video.video_order}
            </span>
            <h3 className="text-sm font-bold text-gray-900 truncate">{getVideoTitle(video)}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm px-1 shrink-0">✕</button>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['info', 'quiz'] as const).map(t2 => (
            <button key={t2} onClick={() => setTab(t2)}
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${tab === t2 ? 'bg-white text-aconso-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t2 === 'info' ? t('courses.info') : `Quiz` + (questions.length > 0 ? ` (${questions.length})` : '')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'info' ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
              <video className="w-full h-full object-cover" preload="metadata" controls>
                <source src={video.video_url} />
              </video>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1.5">
              <div className="flex justify-between"><span>{t('courses.phase')}</span><span className="font-medium text-gray-700">{video.phase || 1}</span></div>
              <div className="flex justify-between"><span>{t('courses.day')}</span><span className="font-medium text-gray-700">{video.day || 1}</span></div>
              <div className="flex justify-between"><span>{t('courses.videoOrder') || 'Orden'}</span><span className="font-medium text-gray-700">{video.video_order}</span></div>
              {video.duration_seconds > 0 && (
                <div className="flex justify-between"><span>{t('courses.duration') || 'Duración'}</span><span className="font-medium text-gray-700">{Math.round(video.duration_seconds / 60)} min</span></div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {loadingQuiz ? (
              <div className="text-center py-8 text-gray-400 text-sm">...</div>
            ) : (
              <QuizEditor courseId={courseId} videoId={video.id} questions={questions} onRefresh={loadQuiz} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
