import './index.css';
import { useCallback, useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { WheelScreen } from './pages/WheelScreen';
import { Dashboard } from './pages/Dashboard';
import { PresentationMode } from './pages/PresentationMode';
import { FinalOrderScreen } from './pages/FinalOrderScreen';
import { Nav } from './components/Nav';
import { useRoster } from './hooks/useRoster';
import { useSettings } from './hooks/useSettings';
import { initAudio } from './utils/sound';

function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

const KNOWN_ROUTES = new Set([
  '#/', '#/contestants', '#/judges', '#/control', '#/present',
  '#/contestants/order', '#/judges/order',
]);

function App() {
  const route = useHashRoute();
  const { settings, updateSettings } = useSettings();

  const contestants = useRoster({ kind: 'contestant' });
  const judges = useRoster({ kind: 'judge' });

  // isComplete: 0 unselected AND history length >= 1
  const contestantComplete = contestants.people.filter(p => !p.selected).length === 0 && contestants.history.length >= 1;
  const judgeComplete = judges.people.filter(p => !p.selected).length === 0 && judges.history.length >= 1;

  const handleToggleSound = useCallback(() => {
    initAudio();
    updateSettings({ soundOn: !settings.soundOn });
  }, [settings.soundOn, updateSettings]);

  const handleResetEntireEvent = useCallback(() => {
    contestants.resetAll();
    judges.resetAll();
  }, [contestants, judges]);

  // Fullscreen keyboard shortcut globally
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'f' || e.key === 'F') && route !== '#/present') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [route]);

  // Presentation mode: full-screen override, no nav
  if (route === '#/present') {
    return (
      <PresentationMode
        contestantPeople={contestants.people}
        contestantHistory={contestants.history}
        contestantPending={contestants.pendingRevealId}
        contestantComplete={contestantComplete}
        judgePeople={judges.people}
        judgeHistory={judges.history}
        judgePending={judges.pendingRevealId}
        judgeComplete={judgeComplete}
        settings={settings}
        onToggleSound={handleToggleSound}
        onSelectContestant={contestants.selectPerson}
        onClearContestantPending={contestants.clearPendingReveal}
        onSelectJudge={judges.selectPerson}
        onClearJudgePending={judges.clearPendingReveal}
      />
    );
  }

  // Order screen routes — redirect if roster not complete
  if (route === '#/contestants/order') {
    if (!contestantComplete) {
      window.location.hash = '#/contestants';
      return null;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Nav currentRoute={route} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <FinalOrderScreen
            kind="contestant"
            history={contestants.history}
            settings={settings}
          />
        </main>
      </div>
    );
  }

  if (route === '#/judges/order') {
    if (!judgeComplete) {
      window.location.hash = '#/judges';
      return null;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Nav currentRoute={route} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <FinalOrderScreen
            kind="judge"
            history={judges.history}
            settings={settings}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Nav currentRoute={route} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {route === '#/' && <Home settings={settings} />}

        {route === '#/contestants' && (
          <WheelScreen
            kind="contestant"
            people={contestants.people}
            history={contestants.history}
            pendingRevealId={contestants.pendingRevealId}
            settings={settings}
            onToggleSound={handleToggleSound}
            onSelectPerson={contestants.selectPerson}
            onClearPendingReveal={contestants.clearPendingReveal}
            onFinalContinue={() => { window.location.hash = '#/contestants/order'; }}
          />
        )}

        {route === '#/judges' && (
          <WheelScreen
            kind="judge"
            people={judges.people}
            history={judges.history}
            pendingRevealId={judges.pendingRevealId}
            settings={settings}
            onToggleSound={handleToggleSound}
            onSelectPerson={judges.selectPerson}
            onClearPendingReveal={judges.clearPendingReveal}
            onFinalContinue={() => { window.location.hash = '#/judges/order'; }}
          />
        )}

        {route === '#/control' && (
          <Dashboard
            contestantPeople={contestants.people}
            contestantHistory={contestants.history}
            judgePeople={judges.people}
            judgeHistory={judges.history}
            settings={settings}
            onAddContestant={contestants.addPerson}
            onEditContestant={contestants.editPerson}
            onRemoveContestant={contestants.removePerson}
            onUndoContestant={contestants.undoLastSelection}
            onResetContestants={contestants.resetAll}
            onAddJudge={judges.addPerson}
            onEditJudge={judges.editPerson}
            onRemoveJudge={judges.removePerson}
            onUndoJudge={judges.undoLastSelection}
            onResetJudges={judges.resetAll}
            onResetEntireEvent={handleResetEntireEvent}
            onUpdateSettings={updateSettings}
          />
        )}

        {/* Fallback */}
        {!KNOWN_ROUTES.has(route) && <Home settings={settings} />}
      </main>
    </div>
  );
}

export default App;
