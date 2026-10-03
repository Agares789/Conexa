import type { Graph } from '../domain/graph';
import type { CompleteExecution, ExecutionStep } from '../execution/types';
import { calculatePaths } from './calculatePaths';
import { findComponents } from './findComponents';
import { orderMatrix } from './orderMatrix';
import { prepareExecution } from './prepareExecution';

/** Reúne los cálculos y construye los pasos que se muestran en pantalla. */
export function runComponents(graph: Graph): CompleteExecution {
  const steps: ExecutionStep[] = [...prepareExecution(graph).steps];
  let matrix = steps[steps.length - 1].after;
  const nodes = graph.nodes;

  // Cada cambio crea otra matriz para que los pasos anteriores sigan intactos.
  const append = (
    step: Pick<ExecutionStep, 'id' | 'phase' | 'title' | 'explanation'> & Partial<ExecutionStep>,
  ) => {
    steps.push({
      before: matrix,
      after: matrix,
      rowOrder: nodes,
      columnOrder: nodes,
      highlightedNodes: [],
      highlightedEdges: [],
      changedCells: [],
      ...step,
    });
  };

  const { matrix: reachability, pivots } = calculatePaths(matrix, nodes);
  for (const [pivotIndex, { pivot, updates }] of pivots.entries()) {
    append({
      id: `pivot-${pivot}`,
      phase: 'paths',
      title: `Analizamos el vértice intermedio ${pivot}`,
      explanation: `Comprobamos R[i, ${pivot}] ∧ R[${pivot}, j] para cada par de vértices. ${updates.length ? `${updates.length === 1 ? 'Se actualizará 1 entrada' : `Se actualizarán ${updates.length} entradas`}: podrás revisar cada recorrido en los siguientes pasos.` : 'No aparecen caminos nuevos: los recorridos que pasan por este vértice ya están representados.'}`,
      highlightedNodes: [pivot],
    });
    for (const { row, column, witness, matrix: updatedMatrix } of updates) {
      const before = matrix;
      matrix = updatedMatrix;
      append({
        id: `path-${pivotIndex}-${row}-${column}`,
        phase: 'paths',
        title: `${nodes[row]} alcanza a ${nodes[column]} pasando por ${pivot}`,
        explanation: `R[${nodes[row]}, ${nodes[column]}] = 0 ∨ (1 ∧ 1) = 1. El recorrido ${witness.join(' → ')} usa conexiones del grafo original; este 1 representa alcanzabilidad, no un arco nuevo.`,
        before,
        after: matrix,
        witness,
        highlightedNodes: witness,
        highlightedEdges: witness
          .slice(1)
          .map((target, index) => ({ source: witness[index], target })),
        changedCells: [{ row, column }],
      });
    }
  }
  append({
    id: 'paths-complete',
    phase: 'paths',
    title: 'La matriz de caminos está completa',
    explanation:
      'Ya consideramos todos los vértices intermedios. R[i, j] = 1 significa que existe un camino dirigido desde i hasta j, incluida la longitud cero en la diagonal.',
  });

  const { counts, order, orderedCounts, reorderedRows, orderedMatrix } = orderMatrix(
    reachability,
    nodes,
  );
  nodes.forEach((node, index) =>
    append({
      id: `count-${node}`,
      phase: 'counts',
      title: `La fila ${node} contiene ${counts[index]} unos`,
      explanation: `Desde el vértice ${node} se alcanzan ${counts[index]} vértices, contando a sí mismo. Usaremos estas cantidades para ordenar las filas de mayor a menor.`,
      highlightedNodes: [node],
      rowCounts: counts.map((count, i) => (i <= index ? count : null)),
    }),
  );

  append({
    id: 'sort-rows',
    phase: 'rows',
    title: 'Ordenamos las filas de la matriz',
    explanation: `Orden: ${order.join(', ')}. Primero, mayor cantidad de unos; después, primer 1 más a la izquierda. Si persiste el empate, comparamos la fila completa (1 antes que 0) y finalmente el número del vértice. Así mantenemos juntas las filas idénticas.`,
    after: reorderedRows,
    rowOrder: order,
    beforeRowOrder: nodes,
    beforeColumnOrder: nodes,
    rowCounts: orderedCounts,
  });
  append({
    id: 'sort-columns',
    phase: 'columns',
    title: 'Aplicamos el mismo orden a las columnas',
    explanation: `Las filas y columnas quedan etiquetadas como ${order.join(', ')}. Solo cambiamos posiciones: las relaciones entre vértices se conservan. Buscaremos bloques cuadrados de unos en la diagonal.`,
    before: reorderedRows,
    after: orderedMatrix,
    rowOrder: order,
    columnOrder: order,
    beforeRowOrder: order,
    beforeColumnOrder: nodes,
    rowCounts: orderedCounts,
  });

  const components = findComponents(orderedMatrix, order);
  for (const [index, group] of components.entries()) {
    append({
      id: `component-${index + 1}`,
      phase: 'components',
      title: `Componente C${index + 1}: {${group.join(', ')}}`,
      explanation:
        group.length === 1
          ? `El vértice ${group[0]} forma una componente por sí solo: no tiene alcanzabilidad mutua con otro vértice. Puede tener conexiones hacia o desde otras componentes.`
          : `Los vértices ${group.join(', ')} se alcanzan entre sí en ambas direcciones. Su bloque diagonal está formado completamente por unos.`,
      before: orderedMatrix,
      after: orderedMatrix,
      rowOrder: order,
      columnOrder: order,
      highlightedNodes: group,
      rowCounts: orderedCounts,
      components: components.slice(0, index + 1).map((component) => [...component]),
    });
  }
  append({
    id: 'components-complete',
    phase: 'components',
    title: `${components.length} ${components.length === 1 ? 'componente encontrada' : 'componentes encontradas'}`,
    explanation: `Todos los ${nodes.length} vértices pertenecen a exactamente una componente fuertemente conexa. Los unos fuera de los bloques representan caminos entre grupos; no bastan para unirlos si no existe camino de regreso.`,
    before: orderedMatrix,
    after: orderedMatrix,
    rowOrder: order,
    columnOrder: order,
    rowCounts: orderedCounts,
    components: components.map((group) => [...group]),
  });
  return {
    graph,
    steps,
    status: 'complete',
    result: { components, reachability, orderedMatrix, order },
  };
}
