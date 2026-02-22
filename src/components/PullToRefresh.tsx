import { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const PULL_THRESHOLD = 80;
const RESISTANCE = 0.4;

interface PullToRefreshProps {
  onRefresh: () => void;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      const resisted = Math.min(diff * RESISTANCE, PULL_THRESHOLD * 1.5);
      setPullDistance(resisted);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      handleRefresh();
    }
    setPullDistance(0);
  };

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto overscroll-contain flex-1 min-h-0 -webkit-overflow-scrolling-touch"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center transition-all duration-200 ease-out"
        style={{
          height: Math.max(0, pullDistance),
          minHeight: isRefreshing ? 56 : 0,
        }}
      >
        {isRefreshing ? (
          <RefreshCw className="w-5 h-5 text-sage-500 animate-spin" />
        ) : pullDistance > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <RefreshCw
              className={`w-5 h-5 text-sage-500 transition-transform ${pullDistance >= PULL_THRESHOLD ? 'rotate-180' : ''}`}
            />
            <span className="text-xs font-display font-600 text-warm-gray">
              {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        ) : null}
      </div>
      <div
        style={{
          transform: `translateY(${isRefreshing ? 56 : Math.min(pullDistance, PULL_THRESHOLD)}px)`,
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
