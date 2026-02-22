import { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, loadSeedData, resetToSeed, resetScores } = useStore();
  const [babyName, setBabyName] = useState(settings.babyName);
  const [dueDate, setDueDate] = useState(settings.dueDate ?? '');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetScores, setConfirmResetScores] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resettingScores, setResettingScores] = useState(false);

  const handleSave = () => {
    updateSettings({ babyName: babyName.trim() || 'Luca', dueDate: dueDate || undefined });
    onClose();
  };

  const handleReset = async () => {
    setResetting(true);
    localStorage.removeItem('baby-tracker-store');
    await resetToSeed();
    setResetting(false);
    onClose();
  };

  const handleReimport = () => {
    loadSeedData(true);
    onClose();
  };

  const handleResetScores = async () => {
    setResettingScores(true);
    await resetScores();
    setResettingScores(false);
    setConfirmResetScores(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-800 text-gray-800 text-lg">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-cream-100 flex items-center justify-center text-warm-gray">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-display font-700 text-gray-700 block mb-1">Baby name</label>
            <input
              type="text"
              value={babyName}
              onChange={e => setBabyName(e.target.value)}
              placeholder="e.g. Luca"
              className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display border-none outline-none focus:ring-2 focus:ring-sage-300"
            />
          </div>
          <div>
            <label className="text-sm font-display font-700 text-gray-700 block mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-cream-100 rounded-xl text-sm font-display border-none outline-none focus:ring-2 focus:ring-sage-300"
            />
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary w-full">Save Settings</button>

        <hr className="border-cream-200" />

        <div className="space-y-2">
          <p className="text-xs font-display font-700 text-warm-gray uppercase tracking-wide">Data</p>
          <button
            onClick={handleReimport}
            className="w-full text-left text-sm font-display font-600 text-sage-600 bg-sage-50 hover:bg-sage-100 rounded-xl px-4 py-2.5 transition-colors"
          >
            Re-import checklist from Excel data
          </button>
          {!confirmResetScores ? (
            <button
              onClick={() => setConfirmResetScores(true)}
              className="w-full text-left text-sm font-display font-600 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl px-4 py-2.5 transition-colors"
            >
              Reset points only
            </button>
          ) : (
            <div className="bg-amber-50 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs text-amber-800 font-display font-600">
                Zero all player points and task counts. Tasks, shopping, and goals stay unchanged.
              </p>
              <div className="flex gap-2">
                <button onClick={handleResetScores} disabled={resettingScores} className="flex-1 bg-amber-500 text-white font-display font-700 rounded-xl py-2 text-sm disabled:opacity-60">
                  {resettingScores ? 'Resetting…' : 'Yes, Reset Points'}
                </button>
                <button onClick={() => setConfirmResetScores(false)} className="flex-1 bg-cream-100 text-warm-gray font-display font-700 rounded-xl py-2 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full text-left text-sm font-display font-600 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl px-4 py-2.5 transition-colors"
            >
              Reset all data
            </button>
          ) : (
            <div className="bg-red-50 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-display font-600">
                  This will erase all progress, scores, and data. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleReset} disabled={resetting} className="flex-1 bg-red-500 text-white font-display font-700 rounded-xl py-2 text-sm disabled:opacity-60">
                  {resetting ? 'Resetting…' : 'Yes, Reset'}
                </button>
                <button onClick={() => setConfirmReset(false)} className="flex-1 bg-cream-100 text-warm-gray font-display font-700 rounded-xl py-2 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
