import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../../services/api';
import type { Course, CourseVideo } from '../../../types';
import CourseInfoStep from './CourseInfoStep';
import CourseSidebar from './CourseSidebar';
import VideoPanel from './VideoPanel';
import QuestionBank from './QuestionBank';
import ExamEditor from './ExamEditor';
import CheckpointEditor from './CheckpointEditor';
import { VideoThumb } from '../../../components/VideoPlayer';
import { IconBook, IconClipboard, IconFlag, IconPlay } from '../../../components/icons';

type View = 'info' | 'editor';
type EditorView = 'video' | 'bank' | 'exam';

interface Props {
  course: Course | null;
  courses: Course[];
  onBack: () => void;
  onSaved: () => void;
}

export default function CourseEditor({ course: initialCourse, courses, onBack, onSaved }: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>(initialCourse ? 'editor' : 'info');
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [editorView, setEditorView] = useState<EditorView>('video');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(1);
  const [activeDay, setActiveDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');

  const refresh = useCallback(async () => {
    if (!course) return;
    try { const r = await coursesApi.get(course.id); setCourse(r.data); } catch { /* */ }
  }, [course?.id]);

  useEffect(() => { if (course) refresh(); }, []);

  const selectedVideo = course?.videos.find(v => v.id === selectedVideoId) || null;

  const handleCreated = (c: Course) => {
    setCourse(c);
    setView('editor');
    onSaved();
  };

  const handleDone = async () => {
    setSaving(true);
    try {
      if (course) await coursesApi.update(course.id, {});
      setMsg(t('courses.saved') || 'Guardado');
      setTimeout(() => setMsg(''), 2000);
    } catch { /* */ } finally { setSaving(false); }
  };

  const handleSelectVideo = (id: string) => {
    setSelectedVideoId(id);
    setEditorView('video');
    const v = course?.videos.find(x => x.id === id);
    if (v) { setActivePhase(v.phase || 1); setActiveDay(v.day || 1); }
  };

  const handleSelectPhase = (phase: number) => {
    setActivePhase(phase);
    setActiveDay(1);
    setSelectedVideoId(null);
    setEditorView('video');
  };

  const handleDeleteVideo = async (vid: string) => {
    if (!course || !confirm(t('courses.confirmDeleteVideo') || '¿Eliminar video?')) return;
    await coursesApi.deleteVideo(course.id, vid);
    if (selectedVideoId === vid) setSelectedVideoId(null);
    await refresh();
  };

  const handleReorderVideo = async (videoId: string, direction: -1 | 1) => {
    if (!course) return;
    const v = course.videos.find(x => x.id === videoId);
    if (!v) return;
    const sameSlot = course.videos
      .filter(x => (x.phase || 1) === (v.phase || 1) && (x.day || 1) === (v.day || 1))
      .sort((a, b) => a.video_order - b.video_order);
    const idx = sameSlot.findIndex(x => x.id === videoId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sameSlot.length) return;
    const reordered = [...sameSlot];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    reordered.forEach((x, i) => { x.video_order = i + 1; });
    const sorted = [...course.videos].sort((a, b) => (a.phase || 1) - (b.phase || 1) || (a.day || 1) - (b.day || 1) || a.video_order - b.video_order);
    const slotIds = new Set(sameSlot.map(x => x.id));
    const newOrder: string[] = [];
    let inserted = false;
    for (const x of sorted) {
      if (slotIds.has(x.id)) {
        if (!inserted) { newOrder.push(...reordered.map(r => r.id)); inserted = true; }
      } else { newOrder.push(x.id); }
    }
    await coursesApi.reorderVideos(course.id, newOrder);
    await refresh();
  };

  const handleAddDay = async (phase: number) => {
    if (!course) return;
    const pc = course.phase_config?.length ? course.phase_config : [{ phase: 1, days: 3 }];
    const phaseConfig = pc.map(p => p.phase === phase ? { ...p, days: p.days + 1 } : p);
    await coursesApi.update(course.id, { phase_config: phaseConfig });
    await refresh();
  };

  const handleUploadVideo = async (file: File, phase: number, day: number) => {
    if (!course) return;
    await coursesApi.uploadVideo(course.id, file, file.name.replace(/\.[^.]+$/, ''), '', -1, phase, day);
    const r = await coursesApi.get(course.id);
    setCourse(r.data);
    const newest = r.data.videos
      .filter((v: any) => (v.phase || 1) === phase && (v.day || 1) === day)
      .sort((a: any, b: any) => b.video_order - a.video_order)[0];
    if (newest) { setSelectedVideoId(newest.id); setEditorView('video'); setActivePhase(phase); setActiveDay(day); }
    setUploadMsg(t('courses.uploadSuccess') || '¡Video subido!');
    setTimeout(() => setUploadMsg(''), 3000);
  };

  const handleUploadUrl = async (url: string, phase: number, day: number) => {
    if (!course || !url.trim()) return;
    await coursesApi.addVideoUrl(course.id, url.trim(), url.trim(), '', -1, phase, day);
    const r = await coursesApi.get(course.id);
    setCourse(r.data);
    const newest = r.data.videos
      .filter((v: any) => (v.phase || 1) === phase && (v.day || 1) === day)
      .sort((a: any, b: any) => b.video_order - a.video_order)[0];
    if (newest) { setSelectedVideoId(newest.id); setEditorView('video'); setActivePhase(phase); setActiveDay(day); }
    setUploadMsg(t('courses.uploadSuccess') || '¡Video subido!');
    setTimeout(() => setUploadMsg(''), 3000);
  };

  if (view === 'info') {
    return (
      <CourseInfoStep
        course={course}
        existingCourses={courses}
        onCreated={handleCreated}
        onCancel={onBack}
      />
    );
  }

  if (!course) return null;

  const pc = course.phase_config?.length ? course.phase_config : [{ phase: 1, days: 3 }];
  const totalVideos = course.videos.length;
  const showQuizPanel = editorView === 'video' && !!selectedVideo;

  const statusLabel = course.status === 'publicado'
    ? t('courses.statusPublished')
    : course.status === 'archivado' ? t('courses.statusArchived') : t('courses.statusDraft');
  const statusCls = course.status === 'publicado'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : course.status === 'archivado'
      ? 'bg-red-50 text-red-600 border border-red-200'
      : 'bg-gray-100 text-gray-600 border border-gray-200';

  const feedback = uploadMsg || msg;

  return (
    <div className="animate-fade-in flex flex-col gap-4 xl:h-[calc(100dvh-8.5rem)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack}
            className="w-9 h-9 shrink-0 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-aconso-600 hover:border-aconso-200 hover:bg-aconso-50 transition-colors flex items-center justify-center"
            aria-label={t('courses.backToCourses')}>
            <IconArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{courseTitle(course)}</h1>
              <span className={`shrink-0 hidden xs:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <IconPlay className="w-3.5 h-3.5 text-gray-400" />{totalVideos} {t('courses.videos')}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconBook className="w-3.5 h-3.5 text-gray-400" />{pc.length} {t('courses.phases')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feedback && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 animate-fade-in">
              <IconCheck className="w-3.5 h-3.5" />{feedback}
            </span>
          )}
          <button
            onClick={async () => { if (!confirm(t('courses.duplicate'))) return; await coursesApi.duplicate(course.id); onSaved(); }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-aconso-200 hover:text-aconso-700 transition-colors">
            <IconCopy className="w-3.5 h-3.5" />{t('courses.duplicate')}
          </button>
          <button onClick={() => setView('info')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-aconso-200 hover:text-aconso-700 transition-colors">
            <IconPencil className="w-3.5 h-3.5" />{t('common.edit')}
          </button>
          <button onClick={handleDone} disabled={saving}
            className="btn-primary text-sm whitespace-nowrap disabled:opacity-60">
            {saving ? '...' : t('courses.done')}
          </button>
        </div>
      </div>

      {/* Workspace: navigation + content (+ detail panel) */}
      <div className={`flex-1 min-h-0 grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[var(--shadow-card)] ${
        showQuizPanel
          ? 'lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_320px]'
          : 'lg:grid-cols-[290px_minmax(0,1fr)]'
      }`}>
        <CourseSidebar
          course={course}
          selectedVideoId={selectedVideoId}
          selectedView={editorView}
          activePhase={activePhase}
          onSelectVideo={handleSelectVideo}
          onSelectPhase={handleSelectPhase}
          onSelectBank={() => { setSelectedVideoId(null); setEditorView('bank'); }}
          onSelectExam={() => { setSelectedVideoId(null); setEditorView('exam'); }}
          onAddDay={handleAddDay}
          onDeleteVideo={handleDeleteVideo}
          onReorderVideo={handleReorderVideo}
        />

        <div className="min-w-0 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-6 bg-gray-50/40">
          {editorView === 'video' ? (
            <DayContent
              course={course}
              phase={activePhase}
              day={activeDay}
              courseId={course.id}
              selectedVideoId={selectedVideoId}
              onSelectVideo={(id) => setSelectedVideoId(id)}
              onUpload={handleUploadVideo}
              onUploadUrl={handleUploadUrl}
            />
          ) : editorView === 'bank' ? (
            <>
              <PanelHeader
                icon={<IconClipboard className="w-4 h-4" />}
                title={t('courses.questionBank')}
                subtitle={t('courses.questionBankDesc') || 'Crea y gestiona preguntas. Asigna videos con un clic.'}
              />
              <QuestionBank courseVideos={course.videos} courseId={course.id} onRefresh={refresh} />
            </>
          ) : (
            <>
              <PanelHeader
                icon={<IconFlag className="w-4 h-4" />}
                title={t('courses.examFinal')}
                subtitle={t('courses.examDesc') || 'Vista previa del examen final. Las preguntas se generan desde el banco.'}
              />
              <ExamEditor courseId={course.id} examCount={course.exam_questions_count || 5} onRefresh={refresh} />
            </>
          )}
        </div>

        {showQuizPanel && (
          <div className="min-w-0 lg:col-span-2 lg:h-[70vh] xl:col-span-1 xl:h-auto">
            <VideoPanel courseId={course.id} video={selectedVideo!} onClose={() => setSelectedVideoId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="w-8 h-8 rounded-lg bg-aconso-50 text-aconso-600 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 truncate">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}

function DayContent({ course, phase, day, courseId, selectedVideoId, onSelectVideo, onUpload, onUploadUrl }: {
  course: Course; phase: number; day: number; courseId: string;
  selectedVideoId: string | null;
  onSelectVideo: (id: string | null) => void;
  onUpload: (file: File, phase: number, day: number) => Promise<void>;
  onUploadUrl: (url: string, phase: number, day: number) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const dayVideos = course.videos
    .filter(v => (v.phase || 1) === phase && (v.day || 1) === day)
    .sort((a, b) => a.video_order - b.video_order);

  const selectedVideo = dayVideos.find(v => v.id === selectedVideoId) || null;

  const handleFile = async (file: File) => {
    setUploading(true);
    try { await onUpload(file, phase, day); } catch { /* */ } finally { setUploading(false); }
  };

  const handleUrl = async () => {
    if (!uploadUrl.trim()) return;
    setUploading(true);
    try { await onUploadUrl(uploadUrl, phase, day); setUploadUrl(''); } catch { /* */ } finally { setUploading(false); }
  };

  const videoTitle = (v: CourseVideo) =>
    typeof v.title === 'string' ? v.title : v.title?.en || v.title?.es || v.title?.de || t('courses.untitled');

  return (
    <div className="space-y-4">
      {/* Day context */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-aconso-700 bg-aconso-50 border border-aconso-100 px-2.5 py-1 rounded-full">
            {t('courses.phase')} {phase}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
            {t('courses.day')} {day}
          </span>
        </div>
        <span className="text-xs text-gray-400">{dayVideos.length} {t('courses.videosForDay')}</span>
      </div>

      {/* Videos in this day */}
      {dayVideos.length > 0 ? (
        <div className="space-y-2">
          {dayVideos.map((v, i) => {
            const isActive = v.id === selectedVideoId;
            return (
              <button key={v.id} type="button"
                onClick={() => onSelectVideo(isActive ? null : v.id)}
                aria-expanded={isActive}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-aconso-300 bg-white ring-1 ring-aconso-200 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-aconso-200 hover:bg-white/80'
                }`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isActive ? 'bg-aconso-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{i + 1}</span>
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-black/5">
                  <VideoThumb src={v.video_url} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${isActive ? 'font-semibold text-aconso-900' : 'font-medium text-gray-900'}`}>
                    {videoTitle(v)}
                  </p>
                  {v.duration_seconds > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{Math.round(v.duration_seconds / 60)} min</p>
                  )}
                </div>
                {isActive && (
                  <span className="hidden sm:inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-aconso-700 bg-aconso-50 border border-aconso-100 px-2 py-1 rounded-full">
                    <IconClipboard className="w-3 h-3" />{t('checkpoints.title')}
                  </span>
                )}
                <IconChevron className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-7 text-center">
          <IconPlay className="w-7 h-7 mx-auto text-gray-300" />
          <p className="mt-2 text-sm font-medium text-gray-700">{t('courses.noVideos')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t('courses.noVideosHint')}</p>
        </div>
      )}

      {/* Add video */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-8 h-8 rounded-lg bg-aconso-50 text-aconso-600 flex items-center justify-center shrink-0">
            <IconUpload className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{t('courses.uploadVideo')}</p>
            <p className="text-[11px] text-gray-400">
              {t('courses.phase')} {phase} · {t('courses.day')} {day}
            </p>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-aconso-500 text-white text-sm font-medium hover:bg-aconso-600 transition-colors disabled:opacity-50">
            <IconUpload className="w-4 h-4" />
            {uploading ? t('courses.uploading') : t('courses.uploadFromPc')}
          </button>

          <div className="flex items-center gap-2">
            <input value={uploadUrl} onChange={e => setUploadUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleUrl(); }}
              className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none"
              placeholder={t('courses.videoUrl') || 'URL del video'} />
            <button onClick={handleUrl} disabled={uploading || !uploadUrl.trim()}
              className="shrink-0 text-xs font-medium px-3 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:border-aconso-200 hover:text-aconso-700 hover:bg-aconso-50 transition-colors disabled:opacity-50">
              {t('courses.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Checkpoints for the selected video */}
      {selectedVideo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden">
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-amber-100">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <IconClock className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">{t('checkpoints.title')}</h4>
                <p className="text-[11px] text-gray-500 truncate">{videoTitle(selectedVideo)}</p>
              </div>
            </div>
            <button onClick={() => onSelectVideo(null)}
              className="w-7 h-7 shrink-0 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors flex items-center justify-center"
              aria-label={t('common.cancel')}>
              <IconClose className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 sm:p-4">
            <CheckpointEditor courseId={courseId} video={{ id: selectedVideo.id, video_url: selectedVideo.video_url, title: selectedVideo.title }} />
          </div>
        </div>
      )}
    </div>
  );
}

function courseTitle(c: Course) {
  if (typeof c.title === 'string') return c.title;
  return c.title?.en || c.title?.es || c.title?.de || '';
}

/* Local icons */
function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconUpload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}