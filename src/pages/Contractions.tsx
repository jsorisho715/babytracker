import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { Contraction, ContractionSettings } from '../types';
import { Trash2, Settings as SettingsIcon, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTimeLong(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

type LaborPhase = 'none' | 'early' | 'active' | 'transition';

function getLaborPhase(avgFreqSec: number | null, avgDurSec: number | null): LaborPhase {
  if (avgDurSec === null) return 'none';
  if (avgFreqSec === null) return avgDurSec >= 20 ? 'early' : 'none';
  if (avgFreqSec < 180 && avgDurSec >= 60) return 'transition';
  if (avgFreqSec <= 300 && avgDurSec >= 45) return 'active';
  if (avgDurSec >= 20) return 'early';
  return 'none';
}

const PHASE_CONFIG: Record<LaborPhase, { label: string; color: string; bg: string; desc: string }> = {
  none: { label: 'Not Active', color: 'text-warm-gray', bg: 'bg-cream-200', desc: 'Start timing contractions' },
  early: { label: 'Early Labor', color: 'text-sage-600', bg: 'bg-sage-50', desc: 'Stay calm, rest when you can' },
  active: { label: 'Active Labor', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Contractions getting stronger' },
  transition: { label: 'Transition', color: 'text-red-600', bg: 'bg-red-50', desc: 'Almost there — you\'re doing great' },
};

function check511(contractions: Contraction[], settings: ContractionSettings): boolean {
  const completed = contractions.filter(c => c.endTime && c.duration);
  if (completed.length < 3) return false;

  const windowMs = settings.alertWindowMin * 60 * 1000;
  const now = Date.now();
  const recent = completed.filter(c => now - new Date(c.startTime).getTime() < windowMs);
  if (recent.length < 3) return false;

  const avgDur = recent.reduce((s, c) => s + (c.duration ?? 0), 0) / recent.length;
  if (avgDur < settings.alertDurationMin * 60) return false;

  let totalFreq = 0;
  for (let i = 1; i < recent.length; i++) {
    totalFreq += (new Date(recent[i].startTime).getTime() - new Date(recent[i - 1].startTime).getTime()) / 1000;
  }
  const avgFreq = totalFreq / (recent.length - 1);
  return avgFreq <= settings.alertFrequencyMin * 60;
}

function useElapsed(startIso: string | null): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startIso) { setElapsed(0); return; }
    const start = new Date(startIso).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);
  return elapsed;
}

function TimerDisplay() {
  const { contractions, startContraction, stopContraction } = useStore();
  const active = contractions.find(c => !c.endTime);
  const lastCompleted = [...contractions].reverse().find(c => c.endTime);

  const elapsed = useElapsed(active?.startTime ?? null);
  const restElapsed = useElapsed(!active && lastCompleted ? lastCompleted.endTime! : null);

  const isActive = !!active;

  const handleTap = useCallback(() => {
    if (isActive) stopContraction();
    else startContraction();
  }, [isActive, startContraction, stopContraction]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer circle */}
      <div className={`relative w-44 h-44 rounded-full flex items-center justify-center border-4 transition-colors duration-300 ${
        isActive
          ? 'border-red-300 bg-red-50'
          : lastCompleted
          ? 'border-sage-300 bg-sage-50'
          : 'border-cream-300 bg-cream-100'
      }`}>
        {isActive && (
          <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse" />
        )}
        <div className="text-center z-10">
          <p className={`text-4xl font-display font-800 tabular-nums ${isActive ? 'text-red-500' : 'text-gray-800'}`}>
            {isActive ? formatTimer(elapsed) : lastCompleted ? formatTimer(restElapsed) : '0:00'}
          </p>
          <p className={`text-xs font-display font-600 mt-1 ${isActive ? 'text-red-400' : 'text-warm-gray'}`}>
            {isActive ? 'contraction' : lastCompleted ? 'rest' : 'ready'}
          </p>
        </div>
      </div>

      {/* Start / Stop button */}
      <button
        onClick={handleTap}
        className={`w-full max-w-[240px] py-4 rounded-2xl text-lg font-display font-800 transition-all active:scale-95 ${
          isActive
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-sage-400 text-white hover:bg-sage-500'
        }`}
      >
        {isActive ? '■  Stop' : '●  Start'}
      </button>

      {!isActive && contractions.length === 0 && (
        <p className="text-sm text-warm-gray font-display font-500 text-center">
          Tap Start when a contraction begins
        </p>
      )}
    </div>
  );
}

function StatsRow() {
  const { contractions } = useStore();

  const stats = useMemo(() => {
    const completed = contractions.filter(c => c.endTime && c.duration);
    const recent = completed.slice(-10);
    const count = completed.length;

    if (count === 0) return { avgDuration: null, avgFrequency: null, count: 0 };

    const avgDuration = recent.reduce((s, c) => s + (c.duration ?? 0), 0) / recent.length;

    let avgFrequency: number | null = null;
    if (recent.length >= 2) {
      let totalFreq = 0;
      for (let i = 1; i < recent.length; i++) {
        totalFreq += (new Date(recent[i].startTime).getTime() - new Date(recent[i - 1].startTime).getTime()) / 1000;
      }
      avgFrequency = totalFreq / (recent.length - 1);
    }

    return { avgDuration, avgFrequency, count };
  }, [contractions]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="card text-center py-3">
        <p className="text-xl font-display font-800 text-sage-500">
          {stats.avgDuration !== null ? formatTimeLong(Math.round(stats.avgDuration)) : '—'}
        </p>
        <p className="text-[11px] text-warm-gray font-display font-600">avg duration</p>
      </div>
      <div className="card text-center py-3">
        <p className="text-xl font-display font-800 text-rose-medium">
          {stats.avgFrequency !== null ? formatTimeLong(Math.round(stats.avgFrequency)) : '—'}
        </p>
        <p className="text-[11px] text-warm-gray font-display font-600">avg frequency</p>
      </div>
      <div className="card text-center py-3">
        <p className="text-xl font-display font-800 text-gray-800">
          {stats.count}
        </p>
        <p className="text-[11px] text-warm-gray font-display font-600">contractions</p>
      </div>
    </div>
  );
}

function LaborPhaseBanner() {
  const { contractions, contractionSettings } = useStore();

  const { phase, is511 } = useMemo(() => {
    const completed = contractions.filter(c => c.endTime && c.duration);
    const recent = completed.slice(-10);

    let avgDur: number | null = null;
    let avgFreq: number | null = null;

    if (recent.length > 0) {
      avgDur = recent.reduce((s, c) => s + (c.duration ?? 0), 0) / recent.length;
    }
    if (recent.length >= 2) {
      let totalFreq = 0;
      for (let i = 1; i < recent.length; i++) {
        totalFreq += (new Date(recent[i].startTime).getTime() - new Date(recent[i - 1].startTime).getTime()) / 1000;
      }
      avgFreq = totalFreq / (recent.length - 1);
    }

    return {
      phase: getLaborPhase(avgFreq, avgDur),
      is511: check511(contractions, contractionSettings),
    };
  }, [contractions, contractionSettings]);

  const config = PHASE_CONFIG[phase];

  return (
    <div className="space-y-2">
      <div className={`card ${config.bg} py-3`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-display font-800 text-sm ${config.color}`}>{config.label}</p>
            <p className="text-xs text-warm-gray font-display font-500">{config.desc}</p>
          </div>
          <span className={`w-3 h-3 rounded-full ${
            phase === 'transition' ? 'bg-red-400' :
            phase === 'active' ? 'bg-amber-400' :
            phase === 'early' ? 'bg-sage-400' :
            'bg-cream-300'
          }`} />
        </div>
      </div>

      {is511 && (
        <div className="card bg-red-50 border-2 border-red-200 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-display font-800 text-sm text-red-600">
                {contractionSettings.alertFrequencyMin}-{contractionSettings.alertDurationMin}-1 Pattern Detected
              </p>
              <p className="text-xs text-red-500 font-display font-500">
                Consider contacting your provider or heading to the hospital
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContractionHistory() {
  const { contractions, deleteContraction } = useStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const completed = useMemo(() =>
    [...contractions].filter(c => c.endTime).reverse(),
    [contractions]
  );

  if (completed.length === 0) return null;

  return (
    <div className="card">
      <h3 className="font-display font-700 text-gray-800 mb-3">History</h3>
      <div className="space-y-1.5">
        {completed.map((c, idx) => {
          const num = completed.length - idx;
          const prevInOrder = completed[idx + 1];
          let freq: number | null = null;
          if (prevInOrder) {
            freq = Math.round(
              (new Date(c.startTime).getTime() - new Date(prevInOrder.startTime).getTime()) / 1000
            );
          }

          return (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-cream-100 rounded-xl">
              <span className="text-xs font-display font-700 text-warm-gray w-6 text-right">#{num}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-display font-600 text-gray-800">
                    {formatTime(c.startTime)}
                  </span>
                  <span className="text-xs text-sage-500 font-display font-700">
                    dur {formatTimeLong(c.duration ?? 0)}
                  </span>
                  {freq !== null && (
                    <span className="text-xs text-rose-medium font-display font-700">
                      freq {formatTimeLong(freq)}
                    </span>
                  )}
                </div>
              </div>
              {confirmId === c.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => { deleteContraction(c.id); setConfirmId(null); }}
                    className="text-xs bg-red-100 text-red-600 font-display font-700 px-2 py-1 rounded-lg"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs bg-cream-200 text-warm-gray font-display font-700 px-2 py-1 rounded-lg"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(c.id)}
                  className="w-7 h-7 rounded-lg bg-cream-200 text-warm-gray hover:bg-red-50 hover:text-red-400 flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PRESETS: { label: string; freq: number; dur: number; window: number }[] = [
  { label: '5-1-1', freq: 5, dur: 1, window: 60 },
  { label: '4-1-1', freq: 4, dur: 1, window: 60 },
  { label: '3-1-1', freq: 3, dur: 1, window: 60 },
];

function ContractionSettingsPanel() {
  const { contractionSettings, updateContractionSettings, clearContractions, contractions } = useStore();
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const currentPreset = PRESETS.find(
    p => p.freq === contractionSettings.alertFrequencyMin &&
      p.dur === contractionSettings.alertDurationMin &&
      p.window === contractionSettings.alertWindowMin
  );

  return (
    <div className="card">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-warm-gray" />
          <span className="font-display font-700 text-gray-800 text-sm">Settings</span>
          <span className="text-xs text-warm-gray font-display font-600">
            ({currentPreset?.label ?? 'Custom'})
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-warm-gray" /> : <ChevronDown className="w-4 h-4 text-warm-gray" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* Presets */}
          <div>
            <p className="text-xs text-warm-gray font-display font-600 mb-1.5">Alert rule preset</p>
            <div className="flex gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => updateContractionSettings({
                    alertFrequencyMin: p.freq,
                    alertDurationMin: p.dur,
                    alertWindowMin: p.window,
                  })}
                  className={`flex-1 py-2 rounded-xl text-xs font-display font-700 transition-colors ${
                    currentPreset?.label === p.label
                      ? 'bg-sage-400 text-white'
                      : 'bg-cream-200 text-warm-gray hover:bg-cream-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-warm-gray font-display font-600 block mb-1">Freq (min)</label>
              <input
                type="number"
                min={1}
                max={15}
                value={contractionSettings.alertFrequencyMin}
                onChange={e => updateContractionSettings({ alertFrequencyMin: Number(e.target.value) || 5 })}
                className="w-full px-2 py-2 bg-cream-100 rounded-xl text-sm font-display font-600 text-center border-none outline-none focus:ring-2 focus:ring-sage-300"
              />
            </div>
            <div>
              <label className="text-[10px] text-warm-gray font-display font-600 block mb-1">Dur (min)</label>
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.5}
                value={contractionSettings.alertDurationMin}
                onChange={e => updateContractionSettings({ alertDurationMin: Number(e.target.value) || 1 })}
                className="w-full px-2 py-2 bg-cream-100 rounded-xl text-sm font-display font-600 text-center border-none outline-none focus:ring-2 focus:ring-sage-300"
              />
            </div>
            <div>
              <label className="text-[10px] text-warm-gray font-display font-600 block mb-1">Window (min)</label>
              <input
                type="number"
                min={30}
                max={120}
                value={contractionSettings.alertWindowMin}
                onChange={e => updateContractionSettings({ alertWindowMin: Number(e.target.value) || 60 })}
                className="w-full px-2 py-2 bg-cream-100 rounded-xl text-sm font-display font-600 text-center border-none outline-none focus:ring-2 focus:ring-sage-300"
              />
            </div>
          </div>

          {/* Clear session */}
          {contractions.length > 0 && (
            <div className="pt-2 border-t border-cream-200">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-500 font-display font-600 flex-1">
                    Clear all {contractions.length} contractions?
                  </p>
                  <button
                    onClick={() => { clearContractions(); setConfirmClear(false); }}
                    className="text-xs bg-red-100 text-red-600 font-display font-700 px-3 py-1.5 rounded-lg"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-xs bg-cream-200 text-warm-gray font-display font-700 px-3 py-1.5 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full text-center py-2 text-xs text-red-500 font-display font-700 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Clear session ({contractions.length} contractions)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Contractions() {
  return (
    <div className="space-y-4">
      <LaborPhaseBanner />
      <TimerDisplay />
      <StatsRow />
      <ContractionHistory />
      <ContractionSettingsPanel />
    </div>
  );
}
