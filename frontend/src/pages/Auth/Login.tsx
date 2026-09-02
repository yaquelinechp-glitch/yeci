import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import Header from '../../components/layout/Header';

function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/partner', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('auth.errEmail'));
      setError(t('auth.errEmail'));
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.user, res.data.access_token);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/partner');
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailInput = (value: string) => {
    setEmail(value.replace(/[^a-zA-Z0-9@._\-+]/g, ''));
    if (emailError) setEmailError('');
  };

  const handleEmailBlur = (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError(t('auth.errEmail'));
    }
  };

  return (
    <>
      <Header />
      <div className="pt-16 min-h-screen flex">
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 text-white items-center justify-center p-12">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold mb-4">{t('auth.welcomeBack')}</h1>
            <p className="opacity-80 mb-8">{t('auth.welcomeDesc')}</p>
            <div className="space-y-3">
              {(t('auth.features', { returnObjects: true }) as string[]).map((f: string) => (
                <div key={f} className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-lg">{f}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">{t('auth.loginTitle')}</h2>
            <p className="text-gray-500 mb-8">{t('auth.loginSubtitle')}</p>

            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
                <input type="text" value={email}
                  onInput={(e) => handleEmailInput((e.target as HTMLInputElement).value)}
                  onBlur={(e) => handleEmailBlur(e.target.value)}
                  className={`w-full border-2 rounded-lg px-4 py-3 focus:outline-none transition-colors ${emailError ? 'border-red-400 focus:border-red-500 bg-red-50/50' : 'border-gray-200 focus:border-blue-500'}`}
                  placeholder={t('auth.emailPlaceholder')} required />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none" placeholder="••••••••" required />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">{loading ? '...' : t('auth.loginBtn')}</button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3">{t('auth.demoLabel')}</p>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => { setEmail('admin@aconso.com'); setPassword('admin123'); setError(''); }}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm">
                  <span className="font-medium text-gray-700">{t('auth.demoAdmin')}</span>
                  <span className="text-gray-400 text-xs">admin@aconso.com</span>
                </button>
                <button type="button" onClick={() => { setEmail('flexso@demo.com'); setPassword('admin123'); setError(''); }}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm">
                  <span className="font-medium text-gray-700">{t('auth.demoFlexso')}</span>
                  <span className="text-gray-400 text-xs">flexso@demo.com</span>
                </button>
                <button type="button" onClick={() => { setEmail('deloitte@demo.com'); setPassword('admin123'); setError(''); }}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm">
                  <span className="font-medium text-gray-700">{t('auth.demoDeloitte')}</span>
                  <span className="text-gray-400 text-xs">deloitte@demo.com</span>
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">{t('auth.noAccount')} <Link to="/register" className="text-blue-600 font-medium">{t('auth.register')}</Link></p>
            <p className="text-center mt-2"><Link to="/" className="text-sm text-gray-400 hover:text-blue-600">{t('auth.backToSite')}</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Login() {
  return <LoginForm />;
}
