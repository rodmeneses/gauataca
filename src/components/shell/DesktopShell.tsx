import { useGuataca } from '../../store';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from '../views/Dashboard';
import { CalendarView } from '../views/CalendarView';
import { Repertoire } from '../views/Repertoire';
import { Ledger } from '../views/Ledger';
import { Brainstorm } from '../views/Brainstorm';
import { Members } from '../views/Members';
import { DesignSystem } from '../views/DesignSystem';

/** 252px sticky sidebar + sticky header + padded main (design lines 37–139, 748–751). */
export function DesktopShell() {
  const { view } = useGuataca();
  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '252px minmax(0,1fr)' }}>
      <Sidebar />
      <div className="flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 min-w-0 pt-6 px-7 pb-[72px]">
          {view === 'dashboard' && <Dashboard />}
          {view === 'calendar' && <CalendarView />}
          {view === 'repertoire' && <Repertoire />}
          {view === 'ledger' && <Ledger />}
          {view === 'brainstorm' && <Brainstorm />}
          {view === 'members' && <Members />}
          {view === 'system' && <DesignSystem />}
        </main>
      </div>
    </div>
  );
}
