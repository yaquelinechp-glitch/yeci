import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerTypesApi, partnersApi } from '../../services/api';
import type { User } from '../../types';

interface PartnerType {
  key: string;
  label: string;
  default_commission_rate: number;
  is_active: boolean;
  sort_order: number;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function PartnerTypes() {
  const { t } = useTranslation();
  const [types, setTypes] = useState<PartnerType[]>([]);
  const [partners, setPartners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [rate, setRate] = useState('10');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<Record<string, { label: string; rate: string; active: boolean }>>({});
  const [deleteTarget, setDeleteTarget] = useState<PartnerType | null>(null);
  const [deleteSearch, setDeleteSearch] = useState('');
  const [moveTo, setMoveTo] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    partnerTypesApi.list().then((r) => {
      setTypes(r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    partnersApi.list().then((r) => setPartners(r.data || [])).catch(() => {});
  };

  const loadTypesOnly = () => {
    partnerTypesApi.list().then((r) => {
      setTypes(r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, []);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!keyInput || keyInput === slugify(name)) setKeyInput(slugify(v));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setMsg({ ok: false, text: t('common.error') }); return; }
    setSaving(true);
    setMsg(null);
    try {
      await partnerTypesApi.create({
        key: keyInput || slugify(name),
        label: name.trim(),
        default_commission_rate: parseFloat(rate) || 0,
      });
      setName(''); setKeyInput(''); setRate('10');
      setMsg({ ok: true, text: t('admin.partnerTypesPage.created') });
      load();
    } catch {
      setMsg({ ok: false, text: t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (pt: PartnerType) => {
    setEditing((m) => ({ ...m, [pt.key]: { label: pt.label, rate: String(pt.default_commission_rate), active: pt.is_active } }));
  };

  const cancelEdit = (key: string) => {
    setEditing((m) => { const c = { ...m }; delete c[key]; return c; });
  };

  const handleUpdate = async (pt: PartnerType) => {
    const ed = editing[pt.key];
    if (!ed) return;
    try {
      await partnerTypesApi.update(pt.key, {
        label: ed.label,
        default_commission_rate: parseFloat(ed.rate) || 0,
        is_active: ed.active,
      });
      setMsg({ ok: true, text: t('admin.partnerTypesPage.updated') });
      cancelEdit(pt.key);
      load();
    } catch {
      setMsg({ ok: false, text: t('common.error') });
    }
  };

  const handleDelete = async (pt: PartnerType) => {
    setMsg(null);
    const inUse = partners.some((p) => p.partner_type === pt.key);
    if (!inUse) {
      if (!window.confirm(t('admin.partnerTypesPage.deleteConfirm'))) return;
      try {
        await partnerTypesApi.delete(pt.key);
        setMsg({ ok: true, text: t('admin.partnerTypesPage.deleted') });
        loadTypesOnly();
      } catch (err: any) {
        setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
      }
      return;
    }
    setDeleteTarget(pt);
    setDeleteSearch('');
    setMoveTo(types.find((x) => x.key !== pt.key && x.is_active)?.key || '');
  };

  const usingPartners = useMemo(() => {
    if (!deleteTarget) return [];
    const q = deleteSearch.trim().toLowerCase();
    return partners
      .filter((p) => p.partner_type === deleteTarget.key)
      .filter((p) =>
        !q ||
        p.company_name.toLowerCase().includes(q) ||
        p.contact_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
  }, [deleteTarget, deleteSearch, partners]);

  const handleReassignAndDelete = async () => {
    if (!deleteTarget || !moveTo) return;
    setDeleting(true);
    try {
      const r = await partnerTypesApi.deleteWithReassign(deleteTarget.key, moveTo);
      setMsg({ ok: true, text: `${t('admin.partnerTypesPage.moved')} ${r.data.moved} → ${r.data.to}` });
      setDeleteTarget(null);
      loadTypesOnly();
      partnersApi.list().then((resp) => setPartners(resp.data || [])).catch(() => {});
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const cell = (pt: PartnerType, current: string, onChange: (v: string) => void, className = '') => (
    <input
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 ${className}`}
    />
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.partnerTypesPage.title')}</h1>
        <p className="text-gray-500 mt-1">{t('admin.partnerTypesPage.subtitle')}</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('admin.partnerTypesPage.newType')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.partnerTypesPage.typeName')}</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.partnerTypesPage.typeKey')}</label>
            <input value={keyInput} onChange={(e) => setKeyInput(slugify(e.target.value))}
              placeholder={t('admin.partnerTypesPage.typeKeyHint')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.partnerTypesPage.defaultRate')}</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500" />
              <button type="submit" disabled={saving || !name.trim()}
                className="btn-primary shrink-0">{saving ? t('common.loading') : t('common.add')}</button>
            </div>
          </div>
        </div>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('admin.partnerTypesPage.typeName')}</th>
              <th>{t('admin.partnerTypesPage.typeKey')}</th>
              <th>{t('admin.partnerTypesPage.defaultRate')}</th>
              <th>{t('admin.partnerTypesPage.active')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {types.map((pt) => {
              const ed = editing[pt.key];
              return (
                <tr key={pt.key}>
                  <td className="font-medium text-gray-900">
                    {ed ? cell(pt, ed.label, (v) => setEditing((m) => ({ ...m, [pt.key]: { ...ed, label: v } }))) : pt.label}
                  </td>
                  <td className="text-gray-500 font-mono text-sm">{pt.key}</td>
                  <td>
                    {ed ? (
                      <div className="flex items-center gap-1 max-w-[140px]">
                        {cell(pt, ed.rate, (v) => setEditing((m) => ({ ...m, [pt.key]: { ...ed, rate: v } })))}
                        <span className="text-gray-400 text-sm">%</span>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">{pt.default_commission_rate}%</span>
                    )}
                  </td>
                  <td>
                    {ed ? (
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={ed.active}
                          onChange={(e) => setEditing((m) => ({ ...m, [pt.key]: { ...ed, active: e.target.checked } }))}
                          className="w-4 h-4 accent-aconso-600" />
                        <span className="text-sm text-gray-600">{ed.active ? t('common.active') : t('admin.statuses.inactivo')}</span>
                      </label>
                    ) : pt.is_active ? (
                      <span className="badge bg-emerald-100 text-emerald-700 border border-emerald-200">● {t('common.active')}</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500 border border-gray-200">○ {t('admin.statuses.inactivo')}</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {ed ? (
                        <>
                          <button onClick={() => handleUpdate(pt)} className="px-3 py-1.5 text-xs font-medium bg-aconso-500 text-white rounded-lg hover:bg-aconso-600">
                            {t('common.save')}
                          </button>
                          <button onClick={() => cancelEdit(pt.key)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
                            {t('common.cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(pt)} className="px-3 py-1.5 text-xs font-medium bg-white text-gray-600 border border-gray-200 rounded-lg hover:border-aconso-300">
                            {t('common.edit')}
                          </button>
                          <button onClick={() => handleDelete(pt)} className="px-3 py-1.5 text-xs font-medium bg-white text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                            {t('common.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && types.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white w-full max-w-lg max-h-[80vh] overflow-hidden border border-gray-200 rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('admin.partnerTypesPage.reassignTitle')} “{deleteTarget.label}”</h3>
                <p className="text-sm text-gray-500 mt-1">{t('admin.partnerTypesPage.inUseCount', { n: partners.filter((p) => p.partner_type === deleteTarget.key).length })}</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[45vh]">
              <div className="mb-4">
                <select
                  value={moveTo}
                  onChange={(e) => setMoveTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500 bg-white"
                >
                  <option value="" disabled>{t('admin.partnerTypesPage.moveToType')}</option>
                  {types.filter((x) => x.key !== deleteTarget.key).map((x) => (
                    <option key={x.key} value={x.key}>{x.label}</option>
                  ))}
                </select>
              </div>

              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={deleteSearch}
                  onChange={(e) => setDeleteSearch(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500"
                />
              </div>

              <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                {usingPartners.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">{t('common.noData')}</div>
                )}
                {usingPartners.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {p.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.company_name}</div>
                      <div className="text-xs text-gray-400 truncate">{p.contact_name} · {p.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReassignAndDelete}
                disabled={deleting || !moveTo}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? t('common.loading') : t('admin.partnerTypesPage.reassignAndDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}