import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { notificationsApi } from '../../services/api';
import type { Notification } from '../../types';
import ProfileModal from '../ProfileModal';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');
  const [annLink, setAnnLink] = useState('');
  const [sending, setSending] = useState(false);
  const [annMsg2, setAnnMsg2] = useState<{ ok: boolean; text: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    if (!user) return;
    notificationsApi.unreadCount().then((r) => setUnread(r.data.count || 0)).catch(() => { });
    if (open) notificationsApi.list().then((r) => setItems(r.data)).catch(() => { });
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [user, open, i18n.language]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openPanel = () => {
    setOpen(!open);
    if (!open) {
      notificationsApi.list().then((r) => setItems(r.data)).catch(() => { });
      setUnread(0);
    }
  };

  const openNotif = (n: Notification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      notificationsApi.markRead(n.id).then(() => notificationsApi.unreadCount().then((r) => setUnread(r.data.count || 0))).catch(() => { });
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = () => {
    notificationsApi.markAllRead().then(() => {
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    }).catch(() => { });
  };

  const sendAnnouncement = async () => {
    if (!annTitle.trim()) { setAnnMsg2({ ok: false, text: t('notifications.titleRequired') }); return; }
    setSending(true);
    setAnnMsg2(null);
    try {
      await notificationsApi.broadcast(annTitle.trim(), annMsg.trim(), annLink.trim());
      setAnnTitle(''); setAnnMsg(''); setAnnLink('');
      setAnnMsg2({ ok: true, text: t('notifications.sent') });
    } catch (err: any) {
      setAnnMsg2({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    } finally {
      setSending(false);
    }
  };

  const changeLang = (lng: string) => i18n.changeLanguage(lng);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t('notifications.now');
    if (min < 60) return t('notifications.minAgo', { n: min });
    const h = Math.floor(min / 60);
    if (h < 24) return t('notifications.hAgo', { n: h });
    const d = Math.floor(h / 24);
    return t('notifications.dAgo', { n: d });
  };

  const profileInitials = () => {
    const fn = (user?.first_name || '').trim();
    const ln = (user?.last_name || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    if (ln) return ln.slice(0, 2).toUpperCase();
    return (user?.company_name || '?').slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-6 shadow-sm gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden text-gray-600 hover:text-aconso-500 p-1.5 rounded-lg hover:bg-gray-50"
            aria-label="menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg min-w-0">
          <span className="text-aconso-500">aconso</span>
          <span className="font-normal text-gray-500 hidden xs:inline sm:inline">Partner Academy</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <select
          onChange={(e) => changeLang(e.target.value)}
          value={i18n.language}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500"
        >
          <option value="en">EN</option>
          <option value="es">ES</option>
          <option value="de">DE</option>
        </select>
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={isAdmin ? '/admin' : '/partner'}
              className="hidden sm:block text-sm text-gray-600 hover:text-aconso-500 transition-colors"
            >
              {t('nav.dashboard')}
            </Link>
            <div className="relative" ref={ref}>
              <button
                onClick={openPanel}
                className="relative text-gray-600 hover:text-aconso-500 transition-colors p-1.5 rounded-lg hover:bg-gray-50"
                aria-label={t('notifications.title')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900 text-sm"> {t('notifications.title')}</span>
                    <button onClick={markAll} className="text-xs text-aconso-600 hover:text-aconso-800">{t('notifications.markAll')}</button>
                  </div>
                  {isAdmin && (
                    <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('notifications.broadcast')}</div>
                      <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder={t('notifications.annTitle')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-aconso-500" />
                      <input value={annMsg} onChange={(e) => setAnnMsg(e.target.value)} placeholder={t('notifications.annMessage')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-aconso-500" />
                      <div className="flex gap-2">
                        <input value={annLink} onChange={(e) => setAnnLink(e.target.value)} placeholder={t('notifications.annLink')}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-aconso-500" />
                        <button onClick={sendAnnouncement} disabled={sending} className="btn-primary text-xs !py-2 whitespace-nowrap">{sending ? '...' : t('notifications.send')}</button>
                      </div>
                      {annMsg2 && (
                        <div className={`text-xs ${annMsg2.ok ? 'text-emerald-600' : 'text-red-500'}`}>{annMsg2.text}</div>
                      )}
                    </div>
                  )}
                  <div className="max-h-80 overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="px-4 py-10 text-center text-gray-400 text-sm">
                        <div className="text-3xl mb-2"></div>
                        {t('notifications.empty')}
                      </div>
                    ) : items.slice(0, 10).map((n) => (
                      <button key={n.id} onClick={() => openNotif(n)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-aconso-50/40 transition-colors ${n.read ? '' : 'bg-aconso-50/60'}`}>
                        <div className="flex items-start gap-2.5">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-aconso-500 mt-1.5 shrink-0"></span>}
                          <div className="min-w-0">
                            <div className={`text-sm ${n.read ? 'text-gray-500' : 'text-gray-900 font-semibold'} truncate`}>{n.title}</div>
                            {n.message && <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</div>}
                            <div className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {!isAdmin && (
                    <Link to="/partner/notifications"
                      onClick={() => setOpen(false)}
                      className="block text-center text-sm py-2.5 text-aconso-600 hover:bg-aconso-50 transition-colors font-medium">
                      {t('notifications.viewAll')}
                    </Link>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-aconso-500 to-aconso-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-gray-100 hover:ring-aconso-300 transition-all overflow-hidden"
              title={t('profile.title')}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={t('profile.title')} className="w-full h-full object-cover" />
              ) : (
                profileInitials()
              )}
            </button>
            <button
              onClick={logout}
              className="hidden sm:block text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-aconso-500 transition-colors">
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm !py-2 !px-3 sm:!px-5"
            >
              {t('nav.register')}
            </Link>
          </div>
        )}
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}
