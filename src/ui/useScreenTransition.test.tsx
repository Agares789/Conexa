import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScreenTransition } from './useScreenTransition';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('screen transitions', () => {
  it('slides ordinary pages quickly and ignores duplicate navigation', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const action = vi.fn();
    const { result, unmount } = renderHook(useScreenTransition);
    act(() => {
      result.current.transition(action);
      result.current.transition(action);
    });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.mode).toBe('slide');
    act(() => vi.advanceTimersByTime(180));
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('reveal');
    act(() => vi.advanceTimersByTime(260));
    expect(result.current.busy).toBe(false);
    act(() => result.current.transition(action));
    unmount();
    act(() => vi.runAllTimers());
    expect(action).toHaveBeenCalledTimes(1);
  });
  it('reserves the full wave for an explicit portada action', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const action = vi.fn();
    const { result } = renderHook(useScreenTransition);
    act(() => result.current.transition(action, 'wave'));
    expect(result.current.mode).toBe('wave');
    act(() => vi.advanceTimersByTime(679));
    expect(action).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(action).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(620));
    expect(result.current.busy).toBe(false);
  });
  it('respects reduced motion without delaying navigation', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { result } = renderHook(useScreenTransition);
    const action = vi.fn();
    act(() => result.current.transition(action));
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.busy).toBe(false);
  });
});
