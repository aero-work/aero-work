import { useRef, useState, useCallback, useEffect } from "react";

interface UseSwipeBackOptions {
  /** Callback when swipe back is triggered */
  onSwipeBack: () => void;
  /** Whether swipe back is enabled (default: true) */
  enabled?: boolean;
  /** Minimum swipe distance to trigger (default: 100) */
  threshold?: number;
  /** Edge width from left that triggers swipe (default: 40) */
  edgeWidth?: number;
}

interface UseSwipeBackReturn {
  /** Props to spread on the container element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  /** Current swipe offset (for visual feedback) */
  swipeOffset: number;
  /** Whether currently swiping */
  isSwiping: boolean;
}

/**
 * useSwipeBack - iOS-style swipe from left edge to go back
 */
export function useSwipeBack({
  onSwipeBack,
  enabled = true,
  threshold = 100,
  edgeWidth = 40,
}: UseSwipeBackOptions): UseSwipeBackReturn {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isEdgeSwipe = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Reset on unmount or disable
  useEffect(() => {
    if (!enabled) {
      setSwipeOffset(0);
      setIsSwiping(false);
    }
  }, [enabled]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isHorizontalSwipe.current = null;

      // Only trigger if starting from left edge
      isEdgeSwipe.current = touch.clientX <= edgeWidth;

      if (isEdgeSwipe.current) {
        setIsSwiping(true);
      }
    },
    [enabled, edgeWidth]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !isEdgeSwipe.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;

      // Determine swipe direction on first significant move
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);

          // If vertical, cancel swipe
          if (!isHorizontalSwipe.current) {
            isEdgeSwipe.current = false;
            setSwipeOffset(0);
            setIsSwiping(false);
            return;
          }
        }
      }

      // Only track rightward swipes (positive deltaX)
      if (isHorizontalSwipe.current && deltaX > 0) {
        // Apply some resistance as you swipe further
        const dampedOffset = Math.min(deltaX * 0.8, window.innerWidth * 0.5);
        setSwipeOffset(dampedOffset);
      }
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isEdgeSwipe.current) return;

    // If swiped past threshold, trigger back
    if (swipeOffset > threshold) {
      onSwipeBack();
    }

    // Reset
    setSwipeOffset(0);
    setIsSwiping(false);
    isEdgeSwipe.current = false;
    isHorizontalSwipe.current = null;
  }, [enabled, swipeOffset, threshold, onSwipeBack]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    swipeOffset,
    isSwiping,
  };
}
