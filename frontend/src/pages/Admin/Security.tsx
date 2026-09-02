import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/Header';
import { adminApi } from '../../services/api';

interface LoginAttempt {
  ip: string;
  attempted_at: string;
  success: boolean;
}

interface BlacklistedToken {
  jti: string;
  user_id: string;
  user_email: string | null;
  created_at: string;
}

export default function AdminSecurity() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'attempts' | 'tokens' | 'register'>('attempts');
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [tokens, setTokens] = useState<BlacklistedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ company_name: '', email: '', password: '', contact_name: '', phone: '', tax_id: '' });
  const [registerMsg, setRegisterMsg] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    if (tab === 'attempts') {
      adminApi.loginAttempts().then((r) => setAttempts(r.data)).catch(() => setError(t('common.error'))).finally(() => setLoading(false));
    } else if (tab === 'tokens') {
      adminApi.blacklistedTokens().then((r) => setTokens(r.data)).catch(() => setError(t('common.error'))).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab, t]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMsg('');
    setRegisterLoading(true);
    try {
      const res = await adminApi.registerAdmin(form);
      setRegisterMsg(`OK ${t('security.adminCreated', { name: res.data.company_name })}`);
      setForm({ company_name: '', email: '', password: '', contact_name: '', phone: '', tax_id: '' });
    } catch (err: any) {
      setRegisterMsg(`${err?.response?.data?.detail || t('common.error')}`);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="pt-24 pb-12 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500 text-xl">&#128737;</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('security.title')}</h1>
              <p className="text-sm text-white/70">{t('security.subtitle')}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {([
              ['attempts', t('security.tabAttempts')],
              ['tokens', t('security.tabTokens')],
              ['register', t('security.tabRegister')],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === key ? 'border-aconso-500 text-aconso-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>{label}</button>
            ))}
          </div>

          {tab === 'attempts' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t('security.failedAttempts')}</h2>
                <span className="text-xs text-gray-400">{t('security.failedCount', { n: attempts.filter(a => !a.success).length })}</span>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">{t('common.loading')}</div>
              ) : error ? (
                <div className="p-12 text-center text-red-500">{error}</div>
              ) : attempts.length === 0 ? (
                <div className="p-12 text-center text-gray-400">{t('security.noAttempts')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">{t('security.ip')}</th>
                        <th className="px-5 py-3">{t('security.dateTime')}</th>
                        <th className="px-5 py-3">{t('security.result')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {attempts.map((a, i) => (
                        <tr key={i} className="hover:bg-gray-25">
                          <td className="px-5 py-3.5 font-mono text-xs">{a.ip}</td>
                          <td className="px-5 py-3.5 text-gray-600">{new Date(a.attempted_at).toLocaleString()}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              a.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>{a.success ? t('security.success') : t('security.failed')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'tokens' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">{t('security.blacklisted')}</h2>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">{t('common.loading')}</div>
              ) : error ? (
                <div className="p-12 text-center text-red-500">{error}</div>
              ) : tokens.length === 0 ? (
                <div className="p-12 text-center text-gray-400">{t('security.noTokens')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">{t('security.user')}</th>
                        <th className="px-5 py-3">{t('security.blacklistedAt')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tokens.map((tok) => (
                        <tr key={tok.jti} className="hover:bg-gray-25">
                          <td className="px-5 py-3.5">{tok.user_email || tok.user_id}</td>
                          <td className="px-5 py-3.5 text-gray-600">{new Date(tok.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'register' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg">
              <h2 className="font-semibold text-gray-900 mb-1">{t('security.createAdmin')}</h2>
              <p className="text-sm text-gray-500 mb-6">{t('security.createAdminDesc')}</p>
              {registerMsg && (
                <div className={`mb-5 px-4 py-3 rounded-xl text-sm ${
                  registerMsg.startsWith('OK ') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>{registerMsg}</div>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('security.companyName')}</label>
                  <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-aconso-500 focus:ring-2 focus:ring-aconso-500/20 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')} *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-aconso-500 focus:ring-2 focus:ring-aconso-500/20 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')} *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-aconso-500 focus:ring-2 focus:ring-aconso-500/20 outline-none text-sm" required minLength={12} />
                  <p className="text-xs text-gray-400 mt-1">{t('security.passwordHint')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('security.contactName')}</label>
                    <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-aconso-500 focus:ring-2 focus:ring-aconso-500/20 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('security.phone')}</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-aconso-500 focus:ring-2 focus:ring-aconso-500/20 outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('security.taxId')}</label>
                  <input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-aconso-500 focus:ring-2 focus:ring-aconso-500/20 outline-none text-sm" />
                </div>
                <button type="submit" disabled={registerLoading}
                  className="w-full py-2.5 rounded-xl bg-aconso-600 text-white font-medium hover:bg-aconso-700 disabled:opacity-50 transition-colors">
                  {registerLoading ? t('security.creating') : t('security.createAdmin')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
