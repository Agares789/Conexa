import { adjacencyMatrix, type Matrix } from '../domain/graph';
import type { ExecutionStep, GraphProcedure } from '../execution/types';

/** Prepara la diagonal de la matriz sin cambiar las conexiones del grafo. */
export const prepareExecution: GraphProcedure = (graph) => {
  let matrix = adjacencyMatrix(graph);
  const steps: ExecutionStep[] = [
    {
      id: 'adjacency',
      phase: 'adjacency',
      title: 'Partimos de la matriz de adyacencia',
      explanation:
        'Un 1 en la fila i y columna j indica una conexión de i hacia j. La diagonal original es 0 porque el grafo no tiene lazos.',
      before: matrix,
      after: matrix,
      rowOrder: [...graph.nodes],
      columnOrder: [...graph.nodes],
      highlightedNodes: [],
      highlightedEdges: [],
      changedCells: [],
    },
  ];
  for (const [index, node] of graph.nodes.entries()) {
    const before = matrix;
    matrix = matrix.map((row, rowIndex) =>
      row.map((value, columnIndex) => (rowIndex === index && columnIndex === index ? 1 : value)),
    ) as Matrix;
    steps.push({
      id: `diagonal-${node}`,
      phase: 'reflexive',
      title: `El vértice ${node} se alcanza a sí mismo`,
      explanation: `Cambiamos la celda (${node}, ${node}) de 0 a 1 para representar el camino de longitud cero. Es una preparación de la matriz; no añadimos un arco al grafo.`,
      before,
      after: matrix,
      rowOrder: [...graph.nodes],
      columnOrder: [...graph.nodes],
      highlightedNodes: [node],
      highlightedEdges: [],
      changedCells: [{ row: index, column: index }],
    });
  }
  return {
    graph,
    steps,
    status: 'partial',
    pending:
      'La diagonal está preparada. Continúa con el cálculo de caminos, el ordenamiento y las componentes mediante runComponents.',
  };
};
