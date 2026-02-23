import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Task, PointTier, Player } from '../types';
import PointsBadge from '../components/PointsBadge';
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, UserX, ArrowRightLeft, ClipboardList, Search, X } from 'lucide-react';
import { CATEGORY_EMOJIS, TASK_CATEGORIES } from '../data/seedData';

const PRIORITY_DOT: Record<string, string> = {
  High: 'bg-red-400',
  Medium: 'bg-yellow-400',
  Low: 'bg-green-400',
};
const PRIORITY_COLORS: Record<string, string> = {
  High: 'text-red-500',
  Medium: 'text-yellow-600',
  Low: 'text-green-600',
};

interface TaskFormProps {
  initial?: Partial<Task>;
  onSave: (data: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

function TaskForm({ initial, onSave, onCancel }: TaskFormProps) {
  const [taskName, setTaskName] = useState(initial?.task ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Nursery');
  const [priority, setPriority] = useState<Task['priority']>(initial?.priority ?? 'Medium');
  const [timing, setTiming] = useState(initial?.timing ?? 'ASAP');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [points, setPoints] = useState<PointTier>(initial?.points ?? 25);
  const [isDaily, setIsDaily] = useState(initial?.isDaily ?? false);

  const handleSave = () => {
    if (!taskName.trim()) return;
    onSave({
      task: taskName.trim(),
      category,
      priority,
      timing,
      notes: notes.trim() || undefined,
      points,
      isDaily,
      status: initial?.status ?? 'pending',
      completedBy: initial?.completedBy,
      claimedBy: initial?.claimedBy,
      assignedBy: initial?.assignedBy,
      completedAt: initial?.completedAt,
    });
  };

  return (
    <div className="card border-2 border-sage-200 space-y-3 animate-fade-in">
      <h4 className="font-display font-700 text-gray-800">Edit Task</h4>
      <input
        autoFocus
        type="text"
        value={taskName}
        onChange={e => setTaskName(e.target.value)}
        placeholder="Task description"
        className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
        >
          {TASK_CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
          ))}
          <option value="Other">📋 Other</option>
        </select>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Task['priority'])}
          className="flex-1 px-3 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
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
          placeholder="Timing"
          className="flex-1 px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
        />
        <select
          value={points}
          onChange={e => setPoints(Number(e.target.value) as PointTier)}
          className="flex-1 px-3 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
        >
          <option value={5}>⭐5 – Quick Win</option>
          <option value={10}>⭐10 – Easy</option>
          <option value={25}>⭐25 – Medium</option>
          <option value={50}>⭐50 – Hard</option>
          <option value={100}>⭐100 – Boss!</option>
        </select>
      </div>
      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
      />
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

function AssignedTaskCard({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const {
    activePlayer, completeTask, uncompleteTask, unassignTask,
    deleteTask, convertTaskToShopping, convertTaskToGoal, scores,
  } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showMove, setShowMove] = useState(false);

  const isDone = task.status === 'done';
  const isClaimed = task.status === 'claimed';
  const isTeam = !!task.assignedToBoth;
  const isMyTask = task.claimedBy === activePlayer;

  const handlePrimary = () => {
    if (isDone) uncompleteTask(task.id);
    else if (isTeam) completeTask(task.id);
    else if (isClaimed && isMyTask) completeTask(task.id);
  };

  return (
    <div className={`card transition-all duration-200 ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handlePrimary}
          disabled={isDone ? false : (!isMyTask && !isTeam)}
          className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            isDone
              ? 'bg-sage-400 text-white'
              : isTeam
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-400 hover:text-white'
              : isMyTask
              ? 'bg-sage-100 text-sage-500 hover:bg-sage-400 hover:text-white'
              : 'bg-cream-200 text-warm-gray cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-display font-600 text-gray-800 text-sm leading-snug ${isDone ? 'line-through opacity-60' : ''}`}>
            {task.task}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
            <span className={`text-xs font-display font-600 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
            <span className="text-xs text-warm-gray">· {task.timing}</span>
            <PointsBadge points={task.points as PointTier} />
          </div>
          {isTeam && !isDone && (
            <p className="text-xs font-display font-600 mt-0.5 text-yellow-600">
              🤝 Team Luca — complete together!
            </p>
          )}
          {!isTeam && task.assignedBy && task.claimedBy && (
            <p className={`text-xs font-display font-600 mt-0.5 ${task.claimedBy === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'}`}>
              📌 {scores[task.claimedBy].displayName} ← assigned by {scores[task.assignedBy].displayName}
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
          {/* Unassign */}
          {!isDone && (
            <button
              onClick={() => unassignTask(task.id)}
              title="Unassign"
              className="w-8 h-8 rounded-xl bg-cream-100 text-warm-gray hover:bg-red-50 hover:text-red-400 flex items-center justify-center"
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
                className="w-8 h-8 rounded-xl bg-cream-100 text-warm-gray hover:bg-cream-200 flex items-center justify-center"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
              {showMove && (
                <div className="absolute right-0 top-9 z-20 bg-white rounded-2xl shadow-md border border-cream-200 min-w-[140px] overflow-hidden">
                  <button
                    onClick={() => { convertTaskToShopping(task.id); setShowMove(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-display font-600 text-gray-700 hover:bg-cream-100"
                  >
                    🛒 Move to Shopping
                  </button>
                  <button
                    onClick={() => { convertTaskToGoal(task.id); setShowMove(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-display font-600 text-gray-700 hover:bg-cream-100"
                  >
                    🎯 Move to Goals
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-xl bg-cream-100 text-warm-gray hover:bg-sage-100 hover:text-sage-500 flex items-center justify-center"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => deleteTask(task.id)}
                className="text-xs bg-red-100 text-red-600 font-display font-700 px-2 py-1 rounded-lg whitespace-nowrap"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs bg-cream-100 text-warm-gray font-display font-700 px-2 py-1 rounded-lg"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-xl bg-cream-100 text-warm-gray hover:bg-red-50 hover:text-red-400 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type AssignedFilter = 'all' | 'mine' | 'team' | 'unassigned';

const byPointsDesc = (a: Task, b: Task) => {
  // Team Luca tasks always go to the bottom
  if (a.assignedToBoth && !b.assignedToBoth) return 1;
  if (!a.assignedToBoth && b.assignedToBoth) return -1;
  return (b.points ?? 0) - (a.points ?? 0);
};

export default function Assigned() {
  const { tasks, activePlayer, scores, updateTask } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AssignedFilter>('all');
  const [search, setSearch] = useState('');

  const otherPlayer: Player = activePlayer === 'johnathan' ? 'jordyn' : 'johnathan';
  const otherName = scores[otherPlayer].displayName;

  // Tasks assigned to me only (claimed by me, not team)
  const myTasks = tasks.filter(
    t => t.status !== 'done' && t.claimedBy === activePlayer && !t.assignedToBoth
  );

  // Team tasks (assigned to both)
  const teamTasks = tasks.filter(t => t.assignedToBoth && t.status !== 'done');

  // All tasks relevant to me: mine + team
  const toMe = [...myTasks, ...teamTasks];

  // Unassigned tasks — pending, non-daily, no claimedBy, not team
  const unassignedTasks = tasks.filter(
    t => t.status !== 'done' && !t.isDaily && !t.claimedBy && !t.assignedToBoth
  );

  const searchLower = search.toLowerCase();
  const applySearch = (list: Task[]) =>
    !search ? list : list.filter(t => t.task.toLowerCase().includes(searchLower) || (t.notes ?? '').toLowerCase().includes(searchLower));

  const displayed = applySearch(
    filter === 'mine'       ? myTasks :
    filter === 'team'       ? teamTasks :
    filter === 'unassigned' ? unassignedTasks :
    [...new Map([...toMe].map(t => [t.id, t])).values()]
  );

  const hasAny = toMe.length > 0 || unassignedTasks.length > 0;

  // Team progress stat
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const teamProgressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Group displayed tasks by category in TASK_CATEGORIES order
  const allCategories = [...TASK_CATEGORIES, 'Other'];
  const grouped = allCategories
    .map(cat => ({
      category: cat,
      tasks: displayed.filter(t => (t.category || 'Other') === cat).sort(byPointsDesc),
    }))
    .filter(g => g.tasks.length > 0);

  const renderCard = (task: Task) => (
    editId === task.id ? (
      <TaskForm
        key={task.id}
        initial={task}
        onSave={data => { updateTask(task.id, data); setEditId(null); }}
        onCancel={() => setEditId(null)}
      />
    ) : (
      <AssignedTaskCard
        key={task.id}
        task={task}
        onEdit={() => setEditId(task.id)}
      />
    )
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFilter('all')}
          className="card text-center min-h-[72px] flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <p className="text-2xl font-display font-800 text-sage-500">{teamProgressPct}%</p>
          <p className="text-xs text-warm-gray font-display font-600">team progress</p>
        </button>
        <button
          onClick={() => setFilter('mine')}
          className="card text-center min-h-[72px] flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <p className="text-2xl font-display font-800 text-rose-medium">{myTasks.length}</p>
          <p className="text-xs text-warm-gray font-display font-600">my tasks</p>
        </button>
        <button
          onClick={() => setFilter('unassigned')}
          className="card text-center min-h-[72px] flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <p className="text-2xl font-display font-800 text-orange-500">{unassignedTasks.length}</p>
          <p className="text-xs text-warm-gray font-display font-600">unassigned</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search assigned tasks…"
          className="w-full pl-9 pr-9 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter tabs — horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1.5 min-w-max">
          {([
            { key: 'all', label: `All (${toMe.length})` },
            { key: 'mine', label: `Mine (${myTasks.length})` },
            { key: 'team', label: `Team (${teamTasks.length})` },
            { key: 'unassigned', label: `Unassigned (${unassignedTasks.length})` },
          ] as { key: AssignedFilter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-display font-700 transition-colors whitespace-nowrap ${
                filter === key
                  ? 'bg-sage-400 text-white'
                  : 'bg-cream-200 text-warm-gray hover:bg-cream-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!hasAny && (
        <div className="card text-center py-10">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-warm-gray opacity-30" />
          <p className="font-display font-700 text-gray-700 mb-1">No assigned tasks</p>
          <p className="text-xs text-warm-gray font-display">
            Tap the person-plus icon on any pending task to assign it to yourself or {otherName}.
          </p>
        </div>
      )}

      {hasAny && displayed.length === 0 && (
        <div className="card text-center py-8">
          <p className="font-display font-700 text-gray-500">Nothing here</p>
          <p className="text-xs text-warm-gray font-display mt-1">Switch filter to see tasks</p>
        </div>
      )}

      {/* Category groups */}
      {grouped.map(({ category, tasks: catTasks }) => (
        <div key={category} className="card space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{CATEGORY_EMOJIS[category] ?? '📋'}</span>
            <h3 className="font-display font-700 text-gray-800 text-sm">{category}</h3>
            <span className="text-xs font-display font-600 px-2 py-0.5 rounded-full bg-cream-200 text-warm-gray">
              {catTasks.length}
            </span>
          </div>
          {catTasks.map(task => renderCard(task))}
        </div>
      ))}
    </div>
  );
}
