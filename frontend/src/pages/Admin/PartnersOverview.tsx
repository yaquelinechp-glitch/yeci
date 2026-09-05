import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { partnersApi } from '../../services/api';
import type { User } from '../../types';
import Solicitudes from './Solicitudes';
import PartnersList from './PartnersList';
import PartnerTypes from './PartnerTypes';

type StatusFilter = 'all' | 'activo' | 'solicitado' | 'en_revision';

export default function PartnersOverview() {
  const { t } = useTranslation();
  const [partners, setPartners] = useState<User[]>([]);
  const [typesOpen, setTypesOpen] = useState(false);
  const [tab, setTab] = useState<'partners' | 'solicitudes'>('partners');
  const [filter, setFilter] = useState<StatusFilter>('all');

  useEffect(() => { partnersApi.list().then((r) => setPartners(r.data || [])); }, []);

  const counts: Record<StatusFilter, number> = {
    all: partners.length,
    activo: partners.filter((p) => p.status === 'activo').length,
    solicitado: partners.filter((p) => p.status === 'solicitado').length,
    en_revision: partners.filter((p) => p.status === 'en_revision').length,
  };
  const pendingCount = counts.solicitado + counts.en_revision;

  const statCards: { key: StatusFilter; label: string; grad: string; icon: string }[] = [
    { key: 'all', label: t('admin.totalPartners'), grad: 'from-aconso-500 to-aconso-700', icon: '' },
    { key: 'activo', label: t('admin.activePartners'), grad: 'from-emerald-500 to-emerald-700', icon: '' },
    { key: 'solicitado', label: t('common.pending'), grad: 'from-amber-500 to-amber-600', icon: '' },
    { key: 'en_revision', label: t('common.review'), grad: 'from-blue-500 to-blue-600', icon: '' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.partners')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.partnersSubtitle')}</p>
        </div>
        <button
          onClick={() => setTypesOpen(!typesOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            typesOpen
              ? 'bg-aconso-500 text-white border-aconso-500 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-aconso-300 hover:text-aconso-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('nav.partnerTypes')}
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${typesOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {typesOpen && <PartnerTypes />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const active = tab === 'partners' && filter === card.key;
          return (
            <button
              key={card.key}
              onClick={() => { setFilter(card.key); setTab('partners'); }}
              className={`group flex items-center gap-3 bg-white border rounded-2xl p-4 text-left transition-all ${
                active ? 'border-aconso-500 ring-2 ring-aconso-500/20' : 'border-gray-200 hover:border-aconso-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.grad} text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm`}>
                {counts[card.key]}
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-medium truncate ${active ? 'text-aconso-700' : 'text-gray-600'}`}>{card.label}</div>
                <div className="text-xs text-gray-400">Partners</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('partners')}
          className={`pb-3 -mb-px border-b-2 text-sm font-medium transition-colors ${
            tab === 'partners'
              ? 'border-aconso-500 text-aconso-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('admin.allPartners')}
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{counts.all}</span>
        </button>
        <button
          onClick={() => setTab('solicitudes')}
          className={`pb-3 -mb-px border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'solicitudes'
              ? 'border-aconso-500 text-aconso-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('admin.requests')}
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">{pendingCount}</span>
          )}
        </button>
      </div>

      {tab === 'partners'
        ? <PartnersList partners={partners} filter={filter} />
        : <Solicitudes />}
    </div>
  );
}