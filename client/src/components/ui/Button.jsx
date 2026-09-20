import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const variants = {
  primary: 'bg-ink text-white hover:bg-[#232936] active:bg-ink disabled:bg-ink/40',
  brand: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/40',
  secondary: 'bg-white text-ink border border-line-strong hover:bg-surface-sunken disabled:text-ink-muted',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-critical-500 text-white hover:bg-[#A62F23] disabled:bg-critical-500/40',
  link: 'text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline px-0',
};

const sizes = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
  icon: 'h-10 w-10',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed', variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
