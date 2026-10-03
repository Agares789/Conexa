import type { Point } from './layout';

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Una única curva determina la línea y la punta; las medidas se mantienen en píxeles. */
export function edgeGeometry(
  source: Point,
  target: Point,
  reciprocal: boolean,
  radius: number,
  unitsPerPixel: number,
  obstacles: readonly Point[] = [],
) {
  const dx = target.x - source.x,
    dy = target.y - source.y;
  const length = Math.hypot(dx, dy);
  const normal = length > 0.01 ? { x: -dy / length, y: dx / length } : { x: 0, y: -1 };
  const clearance = radius + 10 * unitsPerPixel;
  const headLength = 12 * unitsPerPixel,
    headWidth = 5 * unitsPerPixel;
  const close = length < 2 * clearance + 2 * headLength;
  const baseBend = close ? clearance * 3 : reciprocal ? 48 * unitsPerPixel : 0;
  const pointAt = (t: number, c: Point): Point => ({
    x: (1 - t) ** 2 * source.x + 2 * (1 - t) * t * c.x + t * t * target.x,
    y: (1 - t) ** 2 * source.y + 2 * (1 - t) * t * c.y + t * t * target.y,
  });
  const bends = [
    baseBend,
    ...[1, -1, 2, -2, 3, -3, 4, -4].map((n) => n * Math.max(baseBend, clearance * 2)),
  ];
  let control: Point = source,
    best = Infinity;
  for (const bend of bends) {
    const c = {
      x: (source.x + target.x) / 2 + normal.x * bend,
      y: (source.y + target.y) / 2 + normal.y * bend,
    };
    let score = Math.abs(bend - baseBend) * 0.015;
    for (let i = 1; i < 40; i++) {
      const p = pointAt(i / 40, c);
      // Preferimos rodear otros vértices y conservar el recorrido dentro del lienzo.
      for (const obstacle of obstacles)
        score += Math.max(0, radius + 8 * unitsPerPixel - distance(p, obstacle)) ** 2 * 20;
      score += (Math.max(0, 8 - p.x, p.x - 592) ** 2 + Math.max(0, 8 - p.y, p.y - 432) ** 2) * 10;
    }
    if (score < best) {
      best = score;
      control = c;
    }
  }
  const tangentAt = (t: number): Point => ({
    x: 2 * (1 - t) * (control.x - source.x) + 2 * t * (target.x - control.x),
    y: 2 * (1 - t) * (control.y - source.y) + 2 * t * (target.y - control.y),
  });
  function boundary(fromSource: boolean) {
    let low = 0,
      high = 0.5;
    for (let i = 0; i < 36; i++) {
      const mid = (low + high) / 2;
      if (
        distance(pointAt(fromSource ? mid : 1 - mid, control), fromSource ? source : target) <
        clearance
      )
        low = mid;
      else high = mid;
    }
    return fromSource ? high : 1 - high;
  }
  const startT = boundary(true),
    endT = boundary(false);
  const start = pointAt(startT, control),
    tip = pointAt(endT, control);
  const tangent = tangentAt(endT),
    tangentLength = Math.max(0.001, Math.hypot(tangent.x, tangent.y));
  const ux = tangent.x / tangentLength,
    uy = tangent.y / tangentLength;
  const base = { x: tip.x - ux * headLength, y: tip.y - uy * headLength };
  const left = { x: base.x - uy * headWidth, y: base.y + ux * headWidth };
  const right = { x: base.x + uy * headWidth, y: base.y - ux * headWidth };
  // La línea termina bajo la cabeza, evitando que asome por delante de la flecha.
  let low = startT,
    high = endT;
  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2;
    if (distance(pointAt(mid, control), tip) > headLength * 0.72) low = mid;
    else high = mid;
  }
  const lineEndT = (low + high) / 2,
    lineEnd = pointAt(lineEndT, control),
    startTangent = tangentAt(startT);
  const trimmedControl = {
    x: start.x + ((lineEndT - startT) * startTangent.x) / 2,
    y: start.y + ((lineEndT - startT) * startTangent.y) / 2,
  };
  return {
    start,
    tip,
    clearance,
    control,
    path: `M ${start.x} ${start.y} Q ${trimmedControl.x} ${trimmedControl.y} ${lineEnd.x} ${lineEnd.y}`,
    arrow: `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`,
  };
}
