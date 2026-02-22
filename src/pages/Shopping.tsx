import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { ShoppingItem, PointTier } from '../types';
import PointsBadge from '../components/PointsBadge';
import { Plus, Pencil, Trash2, Check, ShoppingCart, RotateCcw, ArrowRightLeft } from 'lucide-react';

type Filter = 'all' | 'need' | 'purchased';

interface ItemFormProps {
  initial?: Partial<ShoppingItem>;
  onSave: (data: Omit<ShoppingItem, 'id'>) => void;
  onCancel: () => void;
}

function ItemForm({ initial, onSave, onCancel }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price?.toString() ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [points, setPoints] = useState<PointTier>(initial?.points ?? 10);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      price: price ? parseFloat(price) : undefined,
      notes: notes.trim() || undefined,
      points,
      status: initial?.status ?? 'Need to Purchase',
      stock: initial?.stock,
      purchasedBy: initial?.purchasedBy,
      purchasedAt: initial?.purchasedAt,
    });
  };

  return (
    <div className="card border-2 border-sage-200 space-y-3">
      <h4 className="font-display font-700 text-gray-800">{initial ? 'Edit Item' : 'Add Item'}</h4>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Item name"
        className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Price (optional)"
          className="flex-1 px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-500 border-none outline-none focus:ring-2 focus:ring-sage-300"
        />
        <select
          value={points}
          onChange={e => setPoints(Number(e.target.value) as PointTier)}
          className="flex-1 px-3 py-2.5 bg-cream-100 rounded-xl text-sm font-display font-600 border-none outline-none focus:ring-2 focus:ring-sage-300"
        >
          <option value={5}>5 – Quick Win</option>
          <option value={10}>10 – Easy</option>
          <option value={25}>25 – Medium</option>
          <option value={50}>50 – Hard</option>
          <option value={100}>100 – Boss</option>
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

interface ShoppingCardProps {
  item: ShoppingItem;
  onEdit: () => void;
}

function ShoppingCard({ item, onEdit }: ShoppingCardProps) {
  const { purchaseItem, unpurchaseItem, deleteShoppingItem, convertShoppingToTask, convertShoppingToGoal, scores } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const isPurchased = item.status === 'Purchased';

  return (
    <div className={`card flex items-center gap-3 transition-all duration-200 ${isPurchased ? 'opacity-70' : ''}`}>
      <button
        onClick={() => isPurchased ? unpurchaseItem(item.id) : purchaseItem(item.id)}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
          isPurchased
            ? 'bg-sage-400 text-white'
            : 'bg-cream-200 text-warm-gray hover:bg-sage-100 hover:text-sage-500'
        }`}
      >
        {isPurchased ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-display font-600 text-gray-800 ${isPurchased ? 'line-through opacity-60' : ''}`}>
          {item.name}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {item.price && <span className="text-xs text-warm-gray">${item.price.toFixed(2)}</span>}
          <PointsBadge points={item.points as PointTier} />
          {item.purchasedBy && (
            <span className={`text-xs font-display font-600 ${item.purchasedBy === 'johnathan' ? 'text-sage-500' : 'text-rose-medium'}`}>
              ✓ {scores[item.purchasedBy].displayName}
            </span>
          )}
        </div>
        {item.notes && <p className="text-xs text-warm-gray mt-0.5">{item.notes}</p>}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {isPurchased && (
          <button
            onClick={() => unpurchaseItem(item.id)}
            title="Undo purchase"
            className="w-8 h-8 rounded-xl bg-cream-100 text-warm-gray hover:bg-cream-200 flex items-center justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Move to... */}
        {!isPurchased && (
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
                  onClick={() => { convertShoppingToTask(item.id); setShowMove(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-display font-600 text-gray-700 hover:bg-cream-100"
                >
                  ✅ Move to Tasks
                </button>
                <button
                  onClick={() => { convertShoppingToGoal(item.id); setShowMove(false); }}
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
              onClick={() => deleteShoppingItem(item.id)}
              className="text-xs bg-red-100 text-red-600 font-display font-700 px-2 py-1 rounded-lg"
            >
              Delete{isPurchased ? ' (-' + item.points + 'pts)' : ''}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs bg-cream-100 text-warm-gray font-display font-700 px-2 py-1 rounded-lg"
            >
              Cancel
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

export default function Shopping() {
  const { shopping, addShoppingItem, updateShoppingItem, scores } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const byPointsDesc = (a: { points: number }, b: { points: number }) => (b.points ?? 0) - (a.points ?? 0);

  const needItems = [...shopping.filter(i => i.status === 'Need to Purchase')].sort(byPointsDesc);
  const purchasedItems = [...shopping.filter(i => i.status === 'Purchased')].sort(byPointsDesc);

  const filtered =
    filter === 'need' ? needItems :
    filter === 'purchased' ? purchasedItems :
    [...needItems, ...purchasedItems];

  const needCount = shopping.filter(s => s.status === 'Need to Purchase').length;
  const purchasedCount = shopping.filter(s => s.status === 'Purchased').length;

  const johnPoints = shopping.filter(s => s.purchasedBy === 'johnathan').reduce((sum, s) => sum + s.points, 0);
  const jordynPoints = shopping.filter(s => s.purchasedBy === 'jordyn').reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-display font-800 text-sage-500">{johnPoints}</p>
          <p className="text-xs text-warm-gray font-display font-600">{scores.johnathan.displayName} shopping pts</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-800 text-rose-medium">{jordynPoints}</p>
          <p className="text-xs text-warm-gray font-display font-600">{scores.jordyn.displayName} shopping pts</p>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
          {(['all', 'need', 'purchased'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`category-chip flex-shrink-0 whitespace-nowrap ${filter === f ? 'category-chip-active' : ''}`}
            >
              {f === 'all' ? `All (${shopping.length})` : f === 'need' ? `Need (${needCount})` : `Got (${purchasedCount})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {showAdd && (
        <ItemForm
          onSave={data => { addShoppingItem(data); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-warm-gray">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-display font-600">Nothing here yet</p>
          </div>
        )}
        {filtered.map(item => (
          editId === item.id ? (
            <ItemForm
              key={item.id}
              initial={item}
              onSave={data => { updateShoppingItem(item.id, data); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <ShoppingCard
              key={item.id}
              item={item}
              onEdit={() => setEditId(item.id)}
            />
          )
        ))}
      </div>
    </div>
  );
}
