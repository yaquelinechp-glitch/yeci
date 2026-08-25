import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { pipelineApi, productsApi } from '../../services/api';
import type { Opportunity, PipelineStats, Product } from '../../types';
import { useAuthStore } from '../../store/auth';
import {
  STAGES, STAGE_PROB, STAGE_COLORS, STAGE_BORDERS,
  OPPORTUNITY_TYPES, FORECAST_CATEGORIES,
  LOSS_REASONS,
  CURRENCIES, fmtMoney,
} from '../../constants';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }
function isOverdue(dateStr: string) { return new Date(dateStr) < new Date(); }
function parseWorkers(v: string): number {
  const m = v.match(/[\d.,]+/);
  if (!m) return 0;
  let s = m[0].replace(/,/g, '');
  const parts = s.split('.');
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    s = last.length !== 3 ? parts.slice(0, -1).join('') + '.' + last : parts.join('');
  }
  return parseFloat(s) || 0;
}

const EMPTY_FORM = {
  company_name: '', company_size: '', products: [] as string[], operation_mode: 'cloud',
  stage: 'registrada', probability: '10', amount: '', scan_one_time_fee: '0',
  currency: 'usd', customCurrency: '',
  delivery_quarter: '', close_date: '', deal_owner: '', channel_manager: '',
  opportunity_type: 'nuevo', forecast_category: '', lead_source: 'generada_partner',
  next_steps: '', loss_reason: '', notes: '',
};

const EMPTY_QFORM = { name: '', description: '', priceUsd: '', priceEur: '', priceChf: '', priceOtro: '', customCurrency: '' };

const priceFor = (p: Product | undefined, cur: string): number => {
  if (!p) return 0;
  const v = cur === 'eur' ? p.price_eur : cur === 'chf' ? p.price_chf : cur === 'otro' ? p.price_otro : p.price_usd;
  return parseFloat(String(v ?? '')) || 0;
};

const productPricesLabel = (p: Product): string => {
  const parts: string[] = [];
  if (Number(p.price_usd) > 0) parts.push(fmtMoney(Number(p.price_usd), 'usd'));
  if (Number(p.price_eur) > 0) parts.push(fmtMoney(Number(p.price_eur), 'eur'));
  if (Number(p.price_chf) > 0) parts.push(fmtMoney(Number(p.price_chf), 'chf'));
  if (Number(p.price_otro) > 0) parts.push(`${(p.custom_currency || '').toUpperCase().slice(0, 5) || '?'} ${Number(p.price_otro).toLocaleString('en-US', { maximumFractionDigits: Number(p.price_otro) % 1 ? 2 : 0 })}`);
  return parts.join(' · ');
};

const curOptLabel = (c: string, t: (k: string) => string) =>
  c === 'usd' ? t('pipeline.curUsd') : c === 'eur' ? t('pipeline.curEur') : c === 'chf' ? t('pipeline.curChf') : t('pipeline.curOtro');

export default function Pipeline() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [events, setEvents] = useState<{ from_stage: string; to_stage: string; created_at: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editOpp, setEditOpp] = useState<Opportunity | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);

  const [prodPick, setProdPick] = useState('');

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qformKey, setQformKey] = useState<string | null>(null);
  const [qform, setQform] = useState({ ...EMPTY_QFORM });
  const [qformError, setQformError] = useState('');
  const [qformLoading, setQformLoading] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');
  const [delProductKey, setDelProductKey] = useState<string | null>(null);

  const load = useCallback(() => {
    const params: { stage?: string; search?: string } = {};
    if (filterStage) params.stage = filterStage;
    if (search) params.search = search;
    pipelineApi.list(params).then((r) => setOpps(r.data));
    pipelineApi.stats().then((r) => setStats(r.data));
  }, [filterStage, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { productsApi.list().then((r) => setCatalog(r.data)).catch(() => { }); }, []);

  const stageI18n = (s: string) => {
    const camel = s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const tr = t(`pipeline.${camel}`);
    return tr.startsWith('pipeline.') ? s : tr;
  };
  const tOpt = (key: string, fallback: string) => t(key) === key ? fallback : t(key);

  const productName = (p: Product) => p.name?.[i18n.language] || p.name?.en || p.name?.es || p.name?.de || p.key;
  const productLabel = (key: string) => {
    const p = catalog.find((x) => x.key === key);
    return p ? productName(p) : tOpt(`pipeline.productChoices.${key}`, key);
  };
  const activeCatalog = catalog.filter((p) => p.active);
  const prodOptions = activeCatalog.filter((p) => !form.products.includes(p.key));

  const docCount = parseWorkers(form.company_size);
  const nowYear = new Date().getFullYear();
  const quarters = Array.from({ length: 8 }, (_, i) => `T${(i % 4) + 1}/${nowYear + Math.floor(i / 4)}`);
  const arrRows = form.products.map((key) => {
    const p = activeCatalog.find((x) => x.key === key);
    const price = priceFor(p, form.currency);
    return { key, name: p ? productName(p) : productLabel(key), price, m12: docCount * price * 12, m24: docCount * price * 24, m36: docCount * price * 36 };
  });
  const arrTotal = arrRows.reduce((s, r) => s + r.m12, 0);
  const total24 = arrRows.reduce((s, r) => s + r.m24, 0);
  const total36 = arrRows.reduce((s, r) => s + r.m36, 0);

  const openCreate = (stage?: string) => {
    setEditOpp(null);
    setWizardStep(1);
    setForm({ ...EMPTY_FORM, stage: stage || 'registrada', probability: String(STAGE_PROB[stage || 'registrada'] || 10), deal_owner: user?.contact_name || '' });
    setFormError('');
    productsApi.list().then((r) => setCatalog(r.data)).catch(() => { });
    setShowForm(true);
  };

  const openEdit = (opp: Opportunity) => {
    setEditOpp(opp);
    setWizardStep(1);
    setForm({
      company_name: opp.company_name,
      company_size: opp.company_size,
      products: opp.products || [],
      operation_mode: opp.operation_mode,
      stage: opp.stage,
      probability: String(opp.probability),
      amount: String(opp.amount || ''),
      scan_one_time_fee: String(opp.scan_one_time_fee || '0'),
      currency: opp.currency || 'usd',
      customCurrency: opp.custom_currency || '',
      delivery_quarter: opp.delivery_quarter || '',
      close_date: opp.close_date || '',
      deal_owner: opp.deal_owner,
      channel_manager: opp.channel_manager,
      opportunity_type: opp.opportunity_type,
      forecast_category: opp.forecast_category || '',
      lead_source: opp.lead_source,
      next_steps: opp.next_steps,
      loss_reason: opp.loss_reason || '',
      notes: opp.notes,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.company_name.trim()) { setFormError(t('pipeline.companyName') + ' *'); return; }
    if (form.products.length === 0) { setFormError(t('pipeline.products') + ' *'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      const data: any = {
        company_name: form.company_name.trim(),
        company_size: form.company_size,
        products: form.products,
        operation_mode: form.operation_mode,
        stage: form.stage,
        probability: parseInt(form.probability) || STAGE_PROB[form.stage],
        amount: arrTotal || parseFloat(form.amount) || 0,
        scan_one_time_fee: parseFloat(form.scan_one_time_fee) || 0,
        currency: form.currency,
        custom_currency: form.currency === 'otro' ? form.customCurrency.trim() : '',
        delivery_quarter: form.delivery_quarter.trim(),
        close_date: form.close_date || null,
        deal_owner: form.deal_owner,
        channel_manager: form.channel_manager,
        opportunity_type: form.opportunity_type,
        forecast_category: form.forecast_category || null,
        lead_source: form.lead_source,
        next_steps: form.next_steps,
        loss_reason: form.loss_reason,
        notes: form.notes,
      };
      if (editOpp) {
        await pipelineApi.update(editOpp.id, data);
      } else {
        await pipelineApi.create(data);
      }
      setShowForm(false);
      load();
      window.dispatchEvent(new CustomEvent('admin:stats-changed'));
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await pipelineApi.delete(deleteId);
    setDeleteId(null);
    load();
  };

  const moveStage = async (opp: Opportunity, direction: 'left' | 'right') => {
    const idx = STAGES.indexOf(opp.stage as any);
    if (idx < 0) return;
    const newStage = direction === 'right' ? STAGES[Math.min(idx + 1, STAGES.length - 1)] : STAGES[Math.max(idx - 1, 0)];
    if (newStage === opp.stage) return;
    try {
      await pipelineApi.update(opp.id, { stage: newStage, probability: STAGE_PROB[newStage] });
      load();
      window.dispatchEvent(new CustomEvent('admin:stats-changed'));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Error');
    }
  };

  const onDragStart = (e: React.DragEvent, oppId: string) => { setDragId(oppId); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e: React.DragEvent, stage: string) => { e.preventDefault(); setDragOver(stage); };
  const onDragLeave = () => { setDragOver(null); };
  const onDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragId) return;
    const opp = opps.find((o) => o.id === dragId);
    if (!opp || opp.stage === stage) { setDragId(null); return; }
    try {
      await pipelineApi.update(dragId, { stage, probability: STAGE_PROB[stage], next_steps: opp.next_steps });
      setDragId(null);
      load();
      window.dispatchEvent(new CustomEvent('admin:stats-changed'));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Error');
      setDragId(null);
    }
  };

  const openDetail = (opp: Opportunity) => {
    setDetailOpp(opp);
    setEvents([]);
    pipelineApi.events(opp.id).then((r) => setEvents(r.data)).catch(() => {});
  };

  const openEditProduct = (prod: Product) => {
    setQformKey(prod.key);
    setQform({
      name: prod.name?.en || prod.name?.es || prod.name?.de || '',
      description: prod.description?.en || prod.description?.es || prod.description?.de || '',
      priceUsd: prod.price_usd ? String(prod.price_usd) : '',
      priceEur: prod.price_eur ? String(prod.price_eur) : '',
      priceChf: prod.price_chf ? String(prod.price_chf) : '',
      priceOtro: prod.price_otro ? String(prod.price_otro) : '',
      customCurrency: prod.custom_currency || '',
    });
    setQformError('');
  };

  const saveProduct = async () => {
    if (!qform.name.trim()) { setQformError(t('pipeline.manageNameRequired')); return; }
    setQformLoading(true);
    setQformError('');
    try {
      const name = qform.name.trim();
      const payload = {
        name: { en: name, es: name, de: name },
        description: { en: qform.description.trim(), es: qform.description.trim(), de: qform.description.trim() },
        price_usd: parseFloat(qform.priceUsd) || 0,
        price_eur: parseFloat(qform.priceEur) || 0,
        price_chf: parseFloat(qform.priceChf) || 0,
        price_otro: parseFloat(qform.priceOtro) || 0,
        custom_currency: qform.customCurrency.trim(),
        active: true,
        sort_order: 0,
      };
      if (qformKey) {
        await productsApi.update(qformKey, payload);
      } else {
        const baseKey = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'producto';
        let key = baseKey;
        let n = 2;
        while (catalog.some((p) => p.key === key)) { key = `${baseKey}_${n}`; n++; }
        await productsApi.create({ ...payload, key });
      }
      setQformKey(null);
      setQform({ ...EMPTY_QFORM });
      setQuickMsg(t(qformKey ? 'pipeline.quickUpdated' : 'pipeline.quickAdded', { name }));
      productsApi.list().then((r) => setCatalog(r.data)).catch(() => { });
    } catch (err: any) {
      setQformError(err?.response?.data?.detail || t('common.error'));
    } finally {
      setQformLoading(false);
    }
  };

  const deleteProduct = async () => {
    if (!delProductKey) return;
    await productsApi.remove(delProductKey);
    setDelProductKey(null);
    productsApi.list().then((r) => setCatalog(r.data)).catch(() => { });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pipeline.title')}</h1>
          <p className="text-gray-500 mt-1">{t('pipeline.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('board')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'board' ? 'bg-white text-aconso-600 shadow-sm' : 'text-gray-500'}`}>{t('pipeline.board')}</button>
            <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-aconso-600 shadow-sm' : 'text-gray-500'}`}>{t('pipeline.list')}</button>
          </div>
          {isAdmin && <button onClick={() => { setShowQuickAdd(true); setQformKey(null); setQform({ ...EMPTY_QFORM }); setQformError(''); }} className="btn-primary text-sm">➕ {t('pipeline.manageQuickAdd')}</button>}
          {!isAdmin && <button onClick={() => openCreate()} className="btn-primary">{t('pipeline.newOpportunity')}</button>}
        </div>
      </div>

      {quickMsg && <div className="mb-6 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">✅ {quickMsg}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: t('pipeline.totalPipeline'), value: fmt(stats.total_value), color: 'border-aconso-500' },
            { label: t('pipeline.weightedValue'), value: fmt(stats.weighted_value), color: 'border-emerald-500' },
            { label: t('pipeline.avgProbability'), value: `${stats.avg_probability}%`, color: 'border-amber-500' },
            { label: t('pipeline.totalOpportunities'), value: String(stats.total_opportunities), color: 'border-purple-500' },
            { label: t('pipeline.conflicts'), value: String(stats.conflicts || 0), color: 'border-red-400' },
          ].map((m) => (
            <div key={m.label} className={`card border-l-4 ${m.color} p-4`}>
              <div className="text-sm text-gray-500 mb-1">{m.label}</div>
              <div className="text-xl font-bold text-gray-900">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <input type="text" placeholder={t('pipeline.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aconso-500/20 focus:border-aconso-500" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aconso-500">
          <option value="">{t('pipeline.allStages')}</option>
          {STAGES.map((s) => <option key={s} value={s}>{stageI18n(s)}</option>)}
        </select>
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-6 gap-3 min-h-0">
          {STAGES.map((stage) => {
            const stageOpps = opps.filter((o) => o.stage === stage);
            return (
              <div key={stage} className={`bg-gray-50 rounded-xl border-2 border-dashed transition-colors min-w-0 ${dragOver === stage ? 'border-aconso-400 bg-aconso-50' : 'border-gray-200'}`}
                {...(isAdmin ? {} : { onDragOver: (e: React.DragEvent) => onDragOver(e, stage), onDragLeave, onDrop: (e: React.DragEvent) => onDrop(e, stage) })}>
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_COLORS[stage]}`} />
                    <span className="text-xs font-semibold text-gray-700 truncate">{stageI18n(stage)}</span>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded-full shrink-0">{stageOpps.length}</span>
                  </div>
                  {!isAdmin && <button onClick={() => openCreate(stage)} className="text-gray-400 hover:text-aconso-600 transition-colors text-sm shrink-0">+</button>}
                </div>
                <div className="px-2 pb-2 space-y-1.5 min-h-[40px]">
                  {stageOpps.map((opp) => (
                    <div key={opp.id}
                      draggable={!isAdmin}
                      onDragStart={!isAdmin ? (e) => onDragStart(e, opp.id) : undefined}
                      onDragEnd={!isAdmin ? () => setDragId(null) : undefined}
                      onClick={() => isAdmin ? openDetail(opp) : openEdit(opp)}
                      className={`bg-white rounded-lg p-2 border ${isAdmin ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} shadow-sm hover:shadow-md transition-all ${dragId === opp.id ? 'opacity-50 scale-95' : ''} ${opp.conflict ? 'border-red-300 ring-1 ring-red-200' : STAGE_BORDERS[stage]}`}>
                      <div className="flex items-start justify-between mb-0.5">
                        <span className="font-medium text-xs text-gray-900 truncate">{opp.company_name}</span>
                        {isAdmin && <span className="text-[10px] text-gray-400 ml-1 shrink-0">{opp.partner_name}</span>}
                      </div>
                      {opp.products_labels && opp.products_labels.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mb-1">
                          {opp.products_labels.map((p) => <span key={p} className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded">{p}</span>)}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-aconso-600">
                          {fmtMoney(opp.amount, opp.currency, opp.custom_currency)}
                          {opp.scan_one_time_fee > 0 && <span className="text-gray-400 font-medium ml-1">+ {fmtMoney(opp.scan_one_time_fee, opp.currency, opp.custom_currency)} scan</span>}
                        </span>
                        <span className="text-[10px] text-gray-400">{opp.probability}%</span>
                      </div>
                      {opp.conflict && <div className="text-[10px] text-red-500 font-medium mt-0.5">⚠ {t('pipeline.conflict')}</div>}
                      {opp.close_date && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(opp.close_date).toLocaleDateString()} {isOverdue(opp.close_date) && <span className="text-red-500 font-medium">⚠</span>}
                        </div>
                      )}
                      {!isAdmin && <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(opp); }} className="text-[10px] text-gray-400 hover:text-aconso-600 transition-colors">✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(opp.id); }} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">🗑</button>
                      </div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('pipeline.companyName')}</th>
                <th>{t('pipeline.stage')}</th>
                <th>{t('pipeline.amountArr')}</th>
                <th>{t('pipeline.probability')}</th>
                <th>{t('pipeline.closeDate')}</th>
                <th>{t('pipeline.dealOwner')}</th>
                {isAdmin && <th>{t('pipeline.partnerLabel')}</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {opps.map((opp) => (
                <tr key={opp.id} className="hover:bg-aconso-50/50 transition-colors">
                  <td className="font-medium text-gray-900">
                    <span className="flex items-center gap-1.5">{opp.company_name} {opp.conflict && <span title={t('pipeline.conflict')}>⚠️</span>}</span>
                  </td>
                  <td>
                    <span className={`badge text-white ${STAGE_COLORS[opp.stage]}`}>{stageI18n(opp.stage)}</span>
                  </td>
                  <td className="font-medium text-gray-900">{fmtMoney(opp.amount, opp.currency, opp.custom_currency)}</td>
                  <td>{opp.probability}%</td>
                  <td className="text-gray-500">{opp.close_date ? new Date(opp.close_date).toLocaleDateString() : '-'}</td>
                  <td className="text-gray-500 text-sm">{opp.deal_owner || '-'}</td>
                  {isAdmin && <td className="text-gray-500 text-sm">{opp.partner_name}</td>}
                  {isAdmin ? (
                    <td>
                      <button onClick={() => openDetail(opp)} className="text-xs text-aconso-600 hover:text-aconso-800">👁️</button>
                    </td>
                  ) : (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => moveStage(opp, 'left')} className="text-xs text-gray-400 hover:text-aconso-600">◀</button>
                        <button onClick={() => openEdit(opp)} className="text-xs text-gray-400 hover:text-aconso-600">✏️</button>
                        <button onClick={() => moveStage(opp, 'right')} className="text-xs text-gray-400 hover:text-aconso-600">▶</button>
                        <button onClick={() => setDeleteId(opp.id)} className="text-xs text-gray-400 hover:text-red-500">🗑</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {opps.length === 0 && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">📊</div>
                  <p>{t('pipeline.noOpportunities')}</p>
                  <p className="text-sm mt-1">{t('pipeline.noOpportunitiesHint')}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editOpp ? t('pipeline.editOpportunity') : t('pipeline.newOpportunity')}</h2>
            {/* Wizard stepper */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <button type="button" onClick={() => s < wizardStep && setWizardStep(s)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${wizardStep === s ? 'bg-aconso-600 text-white' : wizardStep > s ? 'bg-emerald-500 text-white cursor-pointer' : 'bg-gray-200 text-gray-500'}`}>
                    {wizardStep > s ? '✓' : s}
                  </button>
                  <span className={`text-xs font-medium ${wizardStep >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                    {t(`common.step${s}`)}
                  </span>
                  {s < 3 && <div className={`flex-1 h-0.5 rounded ${wizardStep > s ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {wizardStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('pipeline.companyName')} *</label>
                    <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('pipeline.companySize')} *</label>
                      <input type="text" placeholder={t('pipeline.companySize')} value={form.company_size}
                        onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('pipeline.operationMode')} *</label>
                      <select value={form.operation_mode} onChange={(e) => setForm({ ...form, operation_mode: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                        <option value="cloud">{t('pipeline.modeCloud')}</option>
                        <option value="on_premises">{t('pipeline.modeOnPremises')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('pipeline.leadSource')}</label>
                    <select value={form.lead_source} onChange={(e) => setForm({ ...form, lead_source: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                      <option value="generada_partner">{t('pipeline.lsPartner')}</option>
                      <option value="asignada_aconso">{t('pipeline.lsAconso')}</option>
                      <option value="recomendacion_cliente">{t('pipeline.lsReferral')}</option>
                    </select>
                  </div>
                </>
              )}
              {wizardStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('pipeline.products')} *</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select value={prodPick} onChange={(e) => setProdPick(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none bg-white">
                        <option value="">{t('pipeline.selectProduct')}</option>
                        {prodOptions.map((p) => <option key={p.key} value={p.key}>{productName(p)}</option>)}
                      </select>
                      <button type="button" disabled={!prodPick}
                        onClick={() => { if (prodPick) { setForm({ ...form, products: [...form.products, prodPick] }); setProdPick(''); } }}
                        className="btn-secondary whitespace-nowrap disabled:opacity-40">+ {t('common.add')}</button>
                    </div>
                    {form.products.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.products.map((k) => (
                          <span key={k} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-aconso-50 text-aconso-700 border border-aconso-200">
                            {productLabel(k)}
                            <button type="button" onClick={() => setForm({ ...form, products: form.products.filter((x) => x !== k) })}
                              className="text-aconso-400 hover:text-aconso-700">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

              {/* ARR Calculator */}
              <div className="rounded-xl border-2 border-aconso-100 bg-aconso-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">🧮 {t('pipeline.arrCalcTitle')}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t('pipeline.arrCalcSubtitle')}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 max-w-[180px] text-right">{t('pipeline.arrAutoCalc')}</span>
                </div>
                {arrRows.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">{t('pipeline.products')}</th>
                          <th className="text-right font-medium px-3 py-2">{t('pipeline.pricePerDocMonth')}</th>
                          <th className="text-right font-medium px-3 py-2">{t('pipeline.month12')}</th>
                          <th className="text-right font-medium px-3 py-2">{t('pipeline.month24')}</th>
                          <th className="text-right font-medium px-3 py-2">{t('pipeline.month36')}</th>
                        </tr>
                      </thead>
                      <tbody>
                          {arrRows.map((r) => (
                            <tr key={r.key} className="border-t border-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{fmtMoney(r.price, form.currency, form.customCurrency)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(r.m12)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(r.m24)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(r.m36)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-gray-100 bg-gray-50/60 text-sm">
                        <tr>
                          <td className="px-3 py-2.5 font-bold text-gray-900" colSpan={2}>{t('pipeline.arrTotalLabel')}</td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-aconso-600">{fmtMoney(arrTotal, form.currency, form.customCurrency)}</td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-aconso-600">{fmtMoney(total24, form.currency, form.customCurrency)}</td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-aconso-600">{fmtMoney(total36, form.currency, form.customCurrency)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">+ {t('pipeline.selectProduct')} → {t('pipeline.arrCalcSubtitle')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.amountArr')}</label>
                  <input type="number" value={arrTotal ? String(arrTotal) : form.amount} readOnly
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none bg-gray-50 cursor-not-allowed" />
                  {!arrTotal && <p className="text-[11px] text-gray-400 mt-1">{t('pipeline.arrAutoCalc')}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.oneTimeFee')}</label>
                  <input type="number" value={form.scan_one_time_fee} onChange={(e) => setForm({ ...form, scan_one_time_fee: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.currency')}</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{curOptLabel(c, t)}</option>)}
                  </select>
                </div>
                {form.currency === 'otro' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('pipeline.currencyOtherName')} *</label>
                    <input type="text" value={form.customCurrency} onChange={(e) => setForm({ ...form, customCurrency: e.target.value })}
                      placeholder={t('pipeline.currencyOtherPlaceholder')}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                  </div>
                )}
              </div>
            </>
          )}
          {wizardStep === 3 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.deliveryQuarter')} *</label>
                  <select value={quarters.includes(form.delivery_quarter) || form.delivery_quarter === '' ? form.delivery_quarter : ''}
                    onChange={(e) => setForm({ ...form, delivery_quarter: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                    <option value="">—</option>
                    {quarters.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.stage')}</label>
                  <select value={form.stage} onChange={(e) => {
                    const s = e.target.value;
                    setForm({ ...form, stage: s, probability: String(STAGE_PROB[s] ?? form.probability) });
                  }} className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                    {STAGES.map((s) => <option key={s} value={s}>{stageI18n(s)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.probability')}</label>
                  <input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.closeDate')}</label>
                  <input type="date" value={form.close_date} onChange={(e) => setForm({ ...form, close_date: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.opportunityType')}</label>
                  <select value={form.opportunity_type} onChange={(e) => setForm({ ...form, opportunity_type: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                    {OPPORTUNITY_TYPES.map((o) => <option key={o} value={o}>{t(`pipeline.type${o.charAt(0).toUpperCase() + o.slice(1)}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.forecastCategory')}</label>
                  <select value={form.forecast_category} onChange={(e) => setForm({ ...form, forecast_category: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                    <option value="">—</option>
                    {FORECAST_CATEGORIES.map((f) => <option key={f} value={f}>{t(`pipeline.fc${f.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.dealOwner')}</label>
                  <input type="text" value={form.deal_owner} onChange={(e) => setForm({ ...form, deal_owner: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.channelManager')}</label>
                  <input type="text" value={form.channel_manager} onChange={(e) => setForm({ ...form, channel_manager: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                </div>
              )}
              {form.stage === 'perdida' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.lossReason')} *</label>
                  <select value={form.loss_reason} onChange={(e) => setForm({ ...form, loss_reason: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none">
                    <option value="">—</option>
                    {LOSS_REASONS.map((l) => <option key={l} value={l}>{t(`pipeline.lossReasons.${l}`)}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t('pipeline.nextSteps')}</label>
                <textarea value={form.next_steps} onChange={(e) => setForm({ ...form, next_steps: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none resize-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('pipeline.notes')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-aconso-500 focus:outline-none resize-none" rows={3} />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </>
          )}
            </div>
            <div className="flex gap-3 mt-6">
              {wizardStep > 1 && (
                <button onClick={() => setWizardStep(wizardStep - 1)} className="flex-1 btn-secondary" disabled={formLoading}>{t('common.back')}</button>
              )}
              {wizardStep < 3 ? (
                <button onClick={() => {
                  if (wizardStep === 1) {
                    if (!form.company_name.trim()) { setFormError(t('pipeline.companyName') + ' *'); return; }
                    if (!form.company_size.trim()) { setFormError(t('pipeline.companySize') + ' *'); return; }
                  }
                  if (wizardStep === 2 && form.products.length === 0) { setFormError(t('pipeline.products') + ' *'); return; }
                  setFormError('');
                  setWizardStep(wizardStep + 1);
                }} className="flex-1 btn-primary">{t('common.next')}</button>
              ) : (
                <button onClick={handleSave} className="flex-1 btn-primary" disabled={formLoading}>{formLoading ? '...' : t('common.save')}</button>
              )}
              <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary" disabled={formLoading}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t('pipeline.deleteOpportunity')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('pipeline.deleteConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary">{t('common.cancel')}</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-semibold hover:bg-red-600 transition">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {detailOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailOpp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{detailOpp.company_name}</h2>
                <p className="text-sm text-gray-400">{detailOpp.name}</p>
              </div>
              <button onClick={() => setDetailOpp(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.stage')}</div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[detailOpp.stage]}`} />
                  <span className="font-semibold text-gray-900">{stageI18n(detailOpp.stage)}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.amountArr')}</div>
                <div className="font-semibold text-gray-900">{fmtMoney(detailOpp.amount, detailOpp.currency, detailOpp.custom_currency)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.oneTimeFee')}</div>
                <div className="font-semibold text-gray-900">{fmtMoney(detailOpp.scan_one_time_fee || 0, detailOpp.currency, detailOpp.custom_currency)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-aconso-500">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.totalValue')}</div>
                <div className="font-bold text-aconso-600">{fmtMoney((detailOpp.amount || 0) + (detailOpp.scan_one_time_fee || 0), detailOpp.currency, detailOpp.custom_currency)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.probability')}</div>
                <div className={`font-semibold ${detailOpp.stage === 'perdida' ? 'text-red-500' : 'text-gray-900'}`}>{detailOpp.probability}%</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.companySize')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.company_size_label}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.products')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.products_labels?.join(', ') || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.operationMode')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.operation_mode === 'cloud' ? t('pipeline.modeCloud') : t('pipeline.modeOnPremises')}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.deliveryQuarter')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.delivery_quarter || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.closeDate')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.close_date ? new Date(detailOpp.close_date).toLocaleDateString() : '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.forecastCategory')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.forecast_category ? tOpt(`pipeline.fc${detailOpp.forecast_category.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`, detailOpp.forecast_category) : '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.opportunityType')}</div>
                <div className="font-semibold text-gray-900 text-sm">{t(`pipeline.type${detailOpp.opportunity_type?.charAt(0).toUpperCase()}${detailOpp.opportunity_type?.slice(1)}`)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.dealOwner')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.deal_owner || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.channelManager')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.channel_manager || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.leadSource')}</div>
                <div className="font-semibold text-gray-900 text-sm">{t(`pipeline.ls${detailOpp.lead_source === 'generada_partner' ? 'Partner' : detailOpp.lead_source === 'asignada_aconso' ? 'Aconso' : 'Referral'}`)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.protectionEnd')}</div>
                <div className="font-semibold text-gray-900 text-sm">{detailOpp.protection_end_date ? `${new Date(detailOpp.protection_end_date).toLocaleDateString()}${detailOpp.protection_days_left != null && detailOpp.protection_days_left > 0 ? ` (${detailOpp.protection_days_left}d)` : ''}` : '-'}</div>
              </div>
              {detailOpp.partner_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.partnerLabel')}</div>
                  <div className="font-semibold text-gray-900 text-sm">{detailOpp.partner_name}</div>
                </div>
              )}
            </div>
            {detailOpp.conflict && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">⚠ {t('pipeline.conflict')}</div>
            )}
            {detailOpp.loss_reason && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50 text-gray-700 text-sm">{t('pipeline.lossReason')}: {t(`pipeline.lossReasons.${detailOpp.loss_reason}`)}</div>
            )}
            {detailOpp.next_steps && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.nextSteps')}</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{detailOpp.next_steps}</div>
              </div>
            )}
            {detailOpp.notes && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('pipeline.notes')}</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{detailOpp.notes}</div>
              </div>
            )}
            {events.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">{t('pipeline.events')}</div>
                <div className="space-y-1">
                  {events.map((ev, i) => (
                    <div key={i} className="text-xs text-gray-600">
                      <span className={`font-medium ${ev.from_stage ? 'text-gray-500' : 'text-aconso-600'}`}>{ev.from_stage ? stageI18n(ev.from_stage) : '—'}</span>
                      <span className="mx-1.5 text-gray-300">→</span>
                      <span className={`font-medium ${ev.to_stage === 'perdida' ? 'text-red-500' : ev.to_stage === 'ganada' ? 'text-emerald-600' : 'text-aconso-600'}`}>{stageI18n(ev.to_stage)}</span>
                      <span className="ml-2 text-gray-400">{new Date(ev.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setDetailOpp(null)} className="w-full mt-2 btn-secondary">{t('common.back')}</button>
          </div>
        </div>
      )}

      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowQuickAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">➕ {qformKey ? t('pipeline.manageEdit') : t('pipeline.manageQuickAdd')}</h2>
            <p className="text-gray-500 text-sm mb-5">{t('pipeline.manageQuickAddHelp')}</p>
            <div className="rounded-xl border border-gray-200 p-4 mb-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.manageName')} *</label>
                  <input type="text" autoFocus value={qform.name} onChange={(e) => setQform({ ...qform, name: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.managePrice')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">USD</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input type="number" step="0.01" min="0" placeholder="0" value={qform.priceUsd} onChange={(e) => setQform({ ...qform, priceUsd: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">EUR</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        <input type="number" step="0.01" min="0" placeholder="0" value={qform.priceEur} onChange={(e) => setQform({ ...qform, priceEur: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">{t('pipeline.curChf')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">CHF</span>
                        <input type="number" step="0.01" min="0" placeholder="0" value={qform.priceChf} onChange={(e) => setQform({ ...qform, priceChf: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">{t('pipeline.curOtro')}</label>
                      <input type="text" value={qform.customCurrency} onChange={(e) => setQform({ ...qform, customCurrency: e.target.value })}
                        placeholder={t('pipeline.currencyOtherName')}
                        className="w-full border-2 border-gray-200 rounded-lg px-2.5 py-1 mb-1.5 text-xs focus:border-aconso-500 focus:outline-none" />
                      <input type="number" step="0.01" min="0" placeholder="0" value={qform.priceOtro} onChange={(e) => setQform({ ...qform, priceOtro: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-aconso-500 focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('pipeline.manageDescription')}</label>
                  <textarea rows={3} value={qform.description} onChange={(e) => setQform({ ...qform, description: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-aconso-500 focus:outline-none resize-none" />
                </div>
              </div>
              {qformError && <p className="text-sm text-red-500 mt-3">{qformError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setQformKey(null); setQform({ ...EMPTY_QFORM }); setQformError(''); }} className="btn-secondary text-sm">↺ {t('pipeline.manageNew')}</button>
                <button onClick={saveProduct} disabled={qformLoading} className="btn-primary text-sm disabled:opacity-60">{qformLoading ? '...' : t('common.save')}</button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900 mb-1">{t('pipeline.manageExisting')}</div>
              {catalog.length === 0 ? (
                <p className="text-gray-400 text-sm">{t('pipeline.manageNoProducts')}</p>
              ) : catalog.map((p) => (
                <div key={p.key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.active !== false ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{productName(p)}</span>
                    {productPricesLabel(p) && <span className="text-xs font-semibold text-aconso-600 ml-2">{productPricesLabel(p)}</span>}
                  </span>
                  <button onClick={() => openEditProduct(p)} className="text-xs text-gray-400 hover:text-aconso-600">✏️</button>
                  <button onClick={() => setDelProductKey(p.key)} className="text-xs text-gray-400 hover:text-red-500">🗑</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowQuickAdd(false)} className="w-full mt-5 btn-secondary">{t('common.close')}</button>
          </div>
        </div>
      )}

      {delProductKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDelProductKey(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-4">🗑</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t('pipeline.manageDeleteTitle')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('pipeline.manageDeleteConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDelProductKey(null)} className="flex-1 btn-secondary">{t('common.cancel')}</button>
              <button onClick={deleteProduct} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-semibold hover:bg-red-600 transition">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
