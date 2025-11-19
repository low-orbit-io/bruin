import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { create } from '../../src/react';
import { createStore } from '../../src/vanilla';

/**
 * React Hooks Integration with Named Snapshots
 * Phase 4 - Verify React hooks automatically expose snapshot methods
 */

describe('React Hooks - Named Snapshots Integration', () => {
  interface TestState {
    count: number;
    text: string;
    increment: () => void;
    setText: (text: string) => void;
  }

  describe('Snapshot Methods Exposure', () => {
    it('should expose all snapshot methods through useStore hook', () => {
      const useStore = create<TestState>((set) => ({
        count: 0,
        text: 'initial',
        increment: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      }));

      // Check that snapshot methods exist on the store API
      const api = useStore.getState;
      expect(typeof useStore.saveSnapshot).toBe('function');
      expect(typeof useStore.listSnapshots).toBe('function');
      expect(typeof useStore.getSnapshotInfo).toBe('function');
      expect(typeof useStore.loadSnapshot).toBe('function');
      expect(typeof useStore.deleteSnapshot).toBe('function');
      expect(typeof useStore.clearSnapshots).toBe('function');
    });
  });

  describe('Snapshot Functionality in React', () => {
    it('should save and restore snapshots in React store', () => {
      const useStore = create<TestState>((set) => ({
        count: 0,
        text: 'initial',
        increment: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      }));

      // Modify state
      useStore.setState({ count: 5, text: 'modified' });

      // Save snapshot
      const id = useStore.saveSnapshot('checkpoint');

      // Modify state further
      useStore.setState({ count: 10, text: 'changed' });

      // Restore snapshot
      const success = useStore.loadSnapshot(id);
      expect(success).toBe(true);
      expect(useStore.getState().count).toBe(5);
      expect(useStore.getState().text).toBe('modified');
    });

    it('should work with React hooks', () => {
      const useStore = create<TestState>((set) => ({
        count: 0,
        text: 'initial',
        increment: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      }));

      const { result, rerender } = renderHook(() => ({
        state: useStore((state) => state),
        saveSnapshot: useStore.saveSnapshot,
        loadSnapshot: useStore.loadSnapshot,
        listSnapshots: useStore.listSnapshots,
      }));

      // Initial state
      expect(result.current.state.count).toBe(0);

      // Save initial snapshot
      const id = result.current.saveSnapshot('initial-state');

      // Modify state
      act(() => {
        useStore.setState({ count: 10, text: 'updated' });
      });
      rerender();
      expect(result.current.state.count).toBe(10);

      // Restore snapshot
      act(() => {
        result.current.loadSnapshot(id);
      });
      rerender();
      expect(result.current.state.count).toBe(0);
      expect(result.current.state.text).toBe('initial');
    });

    it('should list snapshots through hooks', () => {
      const useStore = create<TestState>((set) => ({
        count: 0,
        text: 'initial',
        increment: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      }));

      const { result } = renderHook(() => ({
        saveSnapshot: useStore.saveSnapshot,
        listSnapshots: useStore.listSnapshots,
      }));

      // Save multiple snapshots
      result.current.saveSnapshot('first');
      result.current.saveSnapshot('second');
      result.current.saveSnapshot('third');

      // List snapshots
      const snapshots = result.current.listSnapshots();
      expect(snapshots.length).toBe(3);
      expect(snapshots[0].name).toBe('first');
      expect(snapshots[1].name).toBe('second');
      expect(snapshots[2].name).toBe('third');
    });

    it('should handle snapshot options with metadata', () => {
      const useStore = create<TestState>((set) => ({
        count: 0,
        text: 'initial',
        increment: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      }));

      const metadata = { userId: 'test-user', action: 'checkpoint' };
      const id = useStore.saveSnapshot('with-metadata', {
        description: 'Test snapshot',
        metadata,
      });

      const info = useStore.getSnapshotInfo(id);
      expect(info).not.toBeNull();
      expect(info?.name).toBe('with-metadata');
      expect(info?.description).toBe('Test snapshot');
      expect(info?.metadata).toEqual(metadata);
    });

    it('should enforce maxSnapshotsSize with vanilla store in React context', () => {
      // Use vanilla createStore for options support
      const store = createStore<TestState>(
        (set) => ({
          count: 0,
          text: 'initial',
          increment: () => set((state) => ({ count: state.count + 1 })),
          setText: (text: string) => set({ text }),
        }),
        { maxSnapshotsSize: 2 },
      );

      const id1 = store.saveSnapshot('snap-1');
      const id2 = store.saveSnapshot('snap-2');
      const id3 = store.saveSnapshot('snap-3'); // Should trigger FIFO cleanup

      const snapshots = store.listSnapshots();
      expect(snapshots.length).toBe(2);
      expect(snapshots.find((s) => s.id === id1)).toBeUndefined(); // Oldest deleted
      expect(snapshots.find((s) => s.id === id2)).toBeDefined();
      expect(snapshots.find((s) => s.id === id3)).toBeDefined();
    });
  });

  describe('Integration with React Suspense', () => {
    it('should work with React Suspense patterns', async () => {
      const useStore = create<TestState>((set) => ({
        count: 0,
        text: 'initial',
        increment: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      }));

      // Save snapshot before async operation
      const beforeAsync = useStore.saveSnapshot('before-async');

      // Simulate async state update
      await new Promise((resolve) => setTimeout(resolve, 10));
      useStore.setState({ count: 100, text: 'async-updated' });

      // Verify we can restore pre-async state
      useStore.loadSnapshot(beforeAsync);
      expect(useStore.getState().count).toBe(0);
      expect(useStore.getState().text).toBe('initial');
    });
  });
});