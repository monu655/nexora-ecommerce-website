import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Rating({ value = 0, count, size = 14, className, showValue = true }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} width={size} height={size} aria-hidden
            className={i <= Math.round(value) ? 'fill-caution-500 text-caution-500' : 'fill-line text-line'} />
        ))}
      </div>
      {showValue && <span className="tnum text-[13px] font-medium text-ink-soft">{value.toFixed(1)}</span>}
      {count != null && <span className="tnum text-[13px] text-ink-muted">({count})</span>}
    </div>
  );
}
