import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { partnersApi } from '../../services/api';
import type { User } from '../../types';

const STATUS_FLOW = ['solicitado', 'en_revision', 'aprobado', 'contrato_pendiente', 'activo'] as const;
const STATUS_KEYS: Record<string, string> = {
  solicitado: 'admin.statuses.solicitado', en_revision: 'admin.statuses.en_revision', aprobado: 'admin.statuses.aprobado',
  contrato_pendiente: 'admin.statuses.contrato_pendiente', activo: 'admin.statuses.activo', inactivo: 'admin.statuses.inactivo',
};
const STATUS_COLORS: Record<string, string> = {
  solicitado: 'bg-blue-100 text-blue-700 border border-blue-200',
  en_revision: 'bg-amber-100 text-amber-700 border border-amber-200',
  aprobado: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  contrato_pendiente: 'bg-purple-100 text-purple-700 border border-purple-200',
  activo: 'bg-emerald-500 text-white border border-emerald-600',
  inactivo: 'bg-red-100 text-red-700 border border-red-200',
};

export default function Solicitudes() {
  const { t } = useTranslation();
  const [solicitudes, setSolicitudes] = useState<User[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { partnersApi.solicitudes().then((r) => setSolicitudes(r.data)); }, []);

  const handleStatus = async (id: string, status: string) => {
    await partnersApi.update(id, { status });
    if (status === 'inactivo') {
      setSolicitudes((prev) => prev.filter((s) => s.id !== id));
    } else {
      setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    }
    window.dispatchEvent(new CustomEvent('admin:stats-changed'));
  };

  const nextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current as any);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.requests')}</h1>
        <p className="text-gray-500 mt-1">{t('admin.solicitudesSubtitle')}</p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <div className="text-gray-400 text-lg">{t('common.noData')}</div>
          <div className="text-gray-400 text-sm mt-2">{t('admin.noPendingRequests')}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((s) => {
            const next = nextStatus(s.status);
            return (
              <div key={s.id} className="card overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aconso-500 to-aconso-700 text-white flex items-center justify-center font-bold text-lg">
                      {s.company_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{s.company_name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || ''}`}>{t(STATUS_KEYS[s.status] || '') || s.status}</span>
                      </div>
                      <div className="text-sm text-gray-500">{s.contact_name} · {s.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      className="text-sm text-aconso-500 hover:text-aconso-700 font-medium transition-colors"
                    >
                      {expanded === s.id ? t('common.cancel') : t('admin.review')}
                    </button>
                    {next && (
                      <button
                        onClick={() => handleStatus(s.id, next)}
                        className="btn-primary !py-2 !px-4 text-sm"
                      >
                        {next === 'activo' ? t('admin.approve') : `→ ${t(STATUS_KEYS[next] || '')}`}
                      </button>
                    )}
                    {s.status !== 'inactivo' && s.status !== 'activo' && (
                      <button
                        onClick={() => handleStatus(s.id, 'inactivo')}
                        className="btn-danger !py-2 !px-4 text-sm"
                      >
                        {t('admin.reject')}
                      </button>
                    )}
                  </div>
                </div>

                {expanded === s.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">{t('auth.contactName')}</div>
                        <div className="text-sm font-medium text-gray-900">{s.contact_name || '—'}</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">{t('auth.email')}</div>
                        <div className="text-sm font-medium text-gray-900">{s.email}</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">{t('auth.phone')}</div>
                        <div className="text-sm font-medium text-gray-900">{s.phone || '—'}</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">{t('auth.taxId')}</div>
                        <div className="text-sm font-medium text-gray-900">{s.tax_id || '—'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('admin.whyPartner')}</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{s.why_partner || t('admin.noDescription')}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('admin.salesApproach')}</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{s.sales_approach || t('admin.noDescription')}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-3">
                      {t('admin.registeredOn')}: {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
