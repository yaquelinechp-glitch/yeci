import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { conflictsApi } from '../../services/api';
import type { ChannelConflict, ConflictStats } from '../../types';

export default function AdminConflicts() {
  const { t, i18n } = useTranslation();
  const [conflicts, setConflicts] = useState<ChannelConflict[]>([]);
  const [stats, setStats] = useState<ConflictStats | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<ChannelConflict | null>(null);

  const stageKey = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

  const load = () => {
    conflictsApi.list(filter ? { status: filter } : {})
      .then((r) => setConflicts(r.data)).catch(() => { });
    conflictsApi.stats().then((r) => setStats(r.data)).catch(() => { });
  };

  useEffect(() => { load(); setLoading(false); }, [i18n.language, filter]);

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

  const act = async (c: ChannelConflict, action: string) => {
    setActing(c.id);
    setMsg(null);
    try {
      let data: any = { action };
      if (action === 'resolve') {
        setResolveTarget(c);
        setActing(null);
        return;
      } else if (action === 'close') {
        const resolution = window.prompt(t('conflicts.closePrompt')) || '';
        data = { action, resolution };
      }
      await conflictsApi.update(c.id, data);
      load();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    } finally {
      setActing(null);
    }
  };

  const confirmResolve = async (c: ChannelConflict, winnerId: string) => {
    setActing(c.id);
    setResolveTarget(null);
    setMsg(null);
    const resolution = window.prompt(t('conflicts.resolutionPrompt')) || '';
    try {
      await conflictsApi.update(c.id, { action: 'resolve', winner_opportunity_id: winnerId, resolution });
      load();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    } finally {
      setActing(null);
    }
  };

  const remove = async (c: ChannelConflict) => {
    if (!window.confirm(t('conflicts.removeConfirm'))) return;
    try {
      await conflictsApi.remove(c.id);
      load();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-aconso-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-white/60">{t('common.loading')}</span>
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

  const byStatus = stats?.by_status || {};
  const openCount = (byStatus.abierto || 0) + (byStatus.en_resolucion || 0);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('conflicts.adminTitle')}</h1>
        <p className="text-white/70 mt-1">{t('conflicts.adminSubtitle')}</p>
      </div>

      {msg && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Overview */}
      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <div className="text-sm text-gray-500">{t('conflicts.totalConflicts')}</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{t('conflicts.openCount')}</div>
            <div className="text-2xl font-bold text-red-600">{openCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{t('conflicts.resolvedCount')}</div>
            <div className="text-2xl font-bold text-emerald-600">{byStatus.resuelto || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{t('conflicts.closedCount')}</div>
            <div className="text-2xl font-bold text-gray-400">{byStatus.cerrado || 0}</div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1">{t('common.status')}</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white">
              <option value="">{t('common.all')}</option>
              {['abierto', 'en_resolucion', 'resuelto', 'cerrado'].map((s) => (
                <option key={s} value={s}>{t(`conflicts.statuses.${s}`)}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? t('common.cancel') : '+ ' + t('conflicts.report')}
          </button>
        </div>

        {stats?.by_company && stats.by_company.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="text-sm font-semibold text-gray-800 mb-3">{t('conflicts.byCompany')}</div>
            <div className="flex flex-wrap gap-2">
              {stats.by_company.map((x) => (
                <span key={x.company_name} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs">
                  <span className="font-medium text-gray-700">{x.company_name}</span>
                  <span className="text-gray-400">({x.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
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
            {conflicts.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{c.company_name}</span>
                      <span className={statusBadge(c.status)}>{t(`conflicts.statuses.${c.status}`)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      {c.opportunity && (
                        <div><span className="font-semibold text-gray-700">{c.opportunity.partner_name}</span> — {c.opportunity.name} ({t(`pipeline.${stageKey(c.opportunity.stage)}`)})</div>
                      )}
                      {c.conflicting_opportunity && (
                        <div><span className="font-semibold text-gray-700">{c.conflicting_opportunity.partner_name}</span> — {c.conflicting_opportunity.name} ({t(`pipeline.${stageKey(c.conflicting_opportunity.stage)}`)})</div>
                      )}
                      {!c.opportunity && !c.conflicting_opportunity && (
                        <div className="text-gray-400">{t('conflicts.noOpps')}</div>
                      )}
                    </div>
                    {c.notes && <p className="text-xs text-gray-600 mt-2">{c.notes}</p>}
                    {c.status === 'resuelto' && (
                      <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {t('conflicts.winner')}: <span className="font-bold">{c.winner_partner_name}</span>
                        {c.resolution && <div className="mt-1 text-emerald-700">{c.resolution}</div>}
                      </div>
                    )}
                    {c.status === 'cerrado' && c.resolution && (
                      <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                        {c.resolution}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right space-y-2">
                    <div className="text-xs text-gray-400">
                      <div>{new Date(c.created_at).toLocaleDateString()}</div>
                      <div className="mt-0.5">{t('conflicts.reportedBy')}: {c.reporter_name}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {c.status === 'abierto' && (
                        <button onClick={() => act(c, 'review')} disabled={acting === c.id} className="btn-secondary !py-1.5 text-xs">{t('conflicts.review')}</button>
                      )}
                      {(c.status === 'abierto' || c.status === 'en_resolucion') && (
                        <>
                          <button onClick={() => act(c, 'resolve')} disabled={acting === c.id} className="btn-primary !py-1.5 !px-3 text-xs">{t('conflicts.resolve')}</button>
                          <button onClick={() => act(c, 'close')} disabled={acting === c.id} className="btn-secondary !py-1.5 text-xs hover:!border-red-400 hover:!text-red-600">{t('conflicts.close')}</button>
                        </>
                      )}
                      {(c.status === 'resuelto' || c.status === 'cerrado') && (
                        <button onClick={() => act(c, 'open')} disabled={acting === c.id} className="btn-secondary !py-1.5 text-xs">{t('conflicts.reopen')}</button>
                      )}
                      <button onClick={() => remove(c)} disabled={acting === c.id} className="btn-secondary !py-1.5 !px-2.5 text-xs hover:!border-red-400 hover:!text-red-600" title={t('common.delete')}>{t('common.delete')}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResolveTarget(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">{t('conflicts.chooseWinner')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('conflicts.chooseWinnerHint')}</p>
            <div className="space-y-2">
              {[resolveTarget.opportunity, resolveTarget.conflicting_opportunity].filter((o): o is NonNullable<typeof o> => !!o).map((o) => (
                <button key={o.id} onClick={() => confirmResolve(resolveTarget, o.id)}
                  className="w-full text-left rounded-xl border border-gray-200 hover:border-aconso-500 hover:bg-aconso-50 px-4 py-3 transition-colors">
                  <span className="block text-sm font-semibold text-gray-800">{o.partner_name}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{o.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setResolveTarget(null)} className="mt-4 w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
