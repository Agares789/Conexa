import { describe, expect, it } from 'vitest';
import { createGraph } from '../domain/graph';
import { lectureGraph } from '../generation/generateGraph';
import { prepareExecution } from './prepareExecution';

describe('observable preparation of the lecture procedure', () => {
  it('matches the complete first matrix of lecture 5.1 page 3', () => {
    const execution = prepareExecution(lectureGraph());
    expect(execution.steps.at(-1)?.after).toEqual([
      [1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1],
      [0, 0, 1, 0, 1],
      [1, 0, 0, 1, 0],
      [0, 0, 1, 0, 1],
    ]);
    expect(execution.status).toBe('partial');
    expect(execution).not.toHaveProperty('result');
  });
  it.each([4, 12])(
    'records one diagonal change per step at n=%i and preserves snapshots',
    (count) => {
      const graph = createGraph(count, [{ source: 1, target: 2 }]);
      const beforeGraph = structuredClone(graph);
      const execution = prepareExecution(graph);
      expect(execution.steps).toHaveLength(count + 1);
      execution.steps.slice(1).forEach((step, index) => {
        expect(step.changedCells).toEqual([{ row: index, column: index }]);
        let changes = 0;
        step.after.forEach((row, i) =>
          row.forEach((value, j) => {
            if (value !== step.before[i][j]) changes++;
          }),
        );
        expect(changes).toBe(1);
        expect(step.after[0][1]).toBe(1);
        expect(step.before[index][index]).toBe(0);
        expect(step.after[index][index]).toBe(1);
      });
      expect(execution.steps[0].after.every((row, i) => row[i] === 0)).toBe(true);
      expect(graph).toEqual(beforeGraph);
    },
  );
});
