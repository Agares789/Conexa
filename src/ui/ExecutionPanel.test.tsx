import { useReducer } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGraph } from '../domain/graph';
import { runComponents } from '../math/runComponents';
import { workspaceReducer, type Workspace } from '../app/state';
import { ExecutionPanel } from './ExecutionPanel';

const graph = createGraph(4);
const execution = runComponents(graph);
function Player({ paused = false }: { paused?: boolean }) {
  const [state, dispatch] = useReducer(workspaceReducer, {
    stage: 'execution',
    graph,
    execution,
    index: 0,
  } as Workspace);
  return state.stage === 'execution' ? (
    <ExecutionPanel execution={execution} index={state.index} dispatch={dispatch} paused={paused} />
  ) : null;
}
afterEach(() => vi.useRealTimers());
describe('playback', () => {
  it('advances, pauses during help and stops when manually navigating or unmounting', () => {
    vi.useFakeTimers();
    const view = render(<Player />);
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir pasos' }));
    act(() => vi.advanceTimersByTime(1700));
    expect(screen.getByRole('heading')).toHaveTextContent('El vértice 1');
    view.rerender(<Player paused />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('heading')).toHaveTextContent('El vértice 1');
    view.rerender(<Player />);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('heading')).toHaveTextContent('El vértice 2');
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('heading')).toHaveTextContent('El vértice 2');
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir pasos' }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
