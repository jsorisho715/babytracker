import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task, ShoppingItem, Goal, Player, PlayerScore, AppSettings, Toast, NavTab, Badge
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

interface AppState {
  tasks: Task[];
  shopping: ShoppingItem[];
  goals: Goal[];
  scores: Record<Player, PlayerScore>;
  settings: AppSettings;
  activePlayer: Player;
  activeTab: NavTab;
  toasts: Toast[];
  isLoaded: boolean;
  previousMilestone: number;

  // Actions - tasks
  loadSeedData: (force?: boolean) => Promise<void>;
  syncToSupabase: () => Promise<void>;
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

  // Actions - conversions
  convertTaskToShopping: (taskId: string) => void;
  convertTaskToGoal: (taskId: string) => void;
  convertShoppingToTask: (itemId: string) => void;
  convertShoppingToGoal: (itemId: string) => void;
  convertGoalToTask: (goalId: string) => void;
  convertGoalToShopping: (goalId: string) => void;

  // UI
  setActivePlayer: (player: Player) => void;
  setActiveTab: (tab: NavTab) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateSettingsFromSync: (settings: Partial<AppSettings>) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
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
      scores: DEFAULT_SCORES,
      settings: DEFAULT_SETTINGS,
      activePlayer: 'johnathan',
      activeTab: 'dashboard',
      toasts: [],
      isLoaded: false,
      previousMilestone: 0,

      loadSeedData: (force = false) => {
        const { isLoaded } = get();
        if (isLoaded && !force) return Promise.resolve();
        
        // If Supabase is enabled, try to load from there
        if (SUPABASE_ENABLED) {
          return Promise.all([
            supabase.from('tasks').select('*'),
            supabase.from('shopping_items').select('*'),
            supabase.from('goals').select('*'),
            supabase.from('player_scores').select('*'),
            supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle()
          ]).then(([tasksRes, shoppingRes, goalsRes, scoresRes, settingsRes]) => {
            const settingsRow = settingsRes.data;
            const settings = settingsRow ? {
              babyName: settingsRow.baby_name ?? 'Luca',
              dueDate: settingsRow.due_date ?? undefined,
              pregnancyWeek: settingsRow.pregnancy_week ?? undefined,
            } : get().settings;

            if (tasksRes.data?.length || force) {
              const tasks = (tasksRes.data || []).map(t => ({
                ...t,
                points: t.points as any,
                status: t.status as any,
                claimedBy: t.claimed_by ?? undefined,
                completedBy: t.completed_by ?? undefined,
                completedAt: t.completed_at ?? undefined,
                assignedBy: t.assigned_by ?? undefined,
                isDaily: t.is_daily ?? false,
                assignedToBoth: t.assigned_to_both ?? false,
              }));
              const shopping = shoppingRes.data?.map(s => ({
                ...s,
                points: s.points as any,
                status: s.status as any
              })) ?? [];
              const goals = goalsRes.data ?? [];
              const playerScores = scoresRes.data ?? [];
              
              const mapScore = (raw: any, defaultVal: PlayerScore): PlayerScore => ({
                ...defaultVal,
                ...raw,
                totalPoints: raw?.total_points ?? defaultVal.totalPoints,
                tasksCompleted: raw?.tasks_completed ?? defaultVal.tasksCompleted,
                streakDays: raw?.streak_days ?? defaultVal.streakDays,
                lastCompletedDate: raw?.last_completed_date ?? defaultVal.lastCompletedDate,
                displayName: raw?.display_name ?? defaultVal.displayName,
                badges: defaultVal.badges,
              });

              const scores: Record<Player, PlayerScore> = {
                johnathan: mapScore(playerScores.find(s => s.player === 'johnathan'), DEFAULT_SCORES.johnathan),
                jordyn: mapScore(playerScores.find(s => s.player === 'jordyn'), DEFAULT_SCORES.jordyn),
              };

              set({ tasks, shopping, goals, scores, settings, isLoaded: true });
            } else {
              // No data in Supabase, load seeds and sync
              set({ tasks: seedTasks, shopping: seedShoppingItems, goals: seedGoals, settings, isLoaded: true });
              get().syncToSupabase();
            }
          }).catch(() => {
            // Fallback to seeds if Supabase fails
            set({ tasks: seedTasks, shopping: seedShoppingItems, goals: seedGoals, isLoaded: true });
          }) as Promise<void>;
        } else {
          // LocalStorage only
          set({ tasks: seedTasks, shopping: seedShoppingItems, goals: seedGoals, isLoaded: true });
          return Promise.resolve();
        }
      },

      syncToSupabase: async () => {
        if (!SUPABASE_ENABLED) return;
        const { tasks, shopping, goals, scores, settings } = get();
        
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
              completed_at: g.completedAt
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
            } as any)
          ]);
        } catch (err) {
          console.error('Failed to sync to Supabase:', err);
        }
      },

      addTask: (taskData) => {
        const task: Task = { ...taskData, id: generateId() };
        set(s => ({ tasks: [...s.tasks, task] }));
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
                }).eq('id', id);
              } catch (err: any) { console.error('Supabase updateTask:', err); }
            })();
          }
          return result;
        });
      },

      deleteTask: (id) => {
        set(s => {
          const task = s.tasks.find(t => t.id === id);
          const tasks = s.tasks.filter(t => t.id !== id);
          if (task?.status === 'done' && task.completedBy) {
            const player = task.completedBy;
            const scores = {
              ...s.scores,
              [player]: {
                ...s.scores[player],
                totalPoints: Math.max(0, s.scores[player].totalPoints - task.points),
                tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
              },
            };
            return { tasks, scores };
          }
          return { tasks };
        });
      },

      claimTask: (id) => {
        const { activePlayer } = get();
        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === id && t.status === 'pending'
              ? { ...t, status: 'claimed', claimedBy: activePlayer, assignedBy: undefined }
              : t
          ),
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').update({ status: 'claimed', claimed_by: get().activePlayer, assigned_by: null }).eq('id', id);
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
      },

      assignTask: (taskId, assignTo) => {
        const { activePlayer } = get();
        const isSelf = assignTo === activePlayer;
        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === taskId && t.status === 'pending'
              ? {
                  ...t,
                  status: 'claimed',
                  claimedBy: assignTo,
                  assignedBy: isSelf ? undefined : activePlayer,
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
              }).eq('id', taskId);
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        const assigneeName = isSelf ? 'yourself' : assignTo === 'johnathan' ? 'Johnathan' : 'Jordyn';
        get().addToast({ message: `Task assigned to ${assigneeName}!`, type: 'info' });
      },

      assignTaskToBoth: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'pending') return;
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
            } catch (err: any) { console.error('Supabase sync error:', err); }
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
        const { activePlayer, tasks, shopping, scores, previousMilestone } = get();
        const task = tasks.find(t => t.id === id);
        if (!task || task.status === 'done') return;

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

        // Check milestones
        const nextMilestone = MILESTONE_MESSAGES.find(m => m.points > previousMilestone && m.points <= totalNow);

        // Sync to Supabase if enabled (fire and forget)
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').update({ 
                status: 'done', 
                completed_by: activePlayer, 
                completed_at: now,
                claimed_by: null 
              }).eq('id', id);
              
              await supabase.from('player_scores').update({
                total_points: newScore.totalPoints,
                tasks_completed: newScore.tasksCompleted,
                streak_days: newScore.streakDays,
                last_completed_date: newScore.lastCompletedDate
              }).eq('player', activePlayer);
              
              console.log('Synced to Supabase');
            } catch (err: any) {
              console.error('Supabase sync error:', err);
            }
          })();
        }

        set({
          tasks: updatedTasks,
          scores: newScores,
          previousMilestone: nextMilestone ? nextMilestone.points : previousMilestone,
        });

        // Toast notifications
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
          get().addToast({
            message: `${newBadges[0].emoji} Badge unlocked: ${newBadges[0].name}!`,
            type: 'info',
          });
        }

        if (nextMilestone) {
          get().addToast({ message: nextMilestone.message, type: 'info' });
        }

        if (streakBonus > 0) {
          get().addToast({ message: `🔥 3-day streak! +${streakBonus} bonus pts`, type: 'info' });
        }
      },

      uncompleteTask: (id) => {
        set(s => {
          const task = s.tasks.find(t => t.id === id);
          if (!task || task.status !== 'done' || !task.completedBy) return s;
          const player = task.completedBy;
          const tasks = s.tasks.map(t =>
            t.id === id ? { ...t, status: 'pending' as const, completedBy: undefined, completedAt: undefined } : t
          );
          const scores = {
            ...s.scores,
            [player]: {
              ...s.scores[player],
              totalPoints: Math.max(0, s.scores[player].totalPoints - task.points),
              tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
            },
          };
          return { tasks, scores };
        });
      },

      addShoppingItem: (itemData) => {
        const item: ShoppingItem = { ...itemData, id: generateId() };
        set(s => ({ shopping: [...s.shopping, item] }));
      },

      updateShoppingItem: (id, updates) => {
        set(s => {
          const shopping = s.shopping.map(i => i.id === id ? { ...i, ...updates } : i);
          const original = s.shopping.find(i => i.id === id);
          if (original?.status === 'Purchased' && updates.status === 'Need to Purchase' && original.purchasedBy) {
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
        set(s => {
          const item = s.shopping.find(i => i.id === id);
          const shopping = s.shopping.filter(i => i.id !== id);
          if (item?.status === 'Purchased' && item.purchasedBy) {
            const player = item.purchasedBy;
            const scores = {
              ...s.scores,
              [player]: {
                ...s.scores[player],
                totalPoints: Math.max(0, s.scores[player].totalPoints - item.points),
                tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
              },
            };
            return { shopping, scores };
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
        }
      },

      unpurchaseItem: (id) => {
        set(s => {
          const item = s.shopping.find(i => i.id === id);
          if (!item || item.status !== 'Purchased' || !item.purchasedBy) return s;
          const player = item.purchasedBy;
          const shopping = s.shopping.map(i =>
            i.id === id ? { ...i, status: 'Need to Purchase' as const, purchasedBy: undefined, purchasedAt: undefined } : i
          );
          const scores = {
            ...s.scores,
            [player]: {
              ...s.scores[player],
              totalPoints: Math.max(0, s.scores[player].totalPoints - item.points),
              tasksCompleted: Math.max(0, s.scores[player].tasksCompleted - 1),
            },
          };
          return { shopping, scores };
        });
      },

      addGoal: (goalData) => {
        const goal: Goal = { ...goalData, id: generateId() };
        set(s => ({ goals: [...s.goals, goal] }));
      },

      updateGoal: (id, updates) => {
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
      },

      deleteGoal: (id) => {
        set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
      },

      completeGoal: (id) => {
        const { activePlayer } = get();
        set(s => ({
          goals: s.goals.map(g =>
            g.id === id ? { ...g, completed: !g.completed, completedBy: activePlayer, completedAt: new Date().toISOString() } : g
          ),
        }));
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

      convertTaskToGoal: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;
        const newGoal: Goal = {
          id: generateId(),
          name: task.task,
          notes: task.notes,
          completed: false,
        };
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== taskId),
          goals: [...s.goals, newGoal],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('tasks').delete().eq('id', taskId);
              await supabase.from('goals').insert({ id: newGoal.id, name: newGoal.name, notes: newGoal.notes, completed: false });
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
        };
        set(s => ({
          shopping: s.shopping.filter(i => i.id !== itemId),
          tasks: [...s.tasks, newTask],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('shopping_items').delete().eq('id', itemId);
              await supabase.from('tasks').insert({ id: newTask.id, task: newTask.task, category: newTask.category, priority: newTask.priority, timing: newTask.timing, status: newTask.status, notes: newTask.notes, points: newTask.points, is_daily: newTask.isDaily ?? false });
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
        };
        set(s => ({
          shopping: s.shopping.filter(i => i.id !== itemId),
          goals: [...s.goals, newGoal],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('shopping_items').delete().eq('id', itemId);
              await supabase.from('goals').insert({ id: newGoal.id, name: newGoal.name, notes: newGoal.notes, completed: false });
            } catch (err: any) { console.error('Supabase sync error:', err); }
          })();
        }
        get().addToast({ message: `Moved to Goals`, type: 'info' });
      },

      convertGoalToTask: (goalId) => {
        const goal = get().goals.find(g => g.id === goalId);
        if (!goal) return;
        const newTask: Task = {
          id: generateId(),
          task: goal.name,
          category: 'Other',
          priority: 'Medium',
          timing: goal.endDate ?? 'ASAP',
          status: 'pending',
          notes: goal.notes,
          points: 25,
        };
        set(s => ({
          goals: s.goals.filter(g => g.id !== goalId),
          tasks: [...s.tasks, newTask],
        }));
        if (SUPABASE_ENABLED) {
          (async () => {
            try {
              await supabase.from('goals').delete().eq('id', goalId);
              await supabase.from('tasks').insert({ id: newTask.id, task: newTask.task, category: newTask.category, priority: newTask.priority, timing: newTask.timing, status: newTask.status, notes: newTask.notes, points: newTask.points, is_daily: newTask.isDaily ?? false });
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
          points: 10,
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

      addToast: (toast) => {
        const id = generateId();
        set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));
        setTimeout(() => {
          get().removeToast(id);
        }, 4500);
      },

      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

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
        scores: state.scores,
        settings: state.settings,
        activePlayer: state.activePlayer,
        previousMilestone: state.previousMilestone,
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
