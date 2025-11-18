import { enableMapSet, produce } from 'immer';

enableMapSet();

export type StoreApi<T> = {
  setState: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
    options?: { skipHistory?: boolean },
  ) => void;
  getState: () => T;
  getInitialState: () => T;
  subscribe: (
    listenerOrPath:
      | ((state: T, prevState: T) => void)
      | (string | number)[],
    listener?: (state: T, prevState: T) => void,
  ) => () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  transaction: (
    fn: () => void,
    options?: { name?: string; skipHistory?: boolean },
  ) => void;
  getHistory: () => any[];
};

type HistoryEntry<T> = {
  state: T;
  timestamp: number;
  name?: string;
};

type CreateStoreOptions = {
  maxHistorySize?: number;
  computedFields?: string[];
  debounce?: number;
};

export const createStore = <T>(
  initializer: (
    set: StoreApi<T>['setState'],
    get: StoreApi<T>['getState'],
    api: StoreApi<T>,
  ) => T,
  options?: CreateStoreOptions,
): StoreApi<T> => {
  let state: T;
  let originalInitialResult: T | null = null;
  let history: HistoryEntry<T>[] = [];
  let historyIndex = -1;
  let inTransaction = false;
  let transactionStartIndex = -1;
  let transactionPrevState: T | null = null;

  const maxHistorySize = options?.maxHistorySize ?? 50;
  const debounceMs = options?.debounce;
  const listeners = new Set<(state: T, prevState: T) => void>();

  type PathListener = {
    listener: (state: T, prevState: T) => void;
    path: (string | number)[];
  };

  const pathListeners = new Set<PathListener>();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let debouncePendingState: T | null = null;
  let debouncePendingPrevState: T | null = null;
  let debouncePendingSkipHistory: boolean | null = null;

  // Store getters from initial state
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

  // Helper to reapply getters to state after updates
  const applyGetters = (newState: T): T => {
    if (!isImmerable(newState) || Object.keys(stateGetters).length === 0) {
      return newState;
    }

    // Create new object with getters applied
    const stateWithGetters = Object.create(Object.getPrototypeOf(newState));

    // Copy all non-getter properties
    for (const key in newState) {
      if (!stateGetters[key]) {
        stateWithGetters[key] = newState[key];
      }
    }

    // Apply getters
    for (const key in stateGetters) {
      const descriptor = stateGetters[key];
      if (descriptor) {
        Object.defineProperty(stateWithGetters, key, descriptor);
      }
    }

    return stateWithGetters;
  };

  const getValueAtPath = (obj: any, path: (string | number)[]): any => {
    let current = obj;
    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  };

  const hasPathChanged = (
    prevState: T,
    newState: T,
    path: (string | number)[],
  ): boolean => {
    const prevValue = getValueAtPath(prevState, path);
    const newValue = getValueAtPath(newState, path);
    return !Object.is(prevValue, newValue);
  };

  const getChangedPaths = (
    prevState: T,
    newState: T,
  ): Set<string> => {
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
              Object.keys(obj[key]).length !== Object.keys(prevObj[key]).length))
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

    if (pathListeners.size > 0 && isImmerable(newState) && isImmerable(prevState)) {
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
      if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
      }

      history.push({
        state: cloneStateForHistory(pendingState),
        timestamp: Date.now(),
      });

      if (history.length > maxHistorySize + 1) {
        history = history.slice(-(maxHistorySize + 1));
      }

      historyIndex = history.length - 1;
    }

    notifyListeners(pendingState, pendingPrevState);
  };

  const api: StoreApi<T> = {
    setState: (
      partial,
      replace = false,
      setOptions?: { skipHistory?: boolean },
    ) => {
      const prevState = state;

      // Early return if setting the exact same object
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
        state = produce(state, (draft) => {
          const updates = (partial as (state: T) => T | Partial<T>)(draft as T);

          if (updates && updates !== draft) {
            if (replace || !isImmerable(updates)) {
              return updates as any;
            } else {
              Object.assign(draft as any, updates);
            }
          }
        });
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
          Object.keys(partial as object).length ===
            Object.keys(state as object).length &&
          Object.keys(partial as object).every(
            (key) => (partial as any)[key] === (state as any)[key],
          ) &&
          Object.getPrototypeOf(partial) === Object.prototype;

        if (isSpread) {
          state = applyGetters({ ...partial } as T);
        } else {
          const newState = produce(state, (draft) => {
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
          });
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
            if (historyIndex < history.length - 1) {
              history = history.slice(0, historyIndex + 1);
            }

            history.push({
              state: cloneStateForHistory(state),
              timestamp: Date.now(),
            });

            if (history.length > maxHistorySize + 1) {
              history = history.slice(-(maxHistorySize + 1));
            }

            historyIndex = history.length - 1;

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
            // skipHistory: update all history entries with the changes so they persist through undo/redo
            if (setOptions?.skipHistory) {
              // Get the keys that changed
              const changedKeys = new Set<string>();
              if (isImmerable(state) && isImmerable(prevState)) {
                for (const key in state) {
                  if ((state as any)[key] !== (prevState as any)[key]) {
                    changedKeys.add(key);
                  }
                }
              }

              // Update all history entries with the changed values
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
    },
    getState: () => state,
    getInitialState: () => initialState,
    subscribe: (listenerOrPath, listenerArg?) => {
      if (typeof listenerOrPath === 'function') {
        listeners.add(listenerOrPath);
        return () => listeners.delete(listenerOrPath);
      } else if (Array.isArray(listenerOrPath) && listenerArg) {
        const pathListener: PathListener = {
          listener: listenerArg,
          path: listenerOrPath,
        };
        pathListeners.add(pathListener);
        return () => pathListeners.delete(pathListener);
      } else {
        throw new Error(
          'subscribe requires either a listener function or a path array and listener function',
        );
      }
    },
    undo: () => {
      if (debounceTimer) {
        flushDebouncedHistory();
      }

      if (historyIndex > 0) {
        const prevState = state;

        historyIndex--;

        const historyEntry = history[historyIndex];
        if (historyEntry) {
          const historyState = historyEntry.state;

          if (isImmerable(historyState) && isImmerable(state)) {
            const descriptors = Object.getOwnPropertyDescriptors(state);
            const newState = {} as T;

            Object.assign(newState as any, historyState);

            for (const key in descriptors) {
              const descriptor = descriptors[key];

              if (descriptor && descriptor.get) {
                Object.defineProperty(newState, key, descriptor);
              }
            }

            Object.setPrototypeOf(newState, Object.getPrototypeOf(state));

            state = newState;
          } else {
            state = historyState;
          }

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
          const historyState = historyEntry.state;

          if (isImmerable(historyState) && isImmerable(state)) {
            const descriptors = Object.getOwnPropertyDescriptors(state);
            const newState = {} as T;

            Object.assign(newState as any, historyState);

            for (const key in descriptors) {
              const descriptor = descriptors[key];

              if (descriptor && descriptor.get) {
                Object.defineProperty(newState, key, descriptor);
              }
            }

            Object.setPrototypeOf(newState, Object.getPrototypeOf(state));

            state = newState;
          } else {
            state = historyState;
          }

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
            if (historyIndex < history.length - 1) {
              history = history.slice(0, historyIndex + 1);
            }

            const entry: HistoryEntry<T> = {
              state: cloneStateForHistory(state),
              timestamp: Date.now(),
            };
            if (txOptions?.name !== undefined) {
              entry.name = txOptions.name;
            }
            history.push(entry);

            // Keep maxHistorySize + 1 entries to allow maxHistorySize undo operations
            if (history.length > maxHistorySize + 1) {
              history = history.slice(-(maxHistorySize + 1));
            }

            historyIndex = history.length - 1;
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
      // Return only the most recent maxHistorySize entries for external consumption
      // (internally we keep one extra for undo operations)
      if (history.length > maxHistorySize) {
        return history.slice(-maxHistorySize);
      }
      return history;
    },
  };

  const tempState = {} as T;
  const initialResult = initializer(api.setState, api.getState, api);
  originalInitialResult = initialResult;

  if (isImmerable(initialResult)) {
    const descriptors = Object.getOwnPropertyDescriptors(initialResult);

    state = Object.create(Object.getPrototypeOf(initialResult));

    for (const key in descriptors) {
      const descriptor = descriptors[key];

      if (descriptor && (descriptor.get || descriptor.set)) {
        // Store getters for later re-application
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

  history.push({
    state: cloneStateForHistory(state),
    timestamp: Date.now(),
  });

  historyIndex = 0;

  return api;
};
