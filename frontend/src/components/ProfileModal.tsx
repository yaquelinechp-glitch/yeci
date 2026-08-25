import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profileApi } from '../services/api';
import { useAuthStore } from '../store/auth';

interface ProfileData {
  first_name: string;
  last_name: string;
  username: string;
  avatar: string;
  contact_name: string;
  company_name: string;
  email: string;
}

const AVATAR_SIZE = 256;

function fileToDataUrl(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(reader.result as string); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('invalid image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { user, setAuth } = useAuthStore();
  const [data, setData] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    setAvatarPreview(user?.avatar || '');
    profileApi.get()
      .then((r) => setData(r.data))
      .catch(() => setMsg({ ok: false, text: t('common.error') }));
  }, [open, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const initials = () => {
    const fn = (data?.first_name || user?.first_name || '').trim();
    const ln = (data?.last_name || user?.last_name || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    if (ln) return ln.slice(0, 2).toUpperCase();
    return (user?.company_name || '?').slice(0, 2).toUpperCase();
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg({ ok: false, text: t('profile.invalidImage') }); return; }
    try {
      const url = await fileToDataUrl(file, AVATAR_SIZE);
      setAvatarPreview(url);
      setData((d) => (d ? { ...d, avatar: url } : d));
    } catch {
      setMsg({ ok: false, text: t('profile.invalidImage') });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      await profileApi.update({
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        avatar: data.avatar,
      });
      const updated = { ...(user as any), first_name: data.first_name, last_name: data.last_name, username: data.username, avatar: data.avatar };
      setAuth(updated, localStorage.getItem('token') || '');
      setMsg({ ok: true, text: t('profile.saved') });
      setTimeout(onClose, 800);
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up text-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{t('profile.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative group" title={t('profile.changePhoto')}>
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-aconso-500 to-aconso-700 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-aconso-100">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  initials()
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-aconso-600 text-white flex items-center justify-center text-sm shadow group-hover:bg-aconso-700 transition-colors">📷</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-aconso-600 hover:text-aconso-800 font-medium">
              {t('profile.changePhoto')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.firstName')}</label>
              <input value={data?.first_name || ''} onChange={(e) => setData((d) => (d ? { ...d, first_name: e.target.value } : d))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.lastName')}</label>
              <input value={data?.last_name || ''} onChange={(e) => setData((d) => (d ? { ...d, last_name: e.target.value } : d))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.username')}</label>
            <input value={data?.username || ''} onChange={(e) => setData((d) => (d ? { ...d, username: e.target.value } : d))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500" />
          </div>

          <div className="pt-1 text-xs text-gray-400">
            {data?.company_name || user?.company_name} · {data?.email || user?.email}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
