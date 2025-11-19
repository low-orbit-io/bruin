import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'bruin/vanilla';

vi.mock('react', () => ({}));

const consoleError = console.error;
afterEach(() => {
  console.error = consoleError;
});

describe('Memory Estimation', () => {
  it('estimates primitive sizes', () => {
    const store = createStore(() => ({
      num: 42,
      str: 'hello',
      bool: true,
      nul: null,
    }));

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(0);
    expect(info.entryCount).toBeGreaterThan(0);
  });

  it('estimates nested object sizes', () => {
    const store = createStore(() => ({
      user: {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
    }));

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(0);
    expect(info.entryCount).toBeGreaterThan(0);
  });

  it('estimates array sizes', () => {
    const store = createStore(() => ({
      items: ['apple', 'banana', 'cherry'],
      numbers: [1, 2, 3, 4, 5],
    }));

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(0);
    expect(info.entryCount).toBeGreaterThan(0);
  });

  it('tracks memory growth with history', () => {
    const store = createStore(() => ({ count: 0 }));

    const initial = store.getHistoryMemoryUsage();
    expect(initial.entryCount).toBe(1);

    store.setState({ count: 1 });
    store.setState({ count: 2 });
    store.setState({ count: 3 });

    const after = store.getHistoryMemoryUsage();
    expect(after.entryCount).toBe(4);
    expect(after.totalBytes).toBeGreaterThan(initial.totalBytes);
  });

  it('respects maxHistoryMemory option', () => {
    const onMemoryLimitReached = vi.fn();
    const store = createStore(
      () => ({ data: 'x'.repeat(100) }),
      {
        maxHistoryMemory: 500, // 500 bytes limit
        onMemoryLimitReached,
      },
    );

    // Add multiple states to exceed memory limit
    for (let i = 0; i < 10; i++) {
      store.setState({ data: 'x'.repeat(100 + i) });
    }

    expect(onMemoryLimitReached).toHaveBeenCalled();
    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeLessThanOrEqual(500);
  });

  it('uses custom estimateSize function', () => {
    const customEstimate = vi.fn(() => 42);
    const store = createStore(
      () => ({ value: 'test' }),
      {
        estimateSize: customEstimate,
      },
    );

    store.setState({ value: 'updated' });

    expect(customEstimate).toHaveBeenCalled();
    const info = store.getHistoryMemoryUsage();
    // Should use custom estimate for each entry
    expect(info.totalBytes).toBe(42 * info.entryCount);
  });

  it('calculates average bytes per entry', () => {
    const store = createStore(() => ({ count: 0 }));

    store.setState({ count: 1 });
    store.setState({ count: 2 });

    const info = store.getHistoryMemoryUsage();
    expect(info.averageBytes).toBe(info.totalBytes / info.entryCount);
    expect(info.averageBytes).toBeGreaterThan(0);
  });

  it('includes utilization percentage when max is set', () => {
    const store = createStore(
      () => ({ value: 'test' }),
      {
        maxHistoryMemory: 1000,
      },
    );

    const info = store.getHistoryMemoryUsage();
    expect(info.maxBytes).toBe(1000);
    expect(info.utilizationPercent).toBeDefined();
    expect(info.utilizationPercent).toBeGreaterThanOrEqual(0);
    expect(info.utilizationPercent).toBeLessThanOrEqual(100);
  });

  it('handles circular references', () => {
    const store = createStore(() => {
      const obj: any = { value: 'test' };
      obj.self = obj; // circular reference
      return obj;
    });

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(0);
    // Should not cause infinite loop
  });

  it('estimates Map and Set sizes', () => {
    const store = createStore(() => ({
      map: new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]),
      set: new Set(['a', 'b', 'c']),
    }));

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(0);
    expect(info.entryCount).toBeGreaterThan(0);
  });

  it('handles symbols and functions', () => {
    const store = createStore(() => ({
      sym: Symbol('test'),
      func: () => 'hello',
      regex: /test/gi,
    }));

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(0);
  });

  it('tracks memory after undo/redo', () => {
    const store = createStore(() => ({ count: 0 }));

    store.setState({ count: 1 });
    store.setState({ count: 2 });

    const beforeUndo = store.getHistoryMemoryUsage();

    store.undo();
    const afterUndo = store.getHistoryMemoryUsage();
    // Memory should remain same after undo (history still exists)
    expect(afterUndo.totalBytes).toBe(beforeUndo.totalBytes);

    store.redo();
    const afterRedo = store.getHistoryMemoryUsage();
    expect(afterRedo.totalBytes).toBe(beforeUndo.totalBytes);
  });

  it('clears memory on clearHistory', () => {
    const store = createStore(() => ({ count: 0 }));

    store.setState({ count: 1 });
    store.setState({ count: 2 });

    const beforeClear = store.getHistoryMemoryUsage();
    expect(beforeClear.entryCount).toBe(3);

    store.clearHistory?.();

    const afterClear = store.getHistoryMemoryUsage();
    expect(afterClear.entryCount).toBe(1); // Current state remains
    expect(afterClear.totalBytes).toBeLessThan(beforeClear.totalBytes);
  });

  it('maintains memory info after save and restore', () => {
    const store = createStore(() => ({ count: 0 }));

    store.setState({ count: 1 });
    store.setState({ count: 2 });

    const history = store.saveHistory!();
    const originalInfo = store.getHistoryMemoryUsage();

    store.restoreHistory!(history, history.length - 1);

    const restoredInfo = store.getHistoryMemoryUsage();
    expect(restoredInfo.totalBytes).toBe(originalInfo.totalBytes);
    expect(restoredInfo.entryCount).toBe(originalInfo.entryCount);
  });
});