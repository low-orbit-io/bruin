import type { StateCreator } from '../vanilla';

type Action = string | { type: string; [key: string]: any };

type DevtoolsOptions = {
  name?: string;
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
  setState: {
    (...args: any[]): any;
  };
};

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
  initializer: StateCreator<T, [...Mps, ['bruin/devtools', never]], Mcs>,
  devtoolsOptions?: DevtoolsOptions,
) => StateCreator<T, Mps, [['bruin/devtools', never], ...Mcs]>;

type DevtoolsImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  devtoolsOptions?: DevtoolsOptions,
) => StateCreator<T, [], []>;

const devtoolsImpl: DevtoolsImpl = (fn, devtoolsOptions) => (set, get, api) => {
  const {
    enabled = true,
    anonymousActionType,
    ...options
  } = devtoolsOptions ?? {};

  type S = ReturnType<typeof fn>;

  if (!enabled) {
    return fn(set, get, api);
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

    return fn(set, get, api);
  }

  let connection: DevtoolsConnection | undefined;

  try {
    connection = extension.connect(options);
  } catch (e) {
    console.error(
      '[bruin devtools middleware] Error connecting to devtools:',
      e,
    );

    return fn(set, get, api);
  }

  let isRecording = true;

  const prefix = options.name ? `${options.name} ` : '';

  let actionCounter = 0;

  const setStateWithDevtools: typeof set = (...args) => {
    const [partialState, replace, optionsOrActionName] = args as [
      any,
      boolean | undefined,
      { skipHistory?: boolean } | Action | undefined,
    ];

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

    set(partialState, replace, options);

    if (!isRecording || !connection) return;

    let action: Action;

    if (typeof actionName === 'string') {
      action = { type: `${prefix}${actionName}` };
    } else if (typeof actionName === 'object' && actionName !== null) {
      action = actionName;
    } else {
      const anonymousType = anonymousActionType || 'anonymous';
      action = { type: `${prefix}${anonymousType} #${++actionCounter}` };
    }

    connection.send(action, get());
  };

  const savedSetState = api.setState;
  api.setState = (
    partial: any,
    replace?: boolean,
    options?: { skipHistory?: boolean },
  ) => {
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

    connection.send(action, get());
  };

  if (!connection) {
    return fn(set, get, api);
  }

  const unsubscribe = connection.subscribe((message: Message) => {
    if (message.type === 'DISPATCH' && message.payload) {
      switch (message.payload.type) {
        case 'RESET': {
          set(api.getInitialState() as S, true);

          connection?.init(get());

          return;
        }

        case 'COMMIT': {
          connection?.init(get());

          return;
        }

        case 'ROLLBACK': {
          const state = message.state ? JSON.parse(message.state) : undefined;

          if (state) {
            set(state, true);
            connection?.init(get());
          }

          return;
        }

        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION': {
          const state = message.state ? JSON.parse(message.state) : undefined;

          if (state) {
            set(state, true);
          }

          return;
        }

        case 'IMPORT_STATE': {
          const { nextLiftedState } = message.payload;
          const state = nextLiftedState?.computedStates?.[0]?.state;

          if (state) {
            set(state, true);
            connection?.init(get());
          }

          return;
        }

        case 'PAUSE_RECORDING': {
          isRecording = !isRecording;

          return;
        }
      }
    }
  });

  (api as any).destroy = () => {
    unsubscribe?.();
    connection?.unsubscribe?.();
  };

  const initialState = fn(setStateWithDevtools, get, api);

  connection.init(initialState);

  return initialState;
};

export const devtools = devtoolsImpl as unknown as Devtools;
