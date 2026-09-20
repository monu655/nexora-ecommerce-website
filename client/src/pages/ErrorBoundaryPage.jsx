import { useRouteError, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

/**
 * Last line of defence. Whatever broke, the customer sees a sentence they can
 * act on — the technical detail goes to the console for us.
 */
export function ErrorBoundaryPage() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="font-display text-title">This page ran into a problem</h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">
        Reloading usually clears it. If it keeps happening, our team can help at support@nexora.store.
      </p>
      <div className="mt-7 flex gap-3">
        <Button onClick={() => window.location.reload()}>Reload the page</Button>
        <Link to="/"><Button variant="secondary">Back to home</Button></Link>
      </div>
    </div>
  );
}
