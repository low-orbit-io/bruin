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
});
