export const STAGES = [
  'registrada', 'cualificada', 'propuesta_enviada', 'negociacion', 'ganada', 'perdida',
] as const;

export const STAGE_PROB: Record<string, number> = {
  registrada: 10, cualificada: 30, propuesta_enviada: 55,
  negociacion: 75, ganada: 100, perdida: 0,
};

export const STAGE_COLORS: Record<string, string> = {
  registrada: 'bg-blue-500', cualificada: 'bg-indigo-500',
  propuesta_enviada: 'bg-purple-500', negociacion: 'bg-orange-500',
  ganada: 'bg-emerald-500', perdida: 'bg-red-400',
};

export const STAGE_BORDERS: Record<string, string> = {
  registrada: 'border-blue-200', cualificada: 'border-indigo-200',
  propuesta_enviada: 'border-purple-200', negociacion: 'border-orange-200',
  ganada: 'border-emerald-200', perdida: 'border-red-200',
};

export const STAGE_BADGE_TEXT: Record<string, string> = {
  registrada: 'text-blue-600', cualificada: 'text-indigo-600',
  propuesta_enviada: 'text-purple-600', negociacion: 'text-orange-600',
  ganada: 'text-emerald-600', perdida: 'text-red-500',
};

export const COMPANY_SIZES = ['<250', '250-1000', '1000-5000', '>5000'] as const;
export const PRODUCTS = ['dpa', 'hr_doc_box', 'scan_services', 'insights'] as const;
export const OPPORTUNITY_TYPES = ['nuevo', 'ampliacion', 'cross_sell'] as const;
export const FORECAST_CATEGORIES = ['commit', 'best_case', 'pipeline', 'omitted'] as const;
export const LEAD_SOURCES = ['generada_partner', 'asignada_aconso', 'recomendacion_cliente'] as const;
export const LOSS_REASONS = ['precio', 'competencia', 'sin_presupuesto', 'proyecto_aplazado', 'otro'] as const;
export const CURRENCIES = ['usd', 'eur', 'chf', 'otro'] as const;

export function currencySymbol(cur: string, custom = ''): string {
  if (cur === 'eur') return '€';
  if (cur === 'chf') return 'CHF';
  if (cur === 'otro') return (custom || '').toUpperCase().slice(0, 5) || '$';
  return '$';
}

export function fmtMoney(n: number, cur = 'usd', custom = ''): string {
  const num = Number(n) || 0;
  const s = currencySymbol(cur, custom);
  const str = num.toLocaleString('en-US', { maximumFractionDigits: num % 1 ? 2 : 0 });
  return cur === 'eur' ? `${str} ${s}` : `${s} ${str}`;
}

export const TRACKS: Record<string, { en: string; es: string; de: string }> = {
  ventas: { en: 'Sales', es: 'Ventas', de: 'Vertrieb' },
  tecnica: { en: 'Technical', es: 'Técnica', de: 'Technik' },
  cumplimiento: { en: 'Compliance', es: 'Cumplimiento', de: 'Compliance' },
  todas: { en: 'All', es: 'Todos', de: 'Alle' },
};

export const CERT_LEVELS: Record<string, { en: string; es: string; de: string }> = {
  associate: { en: 'Associate', es: 'Asociado', de: 'Associate' },
  professional: { en: 'Professional', es: 'Profesional', de: 'Professional' },
  expert: { en: 'Expert', es: 'Experto', de: 'Experte' },
};

export const CERT_STATUS_COLORS: Record<string, string> = {
  valid: 'bg-emerald-100 text-emerald-700',
  pending_update: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
};
