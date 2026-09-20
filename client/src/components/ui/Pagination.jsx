import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, totalPages, onChange, total }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5" aria-label="Pagination">
      {total != null && <p className="tnum text-[13px] text-ink-muted">{total} results</p>}
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && p - pages[i - 1] > 1 && <span className="px-1.5 text-ink-muted">…</span>}
            <button onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}
              className={`tnum h-9 min-w-9 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
                p === page ? 'bg-ink text-white' : 'text-ink-soft hover:bg-surface-sunken'}`}>
              {p}
            </button>
          </span>
        ))}
        <Button variant="secondary" size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
