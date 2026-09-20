import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const config = {
  success: { Icon: CheckCircle2, ring: 'text-positive-500' },
  error: { Icon: AlertCircle, ring: 'text-critical-500' },
  info: { Icon: Info, ring: 'text-brand-600' },
};

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:items-end"
      role="region" aria-live="polite">
      {toasts.map(({ id, variant = 'info', title, message }) => {
        const { Icon, ring } = config[variant] ?? config.info;
        return (
          <div key={id}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-lift">
            <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', ring)} aria-hidden />
            <div className="min-w-0 flex-1">
              {title && <p className="text-[14px] font-semibold">{title}</p>}
              <p className="text-[14px] leading-snug text-ink-soft">{message}</p>
            </div>
            <button onClick={() => dismiss(id)} aria-label="Dismiss" className="rounded p-0.5 text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
