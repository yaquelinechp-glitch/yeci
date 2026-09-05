import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { reportsApi, dealsApi } from '../../services/api';
import type { Deal } from '../../types';
import ProfileModal from '../ProfileModal';

type NavLink = { to: string; label: string; badge?: number };

type Props = {
  mobileOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const [profileOpen, setProfileOpen] = useState(false);
  const [partnersBadge, setPartnersBadge] = useState(0);
  const [pipelineBadge, setPipelineBadge] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const load = () => {
      reportsApi.adminStats().then((r) => {
        setPartnersBadge(r.data.pending_requests || 0);
      }).catch(() => { });
      dealsApi.listAll().then((r) => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const fresh = (r.data as Deal[]).filter((d) =>
          ['necesita_acceso', 'en_revision', 'en_implementacion'].includes(d.status) &&
          new Date(d.updated_at).getTime() > cutoff
        ).length;
        setPipelineBadge(fresh);
      }).catch(() => { });
    };
    load();
    const id = setInterval(load, 30000);
    window.addEventListener('admin:stats-changed', load);
    return () => { clearInterval(id); window.removeEventListener('admin:stats-changed', load); };
  }, [isAdmin]);

  const profileInitials = () => {
    const fn = (user?.first_name || '').trim();
    const ln = (user?.last_name || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    if (ln) return ln.slice(0, 2).toUpperCase();
    return (user?.company_name || '?').slice(0, 2).toUpperCase();
  };

  const links: NavLink[] = isAdmin
    ? [
        { to: '/admin', label: t('nav.dashboard'), },
        { to: '/admin/partners', label: t('nav.partners'), badge: partnersBadge },
        { to: '/admin/partner-types', label: t('nav.partnerTypes'), },
        { to: '/admin/pipeline', label: t('nav.pipeline'), badge: pipelineBadge },
        { to: '/admin/courses', label: t('nav.courses'), },
        { to: '/admin/lms-report', label: t('nav.lmsReport'), },
        { to: '/admin/course-analytics', label: t('nav.courseAnalytics'), },
        { to: '/admin/conflicts', label: t('nav.conflicts'), },
        { to: '/admin/reports', label: t('nav.reports'), },
        { to: '/admin/cost-export', label: t('nav.costExport'), },
        { to: '/admin/security', label: t('nav.security'), },
      ]
    : [
        { to: '/partner', label: t('nav.dashboard'), },
        { to: '/partner/pipeline', label: t('nav.pipeline'), },
        { to: '/partner/courses', label: t('nav.courses'), },
        { to: '/partner/training', label: t('nav.training'), },
        { to: '/partner/conflicts', label: t('nav.conflicts'), },
        { to: '/partner/notifications', label: t('nav.notifications'), },
        { to: '/partner/users', label: t('nav.users'), },
      ];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 right-0 top-16 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}
      <aside className={`w-64 bg-dark-800 text-white min-h-screen fixed left-0 top-16 bottom-0 overflow-y-auto scrollbar-thin z-50 transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
      <div className="p-6 text-center border-b border-white/10">
        <button onClick={() => setProfileOpen(true)} className="group mx-auto block" title={t('profile.title')}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-aconso-500 to-aconso-700 flex items-center justify-center text-xl font-bold mx-auto mb-3 ring-2 ring-white/20 overflow-hidden group-hover:ring-accent-500/60 transition-all">
            {user?.avatar ? (
              <img src={user.avatar} alt={t('profile.title')} className="w-full h-full object-cover" />
            ) : (
              profileInitials()
            )}
          </div>
          <div className="font-semibold text-white group-hover:text-accent-300 transition-colors">
            {[user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || user?.company_name}
          </div>
          <div className="text-xs text-dark-200 mt-0.5">
            {([user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() && user?.username) ? user.username : (user?.contact_name || (isAdmin ? t('nav.admin') : ''))}
          </div>
        </button>
      </div>
      <nav className="mt-4 px-3">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm rounded-lg mb-1 transition-all duration-200 ${
                isActive
                  ? 'bg-accent-500/15 text-accent-400 border-l-3 border-accent-500'
                  : 'text-dark-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={isActive ? 'font-medium' : ''}>{link.label}</span>
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{link.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-full border-t border-white/10 px-3">
        <button onClick={() => { logout(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-4 text-sm text-dark-200 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all duration-200 mt-2">
          <span className="text-lg"></span>
          {t('nav.logout')}
        </button>
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </aside>
    </>
  );
}
