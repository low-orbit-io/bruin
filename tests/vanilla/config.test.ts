import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'bruin/vanilla';

vi.mock('react', () => ({}));

describe('history configuration', () => {
  describe('maxHistorySize', () => {
    it('should limit history to configured size', () => {
      const store = createStore<{ count: number }>(() => ({ count: 0 }), {
        maxHistorySize: 3,
      });

      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.setState({ count: 3 });
      store.setState({ count: 4 });
      store.setState({ count: 5 });

      const history = store.getHistory();

      expect(history.length).toBe(3);

      store.undo();

      expect(store.getState().count).toBe(4);

      store.undo();

      expect(store.getState().count).toBe(3);

      store.undo();

      expect(store.getState().count).toBe(2);
      expect(store.canUndo()).toBe(false);
    });

    it('should use default history size of 50 when not configured', () => {
      const store = createStore<{ count: number }>(() => ({ count: 0 }));

      for (let i = 1; i <= 60; i++) {
        store.setState({ count: i });
      }

      const history = store.getHistory();

      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('skipHistory flag', () => {
    it('should skip adding to history when skipHistory is true', () => {
      const store = createStore<{ count: number; hovering: boolean }>(() => ({
        count: 0,
        hovering: false,
      }));

      store.setState({ count: 1 });
      store.setState({ hovering: true }, false, { skipHistory: true });
      store.setState({ count: 2 });

      store.undo();
      expect(store.getState()).toEqual({ count: 1, hovering: true });

      store.undo();
      expect(store.getState()).toEqual({ count: 0, hovering: true });
    });

    it('should not affect canUndo when skipping history', () => {
      const store = createStore<{ count: number; temp: string }>(() => ({
        count: 0,
        temp: '',
      }));

      store.setState({ count: 1 });
      const canUndoBefore = store.canUndo();

      store.setState({ temp: 'temporary' }, false, { skipHistory: true });
      const canUndoAfter = store.canUndo();

      expect(canUndoAfter).toBe(canUndoBefore);
    });

    it('should skip history in transactions when specified', () => {
      const store = createStore<{ a: number; b: number }>(() => ({
        a: 0,
        b: 0,
      }));

      store.setState({ a: 1 });

      store.transaction(
        () => {
          store.setState({ a: 2 });
          store.setState({ b: 2 });
        },
        { skipHistory: true },
      );

      expect(store.getState()).toEqual({ a: 2, b: 2 });

      store.undo();
      expect(store.getState()).toEqual({ a: 0, b: 0 });
    });
  });

  describe('computedFields configuration', () => {
    it('should exclude configured computed fields from history', () => {
      interface State {
        items: string[];
        filter: string;
        filteredItems?: string[];
      }

      const store = createStore<State>(
        () => ({
          items: ['a', 'b', 'c'],
          filter: '',
          get filteredItems() {
            return this.items.filter((item) => item.includes(this.filter));
          },
        }),
        {
          computedFields: ['filteredItems'],
        },
      );

      store.setState({ items: ['a', 'b', 'c', 'd'] });
      const state1 = store.getState();
      expect(state1.filteredItems).toEqual(['a', 'b', 'c', 'd']);

      store.undo();
      const state2 = store.getState();
      expect(state2.filteredItems).toEqual(['a', 'b', 'c']);

      const history = store.getHistory();
      history.forEach((entry) => {
        expect(entry.state).not.toHaveProperty('filteredItems');
      });
    });

    it('should handle multiple computed fields', () => {
      interface State {
        numbers: number[];
        sum?: number;
        average?: number;
        count?: number;
      }

      const store = createStore<State>(
        () => ({
          numbers: [1, 2, 3],
          get sum() {
            return this.numbers.reduce((a, b) => a + b, 0);
          },
          get average() {
            return this.sum / this.numbers.length;
          },
          get count() {
            return this.numbers.length;
          },
        }),
        {
          computedFields: ['sum', 'average', 'count'],
        },
      );

      store.setState({ numbers: [1, 2, 3, 4, 5] });
      const state = store.getState();

      expect(state.sum).toBe(15);
      expect(state.average).toBe(3);
      expect(state.count).toBe(5);

      const history = store.getHistory();
      history.forEach((entry) => {
        expect(entry.state).not.toHaveProperty('sum');
        expect(entry.state).not.toHaveProperty('average');
        expect(entry.state).not.toHaveProperty('count');
      });
    });
  });

  describe('combined configuration', () => {
    it('should work with multiple config options together', () => {
      interface State {
        value: number;
        temp: string;
        doubled?: number;
      }

      const store = createStore<State>(
        () => ({
          value: 0,
          temp: '',
          get doubled() {
            return this.value * 2;
          },
        }),
        {
          maxHistorySize: 2,
          computedFields: ['doubled'],
        },
      );

      store.setState({ value: 1 });
      store.setState({ value: 2 });
      store.setState({ temp: 'temporary' }, false, { skipHistory: true });
      store.setState({ value: 3 });

      expect(store.getState()).toEqual({
        value: 3,
        temp: 'temporary',
        doubled: 6,
      });

      const history = store.getHistory();
      expect(history.length).toBe(2);

      store.undo();
      expect(store.getState().value).toBe(2);
      expect(store.getState().temp).toBe('temporary');

      store.undo();
      expect(store.getState().value).toBe(1);
      expect(store.canUndo()).toBe(false);
    });
  });

  describe('debounce configuration', () => {
    it('should group rapid mutations into single history entry', async () => {
      vi.useFakeTimers();
      const store = createStore<{ x: number; y: number }>(
        () => ({ x: 0, y: 0 }),
        { debounce: 100 },
      );

      store.setState({ x: 1 });
      store.setState({ x: 2 });
      store.setState({ x: 3 });
      store.setState({ y: 10 });

      expect(store.getHistory().length).toBe(1);

      await vi.advanceTimersByTimeAsync(100);

      expect(store.getHistory().length).toBe(2);
      expect(store.getState()).toEqual({ x: 3, y: 10 });

      store.undo();
      expect(store.getState()).toEqual({ x: 0, y: 0 });

      vi.useRealTimers();
    });

    it('should flush debounced history on undo', async () => {
      vi.useFakeTimers();
      const store = createStore<{ count: number }>(
        () => ({ count: 0 }),
        { debounce: 100 },
      );

      store.setState({ count: 1 });
      store.setState({ count: 2 });

      expect(store.getHistory().length).toBe(1);

      store.undo();

      expect(store.getHistory().length).toBe(2);
      expect(store.getState().count).toBe(0);

      vi.useRealTimers();
    });

    it('should not debounce when debounce is not configured', () => {
      const store = createStore<{ count: number }>(() => ({ count: 0 }));

      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.setState({ count: 3 });

      expect(store.getHistory().length).toBe(4);
    });

    it('should not debounce transactions', async () => {
      vi.useFakeTimers();
      const store = createStore<{ a: number; b: number }>(
        () => ({ a: 0, b: 0 }),
        { debounce: 100 },
      );

      store.transaction(() => {
        store.setState({ a: 1 });
        store.setState({ b: 1 });
      });

      expect(store.getHistory().length).toBe(2);

      await vi.advanceTimersByTimeAsync(100);

      expect(store.getHistory().length).toBe(2);

      vi.useRealTimers();
    });
  });

  describe('path-aware subscriptions', () => {
    it('should notify listeners only when subscribed path changes', () => {
      const store = createStore<{ a: number; b: number; c: number }>(() => ({
        a: 0,
        b: 0,
        c: 0,
      }));

      const listenerA = vi.fn();
      const listenerB = vi.fn();
      const listenerC = vi.fn();

      store.subscribe(['a'], listenerA);
      store.subscribe(['b'], listenerB);
      store.subscribe(['c'], listenerC);

      store.setState({ a: 1 });

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).not.toHaveBeenCalled();
      expect(listenerC).not.toHaveBeenCalled();

      store.setState({ b: 2 });

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(1);
      expect(listenerC).not.toHaveBeenCalled();
    });

    it('should notify listeners for nested path changes', () => {
      const store = createStore<{
        items: { [key: string]: { value: number } };
      }>(() => ({ items: {} }));

      const listener = vi.fn();

      store.subscribe(['items', 'item1'], listener);

      store.setState({ items: { item1: { value: 1 } } });

      expect(listener).toHaveBeenCalledTimes(1);

      store.setState({ items: { item1: { value: 2 }, item2: { value: 3 } } });

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should notify listeners for parent path when child changes', () => {
      const store = createStore<{
        items: { [key: string]: { value: number } };
      }>(() => ({ items: { item1: { value: 0 } } }));

      const listener = vi.fn();

      store.subscribe(['items'], listener);

      store.setState({ items: { item1: { value: 1 } } });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should maintain backward compatibility with function-only subscribe', () => {
      const store = createStore<{ count: number }>(() => ({ count: 0 }));

      const listener = vi.fn();

      store.subscribe(listener);

      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe path listeners correctly', () => {
      const store = createStore<{ a: number; b: number }>(() => ({
        a: 0,
        b: 0,
      }));

      const listener = vi.fn();

      const unsubscribe = store.subscribe(['a'], listener);

      store.setState({ a: 1 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      store.setState({ a: 2 });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
