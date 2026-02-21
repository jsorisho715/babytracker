import type { PointTier } from '../types';
import { POINT_TIER_LABELS } from '../data/seedData';

interface Props {
  points: PointTier;
  size?: 'sm' | 'md';
}

const TIER_COLORS: Record<number, string> = {
  5: 'bg-cream-200 text-warm-gray',
  10: 'bg-sage-100 text-sage-600',
  25: 'bg-blue-50 text-blue-600',
  50: 'bg-orange-50 text-orange-600',
  100: 'bg-yellow-50 text-yellow-700',
};

export default function PointsBadge({ points, size = 'sm' }: Props) {
  const colorClass = TIER_COLORS[points] ?? 'bg-cream-200 text-warm-gray';
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 ${colorClass} ${sizeClass} font-display font-700 rounded-full`}>
      ⭐ {points} {size === 'md' && <span className="opacity-70">{POINT_TIER_LABELS[points]}</span>}
    </span>
  );
}
