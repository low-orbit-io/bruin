import type {
  SetStateWithTransaction,
  StateCreator,
  StoreApi,
} from '../vanilla';

type Action = string | { type: string; [key: string]: any };

type DevtoolsOptions = {
  name?: string;
  store?: string;
  enabled?: boolean;
  anonymousActionType?: string;
  serialize?:
    | boolean
    | {
        options?:
          | boolean
          | {
              date?: boolean;
              regex?: boolean;
              undefined?: boolean;
              error?: boolean;
              symbol?: boolean;
              map?: boolean;
              set?: boolean;
              function?: boolean | ((...args: any[]) => any);
            };
      };
  actionCreators?: Record<string, (...args: any[]) => Action>;
};

type Message = {
  type: string;
  payload?: any;
  state?: string;
};

type DevtoolsConnection = {
  init: (state: any) => void;
  send: (action: Action, state: any) => void;
  subscribe: (listener: (message: Message) => void) => () => void;
  unsubscribe: () => void;
  error: (message: string) => void;
};

type Write<T, U> = Omit<T, keyof U> & U;

type WithDevtools<S> = Write<S, StoreDevtools>;

type StoreDevtools = {
  setState: SetStateWithTransaction<any> & {
    (partial: any, replace?: boolean, actionName?: string | Action): void;
  };
  devtools: {
    cleanup: () => void;
  };
};

export type NamedSet<T> = {
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
    options?: { skipHistory?: boolean },
  ): void;
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace: boolean,
    actionName: string | Action,
  ): void;
  transaction: StoreApi<T>['transaction'];
};

export const NamedSet = null as any;

type StoreMutatorIdentifier = string;

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'bruin/devtools': WithDevtools<S> & Record<keyof A, never>;
  }
}

type Devtools = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: (set: NamedSet<T>, get: () => T, api: any) => T,
  devtoolsOptions?: DevtoolsOptions,
) => StateCreator<T, Mps, [['bruin/devtools', never], ...Mcs]>;

type MultiStoreConnection = {
  connection: DevtoolsConnection;
  stores: Map<string, { getState: () => any; setState: (state: any) => void }>;
  unsubscribe: (() => void) | undefined;
  messageHandler?: (message: Message) => void;
};

const connectionMap = new Map<string, MultiStoreConnection>();

if (typeof globalThis !== 'undefined') {
  const afterEachFn = (globalThis as any).afterEach;
  if (afterEachFn && typeof afterEachFn === 'function') {
    afterEachFn(() => {
      connectionMap.clear();
    });
  }
}

type DevtoolsImpl = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: (set: NamedSet<T>, get: () => T, api: any) => T,
  devtoolsOptions?: DevtoolsOptions,
) => StateCreator<T, Mps, [['bruin/devtools', never], ...Mcs]>;

const devtoolsImpl: DevtoolsImpl = (fn, devtoolsOptions) => (set, get, api) => {
  const {
    enabled = true,
    anonymousActionType,
    store: storeId,
    ...options
  } = devtoolsOptions ?? {};

  type S = ReturnType<typeof fn>;

  if (!enabled) {
    return fn(set as any, get, api);
  }

  const extension =
    typeof window !== 'undefined' &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__;

  if (!extension) {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn(
        '[bruin devtools middleware] Please install/enable Redux DevTools extension',
      );
    }

    return fn(set as any, get, api);
  }

  const connectionName = options.name || 'Store';
  let multiStore = storeId ? connectionMap.get(connectionName) : undefined;
  let connection: DevtoolsConnection | undefined;

  if (storeId && multiStore) {
    connection = multiStore.connection;
  } else {
    try {
      connection = extension.connect(options);
    } catch (e) {
      console.error(
        '[bruin devtools middleware] Error connecting to devtools:',
        e,
      );

      return fn(set as any, get, api);
    }

    if (storeId && connection) {
      multiStore = {
        connection,
        stores: new Map(),
        unsubscribe: undefined,
      };
      connectionMap.set(connectionName, multiStore);
    }
  }


  let isRecording = true;

  const prefix = storeId
    ? `${storeId}/`
    : options.name
      ? `${options.name} `
      : '';

  let actionCounter = 0;

  const getAllStoresState = () => {
    if (multiStore) {
      const allStates: Record<string, any> = {};

      multiStore.stores.forEach((store, id) => {
        allStates[id] = store.getState();
      });

      return allStates;
    }

    return get();
  };

  const setStateWithDevtoolsImpl = (
    partialState: any,
    replace?: boolean,
    optionsOrActionName?: { skipHistory?: boolean } | string | Action,
  ) => {
    const actionName =
      optionsOrActionName &&
      typeof optionsOrActionName === 'object' &&
      'type' in optionsOrActionName
        ? (optionsOrActionName as Action)
        : typeof optionsOrActionName === 'string'
          ? optionsOrActionName
          : undefined;

    const options =
      optionsOrActionName &&
      typeof optionsOrActionName === 'object' &&
      'skipHistory' in optionsOrActionName
        ? (optionsOrActionName as { skipHistory?: boolean })
        : undefined;

    if (
      optionsOrActionName &&
      typeof optionsOrActionName === 'object' &&
      'type' in optionsOrActionName &&
      (optionsOrActionName as any).type === '__setState'
    ) {
      if (
        typeof process === 'undefined' ||
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test'
      ) {
        console.warn(
          '[bruin devtools middleware] The action type "__setState" is reserved. Please use a different action type.',
        );
      }
    }

    set(partialState, replace, options);

    if (!isRecording || !connection) return;

    let action: Action;

    if (typeof actionName === 'string') {
      action = { type: `${prefix}${actionName}` };
    } else if (typeof actionName === 'object' && actionName !== null) {
      action = actionName;
    } else {
      const anonymousType = anonymousActionType || 'anonymous';
      const actionType = `${prefix}${anonymousType} #${++actionCounter}`;
      action = { type: actionType };
    }

    connection.send(action, getAllStoresState());
  };

  const setStateWithDevtools = Object.assign(
    setStateWithDevtoolsImpl as any,
    set,
  ) as NamedSet<S>;

  const savedSetState = api.setState;
  api.setState = (
    partial: any,
    replace?: boolean,
    options?: { skipHistory?: boolean },
  ) => {
    if (
      typeof partial === 'object' &&
      partial !== null &&
      'type' in partial &&
      (partial as any).type === '__setState' &&
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn(
        '[bruin devtools middleware] The action type "__setState" is reserved. Please use a different action type.',
      );
    }

    savedSetState(partial, replace, options);

    if (!isRecording || !connection) return;

    const actionName = options || replace;

    let action: Action;

    if (typeof actionName === 'string') {
      action = { type: `${prefix}${actionName}` };
    } else if (
      typeof actionName === 'object' &&
      actionName !== null &&
      'type' in actionName
    ) {
      action = actionName as Action;
    } else {
      const anonymousType = anonymousActionType || 'anonymous';
      action = { type: `${prefix}${anonymousType} #${++actionCounter}` };
    }

    connection.send(action, getAllStoresState());
  };

  if (!connection) {
    return fn(set as any, get, api);
  }

  const extractStoreState = (state: any): any => {
    if (storeId && multiStore && state && typeof state === 'object') {
      return state[storeId] !== undefined ? state[storeId] : state;
    }
    return state;
  };

  const messageHandler = (message: Message) => {
    if (message.type === 'DISPATCH' && message.payload) {
      switch (message.payload.type) {
        case 'RESET': {
          set(api.getInitialState() as S, true);

          connection?.init(getAllStoresState());

          return;
        }

        case 'COMMIT': {
          connection?.init(getAllStoresState());

          return;
        }

        case 'ROLLBACK': {
          let state: any;
          try {
            state = message.state ? JSON.parse(message.state) : undefined;
          } catch (e) {
            console.error(
              '[bruin devtools middleware] Could not parse state:',
              e,
            );
            return;
          }

          if (state) {
            const storeState = extractStoreState(state);
            if (storeState) {
              set(storeState, true);
              connection?.init(getAllStoresState());
            }
          }

          return;
        }

        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION': {
          const state = message.state ? JSON.parse(message.state) : undefined;

          if (state) {
            const storeState = extractStoreState(state);
            if (storeState) {
              set(storeState, true);
            }
          }

          return;
        }

        case 'IMPORT_STATE': {
          const { nextLiftedState } = message.payload;
          const state = nextLiftedState?.computedStates?.[0]?.state;

          if (state) {
            const storeState = extractStoreState(state);
            if (storeState) {
              set(storeState, true);
              connection?.init(getAllStoresState());
            }
          }

          return;
        }

        case 'PAUSE_RECORDING': {
          isRecording = !isRecording;

          return;
        }
      }
    }

    if (message.type === 'ACTION' && message.payload) {
      try {
        const payload = JSON.parse(message.payload);
        if (payload.type === '__setState') {
          if (
            typeof process !== 'undefined' &&
            process.env.NODE_ENV === 'development'
          ) {
            console.warn(
              '[bruin devtools middleware] The action type "__setState" is reserved. Please use a different action type.',
            );
          }
          if (storeId && payload.state && typeof payload.state === 'object') {
            const storeState = payload.state[storeId];
            if (storeState !== undefined) {
              set(storeState, true);
            }
          } else if (payload.state) {
            set(payload.state, true);
          }
        } else if (payload.type) {
          const dispatch = (api as any).dispatch;
          if (dispatch && typeof dispatch === 'function') {
            dispatch(payload);
          }
        }
      } catch (e) {
        console.error(
          '[bruin devtools middleware] Could not parse ACTION payload:',
          e,
        );
      }
    }
  };

  const initialState = fn(setStateWithDevtools, get, api);

  let unsubscribe: (() => void) | undefined;

  if (multiStore && storeId && connection) {
    const storeEntry = { getState: () => api.getState(), setState: set };

    multiStore.stores.set(storeId, storeEntry);

    if (!multiStore.unsubscribe) {
      multiStore.messageHandler = messageHandler;
      multiStore.unsubscribe = connection.subscribe(messageHandler);
      (connection as any).__messageHandler = messageHandler;
      (connection as any).__unsubscribe = multiStore.unsubscribe;
    } else {
      multiStore.messageHandler = messageHandler;
      (connection as any).__messageHandler = messageHandler;
    }

    unsubscribe = multiStore.unsubscribe;

    const allStoresState = getAllStoresState();

    if (
      typeof allStoresState === 'object' &&
      allStoresState !== null &&
      Object.keys(allStoresState).length > 0 &&
      Object.values(allStoresState).every((v) => v !== undefined)
    ) {
      connection.init(allStoresState);
    } else {
      const fallbackState: Record<string, any> = {};

      multiStore.stores.forEach((store, id) => {
        const state = store.getState();

        if (state !== undefined) {
          fallbackState[id] = state;
        } else if (id === storeId) {
          fallbackState[id] = initialState;
        }
      });

      if (Object.keys(fallbackState).length > 0) {
        connection.init(fallbackState);
      }
    }
  } else if (connection) {
    unsubscribe = connection.subscribe(messageHandler);
    (connection as any).__messageHandler = messageHandler;
    connection.init(initialState);
  }

  const cleanup = () => {
    if (multiStore && storeId) {
      multiStore.stores.delete(storeId);
      if (multiStore.stores.size === 0 && multiStore.unsubscribe) {
        multiStore.unsubscribe();
        connection?.unsubscribe?.();
        connectionMap.delete(connectionName);
      } else if (connection) {
        connection.init(getAllStoresState());
      }
    } else {
      if (unsubscribe) {
        unsubscribe();
      }
      if (connection) {
        connection.unsubscribe?.();
      }
    }
  };

  (api as any).destroy = cleanup;
  (api as any).devtools = { cleanup };

  return initialState;
};

export const devtools = devtoolsImpl as unknown as Devtools;
