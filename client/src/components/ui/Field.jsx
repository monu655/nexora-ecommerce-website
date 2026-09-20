import { cn } from '@/lib/cn';

export function Field({ label, error, hint, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-critical-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] text-critical-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ error, className, ...props }) {
  return <input className={cn('field', error && 'field-error', className)} {...props} />;
}

export function Textarea({ error, className, ...props }) {
  return <textarea className={cn('field min-h-[110px] resize-y', error && 'field-error', className)} {...props} />;
}

export function Select({ error, className, children, ...props }) {
  return (
    <select className={cn('field cursor-pointer appearance-none bg-[right_0.75rem_center] bg-no-repeat pr-9', error && 'field-error', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236B7280' stroke-width='1.8'><path d='M4 6l4 4 4-4'/></svg>\")" }}
      {...props}>
      {children}
    </select>
  );
}
