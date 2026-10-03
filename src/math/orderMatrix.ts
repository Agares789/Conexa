import type { Matrix, NodeId } from '../domain/graph';

/** Cuenta los vértices alcanzables y aplica los criterios de orden de la lectura. */
export function orderMatrix(matrix: Matrix, nodes: readonly NodeId[]) {
  const counts = matrix.map((row) => row.reduce<number>((total, value) => total + value, 0));
  const indices = nodes
    .map((_, index) => index)
    .sort((first, second) => {
      const countDifference = counts[second] - counts[first];
      if (countDifference) return countDifference;

      const firstOneDifference = matrix[first].indexOf(1) - matrix[second].indexOf(1);
      if (firstOneDifference) return firstOneDifference;

      // Si los dos criterios empatan, esta comparación mantiene juntas las filas iguales.
      for (let column = 0; column < nodes.length; column++) {
        const difference = matrix[second][column] - matrix[first][column];
        if (difference) return difference;
      }
      return nodes[first] - nodes[second];
    });

  const order = indices.map((index) => nodes[index]);
  const orderedCounts = indices.map((index) => counts[index]);
  const reorderedRows = indices.map((index) => matrix[index]);
  const orderedMatrix = reorderedRows.map((row) => indices.map((index) => row[index]));
  return { counts, order, orderedCounts, reorderedRows, orderedMatrix };
}
