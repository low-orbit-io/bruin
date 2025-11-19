import type {
  HistoryEntry,
  SetStateWithTransaction,
  Snapshot,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../types/core';
import type { Write } from '../types/middleware';

export interface StateStorage<R = unknown> {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => R;
  removeItem: (name: string) => R;
}

export type StorageValue<S> = {
  state: S;
  version?: number;
  persistHistory?: boolean;
  history?: S[] | Array<{ state: S; timestamp: number; name?: string }>;
  historyIndex?: number;
  // Named Snapshots persistence
  persistSnapshots?: boolean;
  snapshots?: Array<{
    id: string;
    name: string;
    description?: string;
    state: S;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
};

export interface PersistStorage<S, R = unknown> {
  getItem: (
    name: string,
  ) => StorageValue<S> | null | Promise<StorageValue<S> | null>;
  setItem: (name: string, value: StorageValue<S>) => R;
  removeItem: (name: string) => R;
}

export interface PersistOptions<
  S,
  PersistedState = S,
  PersistReturn = unknown,
> {
  name: string;
  storage?: PersistStorage<PersistedState, PersistReturn> | undefined;
  partialize?: (state: S) => PersistedState;
  onRehydrateStorage?: (
    state: S,
  ) => ((state?: S, error?: unknown) => void) | void;
  version?: number;
  migrate?: (
    persistedState: unknown,
    version: number,
  ) => PersistedState | Promise<PersistedState>;
  merge?: (persistedState: unknown, currentState: S) => S;
  skipHydration?: boolean;
  persistHistory?: boolean;
  persistSnapshots?: boolean; // Named Snapshots persistence (default false)
}

type JsonStorageOptions = {
  reviver?: (key: string, value: unknown) => unknown;
  replacer?: (key: string, value: unknown) => unknown;
};

type PersistListener<S> = (state: S) => void;

type StorePersist<S, Ps, Pr> = S extends {
  getState: () => infer T;
  setState: {
    (...args: infer Sa1): infer Sr1;
    (...args: infer Sa2): infer Sr2;
  };
}
  ? {
      setState(...args: Sa1): Sr1 | Pr;
      setState(...args: Sa2): Sr2 | Pr;
      persist: {
        setOptions: (options: Partial<PersistOptions<T, Ps, Pr>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: PersistListener<T>) => () => void;
        onFinishHydration: (fn: PersistListener<T>) => () => void;
        getOptions: () => Partial<PersistOptions<T, Ps, Pr>>;
      };
    }
  : never;

type WithPersist<S, A> = Write<S, StorePersist<S, A, unknown>>;

declare module '../types/core' {
  interface StoreMutators<S, A> {
    'bruin/persist': WithPersist<S, A>;
  }
}

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
>(
  initializer: StateCreator<T, [...Mps, ['bruin/persist', unknown]], Mcs>,
  options: PersistOptions<T, U>,
) => StateCreator<T, Mps, [['bruin/persist', U], ...Mcs]>;

type PersistImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  options: PersistOptions<T, T>,
) => StateCreator<T, [], []>;

type Thenable<Value> = {
  then<V>(
    onFulfilled: (value: Value) => V | Promise<V> | Thenable<V>,
  ): Thenable<V>;
  catch<V>(
    onRejected: (reason: Error) => V | Promise<V> | Thenable<V>,
  ): Thenable<V>;
};

const toThenable =
  <Result, Input>(
    fn: (input: Input) => Result | Promise<Result> | Thenable<Result>,
  ) =>
  (input: Input): Thenable<Result> => {
    try {
      const result = fn(input);
      if (result instanceof Promise) {
        return result as Thenable<Result>;
      }
      return {
        then(onFulfilled) {
          return toThenable(onFulfilled)(result as Result);
        },
        catch(_onRejected) {
          return this as Thenable<any>;
        },
      };
    } catch (e: any) {
      return {
        then(_onFulfilled) {
          return this as Thenable<any>;
        },
        catch(onRejected) {
          return toThenable(onRejected)(e);
        },
      };
    }
  };

export function createJSONStorage<S, R = unknown>(
  getStorage: () => StateStorage<R>,
  options?: JsonStorageOptions,
): PersistStorage<S, unknown> | undefined {
  let storage: StateStorage<R> | undefined;

  try {
    storage = getStorage();
  } catch {
    return;
  }

  const persistStorage: PersistStorage<S, R> = {
    getItem: (name) => {
      const parse = (str: string | null) => {
        if (str === null) {
          return null;
        }

        return JSON.parse(str, options?.reviver) as StorageValue<S>;
      };

      const str = storage!.getItem(name) ?? null;

      if (str instanceof Promise) {
        return str.then(parse);
      }

      return parse(str);
    },
    setItem: (name, newValue) =>
      storage!.setItem(name, JSON.stringify(newValue, options?.replacer)),
    removeItem: (name) => storage!.removeItem(name),
  };

  return persistStorage;
}

const persistImpl: PersistImpl =
  (config, baseOptions) =>
  (
    set: StoreApi<ReturnType<typeof config>>['setState'],
    get: StoreApi<ReturnType<typeof config>>['getState'],
    api: StoreApi<ReturnType<typeof config>>,
  ) => {
    type S = ReturnType<typeof config>;

    let options = {
      storage: createJSONStorage<S, void>(() => localStorage),
      partialize: (state: S) => state,
      version: 0,
      merge: (persistedState: unknown, currentState: S) => ({
        ...currentState,
        ...(persistedState as object),
      }),
      persistHistory: false,
      ...baseOptions,
    };

    let hasHydrated = false;

    const hydrationListeners = new Set<PersistListener<S>>();
    const finishHydrationListeners = new Set<PersistListener<S>>();

    let storage = options.storage;

    if (!storage) {
      const wrappedSetNoStorage = Object.assign(
        (...args: Parameters<typeof set>) => {
          console.warn(
            `[bruin persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`,
          );
          set(...args);
        },
        set,
      ) as SetStateWithTransaction<S>;

      return config(wrappedSetNoStorage, get, api);
    }

    const setItem = () => {
      const state = options.partialize({ ...get() });
      const storageValue: StorageValue<S> = {
        state,
        version: options.version,
      };

      if (options.persistHistory && api.getHistory) {
        const history = api.getHistory();
        const historyEntries = history.map((entry: any) => ({
          state: options.partialize({ ...entry.state }),
          timestamp: entry.timestamp,
          ...(entry.name !== undefined && { name: entry.name }),
        }));
        const currentIndex = history.length - 1;

        storageValue.persistHistory = true;
        storageValue.history = historyEntries;
        storageValue.historyIndex = currentIndex;
      }

      // Named Snapshots persistence
      if (options.persistSnapshots && api.listSnapshots && api.getSnapshot) {
        const snapshotList = api.listSnapshots();
        const snapshotData: Array<Snapshot<S>> = [];

        // Get full snapshot data for each snapshot
        for (const info of snapshotList) {
          const snapshot = api.getSnapshot(info.id);
          if (snapshot) {
            snapshotData.push({
              id: snapshot.id,
              name: snapshot.name,
              state: options.partialize
                ? options.partialize({ ...snapshot.state })
                : snapshot.state,
              timestamp: snapshot.timestamp,
              ...(snapshot.description && {
                description: snapshot.description,
              }),
              ...(snapshot.metadata && { metadata: snapshot.metadata }),
            });
          }
        }

        if (snapshotData.length > 0) {
          storageValue.persistSnapshots = true;
          storageValue.snapshots = snapshotData;
        }
      }

      return (storage as PersistStorage<S, unknown>).setItem(
        options.name,
        storageValue,
      );
    };

    const savedSetState = api.setState;

    api.setState = Object.assign(
      (state: Parameters<typeof savedSetState>[0], replace?: boolean) => {
        savedSetState(state, replace as any);

        return setItem();
      },
      savedSetState,
    ) as SetStateWithTransaction<S>;

    const wrappedSet = Object.assign((...args: Parameters<typeof set>) => {
      set(...args);

      return setItem();
    }, set) as SetStateWithTransaction<S>;

    const configResult = config(wrappedSet, get, api);

    api.getInitialState = () => configResult;

    let stateFromStorage: S | undefined;

    const hydrate = () => {
      if (!storage) return;

      hasHydrated = false;
      hydrationListeners.forEach((cb) => cb(get() ?? configResult));

      const postRehydrationCallback =
        options.onRehydrateStorage?.(get() ?? configResult) || undefined;

      return toThenable(storage.getItem.bind(storage))(options.name)
        .then((deserializedStorageValue: StorageValue<S> | null) => {
          if (deserializedStorageValue) {
            if (
              typeof deserializedStorageValue.version === 'number' &&
              deserializedStorageValue.version !== options.version
            ) {
              if (options.migrate) {
                const migration = options.migrate(
                  deserializedStorageValue.state,
                  deserializedStorageValue.version,
                );
                if (migration instanceof Promise) {
                  return migration.then(
                    (result) =>
                      [true, result, deserializedStorageValue] as const,
                  );
                }
                return [true, migration, deserializedStorageValue] as const;
              }
              console.error(
                `State loaded from storage couldn't be migrated since no migrate function was provided`,
              );
            } else {
              return [
                false,
                deserializedStorageValue.state,
                deserializedStorageValue,
              ] as const;
            }
          }
          return [false, undefined, null] as const;
        })
        .then(
          (
            migrationResult: readonly [
              boolean,
              S | undefined,
              StorageValue<S> | null,
            ],
          ) => {
            const [migrated, migratedState, originalStorageValue] =
              migrationResult;

            if (migratedState !== undefined) {
              stateFromStorage = options.merge(
                migratedState as S,
                get() ?? configResult,
              );
            }

            if (originalStorageValue && stateFromStorage) {
              const storageValue = originalStorageValue as StorageValue<S>;
              const shouldRestoreHistory =
                options.persistHistory &&
                storageValue.persistHistory &&
                storageValue.history &&
                typeof storageValue.historyIndex === 'number' &&
                api.restoreHistory;

              if (shouldRestoreHistory) {
                // Handle both formats: array of states (old) or array of history entries (new)
                const historyArray = storageValue.history!;

                // Type guard to check if item is a history entry
                const isHistoryEntryFormat = (
                  item: S | HistoryEntry<S>,
                ): item is HistoryEntry<S> => {
                  return (
                    typeof item === 'object' &&
                    item !== null &&
                    'state' in item &&
                    'timestamp' in item
                  );
                };

                const firstItem = historyArray[0];
                const isEntryFormat =
                  firstItem !== undefined && isHistoryEntryFormat(firstItem);

                if (isEntryFormat) {
                  // New format: full history entry with state, timestamp, name
                  const mergedHistoryEntries: HistoryEntry<S>[] =
                    historyArray.map((item) => {
                      const entry = item as HistoryEntry<S>;
                      return {
                        state: options.merge(entry.state, configResult),
                        timestamp: entry.timestamp,
                        ...(entry.name !== undefined && { name: entry.name }),
                      };
                    });

                  api.restoreHistory!(
                    mergedHistoryEntries,
                    storageValue.historyIndex!,
                  );
                } else {
                  // Old format: just state object
                  const mergedStates: S[] = historyArray.map((item) =>
                    options.merge(item as S, configResult),
                  );

                  api.restoreHistory!(mergedStates, storageValue.historyIndex!);
                }
              }

              // Named Snapshots hydration
              const shouldRestoreSnapshots =
                options.persistSnapshots &&
                storageValue.persistSnapshots &&
                storageValue.snapshots &&
                Array.isArray(storageValue.snapshots) &&
                api.restoreSnapshots;

              if (shouldRestoreSnapshots) {
                // Validate and apply merge function to each snapshot's state
                const hydratedSnapshots: Snapshot<S>[] = [];

                for (const snapshot of storageValue.snapshots!) {
                  // Validate required fields
                  if (!snapshot?.id || !snapshot?.name || !snapshot?.state) {
                    console.warn(
                      '[Bruin] Skipping invalid snapshot during hydration:',
                      snapshot,
                    );
                    continue;
                  }

                  // Apply migration if needed
                  let snapshotState: any = snapshot.state;
                  if (migrated && options.migrate) {
                    const migrationResult = options.migrate(
                      snapshotState,
                      originalStorageValue?.version || 0,
                    );
                    if (migrationResult instanceof Promise) {
                      // For simplicity, we'll skip async migrations for snapshots
                      console.warn(
                        '[Bruin] Async migration for snapshots not supported',
                      );
                      continue;
                    }
                    snapshotState = migrationResult;
                  }

                  // Apply merge function
                  const mergedState = options.merge
                    ? options.merge(snapshotState, configResult)
                    : snapshotState;

                  const hydratedSnapshot: Snapshot<S> = {
                    id: snapshot.id,
                    name: snapshot.name,
                    state: mergedState,
                    timestamp: snapshot.timestamp,
                    ...(snapshot.description && {
                      description: snapshot.description,
                    }),
                    ...(snapshot.metadata && { metadata: snapshot.metadata }),
                  };

                  hydratedSnapshots.push(hydratedSnapshot);
                }

                // Bulk restore all snapshots at once
                if (hydratedSnapshots.length > 0) {
                  api.restoreSnapshots!(hydratedSnapshots);
                }
              }

              // Set the state if not using history restoration
              if (!shouldRestoreHistory) {
                set(stateFromStorage as S, true);
              }

              if (migrated) {
                return setItem();
              }
            }
          },
        )
        .then(() => {
          postRehydrationCallback?.(
            stateFromStorage ?? get() ?? configResult,
            undefined,
          );

          stateFromStorage = get();
          hasHydrated = true;
          finishHydrationListeners.forEach((cb) => cb(stateFromStorage as S));
        })
        .catch((e: Error) => {
          postRehydrationCallback?.(undefined, e);
        });
    };

    (api as any).persist = {
      setOptions: (newOptions: Partial<PersistOptions<S, S, unknown>>) => {
        options = {
          ...options,
          ...newOptions,
        };

        if (newOptions.storage) {
          storage = newOptions.storage;
        }
      },
      clearStorage: () => {
        storage?.removeItem(options.name);
      },
      getOptions: () => options,
      rehydrate: () => hydrate() as Promise<void>,
      hasHydrated: () => hasHydrated,
      onHydrate: (cb: PersistListener<S>) => {
        hydrationListeners.add(cb);

        return () => {
          hydrationListeners.delete(cb);
        };
      },
      onFinishHydration: (cb: PersistListener<S>) => {
        finishHydrationListeners.add(cb);

        return () => {
          finishHydrationListeners.delete(cb);
        };
      },
    };

    if (!options.skipHydration) {
      hydrate();
    }

    return stateFromStorage || configResult;
  };

export const persist = persistImpl as unknown as Persist;
