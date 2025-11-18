import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'bruin/vanilla';

vi.mock('react', () => ({}));

describe('subscribe()', () => {
  it('should not be called if new state identity is the same', () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: 'a' };
    const { setState, subscribe } = createStore(() => initialState);

    subscribe(spy);
    setState(initialState);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should be called if new state identity is different', () => {
    const spy = vi.fn();
    const initialState = { value: 1, other: 'a' };
    const { setState, getState, subscribe } = createStore(() => initialState);

    subscribe(spy);
    setState({ ...getState() });
    expect(spy).toHaveBeenCalledWith({ value: 1, other: 'a' }, initialState);
  });

  it('should be called with prevState and newState', () => {
    const spy = vi.fn();
    const { setState, subscribe } = createStore(() => ({ count: 0 }));

    subscribe(spy);
    setState({ count: 1 });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
  });

  it('should unsubscribe correctly', () => {
    const spy = vi.fn();
    const { setState, subscribe } = createStore(() => ({ value: 0 }));

    const unsub = subscribe(spy);

    setState({ value: 1 });
    expect(spy).toHaveBeenCalledTimes(1);

    unsub();
    setState({ value: 2 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple subscribers', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const { setState, subscribe } = createStore(() => ({ value: 0 }));

    subscribe(spy1);
    subscribe(spy2);

    setState({ value: 1 });

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy1).toHaveBeenCalledWith({ value: 1 }, { value: 0 });
    expect(spy2).toHaveBeenCalledWith({ value: 1 }, { value: 0 });
  });

  it('should notify on undo', () => {
    const spy = vi.fn();
    const { setState, subscribe, undo } = createStore(() => ({ value: 0 }));

    subscribe(spy);
    setState({ value: 1 });
    setState({ value: 2 });

    spy.mockClear();
    undo();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ value: 1 }, { value: 2 });
  });

  it('should notify on redo', () => {
    const spy = vi.fn();
    const { setState, subscribe, undo, redo } = createStore(() => ({
      value: 0,
    }));

    subscribe(spy);
    setState({ value: 1 });
    undo();

    spy.mockClear();
    redo();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ value: 1 }, { value: 0 });
  });

  it('should notify once for transaction', () => {
    const spy = vi.fn();
    const { setState, subscribe, transaction } = createStore(() => ({
      a: 0,
      b: 0,
    }));

    subscribe(spy);

    transaction(() => {
      setState({ a: 1 });
      setState({ b: 2 });
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ a: 1, b: 2 }, { a: 0, b: 0 });
  });
});
