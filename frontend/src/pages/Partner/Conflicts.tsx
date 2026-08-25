import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { conflictsApi } from '../../services/api';
import type { ChannelConflict, ConflictStats } from '../../types';

const STATUS_ORDER = ['abierto', 'en_resolucion', 'resuelto', 'cerrado'];

export default function PartnerConflicts() {
  const { t, i18n } = useTranslation();
  const [conflicts, setConflicts] = useState<ChannelConflict[]>([]);
  const [stats, setStats] = useState<ConflictStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => {
    conflictsApi.list().then((r) => setConflicts(r.data)).catch(() => { });
    conflictsApi.stats().then((r) => setStats(r.data)).catch(() => { });
    setLoading(false);
  };

  useEffect(load, [i18n.language]);

  const report = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await conflictsApi.create({ company_name: form.company_name, notes: form.notes });
      setShowForm(false);
      setForm({ company_name: '', notes: '' });
      load();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      abierto: 'bg-red-50 text-red-700 border-red-200',
      en_resolucion: 'bg-amber-50 text-amber-700 border-amber-200',
      resuelto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cerrado: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[s] || 'bg-gray-100 text-gray-600'}`;
  };

  const sorted = [...conflicts].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">⚔️ {t('conflicts.title')}</h1>
        <p className="text-gray-500 mt-1">{t('conflicts.subtitle')}</p>
      </div>

      {msg && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Summary */}
      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <div className="text-sm text-gray-500">{t('conflicts.myConflicts')}</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{t('conflicts.openCount')}</div>
            <div className="text-2xl font-bold text-red-600">{stats?.open || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{t('conflicts.resolvedCount')}</div>
            <div className="text-2xl font-bold text-emerald-600">{stats?.resolved || 0}</div>
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? t('common.cancel') : '+ ' + t('conflicts.report')}
          </button>
        </div>
      </div>

      {/* Report form */}
      {showForm && (
        <form onSubmit={report} className="card mb-6 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">{t('conflicts.reportNew')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('conflicts.companyName')} *</label>
              <input type="text" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('conflicts.notes')}</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? t('common.loading') : t('conflicts.report')}</button>
        </form>
      )}

      {/* List */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4">{t('conflicts.list')} ({conflicts.length})</h2>
        {conflicts.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('conflicts.noConflicts')}</p>
        ) : (
          <div className="space-y-4">
            {sorted.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">⚠️ {c.company_name}</span>
                      <span className={statusBadge(c.status)}>{t(`conflicts.statuses.${c.status}`)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      {c.opportunity && (
                        <div>🔵 {c.opportunity.partner_name} — <span className="text-gray-700">{c.opportunity.name}</span></div>
                      )}
                      {c.conflicting_opportunity && (
                        <div>🔴 {c.conflicting_opportunity.partner_name} — <span className="text-gray-700">{c.conflicting_opportunity.name}</span></div>
                      )}
                      {!c.opportunity && !c.conflicting_opportunity && (
                        <div className="text-gray-400">{t('conflicts.noOpps')}</div>
                      )}
                    </div>
                    {c.notes && <p className="text-xs text-gray-600 mt-2">📝 {c.notes}</p>}
                    {c.status === 'resuelto' && (
                      <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                        ✅ {t('conflicts.winner')}: <span className="font-bold">{c.winner_partner_name || '—'}</span>
                        {c.resolution && <div className="mt-1 text-emerald-700">{c.resolution}</div>}
                      </div>
                    )}
                    {c.status === 'cerrado' && c.resolution && (
                      <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                        {c.resolution}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 text-right">
                    <div>{new Date(c.created_at).toLocaleDateString()}</div>
                    <div className="mt-1">{t('conflicts.reportedBy')}: {c.reporter_name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
