export type StoreTransaction<_T> = (
  fn: () => void,
  options?: { name?: string; skipHistory?: boolean },
) => void;

export type StoreSetState<T> = {
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: false,
    options?: { skipHistory?: boolean },
  ): void;
  (
    state: T | ((state: T) => T),
    replace: true,
    options?: { skipHistory?: boolean },
  ): void;
  (
    state: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
    options?: { skipHistory?: boolean },
  ): void;
};

export type Get<T, K, F> = K extends keyof T ? T[K] : F;

export interface StoreMutators<S, A> {}

export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>;

export type StoreSubscriber<T> = {
  (listener: (state: T, prevState: T) => void): () => void;
  (
    path: (string | number)[],
    listener: (state: T, prevState: T) => void,
  ): () => void;
};

export type Mutate<
  S,
  Ms extends [StoreMutatorIdentifier, unknown][],
> = number extends Ms['length']
  ? S
  : Ms extends []
    ? S
    : Ms extends [[infer Mi, infer Mp], ...infer Rest]
      ? Mutate<
          StoreMutators<S, Mp>[Mi & StoreMutatorIdentifier],
          Rest extends [StoreMutatorIdentifier, unknown][] ? Rest : []
        >
      : S;

export type WithTransaction<T, S> = S extends (...args: infer P) => infer R
  ? ((...args: P) => R) & { transaction: StoreTransaction<T> }
  : S;

export type StateCreatorSet<
  T,
  Mps extends [StoreMutatorIdentifier, unknown][],
> = WithTransaction<T, Get<Mutate<StoreApi<T>, Mps>, 'setState', never>>;

export type StateCreator<
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
> = ((
  set: StateCreatorSet<T, Mps>,
  get: Get<Mutate<StoreApi<T>, Mps>, 'getState', never>,
  api: Mutate<StoreApi<T>, Mps>,
) => U) & { $$storeMutators?: Mcs };

export type StoreApi<T> = {
  setState: StoreSetState<T>;
  getState: () => T;
  getInitialState: () => T;
  subscribe: StoreSubscriber<T>;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  transaction: StoreTransaction<T>;
  getHistory: () => any[];
  saveHistory?: () => any[];
  restoreHistory?: (
    statesOrEntries: T[] | HistoryEntry<T>[],
    index: number,
  ) => void;
  clearHistory?: () => void;
  getHistoryMemoryUsage: () => MemoryInfo;
  // Named Snapshots API
  saveSnapshot: (name: string, options?: SnapshotOptions) => string;
  listSnapshots: () => SnapshotInfo[];
  getSnapshotInfo: (id: string) => SnapshotInfo | null;
  getSnapshot?: (id: string) => Snapshot<T> | null; // Internal use for persist
  loadSnapshot: (id: string, options?: SnapshotRestoreOptions) => boolean;
  deleteSnapshot: (id: string) => boolean;
  clearSnapshots: () => void;
  restoreSnapshots?: (snapshots: Snapshot<T>[]) => void;
};

export type SetStateWithTransaction<T> = StoreSetState<T> & {
  transaction: StoreTransaction<T>;
};

export type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

export type ExtractStateCreatorMutators<SC> = SC extends {
  $$storeMutators?: infer Mutators;
}
  ? Mutators extends [StoreMutatorIdentifier, unknown][]
    ? Mutators
    : []
  : [];

export type HistoryEntry<T> = {
  state: T;
  timestamp: number;
  name?: string;
};

export type CreateStoreOptions = {
  maxHistorySize?: number;
  maxSnapshotsSize?: number; // Auto-delete oldest snapshot when exceeded
  computedFields?: string[];
  debounce?: number;
  maxHistoryMemory?: number; // Applies to combined history + snapshots
  estimateSize?: <T>(state: T) => number;
  onMemoryLimitReached?: (info: MemoryLimitInfo) => void;
};

export interface MemoryLimitInfo {
  currentMemory: number;
  maxMemory: number;
  historyLength: number;
  entriesRemoved: number;
}

export interface MemoryInfo {
  totalBytes: number; // History + Snapshots combined
  historyBytes: number; // Just history memory
  snapshotBytes: number; // Just snapshot memory
  entryCount: number; // History entries only
  snapshotCount: number; // Snapshot count
  averageBytes: number; // Average per history entry
  maxBytes?: number; // Applies to totalBytes (combined)
  utilizationPercent?: number; // totalBytes / maxBytes * 100
}

// Legacy alias for backward compatibility
export type HistoryMemoryInfo = MemoryInfo;

// Named Snapshots Types
export type Snapshot<T> = {
  id: string;
  name: string;
  state: T;
  timestamp: number;
  description?: string;
  metadata?: Record<string, any>;
};

export type SnapshotInfo = Omit<Snapshot<any>, 'state'>;

export type SnapshotOptions = {
  description?: string;
  metadata?: Record<string, any>;
  id?: string;
};

export type SnapshotRestoreOptions = {
  addToHistory?: boolean;
};
