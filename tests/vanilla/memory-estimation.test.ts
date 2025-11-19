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

  it('estimates object sizes', () => {
    const store = createStore(() => ({
      user: { name: 'John', age: 30 },
      items: [1, 2, 3, 4, 5],
    }));

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(100);
  });

  it('handles circular references', () => {
    const store = createStore(() => {
      const obj: any = { value: 1 };
      obj.self = obj;
      return { data: obj };
    });

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeGreaterThan(0);
  });

  it('respects maxHistoryMemory limit', () => {
    const store = createStore(
      () => ({ data: '' }),
      { maxHistoryMemory: 1000 },
    );

    for (let i = 0; i < 100; i++) {
      store.setState({ data: 'x'.repeat(100) });
    }

    const info = store.getHistoryMemoryUsage();
    expect(info.totalBytes).toBeLessThanOrEqual(1000);
  });

  it('calls onMemoryLimitReached when limit hit', () => {
    let callCount = 0;
    let lastInfo: any = null;

    const store = createStore(
      () => ({ data: '' }),
      {
        maxHistoryMemory: 500,
        onMemoryLimitReached: (info) => {
          callCount++;
          lastInfo = info;
        },
      },
    );

    for (let i = 0; i < 10; i++) {
      store.setState({ data: 'x'.repeat(100) });
    }

    expect(callCount).toBeGreaterThan(0);
    expect(lastInfo).toBeDefined();
    expect(lastInfo.entriesRemoved).toBeGreaterThan(0);
  });

  it('uses custom size estimator', () => {
    const customEstimates: number[] = [];

    const store = createStore(
      () => ({ value: 0 }),
      {
        estimateSize: (state) => {
          const size = (state as any).value * 1000;
          customEstimates.push(size);
          return size;
        },
      },
    );

    store.setState({ value: 5 });
    store.setState({ value: 10 });

    expect(customEstimates).toContain(5000);
    expect(customEstimates).toContain(10000);
  });

  it('tracks memory accurately across undo/redo', () => {
    const store = createStore(
      () => ({ data: '' }),
      { maxHistoryMemory: 10000 },
    );

    store.setState({ data: 'a'.repeat(100) });
    const info1 = store.getHistoryMemoryUsage();

    store.setState({ data: 'b'.repeat(100) });
    const info2 = store.getHistoryMemoryUsage();

    expect(info2.totalBytes).toBeGreaterThan(info1.totalBytes);

    store.undo();
    const info3 = store.getHistoryMemoryUsage();

    expect(info3.totalBytes).toBe(info2.totalBytes);
  });

  it('combines count and memory limits', () => {
    const store = createStore(
      () => ({ value: 0 }),
      {
        maxHistorySize: 5,
        maxHistoryMemory: 1000,
      },
    );

    for (let i = 0; i < 20; i++) {
      store.setState({ value: i });
    }

    const history = store.getHistory();
    const memInfo = store.getHistoryMemoryUsage();

    expect(history.length).toBeLessThanOrEqual(6);
    expect(memInfo.totalBytes).toBeLessThanOrEqual(1000);
  });

  it('provides memory usage info with maxHistoryMemory', () => {
    const store = createStore(
      () => ({ data: '' }),
      { maxHistoryMemory: 5000 },
    );

    store.setState({ data: 'test' });
    const info = store.getHistoryMemoryUsage();

    expect(info.maxBytes).toBe(5000);
    expect(info.utilizationPercent).toBeDefined();
    expect(info.utilizationPercent).toBeGreaterThanOrEqual(0);
    expect(info.utilizationPercent).toBeLessThanOrEqual(100);
  });

  it('provides memory usage info without maxHistoryMemory', () => {
    const store = createStore(() => ({ data: '' }));

    store.setState({ data: 'test' });
    const info = store.getHistoryMemoryUsage();

    expect(info.maxBytes).toBeUndefined();
    expect(info.utilizationPercent).toBeUndefined();
  });

  it('calculates average bytes per entry', () => {
    const store = createStore(() => ({ value: 0 }));

    store.setState({ value: 1 });
    store.setState({ value: 2 });
    store.setState({ value: 3 });

    const info = store.getHistoryMemoryUsage();
    expect(info.averageBytes).toBeGreaterThan(0);
    expect(info.averageBytes).toBeLessThanOrEqual(info.totalBytes);
  });

  it('handles clearHistory with memory tracking', () => {
    const store = createStore(() => ({ value: 0 }));

    store.setState({ value: 1 });
    store.setState({ value: 2 });

    const infoBefore = store.getHistoryMemoryUsage();
    expect(infoBefore.entryCount).toBeGreaterThan(1);

    store.clearHistory!();

    const infoAfter = store.getHistoryMemoryUsage();
    expect(infoAfter.entryCount).toBe(1);
    expect(infoAfter.totalBytes).toBeLessThan(infoBefore.totalBytes);
  });

  it('handles restoreHistory with memory tracking', () => {
    const store = createStore(() => ({ value: 0 }));

    store.setState({ value: 1 });
    store.setState({ value: 2 });
    store.setState({ value: 3 });

    const history = store.getHistory();
    const originalInfo = store.getHistoryMemoryUsage();

    store.restoreHistory!(history, history.length - 1);

    const restoredInfo = store.getHistoryMemoryUsage();
    expect(restoredInfo.totalBytes).toBe(originalInfo.totalBytes);
    expect(restoredInfo.entryCount).toBe(originalInfo.entryCount);
  });
});

