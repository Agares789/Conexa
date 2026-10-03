import { toggleEdge, resizeGraph, nodeCountError, type Graph, type NodeId } from '../domain/graph';
import type { CompleteExecution } from '../execution/types';

export type Workspace =
  | { stage: 'setup' }
  | { stage: 'build'; graph: Graph; selectedNode: NodeId | null; message: string }
  | { stage: 'review'; graph: Graph }
  | { stage: 'execution' | 'result'; graph: Graph; execution: CompleteExecution; index: number };

export type Action =
  | { type: 'create'; graph: Graph }
  | { type: 'select'; node: NodeId }
  | { type: 'toggle'; source: NodeId; target: NodeId }
  | { type: 'resize'; count: number }
  | { type: 'review' }
  | { type: 'edit' }
  | { type: 'execute'; execution: CompleteExecution }
  | { type: 'move'; delta: number }
  | { type: 'jump'; index: number }
  | { type: 'result' }
  | { type: 'resume' }
  | { type: 'restart' }
  | { type: 'setup' };

export const initialWorkspace: Workspace = { stage: 'setup' };

export function workspaceReducer(state: Workspace, action: Action): Workspace {
  switch (action.type) {
    case 'resize':
      if (state.stage !== 'build' || nodeCountError(action.count)) return state;
      return {
        ...state,
        graph: resizeGraph(state.graph, action.count),
        selectedNode: null,
        message:
          action.count > state.graph.nodes.length
            ? `Vértice ${action.count} añadido.`
            : `Vértice ${state.graph.nodes.length} eliminado junto con sus conexiones.`,
      };
    case 'setup':
      return initialWorkspace;
    case 'create':
      return {
        stage: 'build',
        graph: action.graph,
        selectedNode: null,
        message: 'Selecciona un origen y después un destino para crear una conexión.',
      };
    case 'select': {
      if (state.stage !== 'build' || !state.graph.nodes.includes(action.node)) return state;
      if (state.selectedNode === action.node)
        return {
          ...state,
          selectedNode: null,
          message: 'Selección cancelada. Elige un vértice de origen.',
        };
      if (state.selectedNode === null)
        return {
          ...state,
          selectedNode: action.node,
          message: `Origen ${action.node} seleccionado. Ahora elige el destino.`,
        };
      return workspaceReducer(state, {
        type: 'toggle',
        source: state.selectedNode,
        target: action.node,
      });
    }
    case 'toggle': {
      if (state.stage !== 'build') return state;
      const exists = state.graph.edges.some(
        (edge) => edge.source === action.source && edge.target === action.target,
      );
      return {
        ...state,
        graph: toggleEdge(state.graph, action.source, action.target),
        selectedNode: null,
        message: `Conexión ${action.source} → ${action.target} ${exists ? 'eliminada' : 'añadida'}.`,
      };
    }
    case 'review':
      return state.stage === 'build' ? { stage: 'review', graph: state.graph } : state;
    case 'edit':
      return state.stage !== 'setup'
        ? {
            stage: 'build',
            graph: state.graph,
            selectedNode: null,
            message: 'Puedes editar las conexiones. Al iniciar de nuevo se recalcularán los pasos.',
          }
        : state;
    case 'execute':
      if (
        state.stage !== 'review' ||
        action.execution.graph !== state.graph ||
        !action.execution.steps.length
      )
        return state;
      return { stage: 'execution', graph: state.graph, execution: action.execution, index: 0 };
    case 'move':
      return state.stage === 'execution' && Number.isInteger(action.delta)
        ? {
            ...state,
            index: Math.max(
              0,
              Math.min(state.execution.steps.length - 1, state.index + action.delta),
            ),
          }
        : state;
    case 'restart':
      return state.stage === 'execution' || state.stage === 'result'
        ? { ...state, stage: 'execution', index: 0 }
        : state;
    case 'jump':
      return state.stage === 'execution' && Number.isInteger(action.index)
        ? { ...state, index: Math.max(0, Math.min(state.execution.steps.length - 1, action.index)) }
        : state;
    case 'result':
      return state.stage === 'execution' ? { ...state, stage: 'result' } : state;
    case 'resume':
      return state.stage === 'result' ? { ...state, stage: 'execution' } : state;
  }
}
