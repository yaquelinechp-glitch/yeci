import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dealsApi } from '../../services/api';
import type { Commission } from '../../types';

export default function Commissions() {
  const { t } = useTranslation();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  useEffect(() => { dealsApi.myCommissions().then((r) => setCommissions(r.data)); }, []);

  const total = commissions.reduce((sum, c) => sum + c.amount, 0);
  const pending = commissions.filter((c) => !c.paid_date).reduce((sum, c) => sum + c.amount, 0);
  const paid = commissions.filter((c) => c.paid_date).reduce((sum, c) => sum + c.amount, 0);

  const summaryCards = [
    { label: t('commissions.totalEarned'), value: `$${total.toLocaleString()}`, color: 'border-emerald-500' },
    { label: t('commissions.pending'), value: `$${pending.toLocaleString()}`, color: 'border-amber-500' },
    { label: t('commissions.paid'), value: `$${paid.toLocaleString()}`, color: 'border-aconso-500' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('commissions.title')}</h1>
        <p className="text-gray-500 mt-1">{t('commissions.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {summaryCards.map((c) => (
          <div key={c.label} className={`kpi-card border-l-4 ${c.color}`}>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-0.5">{c.label}</div>
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commissions Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('deals.clientName')}</th>
              <th>{t('deals.estimatedValue')}</th>
              <th>{t('common.commission')}</th>
              <th>{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16">
                  <div className="text-4xl mb-3"></div>
                  <div className="text-gray-400 text-lg">{t('commissions.noCommissions')}</div>
                  <div className="text-gray-400 text-sm mt-2">{t('commissions.commissionsWillAppear')}</div>
                </td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-aconso-100 text-aconso-600 flex items-center justify-center text-sm font-bold">
                        {c.client_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{c.client_name}</span>
                    </div>
                  </td>
                  <td className="text-gray-600">${c.deal_value.toLocaleString()}</td>
                  <td className="font-semibold text-emerald-600">${c.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${c.paid_date ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                      {c.paid_date ? t('commissions.paid') : t('commissions.pending')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
