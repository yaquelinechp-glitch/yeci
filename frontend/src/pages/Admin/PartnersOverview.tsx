import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Solicitudes from './Solicitudes';
import PartnersList from './PartnersList';
import PartnerTypes from './PartnerTypes';

export default function PartnersOverview() {
  const { t } = useTranslation();
  const [typesOpen, setTypesOpen] = useState(false);

  return (
    <div className="space-y-12 animate-fade-in">
      <div>
        <button
          onClick={() => setTypesOpen(!typesOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-aconso-300 hover:text-aconso-700 transition-all"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${typesOpen ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t('nav.partnerTypes')}
        </button>
      </div>

      {typesOpen && <PartnerTypes />}

      <Solicitudes />
      <div className="border-t border-gray-200"></div>
      <PartnersList />
    </div>
  );
}