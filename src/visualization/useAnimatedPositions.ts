import { useEffect, useRef, useState } from 'react';
import type { NodePositions } from './layout';

/** Los nodos y sus aristas consumen exactamente el mismo fotograma. */
export function useAnimatedPositions(target: NodePositions, immediate: boolean) {
  const [frame, setFrame] = useState(target);
  const current = useRef(target);
  const reduced =
    !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (immediate || reduced) {
      current.current = target;
      return;
    }
    const start = current.current,
      time = performance.now();
    let request = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - time) / 260),
        eased = 1 - (1 - progress) ** 3;
      const next = Object.fromEntries(
        Object.entries(target).map(([id, to]) => {
          const from = start[Number(id)] ?? to;
          return [id, { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased }];
        }),
      );
      current.current = next;
      setFrame(next);
      if (progress < 1) request = requestAnimationFrame(animate);
    };
    request = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(request);
  }, [target, immediate, reduced]);
  return immediate || reduced ? target : frame;
}
