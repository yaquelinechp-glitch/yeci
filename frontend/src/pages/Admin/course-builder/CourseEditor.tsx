import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../../services/api';
import type { Course, CourseVideo } from '../../../types';
import CourseInfoStep from './CourseInfoStep';
import CourseSidebar from './CourseSidebar';
import VideoPanel from './VideoPanel';
import QuestionBank from './QuestionBank';
import ExamEditor from './ExamEditor';

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

  const showQuizPanel = editorView === 'video' && selectedVideo;

  return (
    <div className="animate-fade-in grid grid-rows-[auto_1fr] h-[calc(100vh-100px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← {t('common.back') || 'Volver'}</button>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-bold text-white truncate max-w-md">{courseTitle(course)}</h1>
            <p className="text-xs text-white/60">{totalVideos} {t('courses.videos')} · {pc.length} {t('courses.phases')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uploadMsg && <span className="text-sm text-emerald-600 font-medium animate-fade-in">{uploadMsg}</span>}
          {msg && <span className="text-sm text-emerald-600 font-medium animate-fade-in">{msg}</span>}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            course.status === 'publicado' ? 'bg-emerald-100 text-emerald-700' : course.status === 'archivado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {course.status === 'publicado' ? t('courses.statusPublished') : course.status === 'archivado' ? t('courses.statusArchived') : t('courses.statusDraft')}
          </span>
          <button onClick={async () => { if (!confirm(t('courses.duplicate'))) return; await coursesApi.duplicate(course.id); onSaved(); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            📄 {t('courses.duplicate')}
          </button>
          <button onClick={() => setView('info')} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            {t('common.edit')}
          </button>
          <button onClick={handleDone} disabled={saving} className="btn-primary text-sm">
            {saving ? '...' : t('courses.done') + ' ✓'}
          </button>
        </div>
      </div>

      {/* Main layout: sidebar + content panel */}
      <div className="grid min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white"
        style={{ gridTemplateColumns: showQuizPanel ? '288px 1fr 288px' : '288px 1fr' }}>
        {/* Left sidebar */}
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
          onUploadToDay={handleUploadVideo}
          onUploadUrlToDay={handleUploadUrl}
        />

        {/* Center content */}
        <div className="overflow-y-auto p-6 min-w-0">
          {editorView === 'video' ? (
            <DayContent
              course={course}
              phase={activePhase}
              day={activeDay}
              onUpload={handleUploadVideo}
              onUploadUrl={handleUploadUrl}
              onRefresh={refresh}
            />
          ) : editorView === 'bank' ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('courses.questionBank')}</h2>
              <p className="text-sm text-gray-500 mb-4">{t('courses.questionBankDesc') || 'Crea y gestiona preguntas. Asigna videos con un clic.'}</p>
              <QuestionBank courseVideos={course.videos} courseId={course.id} onRefresh={refresh} />
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('courses.examFinal')}</h2>
              <p className="text-sm text-gray-500 mb-4">{t('courses.examDesc') || 'Vista previa del examen final. Las preguntas se generan desde el banco.'}</p>
              <ExamEditor courseId={course.id} examCount={course.exam_questions_count || 5} onRefresh={refresh} />
            </>
          )}
        </div>

        {/* Right panel (quiz/info) — only when video selected */}
        {showQuizPanel && (
          <VideoPanel courseId={course.id} video={selectedVideo!} onRefresh={refresh} onClose={() => setSelectedVideoId(null)} />
        )}
      </div>
    </div>
  );
}

function DayContent({ course, phase, day, onUpload, onUploadUrl, onRefresh }: {
  course: Course; phase: number; day: number;
  onUpload: (file: File, phase: number, day: number) => Promise<void>;
  onUploadUrl: (url: string, phase: number, day: number) => Promise<void>;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const dayVideos = course.videos
    .filter(v => (v.phase || 1) === phase && (v.day || 1) === day)
    .sort((a, b) => a.video_order - b.video_order);

  const handleFile = async (file: File) => {
    setUploading(true);
    try { await onUpload(file, phase, day); } catch { /* */ } finally { setUploading(false); }
  };

  const handleUrl = async () => {
    if (!uploadUrl.trim()) return;
    setUploading(true);
    try { await onUploadUrl(uploadUrl, phase, day); setUploadUrl(''); } catch { /* */ } finally { setUploading(false); }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        {t('courses.phase')} {phase} · {t('courses.day')} {day}
      </h3>
      <p className="text-xs text-gray-400 mb-4">{dayVideos.length} {t('courses.videos')}</p>

      {dayVideos.length > 0 && (
        <div className="space-y-2 mb-4">
          {dayVideos.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-aconso-100 text-aconso-600 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
              <div className="w-20 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                <video className="w-full h-full object-cover" preload="metadata"><source src={v.video_url} /></video>
              </div>
              <span className="text-sm text-gray-700 truncate flex-1">
                {typeof v.title === 'string' ? v.title : v.title?.en || v.title?.es || v.title?.de || t('courses.untitled')}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-3">{t('courses.uploadVideo') || 'Subir video'} — {t('courses.phase')} {phase} · {t('courses.day')} {day}</p>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full py-2.5 bg-aconso-500 text-white rounded-xl text-sm font-medium hover:bg-aconso-600 transition-colors disabled:opacity-50 mb-2">
          {uploading ? '...' : '⬆ ' + t('courses.uploadFromPc')}
        </button>
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        <div className="flex gap-2">
          <input value={uploadUrl} onChange={e => setUploadUrl(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 outline-none"
            placeholder={t('courses.videoUrl') || 'URL del video'} />
          <button onClick={handleUrl} disabled={uploading || !uploadUrl.trim()}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl font-medium transition-colors disabled:opacity-50">
            {t('courses.add')}
          </button>
        </div>
      </div>
    </div>
  );
}

function courseTitle(c: Course) {
  if (typeof c.title === 'string') return c.title;
  return c.title?.en || c.title?.es || c.title?.de || '';
}
