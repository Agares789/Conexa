import { createGraph, type Edge, type Graph } from '../domain/graph';

/** Prueba cada flecha por separado; también puede salir un grafo sin conexiones. */
export function generateGraph(count: number, probability = 0.2, random = Math.random): Graph {
  const graph = createGraph(count);
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error('La probabilidad debe estar entre 0 y 1.');
  }
  const edges: Edge[] = [];
  for (const source of graph.nodes) {
    for (const target of graph.nodes) {
      if (source === target) continue;
      const sample = random();
      if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
        throw new Error('El generador debe producir números entre 0 (incluido) y 1 (excluido).');
      }
      if (sample < probability) edges.push({ source, target });
    }
  }
  return createGraph(count, edges);
}

/** Reproduce el grafo dirigido de la Lectura 5.1 antes de preparar la diagonal. */
export function lectureGraph(): Graph {
  return createGraph(5, [
    { source: 1, target: 2 },
    { source: 2, target: 3 },
    { source: 2, target: 4 },
    { source: 2, target: 5 },
    { source: 3, target: 5 },
    { source: 4, target: 1 },
    { source: 5, target: 3 },
  ]);
}
