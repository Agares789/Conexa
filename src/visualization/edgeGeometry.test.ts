import { describe, expect, it } from 'vitest';
import { edgeGeometry } from './edgeGeometry';

describe('arrow clearance', () => {
  it('keeps solid arrowheads outside nodes at every angle and viewport scale', () => {
    for (const scale of [0.8, 1.3, 2.3]) {
      for (let angle = 0; angle < 360; angle += 15) {
        for (const reciprocal of [false, true]) {
          const source = { x: 300, y: 220 };
          const target = {
            x: 300 + 150 * Math.cos((angle * Math.PI) / 180),
            y: 220 + 150 * Math.sin((angle * Math.PI) / 180),
          };
          const shape = edgeGeometry(source, target, reciprocal, 20 * scale, scale);
          expect(Math.hypot(shape.tip.x - target.x, shape.tip.y - target.y)).toBeCloseTo(
            30 * scale,
            5,
          );
          expect(shape.arrow.split(' ')).toHaveLength(3);
          expect(shape.path).not.toMatch(/NaN|Infinity/);
        }
      }
    }
  });
  it('bends nearby connections and separates reciprocal paths', () => {
    const a = { x: 200, y: 200 },
      b = { x: 220, y: 205 };
    const forward = edgeGeometry(a, b, true, 22, 1);
    const backward = edgeGeometry(b, a, true, 22, 1);
    expect(forward.tip.y).toBeGreaterThan(b.y);
    expect(backward.tip.y).toBeLessThan(a.y);
    expect(Math.hypot(forward.tip.x - b.x, forward.tip.y - b.y)).toBeCloseTo(32, 5);
  });
  it('routes a visible arrow around a vertex between its endpoints', () => {
    const source = { x: 100, y: 220 },
      target = { x: 500, y: 220 };
    const obstacle = { x: 300, y: 220 };
    const shape = edgeGeometry(source, target, false, 22, 1, [obstacle]);
    const middle = {
      x: (source.x + 2 * shape.control.x + target.x) / 4,
      y: (source.y + 2 * shape.control.y + target.y) / 4,
    };
    expect(Math.hypot(middle.x - obstacle.x, middle.y - obstacle.y)).toBeGreaterThan(30);
    expect(shape.path).not.toMatch(/NaN|Infinity/);
    expect(Math.hypot(shape.tip.x - target.x, shape.tip.y - target.y)).toBeCloseTo(32, 4);
  });
});
