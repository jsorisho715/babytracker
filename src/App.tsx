import { useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import BottomNav from './components/BottomNav';
import PlayerToggle from './components/PlayerToggle';
import ToastContainer from './components/ToastContainer';
import PullToRefresh from './components/PullToRefresh';
import PinGate from './components/PinGate';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Shopping from './pages/Shopping';
import Goals from './pages/Goals';
import Assigned from './pages/Assigned';
import Contractions from './pages/Contractions';
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
  const absDiffMs = Math.abs(diffMs);
  const totalHours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  let text: string;
  if (diffMs > 0) {
    text = `${days}d ${hours}h until ${settings.babyName} arrives! 🍼`;
  } else if (absDiffMs < 24 * 60 * 60 * 1000) {
    text = `Today's the day! ${settings.babyName} is coming! 🎉`;
  } else {
    text = `${days}d ${hours}h since ${settings.babyName}'s due date`;
  }

  return (
    <div className="bg-gradient-to-r from-sage-100 to-rose-50 border-b border-cream-200 py-2 px-4">
      <p className="text-center text-sm font-display font-700 text-gray-800 truncate">
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
    contractions: 'Contractions',
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
              className="w-10 h-10 rounded-xl bg-cream-200 text-warm-gray hover:bg-cream-300 flex items-center justify-center"
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
  const { activeTab, isLoaded, loadSeedData, updateSettingsFromSync, confettiTrigger } = useStore();

  // Debounced reload — batches rapid subscription events into a single fetch
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      loadSeedData(true);
    }, 500);
  }, [loadSeedData]);

  useEffect(() => {
    if (confettiTrigger === 0) return;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }, [confettiTrigger]);

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

  // Set up real-time listeners for Supabase (debounced to batch rapid changes)
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    const subscription = supabase
      .channel('public:sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, debouncedReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, debouncedReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, debouncedReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_scores' }, debouncedReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_completions' }, debouncedReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'badges' }, debouncedReload)
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
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      subscription.unsubscribe();
    };
  }, [debouncedReload, updateSettingsFromSync]);

  const handleRefresh = () => loadSeedData(true);

  const mainContent = (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-28">
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'tasks' && <Tasks />}
      {activeTab === 'shopping' && <Shopping />}
      {activeTab === 'goals' && <Goals />}
      {activeTab === 'assigned' && <Assigned />}
      {activeTab === 'contractions' && <Contractions />}
    </main>
  );

  return (
    <PinGate>
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
    </PinGate>
  );
}
