import { cn } from '@/lib/cn';

const tones = {
  neutral: 'bg-surface-sunken text-ink-soft border-line',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  positive: 'bg-positive-50 text-positive-700 border-positive-500/20',
  caution: 'bg-caution-50 text-caution-500 border-caution-500/20',
  critical: 'bg-critical-50 text-critical-500 border-critical-500/20',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

const statusTone = {
  pending: 'caution', confirmed: 'brand', packed: 'brand',
  shipped: 'brand', delivered: 'positive', cancelled: 'critical',
  paid: 'positive', refunded: 'neutral', failed: 'critical',
};

export function StatusBadge({ status }) {
  const label = String(status).charAt(0).toUpperCase() + String(status).slice(1);
  return (
    <Badge tone={statusTone[status] || 'neutral'}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </Badge>
  );
}
