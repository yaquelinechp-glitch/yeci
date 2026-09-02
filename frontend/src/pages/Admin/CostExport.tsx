import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/Header';
import { calculatorApi } from '../../services/api';

type Lang = 'en' | 'es' | 'de';
const LANGS: Lang[] = ['en', 'es', 'de'];
const LABELS: Record<string, string> = {
  title: 'costExport.fieldTitle',
  subtitle: 'costExport.fieldSubtitle',
  footer: 'costExport.fieldFooter',
  product_col: 'costExport.productCol',
  annual_col: 'costExport.annualCol',
};

export default function AdminCostExport() {
  const { t } = useTranslation();
  const [fields, setFields] = useState<Record<string, Record<Lang, string>>>({
    title: { en: '', es: '', de: '' },
    subtitle: { en: '', es: '', de: '' },
    footer: { en: '', es: '', de: '' },
    product_col: { en: '', es: '', de: '' },
    annual_col: { en: '', es: '', de: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    calculatorApi.settings()
      .then((r) => {
        const next: Record<string, Record<Lang, string>> = { ...fields };
        (Object.keys(LABELS) as (keyof typeof LABELS)[]).forEach((f) => {
          const raw = r.data[f] || {};
          next[f] = {
            en: raw.en || '',
            es: raw.es || '',
            de: raw.de || '',
          };
        });
        setFields(next);
      })
      .catch(() => setMsg({ ok: false, text: t('common.error') }))
      .finally(() => setLoading(false));
  }, []);

  const change = (field: string, lang: Lang, value: string) => {
    setFields((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await calculatorApi.saveSettings(fields);
      setMsg({ ok: true, text: t('costExport.saved') });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.response?.data?.detail || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500";

  return (
    <>
      <Header />
      <div className="pt-24 pb-12 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-aconso-500/15 flex items-center justify-center text-aconso-500 text-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('costExport.title')}</h1>
              <p className="text-sm text-white/70">{t('costExport.subtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t('costExport.blocksHeader')}</h2>
              <button type="submit" disabled={saving || loading} className="btn-primary disabled:opacity-50">
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>

            {msg && (
              <div className={`mx-5 mt-4 px-4 py-3 rounded-xl text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {msg.text}
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-gray-400">{t('common.loading')}</div>
            ) : (
              <div className="p-5 space-y-6">
                {(Object.keys(LABELS) as string[]).map((f) => (
                  <div key={f}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t(LABELS[f])}</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {LANGS.map((lang) => (
                        <div key={lang}>
                          <span className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">{lang}</span>
                          <input value={fields[f][lang]} onChange={(e) => change(f, lang, e.target.value)}
                            className={inputClass} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400">{t('costExport.hint')}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
