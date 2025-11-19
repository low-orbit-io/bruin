import { describe, expect, it } from 'vitest';
import { createStore } from '../../src/vanilla';

/**
 * Snapshot Sequence Tests
 *
 * Integration-style tests that verify snapshot functionality through
 * realistic user workflows. These tests verify complex sequences of
 * operations including state changes, snapshot saving/loading, history
 * management, and history index positioning.
 */

describe('Snapshot Sequences', () => {
  interface CounterState {
    count: number;
    increment: () => void;
    decrement: () => void;
  }

  interface NestedState {
    user: {
      name: string;
      items: Array<{ id: number }>;
    };
    updateName: (name: string) => void;
    addItem: (id: number) => void;
    removeItem: (id: number) => void;
  }

  const createCounterStore = (options = {}) => {
    return createStore<CounterState>(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
        decrement: () => set((state) => ({ count: state.count - 1 })),
      }),
      options,
    );
  };

  const createNestedStore = () => {
    return createStore<NestedState>((set) => ({
      user: {
        name: 'Alice',
        items: [{ id: 1 }],
      },
      updateName: (name: string) =>
        set((state) => ({
          user: { ...state.user, name },
        })),
      addItem: (id: number) =>
        set((state) => ({
          user: {
            ...state.user,
            items: [...state.user.items, { id }],
          },
        })),
      removeItem: (id: number) =>
        set((state) => ({
          user: {
            ...state.user,
            items: state.user.items.filter((item) => item.id !== id),
          },
        })),
    }));
  };

  const verifyHistoryEntry = (
    entry: any,
    expectedCount: number,
    expectedName?: string,
  ) => {
    expect(entry).toBeDefined();
    expect(entry.state?.count).toBe(expectedCount);
    if (expectedName) {
      expect(entry.name).toBe(expectedName);
    }
  };

  const verifyHistoryState = (
    store: ReturnType<typeof createCounterStore>,
    expectedCount: number,
    expectedIndex: number,
  ) => {
    expect(store.getState().count).toBe(expectedCount);
    expect(store.getCurrentHistoryIndex()).toBe(expectedIndex);
    expect(store.getCurrentHistoryIndex()).toBe(
      store.getHistory().length - 1,
    );
  };

  const verifyHistoryIndependence = (
    store: ReturnType<typeof createCounterStore>,
  ) => {
    const historyEntries = store.getHistory();
    if (historyEntries.length < 2) return;

    const firstEntry = historyEntries[0];
    const lastEntry = historyEntries[historyEntries.length - 1];

    expect(firstEntry.state).not.toBe(lastEntry.state);

    if (
      firstEntry &&
      firstEntry.state &&
      typeof firstEntry.state === 'object'
    ) {
      const originalLastCount = (lastEntry.state as any).count;
      const originalFirstCount = (firstEntry.state as any).count;

      (firstEntry.state as any).count = 999;

      expect((lastEntry.state as any).count).toBe(originalLastCount);
      expect((firstEntry.state as any).count).toBe(999);

      (firstEntry.state as any).count = originalFirstCount;
    }
  };

  describe('Scenario 1: Basic Snapshot Application', () => {
    it('should add new history entry when applying snapshot', () => {
      const store = createCounterStore();

      store.setState({ count: 1 });
      store.setState({ count: 11 });

      const snapshotId = store.saveSnapshot('snapshot-at-11');

      store.setState({ count: 16 });
      store.setState({ count: 17 });
      store.setState({ count: 16 });

      const historyBeforeLoad = store.getHistory();
      const historySizeBeforeLoad = historyBeforeLoad.length;

      const success = store.loadSnapshot(snapshotId);

      expect(success).toBe(true);
      expect(store.getState().count).toBe(11);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );

      const historyAfterLoad = store.getHistory();
      expect(historyAfterLoad.length).toBe(historySizeBeforeLoad + 1);

      for (let i = 0; i < historyBeforeLoad.length; i++) {
        expect(historyAfterLoad[i]!.state.count).toBe(
          historyBeforeLoad[i]!.state.count,
        );
      }

      const lastEntry = historyAfterLoad[historyAfterLoad.length - 1];
      verifyHistoryEntry(lastEntry, 11, 'Restored snapshot: snapshot-at-11');

      verifyHistoryIndependence(store);
    });
  });

  describe('Scenario 2: Multiple Snapshots', () => {
    it('should handle loading multiple snapshots in sequence', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotAId = store.saveSnapshot('snapshot-A');

      store.setState({ count: 15 });
      store.setState({ count: 20 });

      const snapshotBId = store.saveSnapshot('snapshot-B');

      const historyBeforeLoadA = store.getHistory().length;

      store.loadSnapshot(snapshotAId);

      expect(store.getState().count).toBe(10);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );
      expect(store.getHistory().length).toBe(historyBeforeLoadA + 1);

      const historyBeforeLoadB = store.getHistory().length;

      store.loadSnapshot(snapshotBId);

      expect(store.getState().count).toBe(20);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );
      expect(store.getHistory().length).toBe(historyBeforeLoadB + 1);

      store.undo();
      expect(store.getState().count).toBe(10);

      store.undo();
      expect(store.getState().count).toBe(20);
    });
  });

  describe('Scenario 3: Undo/Redo After Snapshot Load', () => {
    it('should allow undo/redo after loading snapshot', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotId = store.saveSnapshot('snapshot-at-10');

      store.setState({ count: 15 });

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);
      expect(store.canUndo()).toBe(true);

      store.undo();

      expect(store.getState().count).toBe(15);
      expect(store.canRedo()).toBe(true);

      store.redo();

      expect(store.getState().count).toBe(10);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );
    });
  });

  describe('Scenario 4: Snapshot Load Then More Changes', () => {
    it('should create new history entries after loading snapshot', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotId = store.saveSnapshot('snapshot-at-10');

      store.setState({ count: 15 });

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);

      const historyBeforeNewChanges = store.getHistory().length;

      store.setState({ count: 20 });

      expect(store.getState().count).toBe(20);
      expect(store.getHistory().length).toBe(historyBeforeNewChanges + 1);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );

      store.undo();
      expect(store.getState().count).toBe(10);

      store.undo();
      expect(store.getState().count).toBe(15);
    });
  });

  describe('Scenario 5: Snapshot After History Clear', () => {
    it('should load snapshot successfully after clearing history', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotId = store.saveSnapshot('snapshot-at-10');

      store.clearHistory();

      expect(store.getHistory().length).toBe(1);

      const success = store.loadSnapshot(snapshotId);

      expect(success).toBe(true);
      expect(store.getState().count).toBe(10);
      expect(store.getHistory().length).toBe(2);
      expect(store.getCurrentHistoryIndex()).toBe(1);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );
    });
  });

  describe('Scenario 6: Snapshot Load After Undo (Truncates Future History)', () => {
    it('should truncate future history when loading snapshot after undo', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotId = store.saveSnapshot('snapshot-at-10');

      store.setState({ count: 15 });
      store.setState({ count: 20 });

      const historyBeforeUndo = store.getHistory().length;

      store.undo();
      store.undo();

      expect(store.getState().count).toBe(10);
      expect(store.getCurrentHistoryIndex()).toBe(historyBeforeUndo - 3);

      const historyBeforeLoad = store.getHistory().length;
      const historyIndexBeforeLoad = store.getCurrentHistoryIndex();

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);
      expect(store.getHistory().length).toBe(historyIndexBeforeLoad + 2);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );
      expect(store.canRedo()).toBe(false);

      const history = store.getHistory();
      const lastEntry = history[history.length - 1];
      verifyHistoryEntry(lastEntry, 10, 'Restored snapshot: snapshot-at-10');
    });
  });

  describe('Scenario 7: Snapshot Load With maxHistorySize', () => {
    it('should respect maxHistorySize when loading snapshots', () => {
      const store = createCounterStore({ maxHistorySize: 5 });

      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.setState({ count: 3 });
      store.setState({ count: 4 });

      const snapshotId = store.saveSnapshot('snapshot-at-4');

      store.setState({ count: 5 });
      store.setState({ count: 6 });
      store.setState({ count: 7 });
      store.setState({ count: 8 });

      expect(store.getHistory().length).toBeLessThanOrEqual(6);

      const historyBeforeLoad = store.getHistory().length;

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(4);
      expect(store.getHistory().length).toBeLessThanOrEqual(6);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );

      expect(store.canUndo()).toBe(true);
      expect(store.canRedo()).toBe(false);
    });
  });

  describe('Scenario 8: Transaction Boundaries With Snapshots', () => {
    it('should handle snapshot loads after transactions', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotId = store.saveSnapshot('snapshot-at-10');

      const historyBeforeTransaction = store.getHistory().length;

      store.transaction(
        () => {
          store.setState({ count: 15 });
          store.setState({ count: 20 });
        },
        { name: 'Batch update' },
      );

      expect(store.getHistory().length).toBe(historyBeforeTransaction + 1);
      expect(store.getState().count).toBe(20);

      const historyBeforeLoad = store.getHistory().length;

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);
      expect(store.getHistory().length).toBe(historyBeforeLoad + 1);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );

      store.undo();
      expect(store.getState().count).toBe(20);

      store.undo();
      expect(store.getState().count).toBe(10);
    });
  });

  describe('Scenario 9: Snapshot Deletion After Load', () => {
    it('should maintain history entry validity after snapshot deletion', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotId = store.saveSnapshot('snapshot-at-10');

      store.setState({ count: 15 });

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);

      const historyBeforeDelete = store.getHistory();
      const historyIndexBeforeDelete = store.getCurrentHistoryIndex();

      store.deleteSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);
      expect(store.getHistory().length).toBe(historyBeforeDelete.length);
      expect(store.getCurrentHistoryIndex()).toBe(historyIndexBeforeDelete);

      store.undo();
      expect(store.getState().count).toBe(15);

      store.redo();
      expect(store.getState().count).toBe(10);

      const snapshotAfterDelete = store.getSnapshot(snapshotId);
      expect(snapshotAfterDelete).toBeNull();
    });
  });

  describe('Scenario 10: Loading Same Snapshot Multiple Times', () => {
    it('should create new history entry each time same snapshot is loaded', () => {
      const store = createCounterStore();

      store.setState({ count: 5 });
      store.setState({ count: 10 });

      const snapshotId = store.saveSnapshot('snapshot-at-10');

      store.setState({ count: 15 });

      const historyBeforeFirstLoad = store.getHistory().length;

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);
      expect(store.getHistory().length).toBe(historyBeforeFirstLoad + 1);

      const firstLoadEntry = store.getHistory()[store.getHistory().length - 1];
      verifyHistoryEntry(firstLoadEntry, 10, 'Restored snapshot: snapshot-at-10');

      store.setState({ count: 20 });

      const historyBeforeSecondLoad = store.getHistory().length;

      store.loadSnapshot(snapshotId);

      expect(store.getState().count).toBe(10);
      expect(store.getHistory().length).toBe(historyBeforeSecondLoad + 1);

      const secondLoadEntry = store.getHistory()[store.getHistory().length - 1];
      verifyHistoryEntry(secondLoadEntry, 10, 'Restored snapshot: snapshot-at-10');

      expect(firstLoadEntry.state).not.toBe(secondLoadEntry.state);

      store.undo();
      expect(store.getState().count).toBe(20);

      store.undo();
      expect(store.getState().count).toBe(10);
    });
  });

  describe('Scenario 11: Complex Nested State', () => {
    it('should handle snapshot operations with nested state structures', () => {
      const store = createNestedStore();

      expect(store.getState().user.name).toBe('Alice');
      expect(store.getState().user.items.length).toBe(1);

      store.getState().updateName('Bob');
      store.getState().addItem(2);

      expect(store.getState().user.name).toBe('Bob');
      expect(store.getState().user.items.length).toBe(2);

      const snapshotId = store.saveSnapshot('snapshot-with-bob');

      store.getState().updateName('Charlie');
      store.getState().removeItem(1);

      expect(store.getState().user.name).toBe('Charlie');
      expect(store.getState().user.items.length).toBe(1);

      const historyBeforeLoad = store.getHistory().length;

      store.loadSnapshot(snapshotId);

      expect(store.getState().user.name).toBe('Bob');
      expect(store.getState().user.items.length).toBe(2);
      expect(store.getState().user.items[0]!.id).toBe(1);
      expect(store.getState().user.items[1]!.id).toBe(2);
      expect(store.getHistory().length).toBe(historyBeforeLoad + 1);
      expect(store.getCurrentHistoryIndex()).toBe(
        store.getHistory().length - 1,
      );

      verifyHistoryIndependence(store);

      store.undo();
      expect(store.getState().user.name).toBe('Charlie');
      expect(store.getState().user.items.length).toBe(1);

      store.redo();
      expect(store.getState().user.name).toBe('Bob');
      expect(store.getState().user.items.length).toBe(2);
    });
  });
});

