import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notificationsApi } from '../../services/api';
import type { Notification } from '../../types';

export default function Notifications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationsApi.list().then((r) => setItems(r.data)).catch(() => { }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [i18n.language]);

  const open = async (n: Notification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try { await notificationsApi.markRead(n.id); } catch { /* noop */ }
    }
    if (n.link) navigate(n.link);
  };

  const markAll = () => {
    notificationsApi.markAllRead().then(() => {
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    }).catch(() => { });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-white/60">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('notifications.title')}</h1>
          <p className="text-white/70 mt-1">{t('notifications.subtitle')}</p>
        </div>
        {items.some((n) => !n.read) && (
          <button onClick={markAll} className="btn-secondary text-sm">{t('notifications.markAll')}</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p>{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => (
            <button key={n.id} onClick={() => open(n)}
              className={`w-full text-left card p-4 transition-colors hover:shadow-md ${n.read ? '' : 'border-aconso-300 bg-aconso-50/40'}`}>
              <div className="flex items-start gap-3">
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-aconso-500 mt-1.5 shrink-0 animate-pulse"></span>}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${n.read ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}>{n.title}</div>
                  {n.message && <div className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{n.message}</div>}
                  <div className="text-xs text-gray-400 mt-2">{timeAgo(n.created_at)} · {new Date(n.created_at).toLocaleString()}</div>
                </div>
                {n.link && <span className="text-gray-300 mt-1 shrink-0">→</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
