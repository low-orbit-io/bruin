import { enableMapSet, produce } from 'immer';
import type {
  CreateStoreOptions,
  ExtractStateCreatorMutators,
  Get,
  HistoryEntry,
  MemoryInfo,
  Mutate,
  SetStateWithTransaction,
  Snapshot,
  SnapshotInfo,
  SnapshotOptions,
  SnapshotRestoreOptions,
  StateCreator,
  StateCreatorSet,
  StoreApi,
  StoreMutatorIdentifier,
  StoreSetState,
  StoreSubscriber,
} from './types/core';

enableMapSet();

export type {
  ExtractState,
  ExtractStateCreatorMutators,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  StoreMutators,
  StoreSetState,
  SetStateWithTransaction,
  // Named Snapshots Types
  Snapshot,
  SnapshotInfo,
  SnapshotOptions,
  SnapshotRestoreOptions,
  MemoryInfo,
} from './types/core';

function estimateObjectSize(obj: any, seen = new WeakSet()): number {
  if (obj === null) {
    return 4;
  }

  const type = typeof obj;

  switch (type) {
    case 'boolean':
      return 4;
    case 'number':
      return 8;
    case 'string':
      return obj.length * 2;
    case 'symbol':
      return 8;
    case 'undefined':
      return 0;
    case 'function':
      return 0;
  }

  if (seen.has(obj)) {
    return 0;
  }
  seen.add(obj);

  let size = 0;

  if (Array.isArray(obj)) {
    size = 24;
    for (let i = 0; i < obj.length; i++) {
      size += estimateObjectSize(obj[i], seen);
    }
    return size;
  }

  if (obj instanceof Map) {
    size = 24;
    obj.forEach((value, key) => {
      size += estimateObjectSize(key, seen);
      size += estimateObjectSize(value, seen);
    });
    return size;
  }

  if (obj instanceof Set) {
    size = 24;
    obj.forEach((value) => {
      size += estimateObjectSize(value, seen);
    });
    return size;
  }

  if (obj instanceof Date) {
    return 24;
  }

  if (obj instanceof RegExp) {
    return 24 + obj.source.length * 2;
  }

  if (type === 'object') {
    size = 24;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        size += key.length * 2;
        size += estimateObjectSize(obj[key], seen);
      }
    }

    return size;
  }

  return 0;
}

function createStoreImpl<
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>,
  options?: CreateStoreOptions,
): Mutate<StoreApi<T>, Mos> {
  let state: T;
  let originalInitialResult: T | null = null;
  let history: HistoryEntry<T>[] = [];
  let historyIndex = -1;
  let inTransaction = false;
  let transactionStartIndex = -1;
  let transactionPrevState: T | null = null;

  // Named snapshots storage
  const snapshots = new Map<string, Snapshot<T>>();
  let snapshotCounter = 0;

  const maxHistorySize = options?.maxHistorySize ?? 50;
  const maxSnapshotsSize = options?.maxSnapshotsSize;
  const maxHistoryMemory = options?.maxHistoryMemory;
  const customSizeEstimator = options?.estimateSize;
  const onMemoryLimitReached = options?.onMemoryLimitReached;
  const debounceMs = options?.debounce;
  const listeners = new Set<(state: T, prevState: T) => void>();

  let historyMemoryUsage = 0;
  const historySizes: number[] = [];

  const estimateEntrySize = (entry: HistoryEntry<T>): number => {
    if (customSizeEstimator) {
      return customSizeEstimator(entry.state);
    }

    const stateSize = estimateObjectSize(entry.state);
    const metadataSize = 8 + (entry.name ? entry.name.length * 2 : 0);

    return stateSize + metadataSize;
  };

  const addToHistory = (newEntry: HistoryEntry<T>) => {
    const entrySize = estimateEntrySize(newEntry);

    if (historyIndex < history.length - 1) {
      const removedCount = history.length - historyIndex - 1;
      for (let i = 0; i < removedCount; i++) {
        const removedSize = historySizes.pop() || 0;
        historyMemoryUsage -= removedSize;
      }
      history = history.slice(0, historyIndex + 1);
    }

    history.push(newEntry);
    historySizes.push(entrySize);
    historyMemoryUsage += entrySize;
    historyIndex = history.length - 1;

    let _removedByCount = 0;
    if (history.length > maxHistorySize + 1) {
      const removeCount = history.length - (maxHistorySize + 1);
      _removedByCount = removeCount;

      for (let i = 0; i < removeCount; i++) {
        const removedSize = historySizes.shift() || 0;
        historyMemoryUsage -= removedSize;
      }

      history = history.slice(removeCount);
      historyIndex = history.length - 1;
    }

    let removedByMemory = 0;
    if (maxHistoryMemory && historyMemoryUsage > maxHistoryMemory) {
      while (historyMemoryUsage > maxHistoryMemory && history.length > 1) {
        const removedSize = historySizes.shift() || 0;
        historyMemoryUsage -= removedSize;
        history.shift();
        historyIndex--;
        removedByMemory++;
      }

      if (onMemoryLimitReached && removedByMemory > 0) {
        onMemoryLimitReached({
          currentMemory: historyMemoryUsage,
          maxMemory: maxHistoryMemory,
          historyLength: history.length,
          entriesRemoved: removedByMemory,
        });
      }
    }
  };

  type PathListener = {
    listener: (state: T, prevState: T) => void;
    path: (string | number)[];
  };

  const pathListeners = new Set<PathListener>();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let debouncePendingState: T | null = null;
  let debouncePendingPrevState: T | null = null;
  let debouncePendingSkipHistory: boolean | null = null;

  const stateGetters: PropertyDescriptorMap = {};

  const isImmerable = (value: any): boolean => {
    return value !== null && typeof value === 'object';
  };

  const cloneStateForHistory = (s: T): T => {
    if (!isImmerable(s)) {
      return s;
    }

    const clone = {} as T;
    const descriptors = Object.getOwnPropertyDescriptors(s);

    for (const key in descriptors) {
      const descriptor = descriptors[key];

      if (
        descriptor &&
        !descriptor.get &&
        (!options?.computedFields || !options.computedFields.includes(key))
      ) {
        clone[key as keyof T] = s[key as keyof T];
      }
    }

    return clone;
  };

  // Helper to generate unique snapshot IDs
  const generateSnapshotId = (name: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    const counter = ++snapshotCounter;
    return `${name}-${timestamp}-${counter}-${random}`;
  };

  const applyGetters = (newState: T): T => {
    if (!isImmerable(newState) || Object.keys(stateGetters).length === 0) {
      return newState;
    }

    const stateWithGetters = Object.create(Object.getPrototypeOf(newState));

    for (const key in newState) {
      if (!stateGetters[key]) {
        stateWithGetters[key] = newState[key];
      }
    }

    for (const key in stateGetters) {
      const descriptor = stateGetters[key];

      if (descriptor) {
        Object.defineProperty(stateWithGetters, key, descriptor);
      }
    }

    return stateWithGetters;
  };

  const getChangedPaths = (prevState: T, newState: T): Set<string> => {
    const changedPaths = new Set<string>();

    if (!isImmerable(prevState) || !isImmerable(newState)) {
      return changedPaths;
    }

    const checkPaths = (obj: any, prevObj: any, currentPath: string[] = []) => {
      for (const key in obj) {
        const newPath = [...currentPath, key];
        const pathStr = newPath.join('.');

        if (
          !stateGetters[key] &&
          (obj[key] !== prevObj[key] ||
            (isImmerable(obj[key]) &&
              isImmerable(prevObj[key]) &&
              Object.keys(obj[key]).length !==
                Object.keys(prevObj[key]).length))
        ) {
          changedPaths.add(pathStr);

          if (isImmerable(obj[key]) && isImmerable(prevObj[key])) {
            checkPaths(obj[key], prevObj[key], newPath);
          }
        }
      }
    };

    checkPaths(newState, prevState);

    return changedPaths;
  };

  const notifyListeners = (newState: T, prevState: T) => {
    listeners.forEach((listener) => listener(newState, prevState));

    if (
      pathListeners.size > 0 &&
      isImmerable(newState) &&
      isImmerable(prevState)
    ) {
      const changedPaths = getChangedPaths(prevState, newState);

      pathListeners.forEach((pathListener) => {
        const pathStr = pathListener.path.join('.');
        const pathMatches =
          changedPaths.has(pathStr) ||
          Array.from(changedPaths).some((changedPath) =>
            changedPath.startsWith(pathStr + '.'),
          ) ||
          pathListener.path.some((_, i) => {
            const partialPath = pathListener.path.slice(0, i + 1).join('.');
            return changedPaths.has(partialPath);
          });

        if (pathMatches) {
          pathListener.listener(newState, prevState);
        }
      });
    }
  };

  const restoreHistoryState = (historyState: T, currentState: T): T => {
    if (isImmerable(historyState) && isImmerable(currentState)) {
      const descriptors = Object.getOwnPropertyDescriptors(currentState);
      const newState = {} as T;

      Object.assign(newState as any, historyState);

      for (const key in descriptors) {
        const descriptor = descriptors[key];

        if (descriptor && descriptor.get) {
          Object.defineProperty(newState, key, descriptor);
        }
      }

      Object.setPrototypeOf(newState, Object.getPrototypeOf(currentState));

      return newState;
    }
    return historyState;
  };

  const flushDebouncedHistory = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (debouncePendingState === null || debouncePendingPrevState === null) {
      return;
    }

    const pendingState = debouncePendingState;
    const pendingPrevState = debouncePendingPrevState;
    const skipHistory = debouncePendingSkipHistory === true;

    debouncePendingState = null;
    debouncePendingPrevState = null;
    debouncePendingSkipHistory = null;

    if (!skipHistory) {
      addToHistory({
        state: cloneStateForHistory(pendingState),
        timestamp: Date.now(),
      });
    }

    notifyListeners(pendingState, pendingPrevState);
  };

  const setStateImpl: StoreSetState<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace = false,
    setOptions?: { skipHistory?: boolean },
  ) => {
    const prevState = state;

    if (partial === prevState) {
      return;
    }

    if (replace) {
      const nextState =
        typeof partial === 'function'
          ? (partial as (state: T) => T | Partial<T>)(state)
          : partial;
      state = nextState as T;
    } else if (!isImmerable(state)) {
      if (typeof partial === 'function') {
        state = (partial as (state: T) => T | Partial<T>)(state) as T;
      } else {
        state = partial as T;
      }
    } else if (typeof partial === 'function') {
      state = produce(state, (draft: T) => {
        const updates = (partial as (state: T) => T | Partial<T>)(draft);

        if (updates && updates !== draft) {
          if (replace || !isImmerable(updates)) {
            return updates as any;
          } else {
            Object.assign(draft as any, updates);
          }
        }
      }) as T;
      state = applyGetters(state);
    } else if (!isImmerable(partial)) {
      state = partial as T;
    } else {
      if (partial === prevState) {
        return;
      }

      let contentMatches = true;

      if (isImmerable(partial)) {
        for (const key in partial as object) {
          if (
            !stateGetters[key] &&
            (prevState as any)[key] !== (partial as any)[key]
          ) {
            contentMatches = false;
            break;
          }
        }
      }

      const hasSamePrototype =
        Object.getPrototypeOf(partial) === Object.getPrototypeOf(prevState);
      const isOriginalObject = partial === originalInitialResult;
      const isSpread =
        !isOriginalObject &&
        partial !== state &&
        Object.keys(partial as unknown as object).length ===
          Object.keys(state as unknown as object).length &&
        Object.keys(partial as object).every(
          (key) => (partial as any)[key] === (state as any)[key],
        ) &&
        Object.getPrototypeOf(partial) === Object.prototype;

      if (isSpread) {
        state = applyGetters({ ...partial } as T);
      } else {
        const newState = produce(state, (draft: T) => {
          if (isImmerable(partial)) {
            for (const key in partial as object) {
              if (
                !stateGetters[key] &&
                (draft as any)[key] !== (partial as any)[key]
              ) {
                (draft as any)[key] = (partial as any)[key];
              }
            }
          }
        }) as T;

        if (
          contentMatches &&
          (hasSamePrototype || isOriginalObject) &&
          newState === state
        ) {
          return;
        }

        if (newState !== state) {
          state = applyGetters(newState);
        } else {
          return;
        }
      }
    }

    if (!Object.is(state, prevState)) {
      if (!inTransaction && !setOptions?.skipHistory) {
        if (debounceMs && debounceMs > 0) {
          debouncePendingState = state;
          debouncePendingPrevState = prevState;
          debouncePendingSkipHistory = false;

          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(() => {
            flushDebouncedHistory();
          }, debounceMs);
        } else {
          addToHistory({
            state: cloneStateForHistory(state),
            timestamp: Date.now(),
          });

          notifyListeners(state, prevState);
        }
      } else if (!inTransaction) {
        if (debounceMs && debounceMs > 0 && !setOptions?.skipHistory) {
          debouncePendingState = state;
          debouncePendingPrevState = prevState;
          debouncePendingSkipHistory = false;

          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(() => {
            flushDebouncedHistory();
          }, debounceMs);
        } else {
          if (setOptions?.skipHistory) {
            const changedKeys = new Set<string>();

            if (isImmerable(state) && isImmerable(prevState)) {
              for (const key in state) {
                if ((state as any)[key] !== (prevState as any)[key]) {
                  changedKeys.add(key);
                }
              }
            }

            for (let i = 0; i < history.length; i++) {
              const historyEntry = history[i];

              if (historyEntry) {
                const historyState = historyEntry.state;

                if (isImmerable(historyState)) {
                  const updatedState = { ...historyState };

                  for (const key of changedKeys) {
                    (updatedState as any)[key] = (state as any)[key];
                  }

                  const updatedEntry: HistoryEntry<T> = {
                    state: updatedState as T,
                    timestamp: historyEntry.timestamp,
                  };

                  if (historyEntry.name !== undefined) {
                    updatedEntry.name = historyEntry.name;
                  }

                  history[i] = updatedEntry;
                }
              }
            }
          }
          notifyListeners(state, prevState);
        }
      } else {
        if (transactionPrevState === null) {
          transactionPrevState = prevState;
        }
      }
    }
  };

  const subscribeImpl: StoreSubscriber<T> = ((
    listenerOrPath: ((state: T, prevState: T) => void) | (string | number)[],
    listenerArg?: (state: T, prevState: T) => void,
  ) => {
    if (typeof listenerOrPath === 'function') {
      listeners.add(listenerOrPath);

      return () => listeners.delete(listenerOrPath);
    }

    if (Array.isArray(listenerOrPath) && listenerArg) {
      const pathListener: PathListener = {
        listener: listenerArg,
        path: listenerOrPath,
      };

      pathListeners.add(pathListener);

      return () => pathListeners.delete(pathListener);
    }

    throw new Error(
      'subscribe requires either a listener function or a path array and listener function',
    );
  }) as StoreSubscriber<T>;

  const api: StoreApi<T> = {
    setState: setStateImpl,
    getState: () => state,
    getInitialState: () => initialState,
    subscribe: subscribeImpl,
    undo: () => {
      if (debounceTimer) {
        flushDebouncedHistory();
      }

      if (historyIndex > 0) {
        const prevState = state;

        historyIndex--;

        const historyEntry = history[historyIndex];

        if (historyEntry) {
          state = restoreHistoryState(historyEntry.state, state);
          notifyListeners(state, prevState);
        }
      }
    },
    redo: () => {
      if (debounceTimer) {
        flushDebouncedHistory();
      }

      if (historyIndex < history.length - 1) {
        const prevState = state;

        historyIndex++;

        const historyEntry = history[historyIndex];

        if (historyEntry) {
          state = restoreHistoryState(historyEntry.state, state);
          notifyListeners(state, prevState);
        }
      }
    },
    canUndo: () => historyIndex > 0,
    canRedo: () => historyIndex < history.length - 1,
    transaction: (fn, txOptions) => {
      if (inTransaction) {
        fn();

        return;
      }

      inTransaction = true;
      transactionStartIndex = historyIndex;
      transactionPrevState = null;

      const startState = state;

      try {
        fn();

        if (debounceTimer) {
          flushDebouncedHistory();
        }

        if (!Object.is(state, startState)) {
          if (!txOptions?.skipHistory) {
            const entry: HistoryEntry<T> = {
              state: cloneStateForHistory(state),
              timestamp: Date.now(),
            };

            if (txOptions?.name !== undefined) {
              entry.name = txOptions.name;
            }

            addToHistory(entry);
          }

          if (transactionPrevState !== null) {
            notifyListeners(state, transactionPrevState as T);
          }
        }
      } catch (error) {
        state = startState;
        historyIndex = transactionStartIndex;

        throw error;
      } finally {
        inTransaction = false;
        transactionPrevState = null;
      }
    },
    getHistory: () => {
      if (history.length > maxHistorySize) {
        return history.slice(-maxHistorySize);
      }

      return history;
    },
    saveHistory: () => {
      if (history.length > maxHistorySize) {
        return history.slice(-maxHistorySize);
      }

      return history;
    },
    restoreHistory: (
      statesOrEntries: T[] | HistoryEntry<T>[],
      index: number,
    ) => {
      const isEntryFormat =
        statesOrEntries.length > 0 &&
        typeof statesOrEntries[0] === 'object' &&
        statesOrEntries[0] !== null &&
        'state' in statesOrEntries[0];

      if (isEntryFormat) {
        history = (statesOrEntries as HistoryEntry<T>[]).map((entry) => ({
          state: entry.state,
          timestamp: entry.timestamp ?? Date.now(),
          ...(entry.name !== undefined && { name: entry.name }),
        }));
      } else {
        history = (statesOrEntries as T[]).map((s) => ({
          state: s,
          timestamp: Date.now(),
        }));
      }

      historySizes.length = 0;
      historyMemoryUsage = 0;
      for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        if (entry) {
          const size = estimateEntrySize(entry);
          historySizes.push(size);
          historyMemoryUsage += size;
        }
      }

      historyIndex = index;

      if (historyIndex >= 0 && historyIndex < history.length) {
        const historyEntry = history[historyIndex];
        if (historyEntry) {
          state = restoreHistoryState(historyEntry.state, state);
        }
      }
    },
    clearHistory: () => {
      history = [];
      historySizes.length = 0;
      historyMemoryUsage = 0;
      historyIndex = -1;
      addToHistory({
        state: cloneStateForHistory(state),
        timestamp: Date.now(),
      });
    },
    getHistoryMemoryUsage: (): MemoryInfo => {
      const estimator = customSizeEstimator || estimateObjectSize;

      // Calculate history memory (already tracked)
      const historyBytes = historyMemoryUsage;

      // Calculate snapshot memory
      let snapshotBytes = 0;
      for (const snapshot of snapshots.values()) {
        snapshotBytes += estimator(snapshot.state);
      }

      const totalBytes = historyBytes + snapshotBytes;
      const entryCount = history.length;
      const averageBytes = entryCount > 0 ? historyBytes / entryCount : 0;

      const info: MemoryInfo = {
        totalBytes,
        historyBytes,
        snapshotBytes,
        entryCount,
        snapshotCount: snapshots.size,
        averageBytes: Math.round(averageBytes),
      };

      if (maxHistoryMemory) {
        info.maxBytes = maxHistoryMemory;
        info.utilizationPercent = Math.round(
          (totalBytes / maxHistoryMemory) * 100,
        );
      }

      return info;
    },
    // Named Snapshots API
    saveSnapshot: (name: string, options?: SnapshotOptions): string => {
      const id = options?.id || generateSnapshotId(name);

      const snapshot: Snapshot<T> = {
        id,
        name,
        state: cloneStateForHistory(state),
        timestamp: Date.now(),
      };

      if (options?.description) {
        snapshot.description = options.description;
      }

      if (options?.metadata) {
        snapshot.metadata = options.metadata;
      }

      snapshots.set(id, snapshot);

      // FIFO cleanup: auto-delete oldest snapshot if maxSnapshotsSize exceeded
      if (maxSnapshotsSize && snapshots.size > maxSnapshotsSize) {
        let oldestId: string | null = null;
        let oldestTimestamp = Infinity;

        // Find oldest snapshot by timestamp
        for (const [snapshotId, snap] of snapshots.entries()) {
          if (snap.timestamp < oldestTimestamp) {
            oldestTimestamp = snap.timestamp;
            oldestId = snapshotId;
          }
        }

        // Delete oldest snapshot
        if (oldestId) {
          snapshots.delete(oldestId);
        }
      }

      return id;
    },
    listSnapshots: (): SnapshotInfo[] => {
      const list: SnapshotInfo[] = [];

      for (const snapshot of snapshots.values()) {
        const info: SnapshotInfo = {
          id: snapshot.id,
          name: snapshot.name,
          timestamp: snapshot.timestamp,
        };

        if (snapshot.description !== undefined) {
          info.description = snapshot.description;
        }

        if (snapshot.metadata !== undefined) {
          info.metadata = snapshot.metadata;
        }

        list.push(info);
      }

      return list;
    },
    getSnapshotInfo: (id: string): SnapshotInfo | null => {
      const snapshot = snapshots.get(id);

      if (!snapshot) {
        return null;
      }

      const info: SnapshotInfo = {
        id: snapshot.id,
        name: snapshot.name,
        timestamp: snapshot.timestamp,
      };

      if (snapshot.description !== undefined) {
        info.description = snapshot.description;
      }

      if (snapshot.metadata !== undefined) {
        info.metadata = snapshot.metadata;
      }

      return info;
    },
    loadSnapshot: (id: string, options?: SnapshotRestoreOptions): boolean => {
      const snapshot = snapshots.get(id);

      if (!snapshot) {
        return false;
      }

      const prevState = state;
      const addToHistory = options?.addToHistory !== false; // Default true

      if (addToHistory) {
        // Use transaction to ensure history is updated
        api.transaction(
          () => {
            state = restoreHistoryState(snapshot.state, state);
          },
          { name: `Restored snapshot: ${snapshot.name}` },
        );
      } else {
        // Directly restore without adding to history
        state = restoreHistoryState(snapshot.state, state);

        // Notify listeners
        if (!Object.is(state, prevState)) {
          notifyListeners(state, prevState);
        }
      }

      return true;
    },
    deleteSnapshot: (id: string): boolean => {
      return snapshots.delete(id);
    },
    clearSnapshots: (): void => {
      snapshots.clear();
    },
  };

  (api.setState as SetStateWithTransaction<T>).transaction = api.transaction;

  const setStateWithTransaction = Object.assign(api.setState, {
    transaction: api.transaction,
  }) as SetStateWithTransaction<T>;

  const tempState = {} as T;
  const initialResult = initializer(
    setStateWithTransaction as StateCreatorSet<T, []>,
    api.getState as Get<Mutate<StoreApi<T>, []>, 'getState', never>,
    api as Mutate<StoreApi<T>, []>,
  );

  originalInitialResult = initialResult;

  if (isImmerable(initialResult)) {
    const descriptors = Object.getOwnPropertyDescriptors(initialResult);

    state = Object.create(Object.getPrototypeOf(initialResult));

    for (const key in descriptors) {
      const descriptor = descriptors[key];

      if (descriptor && (descriptor.get || descriptor.set)) {
        stateGetters[key] = descriptor;

        Object.defineProperty(state, key, descriptor);
      } else {
        (state as any)[key] = initialResult[key as keyof T];
      }
    }
  } else {
    state = initialResult;
  }

  Object.assign(tempState as any, state);

  const initialState: T = state;

  if (history.length === 0) {
    addToHistory({
      state: cloneStateForHistory(state),
      timestamp: Date.now(),
    });
  }

  return api as Mutate<StoreApi<T>, Mos>;
}

export function createStore<T>(): <
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>,
  options?: CreateStoreOptions,
) => Mutate<StoreApi<T>, Mos>;
export function createStore<TCreator extends StateCreator<any, [], any>>(
  initializer: TCreator,
  options?: CreateStoreOptions,
): Mutate<
  StoreApi<ReturnType<TCreator>>,
  ExtractStateCreatorMutators<TCreator>
>;
export function createStore<
  T,
  TCreator extends StateCreator<T, [], any> = StateCreator<T, [], any>,
>(
  initializer: TCreator,
  options?: CreateStoreOptions,
): Mutate<StoreApi<T>, ExtractStateCreatorMutators<TCreator>>;
export function createStore<
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(initializer?: StateCreator<T, [], Mos>, options?: CreateStoreOptions): any {
  if (!initializer) {
    return <Mos2 extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer2: StateCreator<T, [], Mos2>,
      options2?: CreateStoreOptions,
    ) => createStoreImpl<T, Mos2>(initializer2, options2);
  }
  return createStoreImpl<T, Mos>(initializer, options);
}
