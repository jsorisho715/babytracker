import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task, ShoppingItem, Goal, Player, PlayerScore, AppSettings, Toast, NavTab, Badge, DailyCompletion,
  Contraction, ContractionSettings,
} from '../types';
import { seedTasks, seedShoppingItems, seedGoals, MILESTONE_MESSAGES } from '../data/seedData';
import { supabase } from '../lib/supabase';

const SUPABASE_ENABLED = !!import.meta.env.VITE_SUPABASE_URL;

const DEFAULT_SCORES: Record<Player, PlayerScore> = {
  johnathan: {
    player: 'johnathan',
    displayName: 'Johnathan',
    totalPoints: 0,
    tasksCompleted: 0,
    streakDays: 0,
    badges: [],
  },
  jordyn: {
    player: 'jordyn',
    displayName: 'Jordyn',
    totalPoints: 0,
    tasksCompleted: 0,
    streakDays: 0,
    badges: [],
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  babyName: 'Luca',
  dueDate: undefined,
};

const DEFAULT_CONTRACTION_SETTINGS: ContractionSettings = {
  alertFrequencyMin: 5,
  alertDurationMin: 1,
  alertWindowMin: 60,
};

const BADGES_CATALOG: Badge[] = [
  { id: 'nursery-ninja', name: 'Nursery Ninja', emoji: '🛏️', description: 'Complete 5 Nursery tasks' },
  { id: 'hospital-hero', name: 'Hospital Bag Hero', emoji: '🎒', description: 'Complete all Hospital Prep tasks' },
  { id: 'diaper-dynamo', name: 'Diaper Dynamo', emoji: '🧷', description: 'Complete all Diapering tasks' },
  { id: 'medical-maven', name: 'Medical Maven', emoji: '🏥', description: 'Complete 5 Medical/Birth tasks' },
  { id: 'first-hundred', name: 'First 100!', emoji: '💯', description: 'Earn 100 points' },
  { id: 'shopping-star', name: 'Shopping Star', emoji: '🛒', description: 'Purchase 3 shopping items' },
  { id: 'boss-slayer', name: 'Boss Slayer', emoji: '👑', description: 'Complete a Boss Level task (100 pts)' },
  { id: 'streak-3', name: 'On a Roll', emoji: '🔥', description: 'Complete tasks 3 days in a row' },
];

function checkAndAwardBadges(player: Player, tasks: Task[], shopping: ShoppingItem[], scores: Record<Player, PlayerScore>): Badge[] {
  const newBadges: Badge[] = [];
  const existing = scores[player].badges.map(b => b.id);

  const playerTasks = tasks.filter(t => t.completedBy === player && t.status === 'done');
  const playerShopping = shopping.filter(s => s.purchasedBy === player && s.status === 'Purchased');

  const nurseryDone = playerTasks.filter(t => t.category === 'Nursery').length;
  const medicalDone = playerTasks.filter(t => t.category === 'Medical / Birth').length;
  const hospitalDone = playerTasks.filter(t => t.category === 'Hospital Prep' && t.status === 'done').length;
  const totalHospital = tasks.filter(t => t.category === 'Hospital Prep').length;
  const diaperDone = playerTasks.filter(t => t.category === 'Diapering').length;
  const totalDiaper = tasks.filter(t => t.category === 'Diapering').length;
  const hasBoss = playerTasks.some(t => t.points === 100);

  if (nurseryDone >= 5 && !existing.includes('nursery-ninja')) newBadges.push(BADGES_CATALOG.find(b => b.id === 'nursery-ninja')!);
  if (hospitalDone >= totalHospital && totalHospital > 0 && !existing.includes('hospital-hero')) newBadges.push(BADGES_CATALOG.find(b => b.id === 'hospital-hero')!);
  if (diaperDone >= totalDiaper && totalDiaper > 0 && !existing.includes('diaper-dynamo')) newBadges.push(BADGES_CATALOG.find(b => b.id === 'diaper-dynamo')!);
  if (medicalDone >= 5 && !existing.includes('medical-maven')) newBadges.push(BADGES_CATALOG.find(b => b.id === 'medical-maven')!);
  if (scores[player].totalPoints >= 100 && !existing.includes('first-hundred')) newBadges.push(BADGES_CATALOG.find(b => b.id === 'first-hundred')!);
  if (playerShopping.length >= 3 && !existing.includes('shopping-star')) newBadges.push(BADGES_CATALOG.find(b => b.id === 'shopping-star')!);
  if (hasBoss && !existing.includes('boss-slayer')) newBadges.push(BADGES_CATALOG.find(b => b.id === 'boss-slayer')!);

  return newBadges.filter(Boolean);
}

function updateStreak(score: PlayerScore): Partial<PlayerScore> {
  const today = new Date().toDateString();
  const last = score.lastCompletedDate;
  if (!last) return { streakDays: 1, lastCompletedDate: today };
  if (last === today) return {};
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (last === yesterday.toDateString()) {
    return { streakDays: score.streakDays + 1, lastCompletedDate: today };
  }
  return { streakDays: 1, lastCompletedDate: today };
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

interface AppState {
  tasks: Task[];
  shopping: ShoppingItem[];
  goals: Goal[];
  dailyCompletions: DailyCompletion[];
  scores: Record<Player, PlayerScore>;
  settings: AppSettings;
  activePlayer: Player;
  activeTab: NavTab;
  toasts: Toast[];
  isLoaded: boolean;
  previousMilestone: number;
  pendingCategoryFilter: string | null;

  // Actions - tasks
  loadSeedData: (force?: boolean) => Promise<void>;
  syncToSupabase: () => Promise<void>;
  resetToSeed: () => Promise<void>;
  resetScores: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  claimTask: (id: string) => void;
  assignTask: (taskId: string, assignTo: Player) => void;
  assignTaskToBoth: (taskId: string) => void;
  unassignTask: (taskId: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;

  // Actions - shopping
  addShoppingItem: (item: Omit<ShoppingItem, 'id'>) => void;
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => void;
  deleteShoppingItem: (id: string) => void;
  purchaseItem: (id: string) => void;
  unpurchaseItem: (id: string) => void;

  // Actions - goals
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  assignGoal: (goalId: string, assignTo: Player) => void;
  assignGoalToBoth: (goalId: string) => void;
  unassignGoal: (goalId: string) => void;

  // Actions - conversions
  convertTaskToShopping: (taskId: string) => void;
  convertTaskToGoal: (taskId: string) => void;
  convertShoppingToTask: (itemId: string) => void;
  convertShoppingToGoal: (itemId: string) => void;
  convertGoalToTask: (goalId: string) => void;
  convertGoalToShopping: (goalId: string) => void;

  // Contractions
  contractions: Contraction[];
  contractionSettings: ContractionSettings;
  startContraction: () => void;
  stopContraction: () => void;
  deleteContraction: (id: string) => void;
  clearContractions: () => void;
  updateContractionSettings: (updates: Partial<ContractionSettings>) => void;

  // UI
  confettiTrigger: number;
  incrementConfetti: () => void;
  setActivePlayer: (player: Player) => void;
  setActiveTab: (tab: NavTab) => void;
  setActiveTabWithCategory: (tab: NavTab, category?: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateSettingsFromSync: (settings: Partial<AppSettings>) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function syncBadgesToSupabase(player: Player, newBadges: Badge[]) {
  if (!SUPABASE_ENABLED || newBadges.length === 0) return;
  (async () => {
    try {
      await supabase.from('badges').upsert(
        newBadges.map(b => ({
          id: `${player}-${b.id}`,
          player,
          badge_id: b.id,
          badge_name: b.name,
          emoji: b.emoji,
          description: b.description,
          unlocked_at: b.unlockedAt ?? new Date().toISOString(),
        })) as any
      );
    } catch (err) { console.error('Supabase badge sync:', err); }
  })();
}

function getTotalPoints(scores: Record<Player, PlayerScore>) {
  return scores.johnathan.totalPoints + scores.jordyn.totalPoints;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      shopping: [],
      goals: [],
      dailyCompletions: [],
      scores: DEFAULT_SCORES,
      settings: DEFAULT_SETTINGS,
      activePlayer: 'johnathan',
      activeTab: 'dashboard',
      toasts: [],
      isLoaded: false,
      previousMilestone: 0,
      contractions: [],
      contractionSettings: DEFAULT_CONTRACTION_SETTINGS,
      confettiTrigger: 0,
      pendingCategoryFilter: null,

      incrementConfetti: () => set(s => ({ confettiTrigger: s.confettiTrigger + 1 })),

      loadSeedData: (force = false) => {
        const { isLoaded } = get();
        if (isLoaded && !force) return Promise.resolve();
        
        // If Supabase is enabled, try to load from there
        if (SUPABASE_ENABLED) {
          // Fetch daily_completions separately so a missing table doesn't break the whole load
          const fetchDailyCompletions = (): Promise<{ data: any[] }> =>
            (supabase.from('daily_completions').select('*') as any).then((r: any) => r).catch(() => ({ data: [] as any[] }));

          const fetchBadges = (): Promise<{ data: any[] }> =>
            (supabase.from('badges').select('*') as any).then((r: any) => r).catch(() => ({ data: [] as any[] }));

          return Promise.all([
            supabase.from('tasks').select('*'),
            supabase.from('shopping_items').select('*'),
            supabase.from('goals').select('*'),
            fetchDailyCompletions(),
            supabase.from('player_scores').select('*'),
            supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle(),
            fetchBadges(),
          ]).then(([tasksRes, shoppingRes, goalsRes, completionsRes, scoresRes, settingsRes, badgesRes]: any[]) => {
            const settingsRow = settingsRes.data;
            const settings = settingsRow ? {
              babyName: settingsRow.baby_name ?? 'Luca',
              dueDate: settingsRow.due_date ?? undefined,
              pregnancyWeek: settingsRow.pregnancy_week ?? undefined,
            } : get().settings;

            if (tasksRes.data?.length || force) {
              const tasks = (tasksRes.data || []).map((t: any) => ({
                ...t,
                points: t.points as any,
                status: t.status as any,
                claimedBy: t.claimed_by ?? undefined,
                completedBy: t.completed_by ?? undefined,
                completedAt: t.completed_at ?? undefined,
                assignedBy: t.assigned_by ?? undefined,
                isDaily: t.is_daily ?? false,
                assignedToBoth: t.assigned_to_both ?? false,
                dueDate: t.due_date ?? undefined,
              }));
              const shopping = shoppingRes.data?.map((s: any) => ({
                ...s,
                points: s.points as any,
                status: s.status as any
              })) ?? [];
              const goals = (goalsRes.data || []).map((g: any) => ({
                ...g,
                startDate: g.start_date ?? undefined,
                endDate: g.end_date ?? undefined,
                completedBy: g.completed_by ?? undefined,
                completedAt: g.completed_at ?? undefined,
                points: g.points ?? 25,
                claimedBy: g.claimed_by ?? undefined,
                assignedBy: g.assigned_by ?? undefined,
                assignedToBoth: g.assigned_to_both ?? false,
              }));
              const dailyCompletions: DailyCompletion[] = ((completionsRes as any).data ?? []).map((c: any) => ({
                taskId: c.task_id,
                player: c.player as Player,
                date: c.date,
                completedAt: c.completed_at,
              }));
              const playerScores = scoresRes.data ?? [];
              const allBadges: any[] = (badgesRes as any).data ?? [];
              const badgesByPlayer = (p: Player): Badge[] =>
                allBadges
                  .filter((b: any) => b.player === p)
                  .map((b: any) => ({ id: b.badge_id, name: b.badge_name, emoji: b.emoji, description: b.description ?? '', unlockedAt: b.unlocked_at }));

              const mapScore = (raw: any, defaultVal: PlayerScore, player: Player): PlayerScore => ({
                player: defaultVal.player,
                displayName: raw?.display_name ?? defaultVal.displayName,
                totalPoints: raw?.total_points ?? defaultVal.totalPoints,
                tasksCompleted: raw?.tasks_completed ?? defaultVal.tasksCompleted,
                streakDays: raw?.streak_days ?? defaultVal.streakDays,
                lastCompletedDate: raw?.last_completed_date ?? defaultVal.lastCompletedDate,
                badges: badgesByPlayer(player).length > 0 ? badgesByPlayer(player) : defaultVal.badges,
              });

              const scores: Record<Player, PlayerScore> = {
                johnathan: mapScore(playerScores.find((s: any) => s.player === 'johnathan'), DEFAULT_SCORES.johnathan, 'johnathan'),
                jordyn: mapScore(playerScores.find((s: any) => s.player === 'jordyn'), DEFAULT_SCORES.jordyn, 'jordyn'),
              };

              set({ tasks, shopping, goals, dailyCompletions, scores, settings, isLoaded: true });
            } else {
              // No data in Supabase, load seeds and sync
              set({ tasks: seedTasks, shopping: seedShoppingItems, goals: seedGoals, dailyCompletions: [], settings, isLoaded: true });
              get().syncToSupabase();
            }
          }).catch((err) => {
            console.error('[BabyTracker] Supabase load failed, falling back to local data:', err);
            const existing = get();
            if (existing.tasks.length > 0) {
              set({ isLoaded: true });
            } else {
              set({ tasks: seedTasks, shopping: seedShoppingItems, goals: seedGoals, dailyCompletions: [], isLoaded: true });
            }
          }) as Promise<void>;
        } else {
          // LocalStorage only
          set({ tasks: seedTasks, shopping: seedShoppingItems, goals: seedGoals, isLoaded: true });
          return Promise.resolve();
        }
      },

      syncToSupabase: async () => {
        if (!SUPABASE_ENABLED) return;
        const { tasks, shopping, goals, scores, settings, dailyCompletions } = get();
        
        try {
          // Upsert all data to Supabase
          await Promise.all([
            supabase.from('tasks').upsert(tasks.map(t => ({
              id: t.id,
              category: t.category,
              task: t.task,
              priority: t.priority,
              timing: t.timing,
              status: t.status,
              notes: t.notes,
              points: t.points,
              completed_by: t.completedBy,
              claimed_by: t.claimedBy,
              assigned_by: t.assignedBy,
              completed_at: t.completedAt,
              is_daily: t.isDaily ?? false,
              assigned_to_both: t.assignedToBoth ?? false,
              due_date: t.dueDate ?? null,
            })) as any),
            supabase.from('shopping_items').upsert(shopping.map(s => ({
              id: s.id,
              name: s.name,
              price: s.price,
              stock: s.stock,
              status: s.status,
              notes: s.notes,
              points: s.points,
              purchased_by: s.purchasedBy,
              purchased_at: s.purchasedAt
            })) as any),
            supabase.from('goals').upsert(goals.map(g => ({
              id: g.id,
              name: g.name,
              start_date: g.startDate,
              end_date: g.endDate,
              notes: g.notes,
              completed: g.completed,
              completed_by: g.completedBy,
              completed_at: g.completedAt,
              points: g.points,
              claimed_by: g.claimedBy,
              assigned_by: g.assignedBy,
              assigned_to_both: g.assignedToBoth,
            })) as any),
            supabase.from('player_scores').upsert(Object.values(scores).map(s => ({
              player: s.player,
              display_name: s.displayName,
              total_points: s.totalPoints,
              tasks_completed: s.tasksCompleted,
              streak_days: s.streakDays,
              last_completed_date: s.lastCompletedDate
            })) as any),
            supabase.from('app_settings').upsert({
              id: 'default',
              baby_name: settings.babyName || 'Luca',
              due_date: settings.dueDate || null,
              pregnancy_week: settings.pregnancyWeek ?? null,
            } as any),
            dailyCompletions.length > 0
              ? supabase.from('daily_completions').upsert(dailyCompletions.map(dc => ({
                  task_id: dc.taskId,
                  player: dc.player,
                  date: dc.date,
                })) as any)
              : Promise.resolve(),
          ]);
        } catch (err) {
          console.error('Failed to sync to Supabase:', err);
        }
      },

      resetToSeed: async () => {
        // Reset local state immediately
        set({
          tasks: seedTasks,
          shopping: seedShoppingItems,
          goals: seedGoals,
          dailyCompletions: [],
          scores: DEFAULT_SCORES,
          previousMilestone: 0,
          isLoaded: true,
        });

        if (SUPABASE_ENABLED) {
          try {
            // Clear all user data from Supabase
            await Promise.all([
              supabase.from('daily_completions').delete().neq('task_id', '__never__' as any),
              supabase.from('tasks').delete().neq('id', '__never__' as any),
              supabase.from('shopping_items').delete().neq('id', '__never__' as any),
              supabase.from('goals').delete().neq('id', '__never__' as any),
            ]);
            // Reset player scores
            await supabase.from('player_scores').upsert([
              { player: 'johnathan', display_name: 'Johnathan', total_points: 0, tasks_completed: 0, streak_days: 0, last_completed_date: null },
              { player: 'jordyn', display_name: 'Jordyn', total_points: 0, tasks_completed: 0, streak_days: 0, last_completed_date: null },
            ] as any);
            // Re-insert seed data
            await get().syncToSupabase();
          } catch (err) {
            console.error('Supabase reset error:', err);
          }
        }

        get().addToast({ message: 'All data reset to fresh start', type: 'info' });
      },

      resetScores: async () => {
        set({ scores: DEFAULT_SCORES });
        if (SUPABASE_ENABLED) {
          try {
            await Promise.all([
              supabase.from('player_scores').update({
                total_points: 0,
                tasks_completed: 0,
                streak_days: 0,
                last_completed_date: null,
              }).eq('player', 'johnathan'),
              supabase.from('player_scores').update({
                total_points: 0,
                tasks_completed: 0,
                streak_days: 0,
                last_completed_date: null,
              }).eq('player', 'jordyn'),
            ]);
          } catch (err) {
            console.error('Supabase resetScores:', err);
          }
        }
        get().addToast({ message: 'Points reset to zero', type: 'info' });
      },

      addTask: (taskData) => {
        const task: Task = { ...taskData, id: generateId() };
        set(s => ({ tasks: [...s.tasks, task] }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').insert({
                id: task.id,
                task: task.task,
                category: task.category,
                priority: task.priority,
                timing: task.timing,
                status: task.status,
                notes: task.notes ?? null,
                points: task.points,
                is_daily: task.isDaily ?? false,
                assigned_to_both: task.assignedToBoth ?? false,
                claimed_by: task.claimedBy ?? null,
                assigned_by: task.assignedBy ?? null,
                due_date: task.dueDate ?? null,
              } as any);
            } catch (err: any) { console.error('Supabase addTask:', err); }
          })();
        }
      },

      updateTask: (id, updates) => {
        set(s => {
          const tasks = s.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
          const updated = tasks.find(t => t.id === id);
          // If reverting to pending from done, deduct points
          const original = s.tasks.find(t => t.id === id);
          let result: { tasks: typeof tasks; scores?: Record<Player, PlayerScore> } = { tasks };
          if (original?.status === 'done' && updates.status === 'pending' && original.completedBy) {
            const player = original.completedBy;
            result.scores = {
              ...s.scores,
              [player]: {
                ...s.scores[player],
                totalPoints: Math.max(0, s.scores[player].totalPoints - original.points),
                tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
              },
            };
          }
          if (SUPABASE_ENABLED && updated) {
            (async () => {
              try {
                await supabase.from('tasks').update({
                  task: updated.task,
                  category: updated.category,
                  priority: updated.priority,
                  timing: updated.timing,
                  status: updated.status,
                  notes: updated.notes ?? null,
                  points: updated.points,
                  completed_by: updated.completedBy ?? null,
                  claimed_by: updated.claimedBy ?? null,
                  assigned_by: updated.assignedBy ?? null,
                  completed_at: updated.completedAt ?? null,
                  is_daily: updated.isDaily ?? false,
                  assigned_to_both: updated.assignedToBoth ?? false,
                  due_date: updated.dueDate ?? null,
                }).eq('id', id);
                if (result.scores) {
                  const player = original!.completedBy!;
                  const sc = result.scores[player];
                  await supabase.from('player_scores').update({
                    total_points: sc.totalPoints,
                    tasks_completed: sc.tasksCompleted,
                  }).eq('player', player);
                }
              } catch (err: any) { console.error('Supabase updateTask:', err); }
            })();
          }
          return result;
        });
      },

      deleteTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        set(s => {
          const tasks = s.tasks.filter(t => t.id !== id);
          if (task?.status === 'done' && task.completedBy) {
            const player = task.completedBy;
            const newScore = {
              ...s.scores[player],
              totalPoints: Math.max(0, s.scores[player].totalPoints - task.points),
              tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
            };
            if (SUPABASE_ENABLED) {
              (async () => {
                try {
                  await supabase.from('tasks').delete().eq('id', id);
                  await supabase.from('player_scores').update({
                    total_points: newScore.totalPoints,
                    tasks_completed: newScore.tasksCompleted,
                  }).eq('player', player);
                } catch (err: any) { console.error('Supabase deleteTask:', err); }
              })();
            }
            return { tasks, scores: { ...s.scores, [player]: newScore } };
          }
          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('tasks').delete().eq('id', id);
              } catch (err: any) { console.error('Supabase deleteTask:', err); }
            })();
          }
          return { tasks };
        });
      },

      claimTask: (id) => {
        const { activePlayer } = get();
        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === id && t.status === 'pending'
              ? { ...t, status: 'claimed', claimedBy: activePlayer, assignedBy: undefined, assignedToBoth: false }
              : t
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').update({
                status: 'claimed',
                claimed_by: get().activePlayer,
                assigned_by: null,
                assigned_to_both: false,
              }).eq('id', id);
            } catch (err: any) { console.error('Supabase claimTask sync:', err); }
          })();
        }
      },

      assignTask: (taskId, assignTo) => {
        const { activePlayer } = get();
        const isSelf = assignTo === activePlayer;
        const canAssign = (t: Task) => t.id === taskId && (t.status === 'pending' || t.status === 'claimed');
        set(s => ({
          tasks: s.tasks.map(t =>
            canAssign(t)
              ? {
                  ...t,
                  status: 'claimed' as const,
                  claimedBy: assignTo,
                  assignedBy: isSelf ? undefined : activePlayer,
                  assignedToBoth: false,
                }
              : t
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').update({
                status: 'claimed',
                claimed_by: assignTo,
                assigned_by: isSelf ? null : activePlayer,
                assigned_to_both: false,
              }).eq('id', taskId);
            } catch (err: any) { console.error('Supabase assignTask sync:', err); }
          })();
        }
        const assigneeName = isSelf ? 'yourself' : assignTo === 'johnathan' ? 'Johnathan' : 'Jordyn';
        get().addToast({ message: `Task assigned to ${assigneeName}!`, type: 'info' });
      },

      assignTaskToBoth: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task || task.status === 'done') return;
        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === taskId
              ? { ...t, status: 'claimed' as const, assignedToBoth: true, claimedBy: undefined, assignedBy: undefined }
              : t
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').update({
                status: 'claimed',
                assigned_to_both: true,
                claimed_by: null,
                assigned_by: null,
              }).eq('id', taskId);
            } catch (err: any) { console.error('Supabase assignTaskToBoth sync:', err); }
          })();
        }
        get().addToast({ message: '🤝 Team Luca task! Complete it together.', type: 'info' });
      },

      unassignTask: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task || (task.status === 'pending' && !task.assignedToBoth)) return;
        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === taskId
              ? { ...t, status: 'pending' as const, claimedBy: undefined, assignedBy: undefined, assignedToBoth: false }
              : t
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').update({
                status: 'pending',
                claimed_by: null,
                assigned_by: null,
                assigned_to_both: false,
              }).eq('id', taskId);
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: 'Task unassigned', type: 'info' });
      },

      completeTask: (id) => {
        const { activePlayer, tasks, shopping, scores, previousMilestone, dailyCompletions } = get();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const today = getTodayDate();

        // Daily tasks: use per-day completions, never change task status
        if (task.isDaily) {
          const alreadyDoneToday = dailyCompletions.some(c => c.taskId === id && c.date === today);
          if (alreadyDoneToday) return;

          const now = new Date().toISOString();
          const streakUpdates = updateStreak(scores[activePlayer]);
          const newPoints = scores[activePlayer].totalPoints + task.points;
          const streakBonus = (streakUpdates.streakDays && streakUpdates.streakDays >= 3) ? 5 : 0;

          const newCompletion: DailyCompletion = { taskId: id, player: activePlayer, date: today, completedAt: now };
          const newDailyCompletions = [...dailyCompletions, newCompletion];

          const newScore: PlayerScore = {
            ...scores[activePlayer],
            totalPoints: newPoints + streakBonus,
            tasksCompleted: scores[activePlayer].tasksCompleted + 1,
            ...streakUpdates,
          };

          const newBadges = checkAndAwardBadges(activePlayer, tasks, shopping, { ...scores, [activePlayer]: newScore });
          newScore.badges = [...newScore.badges, ...newBadges.map(b => ({ ...b, unlockedAt: now }))];

          const newScores = { ...scores, [activePlayer]: newScore };
          const totalNow = getTotalPoints(newScores);
          const nextMilestone = MILESTONE_MESSAGES.find(m => m.points > previousMilestone && m.points <= totalNow);

          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('daily_completions').upsert({
                  task_id: id,
                  player: activePlayer,
                  date: today,
                  completed_at: now,
                } as any);
                await supabase.from('player_scores').update({
                  total_points: newScore.totalPoints,
                  tasks_completed: newScore.tasksCompleted,
                  streak_days: newScore.streakDays,
                  last_completed_date: newScore.lastCompletedDate,
                }).eq('player', activePlayer);
              } catch (err: any) { console.error('Supabase daily completion:', err); }
            })();
          }

          set({
            dailyCompletions: newDailyCompletions,
            scores: newScores,
            previousMilestone: nextMilestone ? nextMilestone.points : previousMilestone,
          });

          const name = scores[activePlayer].displayName;
          get().addToast({
            message: `Nice one, ${name}! +${task.points + streakBonus} pts`,
            type: 'success',
            points: task.points + streakBonus,
            player: activePlayer,
            taskId: id,
            canUndo: true,
          });
          if (newBadges.length > 0) {
            get().addToast({ message: `${newBadges[0].emoji} Badge unlocked: ${newBadges[0].name}!`, type: 'info' });
            syncBadgesToSupabase(activePlayer, newBadges);
          }
          if (nextMilestone) get().addToast({ message: nextMilestone.message, type: 'info' });
          if (streakBonus > 0) get().addToast({ message: `🔥 3-day streak! +${streakBonus} bonus pts`, type: 'info' });
          get().incrementConfetti();
          return;
        }

        // Non-daily tasks: original flow
        if (task.status === 'done') return;

        const now = new Date().toISOString();
        const streakUpdates = updateStreak(scores[activePlayer]);
        const newPoints = scores[activePlayer].totalPoints + task.points;
        const streakBonus = (streakUpdates.streakDays && streakUpdates.streakDays >= 3) ? 5 : 0;

        const updatedTasks = tasks.map(t =>
          t.id === id ? { ...t, status: 'done' as const, completedBy: activePlayer, completedAt: now, claimedBy: undefined } : t
        );

        const newScore: PlayerScore = {
          ...scores[activePlayer],
          totalPoints: newPoints + streakBonus,
          tasksCompleted: scores[activePlayer].tasksCompleted + 1,
          ...streakUpdates,
        };

        const newBadges = checkAndAwardBadges(activePlayer, updatedTasks, shopping, { ...scores, [activePlayer]: newScore });
        newScore.badges = [...newScore.badges, ...newBadges.map(b => ({ ...b, unlockedAt: now }))];

        const newScores = { ...scores, [activePlayer]: newScore };
        const totalNow = getTotalPoints(newScores);
        const nextMilestone = MILESTONE_MESSAGES.find(m => m.points > previousMilestone && m.points <= totalNow);

        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').update({
                status: 'done',
                completed_by: activePlayer,
                completed_at: now,
                claimed_by: null,
              }).eq('id', id);
              await supabase.from('player_scores').update({
                total_points: newScore.totalPoints,
                tasks_completed: newScore.tasksCompleted,
                streak_days: newScore.streakDays,
                last_completed_date: newScore.lastCompletedDate,
              }).eq('player', activePlayer);
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }

        set({
          tasks: updatedTasks,
          scores: newScores,
          previousMilestone: nextMilestone ? nextMilestone.points : previousMilestone,
        });

        const name = scores[activePlayer].displayName;
        get().addToast({
          message: `Nice one, ${name}! +${task.points + streakBonus} pts`,
          type: 'success',
          points: task.points + streakBonus,
          player: activePlayer,
          taskId: id,
          canUndo: true,
        });
        if (newBadges.length > 0) {
          get().addToast({ message: `${newBadges[0].emoji} Badge unlocked: ${newBadges[0].name}!`, type: 'info' });
          syncBadgesToSupabase(activePlayer, newBadges);
        }
        if (nextMilestone) get().addToast({ message: nextMilestone.message, type: 'info' });
        if (streakBonus > 0) get().addToast({ message: `🔥 3-day streak! +${streakBonus} bonus pts`, type: 'info' });
        get().incrementConfetti();
      },

      uncompleteTask: (id) => {
        set(s => {
          const task = s.tasks.find(t => t.id === id);
          if (!task) return s;

          const today = getTodayDate();

          // Daily tasks: remove today's completion
          if (task.isDaily) {
            const completion = s.dailyCompletions.find(c => c.taskId === id && c.date === today);
            if (!completion) return s;
            const player = completion.player;
            const dailyCompletions = s.dailyCompletions.filter(c => !(c.taskId === id && c.date === today));
            const scores = {
              ...s.scores,
              [player]: {
                ...s.scores[player],
                totalPoints: Math.max(0, s.scores[player].totalPoints - task.points),
                tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
              },
            };
            if (SUPABASE_ENABLED) {
              (async () => {
                try {
                  await supabase.from('daily_completions').delete().eq('task_id', id).eq('date', today);
                  await supabase.from('player_scores').update({
                    total_points: scores[player].totalPoints,
                    tasks_completed: scores[player].tasksCompleted,
                  }).eq('player', player);
                } catch (err: any) { console.error('Supabase uncomplete daily:', err); }
              })();
            }
            return { dailyCompletions, scores };
          }

          // Non-daily tasks
          if (task.status !== 'done' || !task.completedBy) return s;
          const player = task.completedBy;
          const tasks = s.tasks.map(t =>
            t.id === id ? { ...t, status: 'pending' as const, completedBy: undefined, completedAt: undefined } : t
          );
          const newScore = {
            ...s.scores[player],
            totalPoints: Math.max(0, s.scores[player].totalPoints - task.points),
            tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
          };
          const scores = { ...s.scores, [player]: newScore };
          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('tasks').update({
                  status: 'pending',
                  completed_by: null,
                  completed_at: null,
                  claimed_by: null,
                }).eq('id', id);
                await supabase.from('player_scores').update({
                  total_points: newScore.totalPoints,
                  tasks_completed: newScore.tasksCompleted,
                }).eq('player', player);
              } catch (err: any) { console.error('Supabase uncompleteTask:', err); }
            })();
          }
          return { tasks, scores };
        });
      },

      addShoppingItem: (itemData) => {
        const item: ShoppingItem = { ...itemData, id: generateId() };
        set(s => ({ shopping: [...s.shopping, item] }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('shopping_items').insert({
                id: item.id,
                name: item.name,
                notes: item.notes ?? null,
                price: item.price ?? null,
                stock: item.stock ?? null,
                points: item.points,
                status: item.status,
              } as any);
            } catch (err: any) { console.error('Supabase addShoppingItem:', err); }
          })();
        }
      },

      updateShoppingItem: (id, updates) => {
        set(s => {
          const shopping = s.shopping.map(i => i.id === id ? { ...i, ...updates } : i);
          const updated = shopping.find(i => i.id === id);
          const original = s.shopping.find(i => i.id === id);
          const isUnpurchasing = original?.status === 'Purchased' && updates.status === 'Need to Purchase' && original.purchasedBy;
          if (SUPABASE_ENABLED && updated) {
            (async () => {
              try {
                await supabase.from('shopping_items').update({
                  name: updated.name,
                  notes: updated.notes ?? null,
                  price: updated.price ?? null,
                  stock: updated.stock ?? null,
                  status: updated.status,
                  points: updated.points,
                  purchased_by: updated.purchasedBy ?? null,
                  purchased_at: updated.purchasedAt ?? null,
                } as any).eq('id', id);
                if (isUnpurchasing && original?.purchasedBy) {
                  const newScore = {
                    ...s.scores[original.purchasedBy],
                    totalPoints: Math.max(0, s.scores[original.purchasedBy].totalPoints - original.points),
                    tasksCompleted: Math.max(0, s.scores[original.purchasedBy].tasksCompleted - 1),
                  };
                  await supabase.from('player_scores').update({
                    total_points: newScore.totalPoints,
                    tasks_completed: newScore.tasksCompleted,
                  }).eq('player', original.purchasedBy);
                }
              } catch (err: any) { console.error('Supabase updateShoppingItem:', err); }
            })();
          }
          if (isUnpurchasing && original?.purchasedBy) {
            const player = original.purchasedBy;
            const scores = {
              ...s.scores,
              [player]: {
                ...s.scores[player],
                totalPoints: Math.max(0, s.scores[player].totalPoints - original.points),
                tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
              },
            };
            return { shopping, scores };
          }
          return { shopping };
        });
      },

      deleteShoppingItem: (id) => {
        const item = get().shopping.find(i => i.id === id);
        set(s => {
          const shopping = s.shopping.filter(i => i.id !== id);
          if (item?.status === 'Purchased' && item.purchasedBy) {
            const player = item.purchasedBy;
            const newScore = {
              ...s.scores[player],
              totalPoints: Math.max(0, s.scores[player].totalPoints - item.points),
              tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
            };
            if (SUPABASE_ENABLED) {
              (async () => {
                try {
                  await supabase.from('shopping_items').delete().eq('id', id);
                  await supabase.from('player_scores').update({
                    total_points: newScore.totalPoints,
                    tasks_completed: newScore.tasksCompleted,
                  }).eq('player', player);
                } catch (err: any) { console.error('Supabase deleteShoppingItem:', err); }
              })();
            }
            return { shopping, scores: { ...s.scores, [player]: newScore } };
          }
          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('shopping_items').delete().eq('id', id);
              } catch (err: any) { console.error('Supabase deleteShoppingItem:', err); }
            })();
          }
          return { shopping };
        });
      },

      purchaseItem: (id) => {
        const { activePlayer, scores, shopping } = get();
        const item = shopping.find(i => i.id === id);
        if (!item || item.status === 'Purchased') return;

        const now = new Date().toISOString();
        const newPoints = scores[activePlayer].totalPoints + item.points;
        const updatedShopping = shopping.map(i =>
          i.id === id ? { ...i, status: 'Purchased' as const, purchasedBy: activePlayer, purchasedAt: now } : i
        );

        const newScore: PlayerScore = {
          ...scores[activePlayer],
          totalPoints: newPoints,
          tasksCompleted: scores[activePlayer].tasksCompleted + 1,
        };
        const newBadges = checkAndAwardBadges(activePlayer, get().tasks, updatedShopping, { ...scores, [activePlayer]: newScore });
        newScore.badges = [...newScore.badges, ...newBadges.map(b => ({ ...b, unlockedAt: now }))];

        set({ shopping: updatedShopping, scores: { ...scores, [activePlayer]: newScore } });

        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('shopping_items').update({
                status: 'Purchased',
                purchased_by: activePlayer,
                purchased_at: now,
              } as any).eq('id', id);
              await supabase.from('player_scores').update({
                total_points: newScore.totalPoints,
                tasks_completed: newScore.tasksCompleted,
              }).eq('player', activePlayer);
            } catch (err: any) { console.error('Supabase purchaseItem:', err); }
          })();
        }

        const name = scores[activePlayer].displayName;
        get().addToast({
          message: `${name} got it! +${item.points} pts`,
          type: 'success',
          points: item.points,
          player: activePlayer,
          taskId: id,
          canUndo: true,
        });

        if (newBadges.length > 0) {
          get().addToast({
            message: `${newBadges[0].emoji} Badge unlocked: ${newBadges[0].name}!`,
            type: 'info',
          });
          syncBadgesToSupabase(activePlayer, newBadges);
        }
        get().incrementConfetti();
      },

      unpurchaseItem: (id) => {
        set(s => {
          const item = s.shopping.find(i => i.id === id);
          if (!item || item.status !== 'Purchased' || !item.purchasedBy) return s;
          const player = item.purchasedBy;
          const shopping = s.shopping.map(i =>
            i.id === id ? { ...i, status: 'Need to Purchase' as const, purchasedBy: undefined, purchasedAt: undefined } : i
          );
          const newScore = {
            ...s.scores[player],
            totalPoints: Math.max(0, s.scores[player].totalPoints - item.points),
            tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
          };
          const scores = { ...s.scores, [player]: newScore };
          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('shopping_items').update({
                  status: 'Need to Purchase',
                  purchased_by: null,
                  purchased_at: null,
                } as any).eq('id', id);
                await supabase.from('player_scores').update({
                  total_points: newScore.totalPoints,
                  tasks_completed: newScore.tasksCompleted,
                }).eq('player', player);
              } catch (err: any) { console.error('Supabase unpurchaseItem:', err); }
            })();
          }
          return { shopping, scores };
        });
      },

      addGoal: (goalData) => {
        const goal: Goal = { ...goalData, id: generateId(), points: goalData.points ?? 25 };
        set(s => ({ goals: [...s.goals, goal] }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('goals').insert({
                id: goal.id,
                name: goal.name,
                notes: goal.notes ?? null,
                start_date: goal.startDate ?? null,
                end_date: goal.endDate ?? null,
                completed: goal.completed ?? false,
                points: goal.points,
                claimed_by: goal.claimedBy ?? null,
                assigned_by: goal.assignedBy ?? null,
                assigned_to_both: goal.assignedToBoth ?? false,
              } as any);
            } catch (err: any) { console.error('Supabase addGoal:', err); }
          })();
        }
      },

      updateGoal: (id, updates) => {
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              const updated = get().goals.find(g => g.id === id);
              if (!updated) return;
              await supabase.from('goals').update({
                name: updated.name,
                notes: updated.notes ?? null,
                start_date: updated.startDate ?? null,
                end_date: updated.endDate ?? null,
                completed: updated.completed ?? false,
                completed_by: updated.completedBy ?? null,
                completed_at: updated.completedAt ?? null,
                points: updated.points,
                claimed_by: updated.claimedBy ?? null,
                assigned_by: updated.assignedBy ?? null,
                assigned_to_both: updated.assignedToBoth ?? false,
              } as any).eq('id', id);
            } catch (err: any) { console.error('Supabase updateGoal:', err); }
          })();
        }
      },

      deleteGoal: (id) => {
        const goal = get().goals.find(g => g.id === id);
        set(s => {
          const goals = s.goals.filter(g => g.id !== id);
          if (goal?.completed && goal.completedBy) {
            const player = goal.completedBy;
            const newScore = {
              ...s.scores[player],
              totalPoints: Math.max(0, s.scores[player].totalPoints - goal.points),
              tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
            };
            if (SUPABASE_ENABLED) {
              (async () => {
                try {
                  await supabase.from('goals').delete().eq('id', id);
                  await supabase.from('player_scores').update({
                    total_points: newScore.totalPoints,
                    tasks_completed: newScore.tasksCompleted,
                  }).eq('player', player);
                } catch (err: any) { console.error('Supabase deleteGoal:', err); }
              })();
            }
            return { goals, scores: { ...s.scores, [player]: newScore } };
          }
          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('goals').delete().eq('id', id);
              } catch (err: any) { console.error('Supabase deleteGoal:', err); }
            })();
          }
          return { goals };
        });
      },

      completeGoal: (id) => {
        const { activePlayer, scores, goals } = get();
        const goal = goals.find(g => g.id === id);
        if (!goal) return;
        
        const now = new Date().toISOString();
        const newCompleted = !goal.completed;
        
        if (newCompleted) {
          // Award points
          const newPoints = scores[activePlayer].totalPoints + goal.points;
          const newScore: PlayerScore = {
            ...scores[activePlayer],
            totalPoints: newPoints,
            tasksCompleted: scores[activePlayer].tasksCompleted + 1,
          };
          const updatedScores = { ...scores, [activePlayer]: newScore };
          const newBadges = checkAndAwardBadges(activePlayer, get().tasks, get().shopping, updatedScores);
          newScore.badges = [...newScore.badges, ...newBadges.map(b => ({ ...b, unlockedAt: now }))];
          
          set(s => ({
            goals: s.goals.map(g =>
              g.id === id ? { ...g, completed: newCompleted, completedBy: activePlayer, completedAt: now } : g
            ),
            scores: updatedScores,
          }));
          
          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('goals').update({
                  completed: newCompleted,
                  completed_by: activePlayer,
                  completed_at: now,
                } as any).eq('id', id);
                await supabase.from('player_scores').update({
                  total_points: newScore.totalPoints,
                  tasks_completed: newScore.tasksCompleted,
                }).eq('player', activePlayer);
              } catch (err: any) { console.error('Supabase completeGoal:', err); }
            })();
          }
          
          get().addToast({
            message: `Goal completed! +${goal.points} pts`,
            type: 'success',
            points: goal.points,
            player: activePlayer,
            taskId: id,
            canUndo: true,
          });
          
          if (newBadges.length > 0) {
            get().addToast({
              message: `${newBadges[0].emoji} Badge unlocked: ${newBadges[0].name}!`,
              type: 'info',
            });
            syncBadgesToSupabase(activePlayer, newBadges);
          }
          get().incrementConfetti();
        } else {
          // Uncomplete: deduct points
          const { completedBy } = goal;
          if (completedBy) {
            const newPoints = Math.max(0, scores[completedBy].totalPoints - goal.points);
            const newScore: PlayerScore = {
              ...scores[completedBy],
              totalPoints: newPoints,
              tasksCompleted: Math.max(0, scores[completedBy].tasksCompleted - 1),
            };
            const updatedScores = { ...scores, [completedBy]: newScore };
            
            set(s => ({
              goals: s.goals.map(g =>
                g.id === id ? { ...g, completed: false, completedBy: undefined, completedAt: undefined } : g
              ),
              scores: updatedScores,
            }));
            
            if (SUPABASE_ENABLED) {
              (async () => {
                try {
                  await supabase.from('goals').update({
                    completed: false,
                    completed_by: null,
                    completed_at: null,
                  } as any).eq('id', id);
                  await supabase.from('player_scores').update({
                    total_points: newScore.totalPoints,
                    tasks_completed: newScore.tasksCompleted,
                  }).eq('player', completedBy);
                } catch (err: any) { console.error('Supabase uncompleteGoal:', err); }
              })();
            }
            
            get().addToast({
              message: `Goal uncompleted. -${goal.points} pts`,
              type: 'info',
            });
          }
        }
      },

      convertTaskToShopping: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;
        const newItem: ShoppingItem = {
          id: generateId(),
          name: task.task,
          notes: task.notes,
          points: task.points,
          status: 'Need to Purchase',
        };
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== taskId),
          shopping: [...s.shopping, newItem],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').delete().eq('id', taskId);
              await supabase.from('shopping_items').insert({ id: newItem.id, name: newItem.name, notes: newItem.notes, points: newItem.points, status: newItem.status });
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: `Moved to Shopping list`, type: 'info' });
      },

      assignGoal: (goalId, assignTo) => {
        const { activePlayer } = get();
        const isSelf = assignTo === activePlayer;
        set(s => ({
          goals: s.goals.map(g =>
            g.id === goalId ? { ...g, claimedBy: assignTo, assignedBy: isSelf ? undefined : activePlayer, assignedToBoth: false } : g
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('goals').update({
                claimed_by: assignTo,
                assigned_by: isSelf ? null : activePlayer,
                assigned_to_both: false,
              } as any).eq('id', goalId);
            } catch (err: any) { console.error('Supabase assignGoal:', err); }
          })();
        }
        const assigneeName = isSelf ? 'yourself' : assignTo === 'johnathan' ? 'Johnathan' : 'Jordyn';
        get().addToast({ message: `Goal assigned to ${assigneeName}`, type: 'info' });
      },

      assignGoalToBoth: (goalId) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.id === goalId ? { ...g, claimedBy: undefined, assignedBy: undefined, assignedToBoth: true } : g
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('goals').update({
                claimed_by: null,
                assigned_by: null,
                assigned_to_both: true,
              } as any).eq('id', goalId);
            } catch (err: any) { console.error('Supabase assignGoalToBoth:', err); }
          })();
        }
        get().addToast({ message: `Goal assigned to Team Luca`, type: 'info' });
      },

      unassignGoal: (goalId) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.id === goalId ? { ...g, claimedBy: undefined, assignedBy: undefined, assignedToBoth: false } : g
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('goals').update({
                claimed_by: null,
                assigned_by: null,
                assigned_to_both: false,
              } as any).eq('id', goalId);
            } catch (err: any) { console.error('Supabase unassignGoal:', err); }
          })();
        }
        get().addToast({ message: `Goal unassigned`, type: 'info' });
      },

      convertTaskToGoal: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;
        const newGoal: Goal = {
          id: generateId(),
          name: task.task,
          notes: task.notes,
          completed: false,
          points: task.points,
          claimedBy: task.claimedBy,
          assignedBy: task.assignedBy,
          assignedToBoth: task.assignedToBoth ?? false,
        };
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== taskId),
          goals: [...s.goals, newGoal],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').delete().eq('id', taskId);
              await supabase.from('goals').insert({ id: newGoal.id, name: newGoal.name, notes: newGoal.notes, completed: false, points: newGoal.points, claimed_by: newGoal.claimedBy ?? null, assigned_by: newGoal.assignedBy ?? null, assigned_to_both: newGoal.assignedToBoth });
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: `Moved to Goals`, type: 'info' });
      },

      convertShoppingToTask: (itemId) => {
        const item = get().shopping.find(i => i.id === itemId);
        if (!item) return;
        const newTask: Task = {
          id: generateId(),
          task: item.name,
          category: 'Other',
          priority: 'Medium',
          timing: 'ASAP',
          status: 'pending',
          notes: item.notes,
          points: item.points,
          assignedToBoth: false,
        };
        set(s => ({
          shopping: s.shopping.filter(i => i.id !== itemId),
          tasks: [...s.tasks, newTask],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('shopping_items').delete().eq('id', itemId);
              await supabase.from('tasks').insert({ id: newTask.id, task: newTask.task, category: newTask.category, priority: newTask.priority, timing: newTask.timing, status: newTask.status, notes: newTask.notes, points: newTask.points, is_daily: false, claimed_by: null, assigned_by: null, assigned_to_both: false });
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: `Moved to Tasks`, type: 'info' });
      },

      convertShoppingToGoal: (itemId) => {
        const item = get().shopping.find(i => i.id === itemId);
        if (!item) return;
        const newGoal: Goal = {
          id: generateId(),
          name: item.name,
          notes: item.notes,
          completed: false,
          points: item.points,
          assignedToBoth: false,
        };
        set(s => ({
          shopping: s.shopping.filter(i => i.id !== itemId),
          goals: [...s.goals, newGoal],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('shopping_items').delete().eq('id', itemId);
              await supabase.from('goals').insert({ id: newGoal.id, name: newGoal.name, notes: newGoal.notes, completed: false, points: newGoal.points, claimed_by: null, assigned_by: null, assigned_to_both: false });
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: `Moved to Goals`, type: 'info' });
      },

      convertGoalToTask: (goalId) => {
        const goal = get().goals.find(g => g.id === goalId);
        if (!goal) return;
        const isAssigned = !!(goal.claimedBy || goal.assignedToBoth);
        const newTask: Task = {
          id: generateId(),
          task: goal.name,
          category: 'Other',
          priority: 'Medium',
          timing: goal.endDate ?? 'ASAP',
          status: isAssigned ? 'claimed' : 'pending',
          notes: goal.notes,
          points: goal.points,
          claimedBy: goal.claimedBy,
          assignedBy: goal.assignedBy,
          assignedToBoth: goal.assignedToBoth ?? false,
        };
        set(s => ({
          goals: s.goals.filter(g => g.id !== goalId),
          tasks: [...s.tasks, newTask],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('goals').delete().eq('id', goalId);
              await supabase.from('tasks').insert({ id: newTask.id, task: newTask.task, category: newTask.category, priority: newTask.priority, timing: newTask.timing, status: newTask.status, notes: newTask.notes, points: newTask.points, is_daily: false, claimed_by: newTask.claimedBy ?? null, assigned_by: newTask.assignedBy ?? null, assigned_to_both: newTask.assignedToBoth });
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: `Moved to Tasks`, type: 'info' });
      },

      convertGoalToShopping: (goalId) => {
        const goal = get().goals.find(g => g.id === goalId);
        if (!goal) return;
        const newItem: ShoppingItem = {
          id: generateId(),
          name: goal.name,
          notes: goal.notes,
          points: goal.points,
          status: 'Need to Purchase',
        };
        set(s => ({
          goals: s.goals.filter(g => g.id !== goalId),
          shopping: [...s.shopping, newItem],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('goals').delete().eq('id', goalId);
              await supabase.from('shopping_items').insert({ id: newItem.id, name: newItem.name, notes: newItem.notes, points: newItem.points, status: newItem.status });
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: `Moved to Shopping list`, type: 'info' });
      },

      setActivePlayer: (player) => set({ activePlayer: player }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveTabWithCategory: (tab, category) => set({ activeTab: tab, pendingCategoryFilter: category ?? null }),

      addToast: (toast) => {
        const id = generateId();
        set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));
        setTimeout(() => {
          get().removeToast(id);
        }, 4500);
      },

      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      startContraction: () => {
        const active = get().contractions.find(c => !c.endTime);
        if (active) return;
        const contraction: Contraction = { id: generateId(), startTime: new Date().toISOString() };
        set(s => ({ contractions: [...s.contractions, contraction] }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('contractions').insert({
                id: contraction.id,
                start_time: contraction.startTime,
              } as any);
            } catch (err) { console.error('Supabase startContraction:', err); }
          })();
        }
      },

      stopContraction: () => {
        const active = get().contractions.find(c => !c.endTime);
        if (!active) return;
        const now = new Date().toISOString();
        const duration = Math.round((new Date(now).getTime() - new Date(active.startTime).getTime()) / 1000);
        set(s => ({
          contractions: s.contractions.map(c =>
            c.id === active.id ? { ...c, endTime: now, duration } : c
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('contractions').update({
                end_time: now,
                duration_seconds: duration,
              } as any).eq('id', active.id);
            } catch (err) { console.error('Supabase stopContraction:', err); }
          })();
        }
      },

      deleteContraction: (id) => {
        set(s => ({ contractions: s.contractions.filter(c => c.id !== id) }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try { await supabase.from('contractions').delete().eq('id', id); }
            catch (err) { console.error('Supabase deleteContraction:', err); }
          })();
        }
      },

      clearContractions: () => {
        const ids = get().contractions.map(c => c.id);
        set({ contractions: [] });
        if (SUPABASE_ENABLED && ids.length > 0) {
          (async () => {
            try { await supabase.from('contractions').delete().in('id', ids); }
            catch (err) { console.error('Supabase clearContractions:', err); }
          })();
        }
      },

      updateContractionSettings: (updates) => {
        set(s => ({ contractionSettings: { ...s.contractionSettings, ...updates } }));
      },

      updateSettings: (updates) => {
        set(s => {
          const next = { ...s.settings, ...updates };
          if (SUPABASE_ENABLED) {
            (async () => {
              try {
                await supabase.from('app_settings').upsert({
                  id: 'default',
                  baby_name: next.babyName || 'Luca',
                  due_date: next.dueDate || null,
                  pregnancy_week: next.pregnancyWeek ?? null,
                } as any);
              } catch (err: any) { console.error('Supabase settings sync:', err); }
            })();
          }
          return { settings: next };
        });
      },

      updateSettingsFromSync: (updates) => {
        set(s => ({ settings: { ...s.settings, ...updates } }));
      },
    }),
    {
      name: 'baby-tracker-store',
      partialize: (state) => ({
        tasks: state.tasks,
        shopping: state.shopping,
        goals: state.goals,
        dailyCompletions: state.dailyCompletions,
        scores: state.scores,
        settings: state.settings,
        activePlayer: state.activePlayer,
        previousMilestone: state.previousMilestone,
        contractions: state.contractions,
        contractionSettings: state.contractionSettings,
      }),
      merge: (persisted: any, current) => {
        const ensureBadges = (scores: any) => {
          if (!scores) return current.scores;
          return {
            johnathan: { ...current.scores.johnathan, ...scores.johnathan, badges: scores.johnathan?.badges ?? [] },
            jordyn: { ...current.scores.jordyn, ...scores.jordyn, badges: scores.jordyn?.badges ?? [] },
          };
        };
        return {
          ...current,
          ...(persisted as any),
          scores: ensureBadges((persisted as any)?.scores),
        };
      },
    }
  )
);
