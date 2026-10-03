import { describe, expect, it } from 'vitest';
import { adjacencyMatrix, createGraph, nodeCountError, toggleEdge, resizeGraph } from './graph';
import { generateGraph, lectureGraph } from '../generation/generateGraph';

describe('graph domain', () => {
  it('shrinks without dangling arcs, preserves other edges and does not mutate the original', () => {
    const original = createGraph(6, [
      { source: 1, target: 2 },
      { source: 6, target: 2 },
      { source: 3, target: 5 },
    ]);
    expect(resizeGraph(original, 4).edges).toEqual([{ source: 1, target: 2 }]);
    expect(resizeGraph(original, 7).edges).toEqual(original.edges);
    expect(original.nodes).toHaveLength(6);
    expect(original.edges).toHaveLength(3);
    expect(() => resizeGraph(original, 3)).toThrow();
    expect(() => resizeGraph(original, 13)).toThrow();
  });
  it.each([4, 12])('accepts boundary size %i', (count) => {
    expect(createGraph(count).nodes).toHaveLength(count);
    expect(nodeCountError(count)).toBeNull();
  });
  it.each([3, 13, 4.5, 0, NaN, Infinity])('rejects invalid size %s', (count) => {
    expect(() => createGraph(count)).toThrow('entero entre 4 y 12');
  });
  it('validates vertices, loops and duplicate directed edges', () => {
    expect(() => createGraph(4, [{ source: 1, target: 5 }])).toThrow('vértices');
    expect(() => createGraph(4, [{ source: 1, target: 1 }])).toThrow('diferentes');
    expect(() =>
      createGraph(4, [
        { source: 1, target: 2 },
        { source: 1, target: 2 },
      ]),
    ).toThrow('ya existe');
  });
  it('toggling a directed edge preserves the reverse edge and the original graph', () => {
    const original = createGraph(4, [{ source: 2, target: 1 }]);
    const next = toggleEdge(original, 1, 2);
    expect(next.edges).toHaveLength(2);
    expect(original.edges).toEqual([{ source: 2, target: 1 }]);
    expect(toggleEdge(next, 1, 2)).toEqual(original);
  });
  it('matches the original adjacency of the directed lecture example', () => {
    expect(adjacencyMatrix(lectureGraph())).toEqual([
      [0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1],
      [0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
    ]);
  });
  it('keeps isolated vertices and supports an empty edge set', () => {
    const matrix = adjacencyMatrix(createGraph(12));
    expect(matrix).toHaveLength(12);
    expect(matrix.every((row) => row.length === 12 && row.every((value) => value === 0))).toBe(
      true,
    );
  });
});

describe('random generation', () => {
  it.each([4, 12])('supports empty and complete directed graphs with %i vertices', (count) => {
    expect(generateGraph(count, 0, () => 0).edges).toHaveLength(0);
    const complete = generateGraph(count, 1, () => 0.99);
    expect(complete.edges).toHaveLength(count * (count - 1));
    expect(complete.edges.every((edge) => edge.source !== edge.target)).toBe(true);
    expect(new Set(complete.edges.map((edge) => `${edge.source}-${edge.target}`)).size).toBe(
      complete.edges.length,
    );
  });
  it('samples directed pairs independently at the probability boundary', () => {
    const values = [0.19, 0.2, ...Array(10).fill(0.9)];
    expect(generateGraph(4, 0.2, () => values.shift()!).edges).toEqual([{ source: 1, target: 2 }]);
  });
  it.each([-0.1, 1.1, NaN])('rejects invalid probability %s', (probability) => {
    expect(() => generateGraph(4, probability)).toThrow('probabilidad');
  });
  it('rejects invalid random samples', () => {
    expect(() => generateGraph(4, 0.2, () => 1)).toThrow('generador');
  });
});
