import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerUsersApi } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import type { PartnerUser } from '../../types';

const ROLE_ORDER = ['owner', 'admin', 'member'];

export default function PartnerUsers() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<PartnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isMember = Boolean((user as any)?.member);

  const load = () => {
    partnerUsersApi.list()
      .then((r) => setMembers(r.data))
      .catch(() => setMsg({ ok: false, text: t('common.error') }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [i18n.language]);

  const roleLabel = (role: string) => t(`users.roles.${role}`) || role;

  const copyInvite = () => {
    const full = `${window.location.origin}${inviteUrl}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setInviting(true);
    try {
      const r = await partnerUsersApi.invite(inviteEmail.trim(), inviteName.trim(), inviteRole);
      setInviteUrl(r.data.invite_url);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('member');
      load();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    } finally {
      setInviting(false);
    }
  };

  const updateMember = async (m: PartnerUser, data: any) => {
    try {
      await partnerUsersApi.update(m.id, data);
      load();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    }
  };

  const removeMember = async (m: PartnerUser) => {
    if (!window.confirm(t('users.removeConfirm', { name: m.contact_name || m.email }))) return;
    try {
      await partnerUsersApi.remove(m.id);
      load();
    } catch {
      setMsg({ ok: false, text: t('common.error') });
    }
  };

  if (isMember) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">{t('users.memberNoAccess')}</p>
      </div>
    );
  }

  const sorted = [...members].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('users.title')}</h1>
        <p className="text-white/70 mt-1">{t('users.subtitle')}</p>
      </div>

      {msg && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-bold text-gray-900 mb-4">{t('users.membersTitle')}</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">{t('common.loading')}</p>
          ) : (
            <div className="space-y-3">
              {/* Owner row */}
              <div className="rounded-xl border border-aconso-200 bg-aconso-50/60 p-4 flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aconso-500 to-aconso-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {(user?.contact_name || 'O').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="font-medium text-gray-900 text-sm">{user?.contact_name || user?.company_name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <span className="badge bg-aconso-600 text-white border border-aconso-700">{roleLabel('owner')}</span>
              </div>
              {sorted.map((m) => (
                <div key={m.id} className="rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {(m.contact_name || m.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="font-medium text-gray-900 text-sm">{m.contact_name || '—'}</div>
                    <div className="text-xs text-gray-500">{m.email}</div>
                  </div>
                  <select
                    value={m.role}
                    onChange={(e) => updateMember(m, { role: e.target.value })}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                    title={t('users.roleTitle')}
                  >
                    <option value="admin">{roleLabel('admin')}</option>
                    <option value="member">{roleLabel('member')}</option>
                  </select>
                  {m.status === 'invitado' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{t('users.statusInvited')}</span>
                  ) : m.status === 'activo' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t('users.statusActive')}</span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t('users.statusDisabled')}</span>
                  )}
                  <div className="flex items-center gap-1">
                    {m.status === 'activo' ? (
                      <button onClick={() => updateMember(m, { status: 'desactivado' })} className="btn-secondary !py-1.5 !px-2.5 text-xs" title={t('users.disable')}>{t('users.disable')}</button>
                    ) : (
                      <button onClick={() => updateMember(m, { status: 'activo' })} className="btn-secondary !py-1.5 !px-2.5 text-xs" title={t('users.enable')}>{t('users.enable')}</button>
                    )}
                    <button onClick={() => removeMember(m)} className="btn-secondary !py-1.5 !px-2.5 text-xs hover:!border-red-400 hover:!text-red-600" title={t('users.remove')}>{t('users.remove')}</button>
                  </div>
                </div>
              ))}
              {members.length === 0 && <p className="text-gray-400 text-sm">{t('users.noMembers')}</p>}
            </div>
          )}
        </div>

        {/* Invite form */}
        <div className="card p-6 h-fit">
          <h2 className="font-bold text-gray-900 mb-4">{t('users.inviteTitle')}</h2>
          <form onSubmit={sendInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.email')} *</label>
              <input
                type="email" value={inviteEmail} required
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.contactName')}</label>
              <input
                type="text" value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('users.roleTitle')}</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none bg-white">
                <option value="admin">{roleLabel('admin')}</option>
                <option value="member">{roleLabel('member')}</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">{t('users.roleHelp')}</p>
            </div>
            <button type="submit" disabled={inviting} className="w-full btn-primary">
              {inviting ? t('common.loading') : t('users.inviteBtn')}
            </button>
          </form>

          {inviteUrl && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="text-sm font-semibold text-emerald-800 mb-2">{t('users.inviteCreated')}</div>
              <div className="flex gap-2">
                <input
                  readOnly value={`${window.location.origin}${inviteUrl}`}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 text-xs border border-emerald-200 rounded-lg px-3 py-2 bg-white text-gray-700"
                />
                <button type="button" onClick={copyInvite} className="btn-secondary !py-1.5 text-xs whitespace-nowrap">
                  {copied ? '✓' : t('users.copy')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
