import type { Matrix, NodeId } from '../domain/graph';

/** Agrupa los vértices que pueden llegar uno al otro en ambas direcciones. */
export function findComponents(matrix: Matrix, order: readonly NodeId[]): NodeId[][] {
  const components: NodeId[][] = [];
  const assigned = new Set<NodeId>();

  for (let row = 0; row < order.length; row++) {
    if (assigned.has(order[row])) continue;
    const group = order.filter(
      (_, column) => matrix[row][column] === 1 && matrix[column][row] === 1,
    );
    group.forEach((node) => assigned.add(node));
    components.push(group);
  }

  return components;
}
