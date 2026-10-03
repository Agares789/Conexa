import { describe, expect, it } from 'vitest';
import { createGraph } from '../domain/graph';
import { runComponents } from '../math/runComponents';
import { initialWorkspace, workspaceReducer } from './state';

describe('workspace transitions', () => {
  it('resizes only in the editor, resets selection and enforces both boundaries', () => {
    let state = workspaceReducer(initialWorkspace, {
      type: 'create',
      graph: createGraph(5, [{ source: 5, target: 1 }]),
    });
    state = workspaceReducer(state, { type: 'select', node: 5 });
    state = workspaceReducer(state, { type: 'resize', count: 4 });
    expect(state).toMatchObject({ selectedNode: null, graph: { nodes: [1, 2, 3, 4], edges: [] } });
    expect(workspaceReducer(state, { type: 'resize', count: 3 })).toBe(state);
    expect(workspaceReducer(state, { type: 'resize', count: 13 })).toBe(state);
    const review = workspaceReducer(state, { type: 'review' });
    expect(workspaceReducer(review, { type: 'resize', count: 7 })).toBe(review);
  });
  it('does not allow reviewing an uncreated graph', () => {
    expect(workspaceReducer(initialWorkspace, { type: 'review' })).toEqual(initialWorkspace);
  });
  it('selects two nodes to create an arc and cancels repeated origin selection', () => {
    let state = workspaceReducer(initialWorkspace, { type: 'create', graph: createGraph(4) });
    state = workspaceReducer(state, { type: 'select', node: 1 });
    state = workspaceReducer(state, { type: 'select', node: 1 });
    expect(state).toMatchObject({ selectedNode: null });
    state = workspaceReducer(state, { type: 'select', node: 1 });
    state = workspaceReducer(state, { type: 'select', node: 2 });
    expect(state).toMatchObject({ graph: { edges: [{ source: 1, target: 2 }] } });
  });
  it('bounds the timeline and discards stale execution when returning to editing', () => {
    const graph = createGraph(4);
    let state = workspaceReducer(
      { stage: 'review', graph },
      { type: 'execute', execution: runComponents(graph) },
    );
    state = workspaceReducer(state, { type: 'move', delta: -100 });
    expect(state).toMatchObject({ index: 0 });
    state = workspaceReducer(state, { type: 'move', delta: 100 });
    expect(state).toMatchObject({ index: runComponents(graph).steps.length - 1 });
    state = workspaceReducer(state, { type: 'restart' });
    expect(state).toMatchObject({ index: 0 });
    state = workspaceReducer(state, { type: 'edit' });
    expect(state.stage).toBe('build');
    expect(state).not.toHaveProperty('execution');
  });
  it('rejects an execution computed from a different graph', () => {
    const state = { stage: 'review' as const, graph: createGraph(4) };
    expect(
      workspaceReducer(state, { type: 'execute', execution: runComponents(createGraph(5)) }),
    ).toBe(state);
  });
  it('preserves the selected step across result/review and clamps jump controls', () => {
    const graph = createGraph(4);
    let state = workspaceReducer(
      { stage: 'review', graph },
      { type: 'execute', execution: runComponents(graph) },
    );
    state = workspaceReducer(state, { type: 'jump', index: 6 });
    state = workspaceReducer(state, { type: 'result' });
    expect(state).toMatchObject({ stage: 'result', index: 6 });
    state = workspaceReducer(state, { type: 'resume' });
    expect(state).toMatchObject({ stage: 'execution', index: 6 });
    expect(workspaceReducer(state, { type: 'jump', index: NaN })).toBe(state);
    state = workspaceReducer(state, { type: 'jump', index: -9 });
    expect(state).toMatchObject({ index: 0 });
    state = workspaceReducer(state, { type: 'result' });
    state = workspaceReducer(state, { type: 'restart' });
    expect(state).toMatchObject({ stage: 'execution', index: 0 });
  });
});
