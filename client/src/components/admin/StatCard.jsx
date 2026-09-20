import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function StatCard({ label, value, change, footnote, icon: Icon, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-4 h-8 w-32" />
        <div className="skeleton mt-3 h-3 w-20" />
      </div>
    );
  }

  const positive = change >= 0;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sunken">
            <Icon className="h-4 w-4 text-ink-soft" aria-hidden />
          </span>
        )}
      </div>
      <p className="tnum mt-3 font-display text-[28px] font-semibold leading-none tracking-[-0.03em]">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-[13px]">
        {change != null && (
          <span className={cn('tnum inline-flex items-center gap-0.5 font-medium',
            positive ? 'text-positive-500' : 'text-critical-500')}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(change)}%
          </span>
        )}
        {footnote && <span className="text-ink-muted">{footnote}</span>}
      </div>
    </div>
  );
}
