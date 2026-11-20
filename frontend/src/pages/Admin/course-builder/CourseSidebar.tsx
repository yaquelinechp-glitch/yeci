import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBook, IconClipboard, IconFlag } from '../../../components/icons';
import type { Course, CourseVideo } from '../../../types';

interface Props {
  course: Course;
  selectedVideoId: string | null;
  selectedView: 'video' | 'bank' | 'exam';
  activePhase: number;
  onSelectVideo: (videoId: string) => void;
  onSelectPhase: (phase: number) => void;
  onSelectBank: () => void;
  onSelectExam: () => void;
  onAddDay: (phase: number) => void;
  onDeleteVideo: (videoId: string) => void;
  onReorderVideo: (videoId: string, direction: -1 | 1) => void;
}

export default function CourseSidebar({
  course, selectedVideoId, selectedView, activePhase,
  onSelectVideo, onSelectPhase, onSelectBank, onSelectExam,
  onAddDay, onDeleteVideo, onReorderVideo,
}: Props) {
  const { t } = useTranslation();
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(() => {
    const phases = course.phase_config?.map(p => p.phase) || [1];
    return new Set(phases);
  });

  const togglePhase = (phase: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase); else next.add(phase);
      return next;
    });
  };

  const videosByPhase = (phase: number) => course.videos.filter(v => (v.phase || 1) === phase);
  const videosByPhaseDay = (phase: number, day: number) =>
    course.videos.filter(v => (v.phase || 1) === phase && (v.day || 1) === day)
      .sort((a, b) => a.video_order - b.video_order);

  const getVideoTitle = (v: CourseVideo) => {
    if (!v.title) return t('courses.untitled');
    if (typeof v.title === 'string') return v.title;
    return v.title.en || v.title.es || v.title.de || t('courses.untitled');
  };

  const pc = course.phase_config?.length ? course.phase_config : [{ phase: 1, days: 3 }];
  const totalVideos = course.videos.length;

  return (
    <div className="flex flex-col h-full min-h-0 max-h-[50vh] lg:max-h-none bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
      {/* Course summary */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-aconso-50 text-aconso-600 flex items-center justify-center shrink-0">
            <IconBook className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{t('courses.courseContent')}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {totalVideos} {t('courses.videos')} · {pc.length} {t('courses.phases')}
            </p>
          </div>
        </div>
      </div>

      {/* Phases and days */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-2 py-2">
        {pc.map(p => {
          const expanded = expandedPhases.has(p.phase);
          const phaseVids = videosByPhase(p.phase);
          const isActive = activePhase === p.phase && selectedView === 'video';
          return (
            <div key={p.phase} className="mb-0.5">
              <button
                onClick={() => { onSelectPhase(p.phase); if (!expanded) togglePhase(p.phase); }}
                aria-expanded={expanded}
                className={`w-full flex items-center gap-1.5 pl-2 pr-2 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-aconso-50 text-aconso-700' : 'text-gray-700 hover:bg-gray-50'
                }`}>
                <IconChevron className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`} />
                <span className="flex-1 min-w-0 text-left text-sm font-semibold truncate">
                  {t('courses.phase')} {p.phase}
                </span>
                <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white text-aconso-600' : 'bg-gray-100 text-gray-500'
                }`}>{phaseVids.length}</span>
              </button>

              {expanded && (
                <div className="mt-0.5 pl-2 space-y-1">
                  {Array.from({ length: p.days }, (_, i) => i + 1).map(day => {
                    const dayVids = videosByPhaseDay(p.phase, day);
                    return (
                      <div key={day}>
                        <div className="flex items-center gap-1.5 pl-1.5 pr-1 py-1">
                          <span className="text-[11px] font-semibold text-gray-500">
                            {t('courses.day')} {day}
                          </span>
                          <span className="flex-1 h-px bg-gray-100" />
                          <span className="text-[10px] font-medium text-gray-400">{dayVids.length}</span>
                        </div>

                        <div className="space-y-0.5">
                          {dayVids.map((v, vi) => {
                            const vActive = selectedView === 'video' && selectedVideoId === v.id;
                            return (
                              <div key={v.id}
                                onClick={() => onSelectVideo(v.id)}
                                className={`group/video flex items-center gap-1.5 pl-1.5 pr-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                  vActive ? 'bg-aconso-50 ring-1 ring-aconso-200' : 'hover:bg-gray-50'
                                }`}>
                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                  vActive ? 'bg-aconso-500 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>{vi + 1}</span>
                                <span className={`flex-1 min-w-0 text-xs truncate ${
                                  vActive ? 'text-aconso-700 font-semibold' : 'text-gray-600'
                                }`}>
                                  {getVideoTitle(v)}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/video:opacity-100 sm:group-focus-within/video:opacity-100 transition-opacity">
                                  <button onClick={e => { e.stopPropagation(); onReorderVideo(v.id, -1); }}
                                    className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-aconso-600 hover:bg-white transition-colors"
                                    aria-label={t('common.moveUp') || 'Subir'} title={t('common.moveUp') || 'Subir'}>
                                    <IconChevronUp className="w-3 h-3" />
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); onReorderVideo(v.id, 1); }}
                                    className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-aconso-600 hover:bg-white transition-colors"
                                    aria-label={t('common.moveDown') || 'Bajar'} title={t('common.moveDown') || 'Bajar'}>
                                    <IconChevronUp className="w-3 h-3 rotate-180" />
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); onDeleteVideo(v.id); }}
                                    className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors"
                                    aria-label={t('common.delete')} title={t('common.delete')}>
                                    <IconTrash className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <button onClick={() => onAddDay(p.phase)}
                    className="w-full flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-aconso-600 hover:bg-aconso-50 transition-colors">
                    <IconPlus className="w-3 h-3" />
                    {t('courses.addDay')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Evaluation tools */}
      <div className="border-t border-gray-100 px-2 py-2 space-y-0.5">
        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {t('courses.tabQuiz')}
        </p>
        <button onClick={onSelectBank}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            selectedView === 'bank'
              ? 'bg-aconso-50 text-aconso-700 ring-1 ring-aconso-200'
              : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <IconClipboard className={`w-4 h-4 shrink-0 ${selectedView === 'bank' ? 'text-aconso-600' : 'text-gray-400'}`} />
          <span className="flex-1 min-w-0 text-left truncate">{t('courses.questionBank')}</span>
        </button>
        <button onClick={onSelectExam}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            selectedView === 'exam'
              ? 'bg-aconso-50 text-aconso-700 ring-1 ring-aconso-200'
              : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <IconFlag className={`w-4 h-4 shrink-0 ${selectedView === 'exam' ? 'text-aconso-600' : 'text-gray-400'}`} />
          <span className="flex-1 min-w-0 text-left truncate">{t('courses.examFinal')}</span>
        </button>
      </div>
    </div>
  );
}

/* Local icons */
function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconChevronUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
    </svg>
  );
}