import { useStore } from '../store/useStore';
import { CATEGORY_EMOJIS } from '../data/seedData';
import type { Player, PointTier, Task } from '../types';
import PointsBadge from '../components/PointsBadge';
import { Trophy, Flame, Star, ChevronRight, ClipboardList, RefreshCw, CheckSquare, ShoppingCart, Target, CheckCircle2, UserX } from 'lucide-react';

function PlayerCard({ player }: { player: Player }) {
  const { scores, tasks, shopping } = useStore();
  const score = scores[player];
  const isSage = player === 'johnathan';

  const total =
    tasks.filter(t => t.completedBy === player && t.status === 'done').length +
    shopping.filter(s => s.purchasedBy === player && s.status === 'Purchased').length;

  const totalPossible = tasks.length + shopping.length;
  const pct = totalPossible ? Math.round((total / totalPossible) * 100) : 0;

  return (
    <div className={`card flex-1 border-2 ${isSage ? 'border-sage-200' : 'border-rose-light'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-display font-800 ${
          isSage ? 'bg-sage-100 text-sage-500' : 'bg-rose-light text-rose-medium'
        }`}>
          {score.displayName[0]}
        </div>
        <div>
          <p className="font-display font-700 text-gray-800 leading-none">{score.displayName}</p>
          <p className="text-xs text-warm-gray">{total} items done</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-end gap-1">
          <span className={`text-3xl font-display font-800 ${isSage ? 'text-sage-500' : 'text-rose-medium'}`}>
            {score.totalPoints}
          </span>
          <span className="text-warm-gray text-sm mb-1">pts</span>
        </div>
        <div className="h-2 bg-cream-200 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isSage ? 'bg-sage-400' : 'bg-rose-baby'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-warm-gray mt-0.5">{pct}% complete</p>
      </div>

      {score.streakDays >= 2 && (
        <div className="flex items-center gap-1 text-orange-500 text-xs font-display font-700">
          <Flame className="w-3.5 h-3.5" />
          {score.streakDays} day streak!
        </div>
      )}

      {(score.badges ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {(score.badges ?? []).slice(0, 4).map(b => (
            <span key={b.id} title={b.name} className="text-base">{b.emoji}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryProgress() {
  const { tasks, setActiveTabWithCategory } = useStore();
  const categories = [...new Set(tasks.map(t => t.category))];

  return (
    <div className="card">
      <h3 className="font-display font-700 text-gray-800 mb-3">Progress by Category</h3>
      <div className="space-y-2.5">
        {categories.map(cat => {
          const catTasks = tasks.filter(t => t.category === cat);
          const done = catTasks.filter(t => t.status === 'done').length;
          const pct = Math.round((done / catTasks.length) * 100);
          const emoji = CATEGORY_EMOJIS[cat] ?? '📋';
          return (
            <button
              key={cat}
              onClick={() => setActiveTabWithCategory('tasks', cat)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-display font-600 text-gray-700 flex items-center gap-1.5">
                  <span>{emoji}</span>{cat}
                </span>
                <span className="text-xs text-warm-gray group-hover:text-sage-500 flex items-center gap-0.5">
                  {done}/{catTasks.length}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AssignedCard() {
  const { tasks, activePlayer, scores, setActiveTab } = useStore();
  const otherPlayer: Player = activePlayer === 'johnathan' ? 'jordyn' : 'johnathan';
  const myName = scores[activePlayer].displayName;

  const byPointsDesc = (a: Task, b: Task) => (b.points ?? 0) - (a.points ?? 0);
  const today = new Date().toISOString().slice(0, 10);

  // Tasks assigned to me (claimed by me or team tasks)
  const toMe = tasks.filter(
    t => t.status !== 'done' && (t.claimedBy === activePlayer || t.assignedToBoth)
  ).sort(byPointsDesc);

  // Tasks I assigned out to partner
  const byMe = tasks.filter(t => t.assignedBy === activePlayer && t.status !== 'done');

  // Overdue: not done, has a due date in the past
  const overdue = tasks.filter(
    t => t.status !== 'done' && t.dueDate && t.dueDate < today
  ).length;

  const hasAny = toMe.length > 0 || byMe.length > 0;

  if (!hasAny) {
    return (
      <div className="card flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-warm-gray" />
          <p className="text-sm font-display font-600 text-warm-gray">No assigned tasks for {myName}</p>
        </div>
        <button
          onClick={() => setActiveTab('tasks')}
          className="text-xs text-sage-500 font-display font-700 whitespace-nowrap"
        >
          Assign one →
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-sage-500" />
          <h3 className="font-display font-700 text-gray-800">Assigned — {myName}</h3>
        </div>
        <button
          onClick={() => setActiveTab('assigned')}
          className="text-xs text-sage-500 font-display font-700"
        >
          See all
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`rounded-2xl p-3 text-left min-h-[60px] ${overdue > 0 ? 'bg-red-50' : 'bg-cream-100'}`}
        >
          <p className={`text-2xl font-display font-800 ${overdue > 0 ? 'text-red-500' : 'text-gray-400'}`}>{overdue}</p>
          <p className="text-xs text-warm-gray font-display font-600">{overdue > 0 ? '⚠️ overdue' : '✓ overdue'}</p>
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className="bg-rose-50 rounded-2xl p-3 text-left min-h-[60px]"
        >
          <p className="text-2xl font-display font-800 text-rose-medium">{toMe.length}</p>
          <p className="text-xs text-warm-gray font-display font-600">my tasks</p>
        </button>
      </div>
      {toMe.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {toMe.slice(0, 2).map(t => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-cream-100 rounded-xl">
              <span className="text-xs font-display font-600 text-gray-800 flex-1 truncate">{t.task}</span>
              {t.assignedBy && (
                <span className="text-[10px] text-rose-medium font-display font-700">
                  from {scores[otherPlayer].displayName}
                </span>
              )}
            </div>
          ))}
          {toMe.length > 2 && (
            <button onClick={() => setActiveTab('assigned')} className="text-xs text-sage-500 font-display font-700 px-3">
              +{toMe.length - 2} more →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuickStats() {
  const { tasks, shopping, goals, dailyCompletions, activePlayer, setActiveTab } = useStore();
  const today = new Date().toISOString().slice(0, 10);

  const pendingTasks = tasks.filter(t => t.status !== 'done' && !t.isDaily).length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const purchasedShopping = shopping.filter(s => s.status === 'Purchased').length;
  const completedGoals = goals.filter(g => g.completed).length;
  const unassignedTasks = tasks.filter(
    t => t.status !== 'done' && !t.isDaily && !t.claimedBy && !t.assignedToBoth
  ).length;

  const dailyTasks = tasks.filter(t =>
    t.isDaily && (t.assignedToBoth || !t.claimedBy || t.claimedBy === activePlayer)
  );
  const doneToday = dailyTasks.filter(t =>
    dailyCompletions.some(c => c.taskId === t.id && c.date === today)
  ).length;
  const dailyLabel = dailyTasks.length > 0 ? `${doneToday}/${dailyTasks.length}` : '—';

  const stats = [
    {
      label: 'Pending',
      value: pendingTasks,
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'text-sage-500',
      bg: 'bg-sage-50',
      tab: 'tasks' as const,
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-sage-600',
      bg: 'bg-sage-100',
      tab: 'tasks' as const,
    },
    {
      label: 'Shopping',
      value: `${purchasedShopping}/${shopping.length}`,
      icon: <ShoppingCart className="w-4 h-4" />,
      color: 'text-rose-medium',
      bg: 'bg-rose-50',
      tab: 'shopping' as const,
    },
    {
      label: 'Goals',
      value: `${completedGoals}/${goals.length}`,
      icon: <Target className="w-4 h-4" />,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      tab: 'goals' as const,
    },
    {
      label: 'Daily',
      value: dailyLabel,
      icon: <RefreshCw className="w-4 h-4" />,
      color: 'text-sky-500',
      bg: 'bg-sky-50',
      tab: 'tasks' as const,
    },
    {
      label: 'Unassigned',
      value: unassignedTasks,
      icon: <UserX className="w-4 h-4" />,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      tab: 'assigned' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(({ label, value, icon, color, bg, tab }) => (
        <button
          key={label}
          onClick={() => setActiveTab(tab)}
          className={`card text-left flex items-center gap-3 py-3 px-3 min-h-[60px] active:scale-95 transition-transform`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className={`text-xl font-display font-800 leading-none ${color}`}>{value}</p>
            <p className="text-[11px] text-warm-gray font-display font-600 mt-0.5">{label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function DailySection() {
  const { tasks, dailyCompletions, activePlayer, scores, claimTask, completeTask, setActiveTab } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const myName = scores[activePlayer].displayName;

  const isDoneToday = (taskId: string) =>
    dailyCompletions.some(c => c.taskId === taskId && c.date === today);

  // Show daily tasks that are unassigned, assigned to me, or team tasks.
  // Use !t.claimedBy as a fallback for team tasks where assignedToBoth may have lost sync.
  const dailyTasks = tasks
    .filter(t => t.isDaily && (t.assignedToBoth || !t.claimedBy || t.claimedBy === activePlayer))
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  if (dailyTasks.length === 0) {
    return (
      <div className="card flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-warm-gray" />
          <p className="text-sm font-display font-600 text-warm-gray">No daily tasks yet</p>
        </div>
        <button
          onClick={() => setActiveTab('tasks')}
          className="text-xs text-sage-500 font-display font-700 whitespace-nowrap"
        >
          Add one →
        </button>
      </div>
    );
  }

  const doneToday = dailyTasks.filter(t => isDoneToday(t.id)).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-sage-500" />
          <h3 className="font-display font-700 text-gray-800">Daily — {myName}</h3>
          {doneToday > 0 && (
            <span className="text-xs bg-sage-100 text-sage-600 font-display font-700 px-2 py-0.5 rounded-full">
              {doneToday}/{dailyTasks.length} done
            </span>
          )}
        </div>
        <button
          onClick={() => setActiveTab('tasks')}
          className="text-xs text-sage-500 font-display font-700"
        >
          See all
        </button>
      </div>
      <div className="space-y-2">
        {dailyTasks.map(task => {
          const isDone = isDoneToday(task.id);
          const isTeam = !!task.assignedToBoth;
          const isClaimedByMe = task.status === 'claimed' && task.claimedBy === activePlayer;
          const canComplete = isClaimedByMe || isTeam;
          return (
            <div key={task.id} className={`flex items-center gap-3 p-2.5 rounded-2xl ${isDone ? 'bg-sage-50 opacity-70' : 'bg-cream-100'}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-display font-600 text-gray-800 truncate ${isDone ? 'line-through' : ''}`}>{task.task}</p>
                <p className="text-xs text-warm-gray">{task.category}</p>
              </div>
              <PointsBadge points={task.points as PointTier} />
              <button
                onClick={() => {
                  if (isDone) return;
                  if (task.status === 'pending') claimTask(task.id);
                  else if (canComplete) completeTask(task.id);
                }}
                disabled={isDone || (!canComplete && task.status === 'claimed')}
                className={`text-xs font-display font-700 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  isDone
                    ? 'bg-sage-200 text-sage-500 cursor-default'
                    : canComplete
                    ? 'bg-sage-400 text-white hover:bg-sage-500'
                    : task.status === 'pending'
                    ? 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                    : 'bg-cream-200 text-warm-gray cursor-not-allowed'
                }`}
              >
                {isDone ? '✓ Done' : canComplete ? 'Complete' : 'Claim'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { tasks, shopping, scores, settings, isLoaded, loadSeedData } = useStore();
  const totalDone = tasks.filter(t => t.status === 'done').length + shopping.filter(s => s.status === 'Purchased').length;
  const totalItems = tasks.length + shopping.length;
  const totalPoints = scores.johnathan.totalPoints + scores.jordyn.totalPoints;
  const overallPct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  const leader = scores.johnathan.totalPoints >= scores.jordyn.totalPoints ? scores.johnathan : scores.jordyn;
  const isNeckAndNeck = Math.abs(scores.johnathan.totalPoints - scores.jordyn.totalPoints) < 20;


  return (
    <div className="space-y-4">
      {/* Welcome / Load */}
      {!isLoaded && (
        <div className="card text-center py-8">
          <div className="text-5xl mb-4">🍼</div>
          <h2 className="font-display font-800 text-2xl text-gray-800 mb-2">
            Welcome, Johnathan & Jordyn!
          </h2>
          <p className="text-warm-gray mb-6">Ready to get ready for {settings.babyName}?</p>
          <button
            onClick={() => loadSeedData()}
            className="btn-primary mx-auto"
          >
            Load Checklist ✨
          </button>
        </div>
      )}

      {isLoaded && (
        <>
          {/* Team Progress */}
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-display font-800 text-gray-800">Team {settings.babyName}</h2>
              {isNeckAndNeck && (
                <span className="text-xs bg-yellow-50 text-yellow-700 font-display font-700 px-2 py-0.5 rounded-full">Neck & Neck!</span>
              )}
            </div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-display font-800 text-gray-800">{totalPoints}</span>
              <span className="text-warm-gray text-sm mb-1">combined pts</span>
            </div>
            <div className="h-3 bg-cream-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-gradient-to-r from-sage-400 to-rose-baby rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-warm-gray">
              <span>{totalDone} of {totalItems} items</span>
              <span>{overallPct}%</span>
            </div>
            {!isNeckAndNeck && totalPoints > 0 && (
              <p className="text-xs text-warm-gray mt-2">
                <span className={leader.player === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'} >
                  {leader.displayName}
                </span> is leading! 🏆
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <QuickStats />

          {/* Assigned Card */}
          <AssignedCard />

          {/* Daily Section */}
          <DailySection />

          {/* Player Cards */}
          <div className="flex gap-3">
            <PlayerCard player="johnathan" />
            <PlayerCard player="jordyn" />
          </div>

          {/* Category Progress */}
          <CategoryProgress />

          {/* All badges */}
          {((scores.johnathan.badges ?? []).length > 0 || (scores.jordyn.badges ?? []).length > 0) && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="font-display font-700 text-gray-800">Badges Earned</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['johnathan', 'jordyn'] as Player[]).map(p => (
                  <div key={p}>
                    <p className={`text-xs font-display font-700 mb-1 ${p === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'}`}>
                      {scores[p].displayName}
                    </p>
                    {(scores[p].badges ?? []).length === 0 ? (
                      <p className="text-xs text-warm-gray">No badges yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(scores[p].badges ?? []).map(b => (
                          <span key={b.id} title={b.name} className="text-xl">{b.emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
