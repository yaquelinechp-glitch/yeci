import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chatApi } from '../services/api';

type Msg = { id: number; role: 'user' | 'bot'; text: string; time: string };

const BUBBLE = 56;
const MARGIN = 16;
const PANEL_W = 360;
const PANEL_H = 480;
const GAP = 14;

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const { t } = useTranslation();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const drag = useRef({ active: false, moved: 0, dx: 0, dy: 0 });
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPos({ x: window.innerWidth - BUBBLE - 24, y: window.innerHeight - BUBBLE - 24 });
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p) => p && ({
      x: Math.min(Math.max(p.x, MARGIN), Math.max(MARGIN, window.innerWidth - BUBBLE - MARGIN)),
      y: Math.min(Math.max(p.y, MARGIN), Math.max(MARGIN, window.innerHeight - BUBBLE - MARGIN)),
    }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ id: Date.now(), role: 'bot', text: t('chat.greeting'), time: nowTime() }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing, open]);

  const clampX = (x: number) => Math.min(Math.max(x, MARGIN), Math.max(MARGIN, window.innerWidth - BUBBLE - MARGIN));
  const clampY = (y: number) => Math.min(Math.max(y, MARGIN), Math.max(MARGIN, window.innerHeight - BUBBLE - MARGIN));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, moved: 0, dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !pos) return;
    const nx = clampX(e.clientX - d.dx);
    const ny = clampY(e.clientY - d.dy);
    d.moved += Math.abs(nx - pos.x) + Math.abs(ny - pos.y);
    setPos({ x: nx, y: ny });
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved < 6) setOpen((o) => !o);
  };

  const panelPos = () => {
    if (!pos || typeof window === 'undefined') return undefined;
    let left = pos.x + BUBBLE / 2 - PANEL_W / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - PANEL_W - 8));
    let top = pos.y - PANEL_H - GAP;
    if (top < 8) top = Math.min(pos.y + BUBBLE + GAP, window.innerHeight - PANEL_H - 8);
    return { left, top, width: PANEL_W, height: PANEL_H };
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || typing) return;
    const nextMsgs: Msg[] = [...msgs, { id: Date.now(), role: 'user', text, time: nowTime() }];
    setMsgs(nextMsgs);
    setDraft('');
    setTyping(true);
    try {
      const history = nextMsgs
        .filter((m, i) => !(i === 0 && m.role === 'bot'))
        .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }) as const);
      const r = await chatApi.send(history);
      setMsgs((m) => [...m, { id: Date.now(), role: 'bot', text: String(r.data.reply), time: nowTime() }]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      console.warn('chat error:', detail);
      setMsgs((m) => [...m, {
        id: Date.now(),
        role: 'bot',
        text: `${t('chat.errorReply')}${detail ? `\n(${detail})` : ''}`,
        time: nowTime(),
      }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {open && (
        <div style={panelPos()}
          className="fixed z-[60] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-aconso-600 to-aconso-500 text-white shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-aconso-600"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">{t('chat.title')}</div>
              <div className="text-[11px] text-white/80">{t('chat.online')}</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto bg-gray-50 p-3 space-y-2">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3.5 py-2 text-sm shadow-sm ${m.role === 'user'
                  ? 'bg-aconso-600 text-white rounded-2xl rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <div className={`text-[10px] mt-0.5 ${m.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>{m.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1.5">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }}></span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-200 p-3 flex items-center gap-2 bg-white">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder={t('chat.placeholder')}
              className="flex-1 min-w-0 border-2 border-gray-200 rounded-full px-4 py-2 text-sm focus:border-aconso-500 focus:outline-none"
            />
            <button onClick={send} disabled={!draft.trim()}
              className="w-10 h-10 shrink-0 rounded-full bg-aconso-600 text-white flex items-center justify-center hover:bg-aconso-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label={t('common.send')}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/></svg>
            </button>
          </div>
        </div>
      )}

      {pos && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ left: pos.x, top: pos.y, width: BUBBLE, height: BUBBLE }}
          className={`fixed z-[70] select-none touch-none rounded-full flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl ${open ? 'bg-gray-800' : 'bg-gradient-to-br from-aconso-600 to-aconso-400'} text-white`}
          title={t('chat.title')}
        >
          {!open && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white pointer-events-none"></span>
          )}
        </div>
      )}
    </>
  );
}
