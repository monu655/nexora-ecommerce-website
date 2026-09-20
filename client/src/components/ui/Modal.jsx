import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`w-full ${width} animate-slide-in rounded-2xl bg-white p-5 shadow-panel sm:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em]">{title}</h2>
            {description && <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Destructive actions always route through this rather than window.confirm. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', loading, tone = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Keep it</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      } />
  );
}
