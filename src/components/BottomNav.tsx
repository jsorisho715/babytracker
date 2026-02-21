import { LayoutDashboard, CheckSquare, ShoppingCart, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { NavTab } from '../types';

const NAV_ITEMS: { tab: NavTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Home' },
  { tab: 'tasks', icon: <CheckSquare className="w-5 h-5" />, label: 'Tasks' },
  { tab: 'shopping', icon: <ShoppingCart className="w-5 h-5" />, label: 'Shop' },
  { tab: 'goals', icon: <Target className="w-5 h-5" />, label: 'Goals' },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, tasks, shopping } = useStore();

  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const pendingShopping = shopping.filter(s => s.status === 'Need to Purchase').length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 pb-safe z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ tab, icon, label }) => {
          const isActive = activeTab === tab;
          const badge = tab === 'tasks' ? pendingTasks : tab === 'shopping' ? pendingShopping : 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-1 py-3 px-4 relative transition-colors duration-150 ${
                isActive ? 'text-sage-500' : 'text-warm-gray'
              }`}
            >
              <div className="relative">
                {icon}
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-baby text-white text-[10px] font-display font-800 rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-display font-600 ${isActive ? 'font-700' : ''}`}>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-sage-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
