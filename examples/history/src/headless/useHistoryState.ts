import { useEffect, useState } from 'react';
import type { StoreApi } from '../../../../src/vanilla';
import type { HistoryEntry, HistoryState } from './types';

/**
 * Hook to subscribe to history state from a Bruin store
 *
 * This hook provides reactive access to the store's history, current index,
 * and undo/redo capabilities.
 *
 * @param store The Bruin store instance
 * @returns History state and controls
 *
 * @example
 * ```tsx
 * const { history, currentIndex, canUndo, undo } = useHistoryState(store);
 * ```
 */
export function useHistoryState<T = any>(
  store: StoreApi<T>,
): HistoryState<T> {
  const [state, setState] = useState<HistoryState<T>>(() => ({
    history: store.getHistory(),
    currentIndex: store.getCurrentHistoryIndex(),
    canUndo: store.canUndo(),
    canRedo: store.canRedo(),
    undo: store.undo,
    redo: store.redo,
  }));

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => {
      setState({
        history: store.getHistory(),
        currentIndex: store.getCurrentHistoryIndex(),
        canUndo: store.canUndo(),
        canRedo: store.canRedo(),
        undo: store.undo,
        redo: store.redo,
      });
    });

    return unsubscribe;
  }, [store]);

  return state;
}
