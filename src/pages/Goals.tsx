import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Goal } from '../types';
import { Plus, Pencil, Trash2, Check, Target, ArrowRightLeft } from 'lucide-react';

interface GoalFormProps {
  initial?: Partial<Goal>;
  onSave: (data: Omit<Goal, 'id'>) => void;
  onCancel: () => void;
}

function GoalForm({ initial, onSave, onCancel }: GoalFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [points, setPoints] = useState<5 | 10 | 25 | 50 | 100>(initial?.points ?? 25);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined,
      points,
      completed: initial?.completed ?? false,
      completedBy: initial?.completedBy,
      completedAt: initial?.completedAt,
    });
  };

  return (
    <div className="card border-2 border-sage-200 space-y-3 animate-fade-in">
      <h4 className="font-display font-700 text-gray-800">{initial?.name ? 'Edit Goal' : 'Add Goal'}</h4>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Goal name"
        className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-warm-gray font-display font-600 block mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-warm-gray font-display font-600 block mb-1">Target date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
          />
        </div>
      </div>
      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
      />
      <div>
        <label className="text-xs text-warm-gray font-display font-600 block mb-1">Points</label>
        <select
          value={points}
          onChange={e => setPoints(parseInt(e.target.value) as 5 | 10 | 25 | 50 | 100)}
          className="w-full px-3 py-2 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
        >
          <option value={5}>5 pts - Quick win</option>
          <option value={10}>10 pts - Easy</option>
          <option value={25}>25 pts - Medium</option>
          <option value={50}>50 pts - Hard</option>
          <option value={100}>100 pts - Boss level</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="btn-primary flex-1 py-2 text-sm">Save</button>
        <button onClick={onCancel} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
}

function GoalCard({ goal, onEdit }: GoalCardProps) {
  const { completeGoal, deleteGoal, convertGoalToTask, convertGoalToShopping, scores } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMove, setShowMove] = useState(false);

  const formatDate = (d?: string) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`card flex items-start gap-3 transition-all ${goal.completed ? 'opacity-70' : ''}`}>
      <button
        onClick={() => completeGoal(goal.id)}
        className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
          goal.completed
            ? 'bg-sage-400 text-white'
            : 'bg-cream-200 text-warm-gray hover:bg-sage-100 hover:text-sage-500'
        }`}
      >
        <Check className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-display font-600 text-gray-800 ${goal.completed ? 'line-through opacity-60' : ''}`}>
          {goal.name}
        </p>
        {(goal.startDate || goal.endDate) && (
          <p className="text-xs text-warm-gray mt-0.5">
            {goal.startDate && <span>From {formatDate(goal.startDate)} </span>}
            {goal.endDate && <span>→ {formatDate(goal.endDate)}</span>}
          </p>
        )}
        {goal.notes && <p className="text-xs text-warm-gray mt-1">{goal.notes}</p>}
        {goal.completed && goal.completedBy && (
          <p className={`text-xs font-display font-600 mt-0.5 ${goal.completedBy === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'}`}>
            ✓ Completed by {scores[goal.completedBy].displayName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Move to... */}
        {!goal.completed && (
          <div className="relative">
            <button
              onClick={() => setShowMove(v => !v)}
              title="Move to..."
              className="w-8 h-8 rounded-xl bg-cream-100 text-warm-gray hover:bg-cream-200 flex items-center justify-center"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            {showMove && (
              <div className="absolute right-0 top-9 z-20 bg-white rounded-2xl shadow-md border border-cream-200 min-w-[150px] overflow-hidden">
                <button
                  onClick={() => { convertGoalToTask(goal.id); setShowMove(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-display font-600 text-gray-700 hover:bg-cream-100"
                >
                  ✅ Move to Tasks
                </button>
                <button
                  onClick={() => { convertGoalToShopping(goal.id); setShowMove(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-display font-600 text-gray-700 hover:bg-cream-100"
                >
                  🛒 Move to Shopping
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
            <button onClick={() => deleteGoal(goal.id)} className="text-xs bg-red-100 text-red-600 font-display font-700 px-2 py-1 rounded-lg">
              Delete
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs bg-cream-100 text-warm-gray font-display font-700 px-2 py-1 rounded-lg">
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
  );
}

export default function Goals() {
  const { goals, addGoal, updateGoal } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const active = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sage-100 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-sage-500" />
          </div>
          <div>
            <h2 className="font-display font-800 text-gray-800">Goals & Ideas</h2>
            <p className="text-sm text-warm-gray">{active.length} active · {completed.length} done</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {showAdd && (
        <GoalForm
          onSave={data => { addGoal(data); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Active goals */}
      <div className="space-y-2">
        {active.length === 0 && !showAdd && (
          <div className="text-center py-8 text-warm-gray">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-display font-600">Add your first goal!</p>
          </div>
        )}
        {active.map(goal => (
          editId === goal.id ? (
            <GoalForm
              key={goal.id}
              initial={goal}
              onSave={data => { updateGoal(goal.id, data); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <GoalCard key={goal.id} goal={goal} onEdit={() => setEditId(goal.id)} />
          )
        ))}
      </div>

      {/* Completed goals */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(v => !v)}
            className="text-sm font-display font-700 text-warm-gray flex items-center gap-1 mb-2"
          >
            {showDone ? '▼' : '▶'} Completed ({completed.length})
          </button>
          {showDone && (
            <div className="space-y-2">
              {completed.map(goal => (
                editId === goal.id ? (
                  <GoalForm
                    key={goal.id}
                    initial={goal}
                    onSave={data => { updateGoal(goal.id, data); setEditId(null); }}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <GoalCard key={goal.id} goal={goal} onEdit={() => setEditId(goal.id)} />
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
