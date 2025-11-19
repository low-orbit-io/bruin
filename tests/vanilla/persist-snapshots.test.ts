import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage, persist } from '../../src/middleware/persist';
import { createStore } from '../../src/vanilla';

/**
 * Persist Middleware with Named Snapshots Tests
 * Following TDD approach - Phase 3
 */

describe('Persist Middleware - Named Snapshots Integration', () => {
  // Test state interface
  interface TestState {
    count: number;
    text: string;
    increment: () => void;
    setText: (text: string) => void;
  }

  // Mock storage that works with createJSONStorage
  const createMockStorage = () => {
    const store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => {
        return store[key] || null;
      }),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
      store,
      getStoredData: (key: string) => {
        const value = store[key];
        return value ? JSON.parse(value) : null;
      },
    };
  };

  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Snapshot Persistence Configuration', () => {
    it('should not persist snapshots by default', async () => {
      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            text: 'initial',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'test-store',
            storage: createJSONStorage(() => storage),
          },
        ),
      );

      // Wait for initial hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Save a snapshot
      store.saveSnapshot('checkpoint');

      // Trigger persist
      store.setState({ count: 1 });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check storage - should NOT contain snapshots
      const stored = storage.getStoredData('test-store') || {};
      expect(stored.state).toBeDefined();
      expect(stored.snapshots).toBeUndefined();
      expect(stored.persistSnapshots).toBeUndefined();
    });

    it('should persist snapshots when persistSnapshots is true', async () => {
      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            text: 'initial',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'test-store',
            storage: createJSONStorage(() => storage),
            persistSnapshots: true, // Enable snapshot persistence
          },
        ),
      );

      // Wait for initial hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Save snapshots
      const id1 = store.saveSnapshot('checkpoint-1', {
        description: 'First checkpoint',
      });
      store.setState({ count: 5, text: 'modified' });
      const id2 = store.saveSnapshot('checkpoint-2', {
        metadata: { userId: 'user123' },
      });

      // Trigger persist by calling setState (persist middleware only saves on setState)
      store.setState(store.getState());
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check storage contains snapshots
      const stored = storage.getStoredData('test-store') || {};
      expect(stored.persistSnapshots).toBe(true);
      expect(stored.snapshots).toBeDefined();
      expect(Array.isArray(stored.snapshots)).toBe(true);
      expect(stored.snapshots.length).toBe(2);

      // Verify snapshot structure
      expect(stored.snapshots[0].id).toBe(id1);
      expect(stored.snapshots[0].name).toBe('checkpoint-1');
      expect(stored.snapshots[0].description).toBe('First checkpoint');
      expect(stored.snapshots[0].state).toEqual({ count: 0, text: 'initial' });

      expect(stored.snapshots[1].id).toBe(id2);
      expect(stored.snapshots[1].name).toBe('checkpoint-2');
      expect(stored.snapshots[1].metadata).toEqual({ userId: 'user123' });
      expect(stored.snapshots[1].state).toEqual({ count: 5, text: 'modified' });
    });
  });

  describe('Snapshot Hydration', () => {
    it('should restore snapshots on hydration', async () => {
      // Pre-populate storage with snapshots
      const storedData = {
        state: { count: 10, text: 'current' },
        version: 0,
        persistSnapshots: true,
        snapshots: [
          {
            id: 'snap-1',
            name: 'checkpoint-1',
            state: { count: 1, text: 'first' },
            timestamp: Date.now() - 2000,
          },
          {
            id: 'snap-2',
            name: 'checkpoint-2',
            state: { count: 2, text: 'second' },
            timestamp: Date.now() - 1000,
            description: 'Second checkpoint',
            metadata: { important: true },
          },
        ],
      };
      storage.setItem('test-store', JSON.stringify(storedData));

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            text: 'initial',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'test-store',
            storage: createJSONStorage(() => storage),
            persistSnapshots: true,
          },
        ),
      );

      // Wait for hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify snapshots were restored
      const snapshots = store.listSnapshots();
      expect(snapshots.length).toBe(2);

      expect(snapshots[0].id).toBe('snap-1');
      expect(snapshots[0].name).toBe('checkpoint-1');

      expect(snapshots[1].id).toBe('snap-2');
      expect(snapshots[1].name).toBe('checkpoint-2');
      expect(snapshots[1].description).toBe('Second checkpoint');
      expect(snapshots[1].metadata).toEqual({ important: true });

      // Verify we can load a restored snapshot
      const success = store.loadSnapshot('snap-1');
      expect(success).toBe(true);
      expect(store.getState().count).toBe(1);
      expect(store.getState().text).toBe('first');
    });

    it('should skip invalid snapshots during hydration', async () => {
      // Pre-populate storage with some invalid snapshots
      const storedData = {
        state: { count: 10, text: 'current' },
        version: 0,
        persistSnapshots: true,
        snapshots: [
          {
            id: 'valid-1',
            name: 'checkpoint-1',
            state: { count: 1, text: 'first' },
            timestamp: Date.now(),
          },
          {
            // Missing id
            name: 'invalid-1',
            state: { count: 2, text: 'second' },
            timestamp: Date.now(),
          },
          {
            id: 'invalid-2',
            // Missing name
            state: { count: 3, text: 'third' },
            timestamp: Date.now(),
          },
          {
            id: 'invalid-3',
            name: 'invalid-3',
            // Missing state
            timestamp: Date.now(),
          },
          null, // Null entry
          {
            id: 'valid-2',
            name: 'checkpoint-2',
            state: { count: 5, text: 'fifth' },
            timestamp: Date.now(),
          },
        ],
      };
      storage.setItem('test-store', JSON.stringify(storedData));

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            text: 'initial',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'test-store',
            storage: createJSONStorage(() => storage),
            persistSnapshots: true,
          },
        ),
      );

      // Wait for hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify only valid snapshots were restored
      const snapshots = store.listSnapshots();
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].id).toBe('valid-1');
      expect(snapshots[1].id).toBe('valid-2');

      // Verify warnings were logged
      expect(warnSpy).toHaveBeenCalledTimes(4); // 3 invalid + 1 null

      warnSpy.mockRestore();
    });
  });

  describe('Partialize with Snapshots', () => {
    it('should apply partialize to snapshot states when persisting', async () => {
      interface FullState extends TestState {
        secret: string;
      }

      const store = createStore<FullState>()(
        persist(
          (set) => ({
            count: 0,
            text: 'initial',
            secret: 'hidden',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'test-store',
            storage: createJSONStorage(() => storage),
            persistSnapshots: true,
            partialize: (state) => {
              // Exclude secret field
              const { secret: _secret, ...rest } = state;
              return rest;
            },
          },
        ),
      );

      // Wait for initial hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Save snapshots with secret in state
      store.setState({ secret: 'confidential' });
      store.saveSnapshot('checkpoint-1');

      store.setState({ secret: 'top-secret', count: 5 });
      store.saveSnapshot('checkpoint-2');

      // Trigger persist by calling setState (persist middleware only saves on setState)
      store.setState(store.getState());
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check storage - snapshots should not contain secret
      const stored = storage.getStoredData('test-store') || {};
      expect(stored.snapshots[0].state.secret).toBeUndefined();
      expect(stored.snapshots[0].state.count).toBe(0);

      expect(stored.snapshots[1].state.secret).toBeUndefined();
      expect(stored.snapshots[1].state.count).toBe(5);
    });
  });

  describe('Merge Function with Snapshots', () => {
    it('should apply merge function to snapshot states during hydration', async () => {
      // Pre-populate storage
      const storedData = {
        state: { count: 10, text: 'stored' },
        version: 0,
        persistSnapshots: true,
        snapshots: [
          {
            id: 'snap-1',
            name: 'checkpoint-1',
            state: { count: 100, text: 'snapshot' },
            timestamp: Date.now(),
          },
        ],
      };
      storage.setItem('test-store', JSON.stringify(storedData));

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            text: 'initial',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'test-store',
            storage: createJSONStorage(() => storage),
            persistSnapshots: true,
            merge: (persistedState, currentState) => {
              // Merge by adding " [merged]" to text fields
              const persisted = persistedState as TestState;
              return {
                ...currentState,
                ...persisted,
                text: persisted.text
                  ? `${persisted.text} [merged]`
                  : currentState.text,
              };
            },
          },
        ),
      );

      // Wait for hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Load the snapshot
      store.loadSnapshot('snap-1');

      // Verify merge was applied to snapshot state
      expect(store.getState().count).toBe(100);
      expect(store.getState().text).toBe('snapshot [merged]');
    });
  });

  describe('Version Migration with Snapshots', () => {
    it('should handle version migration for snapshots', async () => {
      // Old version with different structure
      const storedData = {
        state: { value: 5 }, // Old structure
        version: 1,
        persistSnapshots: true,
        snapshots: [
          {
            id: 'old-snap',
            name: 'old-checkpoint',
            state: { value: 10 }, // Old structure
            timestamp: Date.now(),
          },
        ],
      };
      storage.setItem('test-store', JSON.stringify(storedData));

      const store = createStore<TestState>()(
        persist(
          (set) => ({
            count: 0,
            text: 'initial',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'test-store',
            storage: createJSONStorage(() => storage),
            persistSnapshots: true,
            version: 2, // New version
            migrate: (persistedState: any, version: number) => {
              if (version === 1) {
                // Migrate from v1 to v2
                return {
                  count: persistedState.value || 0,
                  text: 'migrated',
                };
              }
              return persistedState;
            },
          },
        ),
      );

      // Wait for hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify snapshot was migrated
      store.loadSnapshot('old-snap');
      expect(store.getState().count).toBe(10); // Migrated from value: 10
      expect(store.getState().text).toBe('migrated');
    });
  });
});
