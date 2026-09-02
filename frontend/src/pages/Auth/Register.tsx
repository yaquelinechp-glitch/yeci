import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi, partnerUsersApi } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import Header from '../../components/layout/Header';
import { COUNTRIES } from '../../constants';
import type { InviteInfo } from '../../types';

type Field = 'company_name' | 'contact_name' | 'email' | 'password' | 'phone' | 'tax_id';

const PATTERNS: Record<Field, RegExp> = {
  company_name: /[^a-zA-Z0-9\s\-&.,áéíóúñüÁÉÍÓÚÑÜ]/g,
  contact_name: /[^a-zA-Z\s\-'.áéíóúñüÁÉÍÓÚÑÜ]/g,
  email: /[^a-zA-Z0-9@._\-+]/g,
  password: /(?:)/g,
  phone: /[^0-9+\-\s().]/g,
  tax_id: /[^a-zA-Z0-9\-]/g,
};

function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';
  const { setAuth, user } = useAuthStore();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [form, setForm] = useState({
    company_name: '', email: '', password: '', contact_name: '',
    phone: '', tax_id: '', country: '', why_partner: '', sales_approach: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/partner', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!inviteToken) return;
    partnerUsersApi.inviteInfo(inviteToken)
      .then((r) => setInvite(r.data))
      .catch(() => setInviteError(t('auth.inviteInvalid')));
  }, [inviteToken, t]);

  useEffect(() => {
    fetch('https://ipwho.is/')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.country_code && COUNTRIES.some((c) => c.code === String(data.country_code).toLowerCase())) {
          setForm((prev) => ({ ...prev, country: String(data.country_code).toLowerCase() }));
        }
      })
      .catch(() => {});
  }, []);

  const handleAuth = async (accessToken: string, userData: any) => {
    setAuth(userData, accessToken);
    navigate(userData.role === 'admin' ? '/admin' : '/partner');
  };

  const filterInput = useCallback((value: string, pattern: RegExp): string => {
    return value.replace(pattern, '');
  }, []);

  const handleFieldChange = useCallback((field: Field, value: string) => {
    const filtered = filterInput(value, PATTERNS[field]);
    setForm((prev) => ({ ...prev, [field]: filtered }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [fieldErrors, filterInput]);

  const handleFieldBlur = useCallback((field: Field, value: string) => {
    const errs: Record<string, string> = {};
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errs.email = t('auth.errEmail');
    }
    if (field === 'password' && value && value.length < 12) {
      errs.password = t('auth.errPassword');
    }
    if (field === 'company_name' && !value.trim()) {
      errs.company_name = t('auth.errCompanyName');
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errs }));
    }
  }, [t]);

  const fieldClass = (field: string) =>
    `w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors ${
      fieldErrors[field] ? 'border-red-400 focus:border-red-500 bg-red-50/50' : 'border-gray-200 focus:border-blue-500'
    }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (invite) {
      if (!form.contact_name.trim()) {
        setFieldErrors({ contact_name: t('auth.errContactName') });
        setError(t('auth.registerRequired'));
        return;
      }
      if (!form.password || form.password.length < 12) {
        setFieldErrors({ password: t('auth.errPassword') });
        setError(t('auth.registerRequired'));
        return;
      }
      setLoading(true);
      try {
        const res = await partnerUsersApi.registerWithInvite(invite.invite_token, form.contact_name, form.password);
        setRegistered(true);
        handleAuth(res.data.access_token, res.data.user);
      } catch (err: any) {
        setError(err?.response?.data?.detail || t('auth.registerError'));
      } finally {
        setLoading(false);
      }
      return;
    }

    const errs: Record<string, string> = {};
    if (!form.company_name.trim()) errs.company_name = t('auth.errCompanyName');
    if (!form.email.trim()) errs.email = t('auth.errEmail');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('auth.errEmail');
    if (!form.password) errs.password = t('auth.errPassword');
    else if (form.password.length < 12) errs.password = t('auth.errPassword');
    if (form.phone && !/^[0-9+\-\s()]+$/.test(form.phone)) errs.phone = t('auth.errPhone');
    if (form.tax_id && !/^[a-zA-Z0-9\-]+$/.test(form.tax_id)) errs.tax_id = t('auth.errTaxId');

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(t('auth.registerRequired'));
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(form);
      setRegistered(true);
      handleAuth(res.data.access_token, res.data.user);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  function getStrength(pw: string): number {
    let s = 0;
    if (pw.length >= 12) s += 25;
    if (/[A-Z]/.test(pw)) s += 20;
    if (/[a-z]/.test(pw)) s += 15;
    if (/[0-9]/.test(pw)) s += 20;
    if (/[!@#$%^&*()_\-+=[\]{}|;:'",.<>?/~`]/.test(pw)) s += 20;
    return Math.min(s, 100);
  }

  function strengthColor(pct: number): string {
    if (pct < 40) return 'bg-red-500';
    if (pct < 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  if (registered) {
  if (inviteError) {
    return (
      <>
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl"></span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.inviteInvalid')}</h2>
            <p className="text-gray-500 mb-8">{t('auth.inviteInvalidDesc')}</p>
            <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-block">
              {t('auth.registerTitle')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (invite) {
    return (
      <>
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-aconso-100 flex items-center justify-center text-3xl"></div>
              <h2 className="text-2xl font-bold text-gray-900">{t('auth.inviteTitle')}</h2>
              <p className="text-gray-500 mt-1">{t('auth.inviteSubtitle', { partner: invite.partner_name })}</p>
            </div>
            <div className="bg-aconso-50 border border-aconso-100 rounded-xl px-4 py-3 mb-6 text-sm text-aconso-800">
               {invite.email}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.contactName')} *</label>
                <input type="text" value={form.contact_name}
                  onInput={(e) => handleFieldChange('contact_name', (e.target as HTMLInputElement).value)}
                  className={fieldClass('contact_name')} required />
                {fieldErrors.contact_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.contact_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.password')} *</label>
                <input type="password" value={form.password}
                  onInput={(e) => handleFieldChange('password', (e.target as HTMLInputElement).value)}
                  className={fieldClass('password')} required minLength={12} />
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((n) => (
                        <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${
                          getStrength(form.password) >= n * 25 ? strengthColor(getStrength(form.password)) : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                  </div>
                )}
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">{loading ? '...' : t('auth.inviteBtn')}</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
      <>
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.registerSuccessTitle')}</h2>
            <p className="text-gray-500 mb-8">{t('auth.registerSuccessDesc')}</p>
            <button onClick={() => navigate('/partner')} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              {t('auth.registerSuccessBtn')}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-16 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-2">{t('auth.registerTitle')}</h2>
          <p className="text-gray-500 mb-8">{t('auth.registerSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.companyName')} *</label>
                <input type="text" value={form.company_name}
                  onInput={(e) => handleFieldChange('company_name', (e.target as HTMLInputElement).value)}
                  onBlur={(e) => handleFieldBlur('company_name', e.target.value)}
                  className={fieldClass('company_name')} required />
                {fieldErrors.company_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.company_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.contactName')}</label>
                <input type="text" value={form.contact_name}
                  onInput={(e) => handleFieldChange('contact_name', (e.target as HTMLInputElement).value)}
                  className={fieldClass('contact_name')} />
                {fieldErrors.contact_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.contact_name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.email')} *</label>
                <input type="text" value={form.email}
                  onInput={(e) => handleFieldChange('email', (e.target as HTMLInputElement).value)}
                  onBlur={(e) => handleFieldBlur('email', e.target.value)}
                  className={fieldClass('email')} required />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.password')} *</label>
                <input type="password" value={form.password}
                  onInput={(e) => handleFieldChange('password', (e.target as HTMLInputElement).value)}
                  onBlur={(e) => handleFieldBlur('password', e.target.value)}
                  className={fieldClass('password')} required minLength={12} />
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((n) => (
                        <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${
                          getStrength(form.password) >= n * 25 ? strengthColor(getStrength(form.password)) : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[
                        { check: form.password.length >= 12, label: '12+ characters' },
                        { check: /[A-Z]/.test(form.password), label: 'Uppercase' },
                        { check: /[a-z]/.test(form.password), label: 'Lowercase' },
                        { check: /[0-9]/.test(form.password), label: 'Number' },
                        { check: /[!@#$%^&*()_\-+=[\]{}|;:'",.<>?/~`]/.test(form.password), label: 'Special char' },
                      ].map((r) => (
                        <div key={r.label} className={`text-xs ${r.check ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {r.check ? '' : '○'} {r.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.phone')}</label>
                <input type="tel" value={form.phone}
                  onInput={(e) => handleFieldChange('phone', (e.target as HTMLInputElement).value)}
                  onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                  className={fieldClass('phone')} placeholder="+34 600 000 000" />
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.taxId')}</label>
                <input type="text" value={form.tax_id}
                  onInput={(e) => handleFieldChange('tax_id', (e.target as HTMLInputElement).value)}
                  onBlur={(e) => handleFieldBlur('tax_id', e.target.value)}
                  className={fieldClass('tax_id')} placeholder="B12345678" />
                {fieldErrors.tax_id && <p className="text-xs text-red-500 mt-1">{fieldErrors.tax_id}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.country')}</label>
              <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none bg-white">
                <option value="">{t('auth.countryAuto')}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">{t('auth.countryHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.whyPartner')}</label>
              <textarea value={form.why_partner} onChange={(e) => setForm({ ...form, why_partner: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none resize-none" rows={3} placeholder={t('auth.whyPartnerPlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.salesApproach')}</label>
              <textarea value={form.sales_approach} onChange={(e) => setForm({ ...form, sales_approach: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none resize-none" rows={3} placeholder={t('auth.salesApproachPlaceholder')} />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">{loading ? '...' : t('auth.registerBtn')}</button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">{t('auth.hasAccount')} <Link to="/login" className="text-blue-600 font-medium">{t('auth.login')}</Link></p>
        </div>
      </div>
    </>
  );
}

export default function Register() {
  return <RegisterForm />;
}