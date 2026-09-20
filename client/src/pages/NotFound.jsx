import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="tnum font-display text-[64px] font-semibold leading-none tracking-[-0.05em] text-line-strong">404</p>
      <h1 className="mt-4 font-display text-title">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-soft">
        The link may be out of date, or the product may have been retired from the catalogue.
      </p>
      <div className="mt-7 flex gap-3">
        <Button onClick={() => window.history.back()} variant="secondary">Go back</Button>
        <Link to="/products"><Button>Browse products</Button></Link>
      </div>
    </div>
  );
}
