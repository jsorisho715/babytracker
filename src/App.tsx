import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import BottomNav from './components/BottomNav';
import PlayerToggle from './components/PlayerToggle';
import ToastContainer from './components/ToastContainer';
import PullToRefresh from './components/PullToRefresh';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Shopping from './pages/Shopping';
import Goals from './pages/Goals';
import Assigned from './pages/Assigned';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import SettingsModal from './components/SettingsModal';

const SUPABASE_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

function CountdownBanner() {
  const { settings } = useStore();
  const dueDate = settings.dueDate;
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate + 'T00:00:00');
  const diffMs = due.getTime() - now.getTime();

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  let text: string;
  if (diffMs > 0) {
    text = `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''} until ${settings.babyName} arrives!`;
  } else if (diffMs > -24 * 60 * 60 * 1000) {
    text = `Today's the day! ${settings.babyName} is coming!`;
  } else {
    const agoTotalHours = Math.abs(totalHours);
    const agoDays = Math.floor(agoTotalHours / 24);
    const agoHours = agoTotalHours % 24;
    text = `${agoDays} day${agoDays !== 1 ? 's' : ''}, ${agoHours} hour${agoHours !== 1 ? 's' : ''} past due`;
  }

  return (
    <div className="bg-gradient-to-r from-sage-100 to-rose-50 border-b border-cream-200 py-2 px-4">
      <p className="text-center text-sm font-display font-700 text-gray-800">
        {text}
      </p>
    </div>
  );
}

function Header() {
  const { activeTab, settings } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  const titles: Record<string, string> = {
    dashboard: `Team ${settings.babyName} 🍼`,
    tasks: 'Checklist',
    shopping: 'Shopping',
    goals: 'Goals & Ideas',
    assigned: 'Assigned Tasks',
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-cream-200 pt-safe">
        <CountdownBanner />
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="font-display font-800 text-gray-800 text-lg">{titles[activeTab]}</h1>
          <div className="flex items-center gap-2">
            <PlayerToggle />
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-xl bg-cream-200 text-warm-gray hover:bg-cream-300 flex items-center justify-center"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default function App() {
  const { activeTab, isLoaded, loadSeedData, updateSettingsFromSync } = useStore();

  useEffect(() => {
    loadSeedData();
  }, [isLoaded, loadSeedData]);

  // Refresh from Supabase when app becomes visible (e.g. user switches back to tab)
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSeedData(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loadSeedData]);

  // Set up real-time listeners for Supabase
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    const subscription = supabase
      .channel('public:sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadSeedData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => loadSeedData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => loadSeedData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_scores' }, () => loadSeedData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: { new?: { baby_name?: string; due_date?: string | null; pregnancy_week?: number | null } }) => {
        const row = payload.new;
        if (row) {
          updateSettingsFromSync({
            babyName: row.baby_name ?? 'Luca',
            dueDate: row.due_date ?? undefined,
            pregnancyWeek: row.pregnancy_week ?? undefined,
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSeedData, updateSettingsFromSync]);

  const handleRefresh = () => loadSeedData(true);

  const mainContent = (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-28">
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'tasks' && <Tasks />}
      {activeTab === 'shopping' && <Shopping />}
      {activeTab === 'goals' && <Goals />}
      {activeTab === 'assigned' && <Assigned />}
    </main>
  );

  return (
    <div className="flex flex-col bg-cream-100 h-screen max-h-dvh overflow-hidden">
      <div className="flex-shrink-0">
        <Header />
      </div>
      {SUPABASE_ENABLED ? (
        <PullToRefresh onRefresh={handleRefresh}>{mainContent}</PullToRefresh>
      ) : (
        <div className="flex-1 overflow-y-auto">{mainContent}</div>
      )}
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
