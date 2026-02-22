import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import BottomNav from './components/BottomNav';
import PlayerToggle from './components/PlayerToggle';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Shopping from './pages/Shopping';
import Goals from './pages/Goals';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import SettingsModal from './components/SettingsModal';

const SUPABASE_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

function Header() {
  const { activeTab, settings } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  const titles: Record<string, string> = {
    dashboard: `Team ${settings.babyName} 🍼`,
    tasks: 'Checklist',
    shopping: 'Shopping',
    goals: 'Goals & Ideas',
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-cream-200 pt-safe">
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
  const { activeTab, isLoaded, loadSeedData } = useStore();

  useEffect(() => {
    loadSeedData();
  }, [isLoaded, loadSeedData]);

  // Set up real-time listeners for Supabase
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    const subscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Tasks updated:', payload);
        // Force refetch by clearing cache
        loadSeedData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSeedData]);

  return (
    <div className="min-h-screen bg-cream-100">
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-4 pb-28">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'shopping' && <Shopping />}
        {activeTab === 'goals' && <Goals />}
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
