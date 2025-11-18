import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const createPersistentStore = (initialValue: string | null) => {
  let state = initialValue;

  const getItem = (): string | null => {
    getItemSpy();
    return state;
  };
  const setItem = (name: string, newState: string) => {
    setItemSpy(name, newState);
    state = newState;
  };
  const removeItem = (name: string) => {
    removeItemSpy(name);
    state = null;
  };

  const getItemSpy = vi.fn();
  const setItemSpy = vi.fn();
  const removeItemSpy = vi.fn();

  return {
    storage: { getItem, setItem, removeItem },
    getItemSpy,
    setItemSpy,
    removeItemSpy,
  };
};

const createAsyncPersistentStore = (initialValue: string | null) => {
  let state = initialValue;

  const getItem = async (): Promise<string | null> => {
    getItemSpy();
    return state;
  };
  const setItem = async (name: string, newState: string) => {
    setItemSpy(name, newState);
    state = newState;
  };
  const removeItem = async (name: string) => {
    removeItemSpy(name);
    state = null;
  };

  const getItemSpy = vi.fn();
  const setItemSpy = vi.fn();
  const removeItemSpy = vi.fn();

  return {
    storage: { getItem, setItem, removeItem },
    getItemSpy,
    setItemSpy,
    removeItemSpy,
  };
};

describe('Persist Middleware - Sync Storage', () => {
  const consoleError = console.error;

  afterEach(() => {
    cleanup();
    console.error = consoleError;
    vi.restoreAllMocks();
  });

  it('should be defined', async () => {
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );
    expect(persist).toBeDefined();
    expect(createJSONStorage).toBeDefined();
  });

  it('can rehydrate state', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const storage = {
      getItem: (name: string) =>
        JSON.stringify({
          state: { count: 42, name },
          version: 0,
        }),
      setItem: () => {},
      removeItem: () => {},
    };

    const onRehydrateStorageSpy = vi.fn();
    const useStore = create(
      persist(
        () => ({
          count: 0,
          name: 'empty',
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        },
      ),
    );

    expect(useStore.getState()).toEqual({
      count: 42,
      name: 'test-storage',
    });
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
    );
  });

  it('can throw rehydrate error', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const storage = {
      getItem: () => {
        throw new Error('getItem error');
      },
      setItem: () => {},
      removeItem: () => {},
    };

    const spy = vi.fn();
    create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => spy,
      }),
    );

    expect(spy).toBeCalledWith(undefined, new Error('getItem error'));
  });

  it('can persist state', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const { storage, setItemSpy } = createPersistentStore(null);

    const createStore = () => {
      const onRehydrateStorageSpy = vi.fn();
      const useStore = create(
        persist(() => ({ count: 0 }), {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        }),
      );
      return { useStore, onRehydrateStorageSpy };
    };

    // Initialize from empty storage
    const { useStore, onRehydrateStorageSpy } = createStore();
    expect(useStore.getState()).toEqual({ count: 0 });
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined);

    // Write something to the store
    useStore.setState({ count: 42 });
    expect(useStore.getState()).toEqual({ count: 42 });
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({ state: { count: 42 }, version: 0 }),
    );

    // Create the same store a second time and check if the persisted state
    // is loaded correctly
    const {
      useStore: useStore2,
      onRehydrateStorageSpy: onRehydrateStorageSpy2,
    } = createStore();
    expect(useStore2.getState()).toEqual({ count: 42 });
    expect(onRehydrateStorageSpy2).toBeCalledWith({ count: 42 }, undefined);
  });

  it('can migrate persisted state', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const setItemSpy = vi.fn();
    const onRehydrateStorageSpy = vi.fn();
    const migrateSpy = vi.fn(() => ({ count: 99 }));

    const storage = {
      getItem: () =>
        JSON.stringify({
          state: { count: 42 },
          version: 12,
        }),
      setItem: setItemSpy,
      removeItem: () => {},
    };

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        version: 13,
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => onRehydrateStorageSpy,
        migrate: migrateSpy,
      }),
    );

    expect(useStore.getState()).toEqual({ count: 99 });
    expect(migrateSpy).toBeCalledWith({ count: 42 }, 12);
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({
        state: { count: 99 },
        version: 13,
      }),
    );
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 99 }, undefined);
  });

  it('can filter the persisted value with partialize', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const setItemSpy = vi.fn();

    const storage = {
      getItem: () => '',
      setItem: setItemSpy,
      removeItem: () => {},
    };

    const useStore = create(
      persist(
        () => ({
          count: 0,
          _internal: 'do not persist',
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          partialize: (state) => ({ count: state.count }),
        },
      ),
    );

    useStore.setState({});
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({
        state: { count: 0 },
        version: 0,
      }),
    );
  });

  it('can skip initial hydration', async () => {
    const { create } = await import('../../src/react');
    const { persist } = await import('../../src/middleware/persist');

    const storage = {
      getItem: (name: string) => ({
        state: { count: 42, name },
        version: 0,
      }),
      setItem: () => {},
      removeItem: () => {},
    };

    const onRehydrateStorageSpy = vi.fn();
    const useStore = create(
      persist(
        () => ({
          count: 0,
          name: 'empty',
        }),
        {
          name: 'test-storage',
          storage: storage,
          onRehydrateStorage: () => onRehydrateStorageSpy,
          skipHydration: true,
        },
      ),
    );

    expect(useStore.getState()).toEqual({
      count: 0,
      name: 'empty',
    });

    // Wait for next tick to ensure store is initialized
    await new Promise((resolve) => process.nextTick(resolve));

    // Asserting store hasn't hydrated
    expect(useStore.persist.hasHydrated()).toBe(false);

    await useStore.persist.rehydrate();

    expect(useStore.getState()).toEqual({
      count: 42,
      name: 'test-storage',
    });
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
    );
  });

  it('can clear storage through the api', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const removeItemSpy = vi.fn();

    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: removeItemSpy,
    };

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    );

    useStore.persist.clearStorage();
    expect(removeItemSpy).toBeCalledWith('test-storage');
  });

  it('can manually rehydrate through the api', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const storageValue = '{"state":{"count":1},"version":0}';

    const storage = {
      getItem: () => '',
      setItem: () => {},
      removeItem: () => {},
    };

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    );

    storage.getItem = () => storageValue;
    useStore.persist.rehydrate();
    expect(useStore.getState()).toEqual({
      count: 1,
    });
  });

  it('exposes persist API methods', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    );

    expect(useStore.persist).toBeDefined();
    expect(useStore.persist.clearStorage).toBeDefined();
    expect(useStore.persist.rehydrate).toBeDefined();
    expect(useStore.persist.hasHydrated).toBeDefined();
    expect(useStore.persist.onHydrate).toBeDefined();
    expect(useStore.persist.onFinishHydration).toBeDefined();
    expect(useStore.persist.getOptions).toBeDefined();
    expect(useStore.persist.setOptions).toBeDefined();
  });
});

describe('Persist Middleware - Async Storage', () => {
  const consoleError = console.error;

  afterEach(() => {
    cleanup();
    console.error = consoleError;
    vi.restoreAllMocks();
  });

  it('can rehydrate state asynchronously', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const onRehydrateStorageSpy = vi.fn();
    const storage = {
      getItem: async (name: string) =>
        JSON.stringify({
          state: { count: 42, name },
          version: 0,
        }),
      setItem: () => {},
      removeItem: () => {},
    };

    const useStore = create(
      persist(
        () => ({
          count: 0,
          name: 'empty',
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        },
      ),
    );

    function Counter() {
      const { count, name } = useStore();
      return (
        <div>
          count: {count}, name: {name}
        </div>
      );
    }

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    expect(await screen.findByText('count: 0, name: empty')).toBeTruthy();
    expect(
      await screen.findByText('count: 42, name: test-storage'),
    ).toBeTruthy();
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
    );
  });

  it('can persist state asynchronously', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const { storage, setItemSpy } = createAsyncPersistentStore(null);

    const createStore = () => {
      const onRehydrateStorageSpy = vi.fn();
      const useStore = create(
        persist(() => ({ count: 0 }), {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        }),
      );
      return { useStore, onRehydrateStorageSpy };
    };

    // Initialize from empty storage
    const { useStore, onRehydrateStorageSpy } = createStore();

    function Counter() {
      const { count } = useStore();
      return <div>count: {count}</div>;
    }

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    expect(await screen.findByText('count: 0')).toBeTruthy();
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined);
    });

    // Write something to the store
    act(() => {
      useStore.setState({ count: 42 });
    });
    expect(await screen.findByText('count: 42')).toBeTruthy();
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({ state: { count: 42 }, version: 0 }),
    );

    // Create the same store a second time and check if the persisted state
    // is loaded correctly
    const {
      useStore: useStore2,
      onRehydrateStorageSpy: onRehydrateStorageSpy2,
    } = createStore();
    function Counter2() {
      const { count } = useStore2();
      return <div>count: {count}</div>;
    }

    render(
      <StrictMode>
        <Counter2 />
      </StrictMode>,
    );

    expect(await screen.findByText('count: 42')).toBeTruthy();
    await waitFor(() => {
      expect(onRehydrateStorageSpy2).toBeCalledWith({ count: 42 }, undefined);
    });
  });
});

describe('Persist Middleware - History Persistence (Bruin Feature)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not persist history by default (Zustand behavior)', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const { storage, setItemSpy } = createPersistentStore(null);

    const useStore = create<{ count: number; inc: () => void }>()(
      persist(
        (set) => ({
          count: 0,
          inc: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
        },
      ),
    );

    useStore.getState().inc();
    useStore.getState().inc();

    // Check that storage does NOT include history
    const lastCall = setItemSpy.mock.calls[setItemSpy.mock.calls.length - 1];
    if (!lastCall) throw new Error('No storage call found');
    const stored = JSON.parse(lastCall[1]);

    // Functions are not serialized by JSON.stringify
    expect(stored.state.count).toBe(2);
    expect(stored.state.inc).toBeUndefined();
    expect(stored.history).toBeUndefined();
    expect(stored.historyIndex).toBeUndefined();
    expect(stored.persistHistory).toBeUndefined();
  });

  it('persists history when persistHistory: true', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const { storage, setItemSpy } = createPersistentStore(null);

    const useStore = create<{ count: number; inc: () => void }>()(
      persist(
        (set) => ({
          count: 0,
          inc: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          persistHistory: true,
        },
      ),
    );

    useStore.getState().inc();
    useStore.getState().inc();

    // Check that storage INCLUDES history
    const lastCall = setItemSpy.mock.calls[setItemSpy.mock.calls.length - 1];
    if (!lastCall) throw new Error('No storage call found');
    const stored = JSON.parse(lastCall[1]);

    expect(stored.persistHistory).toBe(true);
    expect(stored.history).toBeDefined();
    expect(stored.historyIndex).toBeDefined();
    expect(Array.isArray(stored.history)).toBe(true);
  });

  it('restores history on rehydration when persistHistory: true', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const storage = {
      getItem: () =>
        JSON.stringify({
          state: { count: 2 },
          version: 0,
          persistHistory: true,
          history: [{ count: 0 }, { count: 1 }, { count: 2 }],
          historyIndex: 2,
        }),
      setItem: () => {},
      removeItem: () => {},
    };

    const useStore = create<{ count: number; inc: () => void }>()(
      persist(
        (set) => ({
          count: 0,
          inc: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          persistHistory: true,
        },
      ),
    );

    expect(useStore.getState().count).toBe(2);

    // Undo should work with restored history
    useStore.undo();
    expect(useStore.getState().count).toBe(1);

    useStore.undo();
    expect(useStore.getState().count).toBe(0);

    // Redo should also work
    useStore.redo();
    expect(useStore.getState().count).toBe(1);
  });

  it('does not restore history when persistHistory: false', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const storage = {
      getItem: () =>
        JSON.stringify({
          state: { count: 2 },
          version: 0,
          persistHistory: true,
          history: [{ count: 0 }, { count: 1 }, { count: 2 }],
          historyIndex: 2,
        }),
      setItem: () => {},
      removeItem: () => {},
    };

    const useStore = create<{ count: number; inc: () => void }>()(
      persist(
        (set) => ({
          count: 0,
          inc: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          persistHistory: false, // Explicitly disabled
        },
      ),
    );

    expect(useStore.getState().count).toBe(2);

    // History should be fresh (undo shouldn't go back to persisted history)
    useStore.undo();
    expect(useStore.getState().count).toBe(2); // Can't undo to persisted state
  });

  it('handles history clearing correctly', async () => {
    const { create } = await import('../../src/react');
    const { persist, createJSONStorage } = await import(
      '../../src/middleware/persist'
    );

    const { storage, setItemSpy } = createPersistentStore(null);

    const useStore = create<{ count: number; inc: () => void }>()(
      persist(
        (set) => ({
          count: 0,
          inc: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          persistHistory: true,
        },
      ),
    );

    useStore.getState().inc();
    useStore.getState().inc();

    const callCountBeforeClear = setItemSpy.mock.calls.length;

    // Clear history
    useStore.clearHistory?.();

    // clearHistory should trigger a setItem call to persist the cleared history
    act(() => {
      useStore.setState({}); // Trigger setItem
    });

    // Check that storage has only current state in history
    expect(setItemSpy.mock.calls.length).toBeGreaterThan(callCountBeforeClear);
    const lastCall = setItemSpy.mock.calls[setItemSpy.mock.calls.length - 1];
    if (!lastCall) throw new Error('No storage call found');
    const stored = JSON.parse(lastCall[1]);

    expect(stored.history).toBeDefined();
    expect(stored.history.length).toBe(1);
    expect(stored.history[0].count).toBe(2);
    expect(stored.historyIndex).toBe(0);
  });
});
