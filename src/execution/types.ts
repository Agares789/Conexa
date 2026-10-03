import type { Edge, Graph, Matrix, NodeId } from '../domain/graph';

export type ExecutionPhase =
  'adjacency' | 'reflexive' | 'paths' | 'counts' | 'rows' | 'columns' | 'components';
export type Cell = Readonly<{ row: number; column: number }>;
export type ExecutionStep = Readonly<{
  id: string;
  phase: ExecutionPhase;
  title: string;
  explanation: string;
  before: Matrix;
  after: Matrix;
  rowOrder: readonly NodeId[];
  columnOrder: readonly NodeId[];
  highlightedNodes: readonly NodeId[];
  highlightedEdges: readonly Edge[];
  changedCells: readonly Cell[];
  beforeRowOrder?: readonly NodeId[];
  beforeColumnOrder?: readonly NodeId[];
  rowCounts?: readonly (number | null)[];
  witness?: readonly NodeId[];
  components?: ReadonlyArray<readonly NodeId[]>;
}>;

export type ComponentResult = Readonly<{
  components: ReadonlyArray<readonly NodeId[]>;
  reachability: Matrix;
  orderedMatrix: Matrix;
  order: readonly NodeId[];
}>;
type ExecutionBase = Readonly<{ graph: Graph; steps: readonly ExecutionStep[] }>;
export type CompleteExecution = ExecutionBase &
  Readonly<{ status: 'complete'; result: ComponentResult }>;
export type Execution = ExecutionBase &
  (
    | Readonly<{ status: 'partial'; pending: string }>
    | Readonly<{ status: 'complete'; result: ComponentResult }>
  );

/** El cálculo entrega todos los pasos; la interfaz elige cuál mostrar. */
export type GraphProcedure = (graph: Graph) => Execution;
