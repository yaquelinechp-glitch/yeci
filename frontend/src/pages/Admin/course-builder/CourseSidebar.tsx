import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  onUploadToDay: (phase: number, day: number, file: File) => void;
  onUploadUrlToDay: (phase: number, day: number, url: string) => void;
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
    <div className="border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400"></span>
          <span className="text-xs font-semibold text-gray-900 truncate">{courseTitle(course)}</span>
        </div>
        <div className="text-[11px] text-gray-400">{totalVideos} {t('courses.videos')} · {pc.length} {t('courses.phases')}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {pc.map(p => {
          const expanded = expandedPhases.has(p.phase);
          const phaseVids = videosByPhase(p.phase);
          const isActive = activePhase === p.phase && selectedView === 'video';
          return (
            <div key={p.phase} className="mb-1">
              <button onClick={() => { togglePhase(p.phase); onSelectPhase(p.phase); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group ${
                  isActive ? 'bg-aconso-50 border border-aconso-200' : 'hover:bg-gray-50'
                }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isActive ? 'bg-aconso-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {p.phase}
                </span>
                <span className={`flex-1 text-left text-sm font-medium ${isActive ? 'text-aconso-700' : 'text-gray-700'}`}>
                  {t('courses.phase')} {p.phase}
                </span>
                <span className="text-[10px] text-gray-400 mr-1">{phaseVids.length}</span>
                <span className={`text-gray-400 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {expanded && (
                <div className="ml-3 pl-3 border-l border-gray-100">
                  {Array.from({ length: p.days }, (_, i) => i + 1).map(day => {
                    const dayVids = videosByPhaseDay(p.phase, day);
                    return (
                      <div key={day} className="mb-1">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400">
                          <span className="font-medium">{t('courses.day')} {day}</span>
                          <span className="text-gray-300">·</span>
                          <span>{dayVids.length} {t('courses.videos')}</span>
                        </div>
                        <div className="space-y-0.5">
                          {dayVids.map((v, vi) => {
                            const vActive = selectedView === 'video' && selectedVideoId === v.id;
                            return (
                              <div key={v.id}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group/video ${
                                  vActive ? 'bg-aconso-50 border border-aconso-200' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onSelectVideo(v.id)}>
                                <span className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0">{vi + 1}</span>
                                <span className={`flex-1 text-xs truncate ${vActive ? 'text-aconso-700 font-medium' : 'text-gray-600'}`}>
                                  {getVideoTitle(v)}
                                </span>
                                <div className="flex gap-0.5 opacity-0 group-hover/video:opacity-100 transition-opacity">
                                  <button onClick={e => { e.stopPropagation(); onReorderVideo(v.id, -1); }}
                                    className="text-[10px] text-gray-400 hover:text-aconso-600 px-0.5">▲</button>
                                  <button onClick={e => { e.stopPropagation(); onReorderVideo(v.id, 1); }}
                                    className="text-[10px] text-gray-400 hover:text-aconso-600 px-0.5">▼</button>
                                  <button onClick={e => { e.stopPropagation(); onDeleteVideo(v.id); }}
                                    className="text-[10px] text-gray-400 hover:text-red-500 px-0.5"></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button onClick={() => onAddDay(p.phase)}
                          className="w-full text-left px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
                          + {t('courses.addDay')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 p-2 space-y-1">
        <button onClick={onSelectBank}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            selectedView === 'bank' ? 'bg-aconso-50 text-aconso-700 border border-aconso-200' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <span></span>
          <span className="flex-1 text-left">{t('courses.questionBank')}</span>
        </button>
        <button onClick={onSelectExam}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            selectedView === 'exam' ? 'bg-aconso-50 text-aconso-700 border border-aconso-200' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <span></span>
          <span className="flex-1 text-left">{t('courses.examFinal')}</span>
        </button>
      </div>
    </div>
  );
}

function courseTitle(c: Course) {
  if (typeof c.title === 'string') return c.title;
  return c.title?.en || c.title?.es || c.title?.de || '';
}
