import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Task, PointTier, Player } from '../types';
import { CATEGORY_EMOJIS, TASK_CATEGORIES } from '../data/seedData';
import PointsBadge from '../components/PointsBadge';
import { Plus, Pencil, Trash2, Check, ChevronDown, ChevronUp, Flag, UserPlus, ArrowRightLeft, UserX, Calendar, Search, X } from 'lucide-react';

type Filter = 'all' | 'pending' | 'claimed' | 'done' | 'unassigned';

interface TaskFormProps {
  initial?: Partial<Task>;
  onSave: (data: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

function TaskForm({ initial, onSave, onCancel }: TaskFormProps) {
  const { activePlayer, scores } = useStore();
  const [taskName, setTaskName] = useState(initial?.task ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Nursery');
  const [priority, setPriority] = useState<Task['priority']>(initial?.priority ?? 'Medium');
  const [timing, setTiming] = useState(initial?.timing ?? 'ASAP');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [points, setPoints] = useState<PointTier>(initial?.points ?? 25);
  const [isDaily, setIsDaily] = useState(initial?.isDaily ?? false);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [assignTo, setAssignTo] = useState<'none' | 'me' | 'other' | 'both'>(
    initial?.assignedToBoth ? 'both' : initial?.claimedBy === activePlayer ? 'me' : initial?.claimedBy ? 'other' : 'none'
  );

  const otherPlayer: Player = activePlayer === 'johnathan' ? 'jordyn' : 'johnathan';
  const myName = scores[activePlayer].displayName;
  const otherName = scores[otherPlayer].displayName;

  const handleSave = () => {
    if (!taskName.trim()) return;
    let claimedBy: Player | undefined;
    let assignedBy: Player | undefined;
    let assignedToBoth = false;
    if (assignTo === 'me') { claimedBy = activePlayer; }
    else if (assignTo === 'other') { claimedBy = otherPlayer; assignedBy = activePlayer; }
    else if (assignTo === 'both') { assignedToBoth = true; }
    onSave({
      task: taskName.trim(),
      category,
      priority,
      timing,
      notes: notes.trim() || undefined,
      points,
      isDaily,
      dueDate: dueDate || undefined,
      status: (claimedBy || assignedToBoth) ? 'claimed' : (initial?.status ?? 'pending'),
      completedBy: initial?.completedBy,
      claimedBy: assignTo !== 'none' ? claimedBy : initial?.claimedBy,
      assignedBy: assignTo !== 'none' ? assignedBy : initial?.assignedBy,
      assignedToBoth: assignTo !== 'none' ? assignedToBoth : (initial?.assignedToBoth ?? false),
      completedAt: initial?.completedAt,
    });
  };

  return (
    <div className="card border-2 border-sage-200 space-y-3 animate-fade-in">
      <h4 className="font-display font-700 text-gray-800">{initial?.task ? 'Edit Task' : 'Add Task'}</h4>
      <input
        autoFocus
        type="text"
        value={taskName}
        onChange={e => setTaskName(e.target.value)}
        placeholder="Task description"
        className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-base font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-cream-100 rounded-xl text-base font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
        >
          {TASK_CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
          ))}
          <option value="Other">📋 Other</option>
        </select>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Task['priority'])}
          className="flex-1 px-3 py-2.5 bg-cream-100 rounded-xl text-base font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
        >
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={timing}
          onChange={e => setTiming(e.target.value)}
          placeholder="Timing (e.g. ASAP)"
          className="flex-1 px-4 py-2.5 bg-cream-100 rounded-xl text-base font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
        />
        <select
          value={points}
          onChange={e => setPoints(Number(e.target.value) as PointTier)}
          className="flex-1 px-3 py-2.5 bg-cream-100 rounded-xl text-base font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
        >
          <option value={5}>⭐5 – Quick Win</option>
          <option value={10}>⭐10 – Easy</option>
          <option value={25}>⭐25 – Medium</option>
          <option value={50}>⭐50 – Hard</option>
          <option value={100}>⭐100 – Boss!</option>
        </select>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-warm-gray font-display font-600 block mb-1">Due date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-cream-100 rounded-xl text-base font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-warm-gray font-display font-600 block mb-1">Assign to</label>
          <select
            value={assignTo}
            onChange={e => setAssignTo(e.target.value as 'none' | 'me' | 'other' | 'both')}
            className="w-full px-3 py-2.5 bg-cream-100 rounded-xl text-base font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
          >
            <option value="none">Unassigned</option>
            <option value="me">👤 {myName}</option>
            <option value="other">👤 {otherName}</option>
            <option value="both">🤝 Team Luca</option>
          </select>
        </div>
      </div>
      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-base font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
      />
      {/* Daily toggle */}
      <button
        type="button"
        onClick={() => setIsDaily(v => !v)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-600 w-full transition-colors ${
          isDaily ? 'bg-sage-100 text-sage-600' : 'bg-cream-100 text-warm-gray hover:bg-cream-200'
        }`}
      >
        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isDaily ? 'bg-sage-400 border-sage-400' : 'border-warm-gray'}`}>
          {isDaily && <span className="text-white text-[10px] font-900">✓</span>}
        </span>
        🔄 Repeat daily
      </button>
      <div className="flex gap-2">
        <button onClick={handleSave} className="btn-primary flex-1 py-2 text-sm">Save</button>
        <button onClick={onCancel} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: 'text-red-500',
  Medium: 'text-yellow-600',
  Low: 'text-green-600',
};
const PRIORITY_DOT: Record<string, string> = {
  High: 'bg-red-400',
  Medium: 'bg-yellow-400',
  Low: 'bg-green-400',
};

function TaskCard({ task, onEdit }: TaskCardProps) {
  const {
    activePlayer, claimTask, assignTask, assignTaskToBoth, unassignTask, completeTask, uncompleteTask,
    deleteTask, convertTaskToShopping, convertTaskToGoal, scores,
  } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const isDone = task.status === 'done';
  const isClaimed = task.status === 'claimed';
  const isTeam = !!task.assignedToBoth;
  const otherPlayer: Player = activePlayer === 'johnathan' ? 'jordyn' : 'johnathan';
  const otherName = scores[otherPlayer].displayName;

  const handlePrimary = () => {
    if (isDone) {
      uncompleteTask(task.id);
    } else if (isTeam) {
      completeTask(task.id);
    } else if (isClaimed && task.claimedBy === activePlayer) {
      completeTask(task.id);
    } else if (!isClaimed) {
      claimTask(task.id);
    }
  };

  const primaryDisabled = !isDone && isClaimed && !isTeam && task.claimedBy !== activePlayer;

  const isAssigned = !!task.assignedBy;

  return (
    <div className={`card transition-all duration-200 ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Status indicator / complete button */}
        <button
          onClick={handlePrimary}
          disabled={primaryDisabled}
          className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            isDone
              ? 'bg-sage-400 text-white'
              : isTeam
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-400 hover:text-white'
              : isClaimed && task.claimedBy === activePlayer
              ? 'bg-sage-100 text-sage-500 hover:bg-sage-400 hover:text-white'
              : isClaimed
              ? 'bg-cream-200 text-warm-gray cursor-not-allowed'
              : 'bg-cream-200 text-warm-gray hover:bg-sage-100 hover:text-sage-500'
          }`}
        >
          <Check className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className={`font-display font-600 text-gray-800 text-sm leading-snug ${isDone ? 'line-through opacity-60' : ''}`}>
              {task.task}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
            <span className={`text-xs font-display font-600 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
            <span className="text-xs text-warm-gray">· {task.timing}</span>
            <PointsBadge points={task.points as PointTier} />
            {task.dueDate && (() => {
              const today = new Date().toISOString().slice(0, 10);
              const diff = Math.ceil((new Date(task.dueDate).getTime() - new Date(today).getTime()) / 86400000);
              const color = diff < 0 ? 'text-red-500' : diff <= 3 ? 'text-amber-600' : 'text-warm-gray';
              return (
                <span className={`flex items-center gap-0.5 text-xs font-display font-600 ${color}`}>
                  <Calendar className="w-3 h-3" />
                  {diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Due today' : `Due in ${diff}d`}
                </span>
              );
            })()}
          </div>
          {isClaimed && (
            <p className={`text-xs font-display font-600 mt-0.5 ${isTeam ? 'text-yellow-600' : task.claimedBy === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'}`}>
              {isTeam
                ? '🤝 Team Luca — complete together!'
                : isAssigned
                ? `📌 Assigned to ${scores[task.claimedBy!].displayName} by ${scores[task.assignedBy!].displayName}`
                : `🤚 Claimed by ${scores[task.claimedBy!].displayName}`}
            </p>
          )}
          {isDone && task.completedBy && (
            <p className={`text-xs font-display font-600 mt-0.5 ${task.completedBy === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'}`}>
              ✓ Done by {scores[task.completedBy].displayName}
            </p>
          )}
          {task.notes && (
            <button
              onClick={() => setShowNotes(v => !v)}
              className="text-xs text-sage-500 font-display font-600 mt-1 flex items-center gap-1"
            >
              Note {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          {showNotes && task.notes && (
            <p className="text-xs text-warm-gray mt-1 bg-cream-100 rounded-lg px-3 py-2">{task.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Assign dropdown (only when pending) */}
          {!isDone && !isClaimed && (
            <div className="relative">
              <button
                onClick={() => setShowAssign(v => !v)}
                title="Assign to..."
                className="w-9 h-9 rounded-xl bg-cream-100 text-warm-gray hover:bg-rose-50 hover:text-rose-medium flex items-center justify-center"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
              {showAssign && (
                <div className="absolute right-0 top-10 z-20 bg-white rounded-2xl shadow-md border border-cream-200 min-w-[170px] overflow-hidden">
                  <button
                    onClick={() => { assignTask(task.id, activePlayer); setShowAssign(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-display font-600 text-gray-700 hover:bg-cream-100"
                  >
                    👤 Assign to me
                  </button>
                  <button
                    onClick={() => { assignTask(task.id, otherPlayer); setShowAssign(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-display font-600 text-gray-700 hover:bg-cream-100"
                  >
                    👥 Assign to {otherName}
                  </button>
                  <button
                    onClick={() => { assignTaskToBoth(task.id); setShowAssign(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-display font-600 text-yellow-700 hover:bg-yellow-50 border-t border-cream-200"
                  >
                    🤝 Team task (both)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Unassign (when task is claimed, by assignment or self) */}
          {!isDone && isClaimed && (
            <button
              onClick={() => unassignTask(task.id)}
              title="Unassign"
              className="w-9 h-9 rounded-xl bg-cream-100 text-warm-gray hover:bg-red-50 hover:text-red-400 flex items-center justify-center"
            >
              <UserX className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move to... */}
          {!isDone && (
            <div className="relative">
              <button
                onClick={() => setShowMove(v => !v)}
                title="Move to..."
                className="w-9 h-9 rounded-xl bg-cream-100 text-warm-gray hover:bg-cream-200 flex items-center justify-center"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
              {showMove && (
                <div className="absolute right-0 top-10 z-20 bg-white rounded-2xl shadow-md border border-cream-200 min-w-[140px] overflow-hidden">
                  <button
                    onClick={() => { convertTaskToShopping(task.id); setShowMove(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-display font-600 text-gray-700 hover:bg-cream-100 flex items-center gap-2"
                  >
                    🛒 Move to Shopping
                  </button>
                  <button
                    onClick={() => { convertTaskToGoal(task.id); setShowMove(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-display font-600 text-gray-700 hover:bg-cream-100 flex items-center gap-2"
                  >
                    🎯 Move to Goals
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onEdit}
            className="w-9 h-9 rounded-xl bg-cream-100 text-warm-gray hover:bg-sage-100 hover:text-sage-500 flex items-center justify-center"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => deleteTask(task.id)}
                className="text-xs bg-red-100 text-red-600 font-display font-700 px-3 py-2 rounded-lg whitespace-nowrap min-h-[36px] flex items-center"
              >
                Delete{isDone ? ` (-${task.points}pts)` : ''}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs bg-cream-100 text-warm-gray font-display font-700 px-3 py-2 rounded-lg min-h-[36px] flex items-center"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 rounded-xl bg-cream-100 text-warm-gray hover:bg-red-50 hover:text-red-400 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CategoryGroupProps {
  category: string;
  tasks: Task[];
  defaultOpen: boolean;
  onEdit: (id: string) => void;
  editId: string | null;
  onCancelEdit: () => void;
}

const byPointsDesc = (a: Task, b: Task) => {
  if (a.assignedToBoth && !b.assignedToBoth) return 1;
  if (!a.assignedToBoth && b.assignedToBoth) return -1;
  return (b.points ?? 0) - (a.points ?? 0);
};

function CategoryGroup({ category, tasks, defaultOpen, onEdit, editId, onCancelEdit }: CategoryGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { updateTask } = useStore();
  const emoji = CATEGORY_EMOJIS[category] ?? '📋';
  const done = tasks.filter(t => t.status === 'done').length;
  const allDone = done === tasks.length;
  const sorted = [...tasks].sort(byPointsDesc);

  return (
    <div className="card">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="font-display font-700 text-gray-800">{category}</h3>
          <span className={`text-xs font-display font-700 px-2 py-0.5 rounded-full ${allDone ? 'bg-sage-100 text-sage-600' : 'bg-cream-200 text-warm-gray'}`}>
            {done}/{tasks.length}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-warm-gray" /> : <ChevronDown className="w-4 h-4 text-warm-gray" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {sorted.map(task => (
            editId === task.id ? (
              <TaskForm
                key={task.id}
                initial={task}
                onSave={data => { updateTask(task.id, data); onCancelEdit(); }}
                onCancel={onCancelEdit}
              />
            ) : (
              <TaskCard key={task.id} task={task} onEdit={() => onEdit(task.id)} />
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const { tasks, addTask, scores, pendingCategoryFilter, setActiveTabWithCategory } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dailyOnly, setDailyOnly] = useState(false);
  const [search, setSearch] = useState('');

  // When navigating from Dashboard category progress, apply that category filter
  useEffect(() => {
    if (pendingCategoryFilter) {
      setCategoryFilter(pendingCategoryFilter);
      setDailyOnly(false);
      setFilter('all');
      // Clear the pending filter from store
      setActiveTabWithCategory('tasks', undefined);
    }
  }, [pendingCategoryFilter, setActiveTabWithCategory]);

  const searchLower = search.toLowerCase();
  const filtered = tasks.filter(t => {
    const searchMatch = !search || t.task.toLowerCase().includes(searchLower) || (t.notes ?? '').toLowerCase().includes(searchLower);
    if (!searchMatch) return false;
    if (filter === 'unassigned') return !t.claimedBy && !t.assignedToBoth && t.status !== 'done' && !t.isDaily;
    const statusMatch = filter === 'all' || t.status === filter;
    const catMatch = categoryFilter === 'all' || t.category === categoryFilter;
    const dailyMatch = !dailyOnly || t.isDaily;
    return statusMatch && catMatch && dailyMatch;
  });

  const categories = [...new Set(tasks.map(t => t.category))];
  const groupedByCategory = categories.reduce((acc, cat) => {
    const catTasks = filtered.filter(t => t.category === cat);
    if (catTasks.length > 0) acc[cat] = catTasks;
    return acc;
  }, {} as Record<string, Task[]>);

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    claimed: tasks.filter(t => t.status === 'claimed').length,
    done: tasks.filter(t => t.status === 'done').length,
    unassigned: tasks.filter(t => !t.claimedBy && !t.assignedToBoth && t.status !== 'done' && !t.isDaily).length,
  };

  const johnTasks = tasks.filter(t => t.completedBy === 'johnathan' && t.status === 'done').length;
  const jordynTasks = tasks.filter(t => t.completedBy === 'jordyn' && t.status === 'done').length;

  return (
    <div className="space-y-4">
      {/* Mini leaderboard */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-display font-800 text-sage-500">{johnTasks}</p>
          <p className="text-xs text-warm-gray font-display font-600">{scores.johnathan.displayName} tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-800 text-rose-medium">{jordynTasks}</p>
          <p className="text-xs text-warm-gray font-display font-600">{scores.jordyn.displayName} tasks</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-9 pr-8 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-gray">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="btn-primary h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 p-0"
          title="Add task"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Status filter chips — full width scrollable */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4">
        {([
          { key: 'all', label: `All`, count: counts.all },
          { key: 'pending', label: `Pending`, count: counts.pending },
          { key: 'claimed', label: `In Progress`, count: counts.claimed },
          { key: 'done', label: `Done`, count: counts.done },
          { key: 'unassigned', label: `Unassigned`, count: counts.unassigned },
        ] as { key: Filter; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); if (key === 'unassigned') { setCategoryFilter('all'); setDailyOnly(false); } }}
            className={`flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-display font-700 transition-colors ${
              filter === key ? 'bg-sage-400 text-white' : 'bg-cream-200 text-warm-gray hover:bg-cream-300'
            }`}
          >
            {label}
            <span className={`text-[10px] font-800 px-1.5 py-0.5 rounded-full ${filter === key ? 'bg-white/25 text-white' : 'bg-cream-300 text-warm-gray'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Category filter chips — hidden when Unassigned filter active */}
      {filter !== 'unassigned' && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4">
          <button
            onClick={() => { setCategoryFilter('all'); setDailyOnly(false); }}
            className={`category-chip whitespace-nowrap flex-shrink-0 ${categoryFilter === 'all' && !dailyOnly ? 'category-chip-active' : ''}`}
          >
            📋 All
          </button>
          <button
            onClick={() => { setDailyOnly(v => !v); setCategoryFilter('all'); }}
            className={`category-chip whitespace-nowrap flex-shrink-0 ${dailyOnly ? 'category-chip-active' : ''}`}
          >
            🔄 Daily
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setDailyOnly(false); }}
              className={`category-chip whitespace-nowrap flex-shrink-0 ${categoryFilter === cat && !dailyOnly ? 'category-chip-active' : ''}`}
            >
              {CATEGORY_EMOJIS[cat] ?? '📋'} {cat}
            </button>
          ))}
        </div>
      )}

      {showAdd && (
        <TaskForm
          onSave={data => { addTask(data); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Grouped task list */}
      <div className="space-y-3">
        {Object.keys(groupedByCategory).length === 0 && (
          <div className="text-center py-8 text-warm-gray">
            <Flag className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-display font-600">No tasks match this filter</p>
          </div>
        )}
        {Object.entries(groupedByCategory).map(([cat, catTasks]) => (
          <CategoryGroup
            key={cat}
            category={cat}
            tasks={catTasks}
            defaultOpen={categoryFilter !== 'all' || filter !== 'all' || catTasks.some(t => t.status !== 'done')}
            onEdit={(id) => { setEditId(id); setShowAdd(false); }}
            editId={editId}
            onCancelEdit={() => setEditId(null)}
          />
        ))}
      </div>
    </div>
  );
}
