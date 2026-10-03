import { describe, expect, it } from 'vitest';
import { createGraph, type Edge, type Graph, type NodeId } from '../domain/graph';
import { generateGraph, lectureGraph } from '../generation/generateGraph';
import { runComponents } from './runComponents';

// Recorremos las flechas originales para comprobar el cálculo matricial por otra vía.
function traversalOracle(graph: Graph) {
  const reachable = graph.nodes.map((source) => {
    const seen = new Set([source]);
    const pending = [source];
    while (pending.length) {
      const node = pending.pop()!;
      for (const edge of graph.edges) {
        if (edge.source === node && !seen.has(edge.target)) {
          seen.add(edge.target);
          pending.push(edge.target);
        }
      }
    }
    return graph.nodes.map((target) => (seen.has(target) ? 1 : 0));
  });
  const assigned = new Set<number>();
  const components: number[][] = [];
  for (const node of graph.nodes) {
    if (assigned.has(node)) continue;
    const group = graph.nodes.filter(
      (other) => reachable[node - 1][other - 1] && reachable[other - 1][node - 1],
    );
    group.forEach((item) => assigned.add(item));
    components.push(group);
  }
  return { reachable, components };
}
function canonical(groups: ReadonlyArray<readonly NodeId[]>) {
  return groups.map((group) => [...group].sort((a, b) => a - b).join(',')).sort();
}

describe('complete matrix procedure', () => {
  it('reproduces the lecture reachability, ordering and two components', () => {
    const { result } = runComponents(lectureGraph());
    expect(result.reachability).toEqual([
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 1],
    ]);
    expect(result.order).toEqual([1, 2, 4, 3, 5]);
    expect(result.components).toEqual([
      [1, 2, 4],
      [3, 5],
    ]);
    expect(result.orderedMatrix).toEqual([
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 1, 1],
      [0, 0, 0, 1, 1],
    ]);
  });
  it.each([4, 12])('handles isolated, complete, chain and cyclic graphs at n=%i', (count) => {
    expect(runComponents(createGraph(count)).result.components).toHaveLength(count);
    expect(runComponents(generateGraph(count, 1, () => 0.5)).result.components).toHaveLength(1);
    const chain = Array.from({ length: count - 1 }, (_, i) => ({ source: i + 1, target: i + 2 }));
    expect(runComponents(createGraph(count, chain)).result.components).toHaveLength(count);
    const cycle = createGraph(count, [...chain, { source: count, target: 1 }]);
    expect(runComponents(cycle).result.components).toEqual([cycle.nodes]);
  });
  it('keeps SCC blocks contiguous when counts and first one positions tie', () => {
    const graph = createGraph(5, [
      { source: 2, target: 4 },
      { source: 4, target: 2 },
      { source: 3, target: 5 },
      { source: 5, target: 3 },
      { source: 2, target: 1 },
      { source: 3, target: 1 },
    ]);
    const { result } = runComponents(graph);
    expect(result.order).toEqual([2, 4, 3, 5, 1]);
    expect(result.components).toEqual([[2, 4], [3, 5], [1]]);
  });
  it('records real original-graph witnesses and immutable snapshots with correct permutation labels', () => {
    const graph = lectureGraph();
    graph.edges.forEach(Object.freeze);
    Object.freeze(graph.edges);
    Object.freeze(graph.nodes);
    Object.freeze(graph);
    const execution = runComponents(graph);
    const saved = JSON.stringify(execution);
    const ids = new Set(execution.steps.map((step) => step.id));
    expect(ids.size).toBe(execution.steps.length);
    for (const step of execution.steps) {
      for (const cell of step.changedCells) {
        expect(step.before[cell.row][cell.column]).toBe(0);
        expect(step.after[cell.row][cell.column]).toBe(1);
      }
      if (step.witness) {
        expect(step.witness.length).toBeGreaterThan(2);
        for (let i = 1; i < step.witness.length; i++) {
          expect(graph.edges).toContainEqual({
            source: step.witness[i - 1],
            target: step.witness[i],
          });
        }
        const cell = step.changedCells[0];
        expect(step.witness[0]).toBe(step.rowOrder[cell.row]);
        expect(step.witness.at(-1)).toBe(step.columnOrder[cell.column]);
      }
    }
    const rows = execution.steps.find((step) => step.phase === 'rows')!;
    const columns = execution.steps.find((step) => step.phase === 'columns')!;
    expect(rows.beforeRowOrder).toEqual(graph.nodes);
    expect(columns.beforeRowOrder).toEqual(execution.result.order);
    expect(columns.beforeColumnOrder).toEqual(graph.nodes);
    expect(rows.after).toEqual(columns.before);
    expect(execution.steps.find((step) => step.id === 'component-1')?.components).toHaveLength(1);
    runComponents(createGraph(12));
    expect(JSON.stringify(execution)).toBe(saved);
  });
  it('matches an independent traversal oracle for all 4096 directed simple graphs of size 4', () => {
    const pairs: Edge[] = [];
    for (let source = 1; source <= 4; source++)
      for (let target = 1; target <= 4; target++)
        if (source !== target) pairs.push({ source, target });
    for (let mask = 0; mask < 4096; mask++) {
      const graph = createGraph(
        4,
        pairs.filter((_, index) => (mask & (1 << index)) !== 0),
      );
      const { result } = runComponents(graph);
      const expected = traversalOracle(graph);
      expect(result.reachability, `reachability mask ${mask}`).toEqual(expected.reachable);
      expect(canonical(result.components), `components mask ${mask}`).toEqual(
        canonical(expected.components),
      );
      expect(result.components.flat(), `contiguous blocks mask ${mask}`).toEqual(result.order);
    }
  }, 20000);
  it('validates larger deterministic random graphs and all reordered cell identities', () => {
    let seed = 721;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let count = 5; count <= 12; count++)
      for (const probability of [0.08, 0.2, 0.5, 0.85]) {
        const graph = generateGraph(count, probability, random);
        const { result } = runComponents(graph);
        const expected = traversalOracle(graph);
        expect(result.reachability).toEqual(expected.reachable);
        expect(canonical(result.components)).toEqual(canonical(expected.components));
        expect(result.components.flat()).toEqual(result.order);
        result.orderedMatrix.forEach((row, i) =>
          row.forEach((value, j) =>
            expect(value).toBe(result.reachability[result.order[i] - 1][result.order[j] - 1]),
          ),
        );
      }
  });
});
