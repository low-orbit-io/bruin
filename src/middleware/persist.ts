import type {
  SetStateWithTransaction,
  StateCreator,
  StoreApi,
} from '../vanilla';

export interface StateStorage<R = unknown> {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => R;
  removeItem: (name: string) => R;
}

export type StorageValue<S> = {
  state: S;
  version?: number;
  persistHistory?: boolean;
  history?: S[];
  historyIndex?: number;
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

type Write<T, U> = Omit<T, keyof U> & U;

type WithPersist<S, A> = Write<S, StorePersist<S, A, unknown>>;

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'bruin/persist': WithPersist<S, A>;
  }
}

type Persist = <T, U = T>(
  initializer: StateCreator<T>,
  options: PersistOptions<T, U>,
) => StateCreator<T>;

type PersistImpl = <T>(
  storeInitializer: StateCreator<T>,
  options: PersistOptions<T, T>,
) => StateCreator<T>;

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
        const historyStates = history.map((entry: any) =>
          options.partialize({ ...entry.state }),
        );
        const currentIndex = history.length - 1;

        storageValue.persistHistory = true;
        storageValue.history = historyStates;
        storageValue.historyIndex = currentIndex;
      }

      return (storage as PersistStorage<S, unknown>).setItem(
        options.name,
        storageValue,
      );
    };

    const savedSetState = api.setState;

    api.setState = (state, replace) => {
      savedSetState(state, replace as any);

      return setItem();
    };

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
                const mergedHistory = storageValue.history!.map(
                  (historyState: any) => {
                    return options.merge(historyState, configResult);
                  },
                );

                api.restoreHistory!(mergedHistory, storageValue.historyIndex!);
              } else {
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
