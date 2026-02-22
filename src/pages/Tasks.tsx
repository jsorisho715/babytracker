import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Task, PointTier, Player } from '../types';
import { CATEGORY_EMOJIS, TASK_CATEGORIES } from '../data/seedData';
import PointsBadge from '../components/PointsBadge';
import { Plus, Pencil, Trash2, Check, ChevronDown, ChevronUp, Flag, UserPlus, ArrowRightLeft } from 'lucide-react';

type Filter = 'all' | 'pending' | 'claimed' | 'done';

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

  const handleSave = () => {
    if (!taskName.trim()) return;
    onSave({
      task: taskName.trim(),
      category,
      priority,
      timing,
      notes: notes.trim() || undefined,
      points,
      status: initial?.status ?? 'pending',
      completedBy: initial?.completedBy,
      claimedBy: initial?.claimedBy,
      assignedBy: initial?.assignedBy,
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
          placeholder="Timing (e.g. ASAP, Week 35)"
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
    activePlayer, claimTask, assignTask, completeTask, uncompleteTask,
    deleteTask, convertTaskToShopping, convertTaskToGoal, scores,
  } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showMove, setShowMove] = useState(false);

  const isDone = task.status === 'done';
  const isClaimed = task.status === 'claimed';
  const otherPlayer: Player = activePlayer === 'johnathan' ? 'jordyn' : 'johnathan';
  const otherName = scores[otherPlayer].displayName;

  const handlePrimary = () => {
    if (isDone) {
      uncompleteTask(task.id);
    } else if (isClaimed && task.claimedBy === activePlayer) {
      completeTask(task.id);
    } else if (!isClaimed) {
      claimTask(task.id);
    }
  };

  const primaryDisabled = isClaimed && task.claimedBy !== activePlayer && !isDone;

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
          </div>
          {isClaimed && (
            <p className={`text-xs font-display font-600 mt-0.5 ${task.claimedBy === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'}`}>
              {isAssigned
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
          {/* Assign to other player (only when pending) */}
          {!isDone && !isClaimed && (
            <button
              onClick={() => assignTask(task.id, otherPlayer)}
              title={`Assign to ${otherName}`}
              className="w-8 h-8 rounded-xl bg-cream-100 text-warm-gray hover:bg-rose-50 hover:text-rose-medium flex items-center justify-center"
            >
              <UserPlus className="w-3.5 h-3.5" />
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
                Delete{isDone ? ` (-${task.points}pts)` : ''}
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

interface CategoryGroupProps {
  category: string;
  tasks: Task[];
  defaultOpen: boolean;
  onEdit: (id: string) => void;
  editId: string | null;
  onCancelEdit: () => void;
}

function CategoryGroup({ category, tasks, defaultOpen, onEdit, editId, onCancelEdit }: CategoryGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { updateTask } = useStore();
  const emoji = CATEGORY_EMOJIS[category] ?? '📋';
  const done = tasks.filter(t => t.status === 'done').length;
  const allDone = done === tasks.length;

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
          {tasks.map(task => (
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

function AssignedSection({ tasks, editId, onEdit, onCancelEdit }: {
  tasks: Task[];
  editId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}) {
  const { updateTask, scores, activePlayer } = useStore();
  const [open, setOpen] = useState(true);

  const assignerName = tasks.length > 0 && tasks[0].assignedBy
    ? scores[tasks[0].assignedBy].displayName
    : 'them';

  return (
    <div className="card border-2 border-rose-light">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📌</span>
          <h3 className="font-display font-700 text-gray-800">
            Assigned to {scores[activePlayer].displayName}
          </h3>
          <span className="text-xs font-display font-700 px-2 py-0.5 rounded-full bg-rose-light text-rose-medium">
            {tasks.length}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-warm-gray" /> : <ChevronDown className="w-4 h-4 text-warm-gray" />}
      </button>
      {tasks.length > 0 && (
        <p className="text-xs text-warm-gray mt-1 font-display">
          From {assignerName} — complete these to earn points!
        </p>
      )}
      {open && (
        <div className="mt-3 space-y-2">
          {tasks.map(task => (
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
  const { tasks, addTask, scores, activePlayer } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const assignedToMe = tasks.filter(
    t => t.claimedBy === activePlayer && t.assignedBy && t.assignedBy !== activePlayer && t.status !== 'done'
  );

  const filtered = tasks.filter(t => {
    const isAssignedToMe = t.claimedBy === activePlayer && t.assignedBy && t.assignedBy !== activePlayer && t.status !== 'done';
    if (isAssignedToMe) return false; // shown separately
    const statusMatch = filter === 'all' || t.status === filter;
    const catMatch = categoryFilter === 'all' || t.category === categoryFilter;
    return statusMatch && catMatch;
  });

  const categories = [...new Set(tasks.map(t => t.category))];
  const groupedByCategory = categories.reduce((acc, cat) => {
    const catTasks = filtered.filter(t => t.category === cat);
    if (catTasks.length > 0) acc[cat] = catTasks;
    return acc;
  }, {} as Record<string, Task[]>);

  const counts = {
    all: tasks.filter(t => !(t.claimedBy === activePlayer && t.assignedBy && t.assignedBy !== activePlayer && t.status !== 'done')).length,
    pending: tasks.filter(t => t.status === 'pending').length,
    claimed: tasks.filter(t => t.status === 'claimed').length,
    done: tasks.filter(t => t.status === 'done').length,
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

      {/* Assigned to you section */}
      {assignedToMe.length > 0 && (
        <AssignedSection
          tasks={assignedToMe}
          editId={editId}
          onEdit={(id) => { setEditId(id); setShowAdd(false); }}
          onCancelEdit={() => setEditId(null)}
        />
      )}

      {/* Status filter + Add */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(['all', 'pending', 'claimed', 'done'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`category-chip whitespace-nowrap flex-shrink-0 ${filter === f ? 'category-chip-active' : ''}`}
            >
              {f === 'all' ? `All (${counts.all})` : f === 'pending' ? `Pending (${counts.pending})` : f === 'claimed' ? `In Progress (${counts.claimed})` : `Done (${counts.done})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`category-chip whitespace-nowrap flex-shrink-0 ${categoryFilter === 'all' ? 'category-chip-active' : ''}`}
        >
          📋 All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`category-chip whitespace-nowrap flex-shrink-0 ${categoryFilter === cat ? 'category-chip-active' : ''}`}
          >
            {CATEGORY_EMOJIS[cat] ?? '📋'} {cat}
          </button>
        ))}
      </div>

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
