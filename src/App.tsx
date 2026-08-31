import { useMemo } from 'react';
import { BandSyncProvider } from './store';
import { AuthProvider } from './lib/auth';
import { DataProvider } from './lib/data';
import type { AppProps, Lang, Role, View } from './types';
import { Shell } from './components/shell/Shell';

const VIEWS: View[] = ['dashboard', 'calendar', 'repertoire', 'ledger', 'brainstorm', 'members', 'system'];

/**
 * Prototype knobs (the design's "tweaks"). Override via URL query, e.g.
 *   ?lang=en&role=member&view=ledger&tour=1&stale=45&band=Mi%20Grupo
 */
function readProps(): AppProps {
  const q = new URLSearchParams(window.location.search);
  const lang = q.get('lang');
  const role = q.get('role');
  const view = q.get('view');
  const stale = Number(q.get('stale'));
  return {
    bandName: q.get('band') || 'Dulce Tricolor Venezolano',
    initialLang: (lang === 'en' ? 'en' : 'es') as Lang,
    initialRole: (role === 'member' ? 'member' : 'admin') as Role,
    startView: VIEWS.includes(view as View) ? (view as View) : 'dashboard',
    showTour: q.get('tour') === '1',
    staleDays: Number.isFinite(stale) && stale >= 14 && stale <= 120 ? stale : 30,
  };
}

export default function App() {
  const props = useMemo(readProps, []);
  return (
    <AuthProvider>
      <DataProvider>
        <BandSyncProvider props={props}>
          <Shell />
        </BandSyncProvider>
      </DataProvider>
    </AuthProvider>
  );
}
