import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { reportsApi, dealsApi } from '../../services/api';
import type { Deal } from '../../types';

type NavLink = { to: string; label: string; badge?: number };

type Props = {
  mobileOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
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

  const links: NavLink[] = isAdmin
    ? [
        { to: '/admin', label: t('nav.dashboard'), },
        { to: '/admin/partners', label: t('nav.partners'), badge: partnersBadge },
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
        <div className="fixed inset-y-0 left-0 right-0 top-16 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`w-64 bg-gradient-to-b from-[#1b4a6b] via-[#123a5c] to-[#0b2d47] text-[#bfe3f5] flex flex-col fixed left-0 top-16 bottom-0 z-50 border-r border-white/10 transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col justify-evenly px-3 py-3">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#357fae] via-[#1b4a6b]/80 to-transparent text-white font-semibold shadow-[-8px_0_12px_-6px_rgba(0,0,0,0.28)]'
                  : 'text-[#bfe3f5]/90 hover:bg-gradient-to-r hover:from-[#357fae] hover:via-[#1b4a6b]/80 hover:to-transparent hover:text-white'
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
    </aside>
    </>
  );
}
