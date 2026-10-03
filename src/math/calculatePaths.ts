import type { Matrix, NodeId } from '../domain/graph';

export type PathUpdate = Readonly<{
  row: number;
  column: number;
  witness: readonly NodeId[];
  matrix: Matrix;
}>;

export type PivotTrace = Readonly<{
  pivot: NodeId;
  updates: readonly PathUpdate[];
}>;

/** Calcula la matriz de caminos y guarda cómo se obtuvo cada 1 nuevo. */
export function calculatePaths(initialMatrix: Matrix, nodes: readonly NodeId[]) {
  let matrix = initialMatrix;
  let knownPaths: (NodeId[] | null)[][] = matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      value
        ? rowIndex === columnIndex
          ? [nodes[rowIndex]]
          : [nodes[rowIndex], nodes[columnIndex]]
        : null,
    ),
  );
  const pivots: PivotTrace[] = [];

  for (let pivotIndex = 0; pivotIndex < nodes.length; pivotIndex++) {
    const beforePivot = matrix;
    const pathsBeforePivot = knownPaths;
    knownPaths = knownPaths.map((row) => [...row]);
    const updates: PathUpdate[] = [];

    for (let row = 0; row < nodes.length; row++) {
      for (let column = 0; column < nodes.length; column++) {
        // Un camino nuevo pasa por el pivote si existen sus dos tramos.
        if (
          beforePivot[row][column] ||
          !beforePivot[row][pivotIndex] ||
          !beforePivot[pivotIndex][column]
        )
          continue;

        const witness = [
          ...pathsBeforePivot[row][pivotIndex]!,
          ...pathsBeforePivot[pivotIndex][column]!.slice(1),
        ];
        knownPaths[row][column] = witness;
        matrix = matrix.map((currentRow, rowIndex) =>
          currentRow.map((value, columnIndex) =>
            rowIndex === row && columnIndex === column ? 1 : value,
          ),
        ) as Matrix;
        updates.push({ row, column, witness, matrix });
      }
    }
    pivots.push({ pivot: nodes[pivotIndex], updates });
  }

  return { matrix, pivots };
}
