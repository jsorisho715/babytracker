export type Player = 'johnathan' | 'jordyn';
export type PointTier = 5 | 10 | 25 | 50 | 100;
export type TaskStatus = 'pending' | 'claimed' | 'done';

export interface Task {
  id: string;
  category: string;
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  timing: string;
  status: TaskStatus;
  notes?: string;
  points: PointTier;
  completedBy?: Player;
  claimedBy?: Player;
  completedAt?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  price?: number;
  stock?: string;
  status: 'Need to Purchase' | 'Purchased' | 'In Stock';
  notes?: string;
  points: PointTier;
  purchasedBy?: Player;
  purchasedAt?: string;
}

export interface Goal {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  completed?: boolean;
  completedBy?: Player;
  completedAt?: string;
}

export interface PlayerScore {
  player: Player;
  displayName: string;
  totalPoints: number;
  tasksCompleted: number;
  streakDays: number;
  lastCompletedDate?: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockedAt?: string;
}

export interface AppSettings {
  babyName: string;
  dueDate?: string;
  pregnancyWeek?: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  taskId?: string;
  points?: number;
  player?: Player;
  canUndo?: boolean;
}

export type NavTab = 'dashboard' | 'tasks' | 'shopping' | 'goals';
