/**
 * Pull-to-refresh for the phone scroll area. An installed iOS/Android PWA has
 * no browser chrome, so there's no native pull-to-refresh — and the shell pins
 * the body (`overscroll-behavior: none`), so we implement it on the scroll
 * container: drag down from scrollTop 0, release past the threshold to refetch.
 */
import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 64;
const MAX_PULL = 96;
const MIN_SPIN_MS = 600;

export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshFn = useRef(onRefresh);
  refreshFn.current = onRefresh;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startY: number | null = null;
    let dist = 0;
    let busy = false;

    const onStart = (e: TouchEvent) => {
      startY = !busy && el.scrollTop <= 0 ? e.touches[0].clientY : null;
      dist = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      if (el.scrollTop > 0) {
        startY = null;
        dist = 0;
        setDragging(false);
        setPull(0);
        return;
      }
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) return;
      // Non-passive so we can stop the native rubber-band while pulling.
      if (e.cancelable) e.preventDefault();
      dist = Math.min(dy * 0.5, MAX_PULL);
      setDragging(true);
      setPull(dist);
    };
    const onEnd = () => {
      if (startY === null) return;
      startY = null;
      setDragging(false);
      if (dist < THRESHOLD) {
        setPull(0);
        return;
      }
      busy = true;
      setRefreshing(true);
      setPull(THRESHOLD);
      void Promise.allSettled([refreshFn.current(), new Promise((r) => setTimeout(r, MIN_SPIN_MS))]).then(() => {
        busy = false;
        setRefreshing(false);
        setPull(0);
      });
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  return { ref, pull, dragging, refreshing, ready: pull >= THRESHOLD };
}
