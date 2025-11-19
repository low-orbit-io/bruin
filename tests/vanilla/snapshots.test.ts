import { describe, expect, it } from 'vitest';
import { createStore } from '../../src/vanilla';

/**
 * Named Snapshots Feature Tests
 * Following TDD (Test-Driven Development) approach:
 * 1. RED: Write failing tests first
 * 2. GREEN: Implement minimal code to pass
 * 3. REFACTOR: Improve code while keeping tests green
 */

describe('Named Snapshots', () => {
  // Test state interface
  interface TestState {
    count: number;
    text: string;
    computed?: number; // For computed field testing
  }

  // Helper to create a test store
  const createTestStore = (options = {}) => {
    return createStore<TestState>(
      (set) => ({
        count: 0,
        text: 'initial',
        increment: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      }),
      options,
    );
  };

  describe('Phase 1a: Type Definitions', () => {
    it('should expose snapshot types from vanilla module', () => {
      // Verify types are exported (they compile without error)
      type _TestSnapshot = import('../../src/vanilla').Snapshot<any>;
      type _TestSnapshotInfo = import('../../src/vanilla').SnapshotInfo;
      type _TestSnapshotOptions = import('../../src/vanilla').SnapshotOptions;
      type _TestSnapshotRestoreOptions =
        import('../../src/vanilla').SnapshotRestoreOptions;
      type _TestMemoryInfo = import('../../src/vanilla').MemoryInfo;

      // Types compile successfully
      expect(true).toBe(true);
    });
  });

  describe('Phase 2a: Snapshot Creation (saveSnapshot)', () => {
    it('should have saveSnapshot method on store', () => {
      const store = createTestStore();

      expect(typeof store.saveSnapshot).toBe('function');
    });

    it('should save snapshot with name only', () => {
      const store = createTestStore();

      const id = store.saveSnapshot('checkpoint-1');

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toContain('checkpoint-1');
    });

    it('should save snapshot with description', () => {
      const store = createTestStore();

      const id = store.saveSnapshot('before-experiment', {
        description: 'State before running experiment',
      });

      expect(id).toBeDefined();
      expect(id).toContain('before-experiment');
    });

    it('should save snapshot with custom ID', () => {
      const store = createTestStore();
      const customId = 'custom-id-123';

      const id = store.saveSnapshot('test', {
        id: customId,
      });

      expect(id).toBe(customId);
    });

    it('should save snapshot with metadata', () => {
      const store = createTestStore();
      const metadata = { userId: 'user123', action: 'manual-save' };

      const id = store.saveSnapshot('with-metadata', {
        metadata,
      });

      expect(id).toBeDefined();

      const info = store.getSnapshotInfo(id);
      expect(info?.metadata).toEqual(metadata);
    });

    it('should auto-generate unique IDs for same name', () => {
      const store = createTestStore();

      const id1 = store.saveSnapshot('duplicate');

      const id2 = store.saveSnapshot('duplicate');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('duplicate');
      expect(id2).toContain('duplicate');
    });

    it('should enforce FIFO cleanup when maxSnapshotsSize exceeded', () => {
      const store = createTestStore({ maxSnapshotsSize: 3 });

      // Save 4 snapshots (exceeds limit of 3)

      const id1 = store.saveSnapshot('snap-1');

      const id2 = store.saveSnapshot('snap-2');

      const id3 = store.saveSnapshot('snap-3');

      const id4 = store.saveSnapshot('snap-4'); // Should trigger FIFO cleanup

      const snapshots = store.listSnapshots();

      expect(snapshots.length).toBe(3); // Only 3 snapshots remain
      expect(snapshots.find((s) => s.id === id1)).toBeUndefined(); // Oldest deleted
      expect(snapshots.find((s) => s.id === id2)).toBeDefined();
      expect(snapshots.find((s) => s.id === id3)).toBeDefined();
      expect(snapshots.find((s) => s.id === id4)).toBeDefined();
    });
  });

  describe('Phase 2b: Snapshot Listing (listSnapshots)', () => {
    it('should have listSnapshots method on store', () => {
      const store = createTestStore();

      expect(typeof store.listSnapshots).toBe('function');
    });

    it('should return empty array when no snapshots', () => {
      const store = createTestStore();

      const snapshots = store.listSnapshots();

      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots.length).toBe(0);
    });

    it('should list all saved snapshots', () => {
      const store = createTestStore();

      const id1 = store.saveSnapshot('first');

      const id2 = store.saveSnapshot('second');

      const snapshots = store.listSnapshots();

      expect(snapshots.length).toBe(2);
      expect(snapshots[0]!.id).toBe(id1);
      expect(snapshots[0]!.name).toBe('first');
      expect(snapshots[1]!.id).toBe(id2);
      expect(snapshots[1]!.name).toBe('second');
    });

    it('should include metadata in listing', () => {
      const store = createTestStore();
      const metadata = { feature: 'test' };

      store.saveSnapshot('with-meta', { metadata });

      const snapshots = store.listSnapshots();

      expect(snapshots[0]!.metadata).toEqual(metadata);
    });
  });

  describe('Phase 2c: Snapshot Info (getSnapshotInfo)', () => {
    it('should have getSnapshotInfo method on store', () => {
      const store = createTestStore();

      expect(typeof store.getSnapshotInfo).toBe('function');
    });

    it('should return null for non-existent snapshot', () => {
      const store = createTestStore();

      const info = store.getSnapshotInfo('non-existent');

      expect(info).toBeNull();
    });

    it('should return info without state', () => {
      const store = createTestStore();
      store.setState({ count: 5, text: 'test' });

      const id = store.saveSnapshot('test-info');

      const info = store.getSnapshotInfo(id);

      expect(info).toBeDefined();
      expect(info?.id).toBe(id);
      expect(info?.name).toBe('test-info');
      expect(info?.timestamp).toBeGreaterThan(0);
      expect('state' in info!).toBe(false); // State not included in info
    });
  });

  describe('Phase 2d: Snapshot Restoration (loadSnapshot)', () => {
    it('should have loadSnapshot method on store', () => {
      const store = createTestStore();

      expect(typeof store.loadSnapshot).toBe('function');
    });

    it('should restore state from snapshot', () => {
      const store = createTestStore();

      // Modify state
      store.setState({ count: 10, text: 'modified' });

      // Save snapshot

      const id = store.saveSnapshot('restore-test');

      // Modify state further
      store.setState({ count: 20, text: 'changed-again' });

      // Restore snapshot

      const success = store.loadSnapshot(id);

      expect(success).toBe(true);
      expect(store.getState()).toEqual({
        count: 10,
        text: 'modified',
        increment: expect.any(Function),
        setText: expect.any(Function),
      });
    });

    it('should return false for non-existent snapshot', () => {
      const store = createTestStore();

      const success = store.loadSnapshot('non-existent');

      expect(success).toBe(false);
    });

    it('should add to history by default', () => {
      const store = createTestStore();

      // Enable history
      store.setState({ count: 5 });

      const id = store.saveSnapshot('history-test');

      store.setState({ count: 10 });
      const historySizeBefore = store.getHistory().length;
      const historyBefore = store.getHistory().map((entry: any) => ({
        count: entry.state?.count,
        name: entry.name,
      }));

      store.loadSnapshot(id);

      const historySizeAfter = store.getHistory().length;
      expect(historySizeAfter).toBe(historySizeBefore + 1);

      // Verify all previous history entries are preserved
      const historyAfter = store.getHistory().map((entry: any) => ({
        count: entry.state?.count,
        name: entry.name,
      }));

      // All previous entries should still be there
      for (let i = 0; i < historyBefore.length; i++) {
        expect(historyAfter[i]).toEqual(historyBefore[i]);
      }

      // The last entry should be the restored snapshot
      const lastEntry = historyAfter[historyAfter.length - 1];
      expect(lastEntry.count).toBe(5); // The snapshot was saved when count was 5
      expect(lastEntry.name).toBe('Restored snapshot: history-test');
    });

    it('should skip history when addToHistory is false', () => {
      const store = createTestStore();

      store.setState({ count: 5 });

      const id = store.saveSnapshot('no-history-test');

      store.setState({ count: 10 });
      const historySizeBefore = store.getHistory().length;

      store.loadSnapshot(id, { addToHistory: false });

      const historySizeAfter = store.getHistory().length;
      expect(historySizeAfter).toBe(historySizeBefore);
    });
  });

  describe('Phase 2e: Snapshot Deletion (deleteSnapshot)', () => {
    it('should have deleteSnapshot method on store', () => {
      const store = createTestStore();

      expect(typeof store.deleteSnapshot).toBe('function');
    });

    it('should delete existing snapshot', () => {
      const store = createTestStore();

      const id = store.saveSnapshot('to-delete');

      const deleted = store.deleteSnapshot(id);

      expect(deleted).toBe(true);

      const info = store.getSnapshotInfo(id);
      expect(info).toBeNull();
    });

    it('should return false for non-existent snapshot', () => {
      const store = createTestStore();

      const deleted = store.deleteSnapshot('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('Phase 2f: Clear All Snapshots (clearSnapshots)', () => {
    it('should have clearSnapshots method on store', () => {
      const store = createTestStore();

      expect(typeof store.clearSnapshots).toBe('function');
    });

    it('should clear all snapshots', () => {
      const store = createTestStore();

      store.saveSnapshot('snap-1');

      store.saveSnapshot('snap-2');

      store.saveSnapshot('snap-3');

      store.clearSnapshots();

      const snapshots = store.listSnapshots();
      expect(snapshots.length).toBe(0);
    });
  });

  describe('Phase 2g: Memory Tracking', () => {
    it('should include snapshot memory in getHistoryMemoryUsage', () => {
      const store = createTestStore();

      const memoryBefore = store.getHistoryMemoryUsage();

      // Save some snapshots

      store.saveSnapshot('snap-1');
      store.setState({ count: 100, text: 'a'.repeat(1000) });

      store.saveSnapshot('snap-2');

      const memoryAfter = store.getHistoryMemoryUsage();

      expect(memoryAfter.snapshotBytes).toBeGreaterThan(0);
      expect(memoryAfter.snapshotCount).toBe(2);
      expect(memoryAfter.totalBytes).toBeGreaterThan(memoryBefore.totalBytes);
    });
  });
});
