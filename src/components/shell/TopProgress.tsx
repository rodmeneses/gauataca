/**
 * Thin indeterminate bar pinned to the very top of the viewport while a write +
 * its silent refetch are in flight. Replaces the old full-screen spinner flash
 * that every mutation used to trigger. Shows only after a short delay so quick
 * writes don't flicker it.
 */
import { useEffect, useState } from 'react';
import { useGuataca } from '../../store';

export function TopProgress() {
  const { mutating } = useGuataca();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!mutating) { setShow(false); return; }
    const id = window.setTimeout(() => setShow(true), 120);
    return () => window.clearTimeout(id);
  }, [mutating]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[120] h-[2px] overflow-hidden pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      role="progressbar"
      aria-label="Saving"
    >
      <div className="h-full w-full origin-left bg-emerald animate-progress" />
    </div>
  );
}
