import { useCallback, useEffect, useRef, useState } from 'react';

export type TransitionMode = 'wave' | 'slide';

export function useScreenTransition() {
  const [phase, setPhase] = useState<'idle' | 'cover' | 'reveal'>('idle');
  const [mode, setMode] = useState<TransitionMode>('slide');
  const locked = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const transition = useCallback((action: () => void, nextMode: TransitionMode = 'slide') => {
    if (locked.current) return;
    if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      action();
      return;
    }
    locked.current = true;
    setMode(nextMode);
    setPhase('cover');
    const coverDuration = nextMode === 'wave' ? 680 : 180;
    const revealDuration = nextMode === 'wave' ? 620 : 260;
    timers.current.push(
      setTimeout(() => {
        action();
        setPhase('reveal');
        timers.current.push(
          setTimeout(() => {
            locked.current = false;
            setPhase('idle');
          }, revealDuration),
        );
      }, coverDuration),
    );
  }, []);
  return { phase, mode, transition, busy: phase !== 'idle' };
}
