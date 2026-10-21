/**
 * Full-screen placeholder shown while the first data load runs. It mirrors the layout of the
 * screen the user is about to see (dashboard stats, song rows, ledger balance, …) so the page
 * doesn't jump when the real content lands.
 */
import type { MobileTab, View } from '../../types';
import { Skeleton } from '../ui';

type Shape = 'dashboard' | 'list' | 'songs' | 'ledger' | 'cards';

const SHAPE_BY_VIEW: Partial<Record<View, Shape>> = {
  dashboard: 'dashboard', calendar: 'list', repertoire: 'songs', ledger: 'ledger', brainstorm: 'cards', links: 'cards', members: 'cards',
};
const SHAPE_BY_TAB: Record<MobileTab, Shape> = {
  agenda: 'list', repertoire: 'songs', fund: 'ledger', brainstorm: 'cards', links: 'cards', profile: 'cards',
};

const rows = (n: number) => Array.from({ length: n }, (_, i) => i);

function Rows({ n, h = 'h-16' }: { n: number; h?: string }) {
  return <>{rows(n).map((i) => <Skeleton key={i} className={h} />)}</>;
}

function Body({ shape }: { shape: Shape }) {
  switch (shape) {
    case 'dashboard':
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Rows n={4} h="h-24" /></div>
          <Skeleton className="h-40" />
          <Rows n={3} h="h-20" />
        </>
      );
    case 'songs':
      return (
        <>
          <Skeleton className="h-11" />
          <div className="flex gap-2 overflow-hidden">{rows(5).map((i) => <Skeleton key={i} className="h-8 w-20 flex-none rounded-full" />)}</div>
          <Rows n={7} h="h-14" />
        </>
      );
    case 'ledger':
      return (
        <>
          <Skeleton className="h-28" />
          <div className="grid grid-cols-2 gap-3"><Rows n={2} h="h-16" /></div>
          <Rows n={6} h="h-14" />
        </>
      );
    case 'cards':
      return <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Rows n={6} h="h-28" /></div>;
    case 'list':
      return <Rows n={5} h="h-24" />;
  }
}

export function LoadingSkeleton({ view, mobileTab, phone }: { view: View; mobileTab: MobileTab; phone: boolean }) {
  const shape = (phone ? SHAPE_BY_TAB[mobileTab] : SHAPE_BY_VIEW[view]) ?? 'dashboard';
  return (
    <div role="status" aria-busy="true" aria-label="…" className="min-h-screen bg-base flex">
      <Skeleton className="hidden md:block w-[232px] flex-none rounded-none" />
      <div className="flex-1 min-w-0 p-5 md:p-8 flex flex-col gap-4 max-w-[1100px]">
        <Skeleton className="h-8 w-48" />
        <Body shape={shape} />
      </div>
      {phone && <Skeleton className="fixed bottom-0 inset-x-0 h-16 rounded-none" />}
    </div>
  );
}
