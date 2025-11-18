import type { StateCreator } from '../vanilla';

type Write<T, U> = Omit<T, keyof U> & U;

type WithSelectorSubscribe<S> = S extends { getState: () => infer T }
  ? Write<S, StoreSubscribeWithSelector<T>>
  : never;

type StoreSubscribeWithSelector<T> = {
  subscribe: {
    (
      listener: (selectedState: T, previousSelectedState: T) => void,
    ): () => void;
    <U>(
      selector: (state: T) => U,
      listener: (selectedState: U, previousSelectedState: U) => void,
      options?: {
        equalityFn?: (a: U, b: U) => boolean;
        fireImmediately?: boolean;
      },
    ): () => void;
  };
};

type StoreMutatorIdentifier = string;

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'bruin/subscribeWithSelector': WithSelectorSubscribe<S> &
      Record<keyof A, never>;
  }
}

type SubscribeWithSelector = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<
    T,
    [...Mps, ['bruin/subscribeWithSelector', never]],
    Mcs
  >,
) => StateCreator<T, Mps, [['bruin/subscribeWithSelector', never], ...Mcs]>;

type SubscribeWithSelectorImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
) => StateCreator<T, [], []>;

const subscribeWithSelectorImpl: SubscribeWithSelectorImpl =
  (fn) => (set, get, api) => {
    type S = ReturnType<typeof fn>;
    type Listener = (state: S, previousState: S) => void;

    const origSubscribe = api.subscribe;

    (api as any).subscribe = ((
      listenerOrPath: Listener | ((state: S) => any) | (string | number)[],
      maybeListener?: (selectedState: any, previousSelectedState: any) => void,
      options?: {
        equalityFn?: (a: any, b: any) => boolean;
        fireImmediately?: boolean;
      },
    ) => {
      if (Array.isArray(listenerOrPath)) {
        return origSubscribe(listenerOrPath, maybeListener);
      }

      if (maybeListener === undefined) {
        return origSubscribe(listenerOrPath as Listener);
      }

      const selector = listenerOrPath as (state: S) => any;
      const listener = maybeListener;
      const equalityFn = options?.equalityFn || Object.is;

      let currentSlice = selector(get());

      if (options?.fireImmediately) {
        listener(currentSlice, currentSlice);
      }

      const listenerWrapper: Listener = (state, _previousState) => {
        const nextSlice = selector(state);

        if (!equalityFn(currentSlice, nextSlice)) {
          const previousSlice = currentSlice;
          currentSlice = nextSlice;
          listener(nextSlice, previousSlice);
        }
      };

      return origSubscribe(listenerWrapper);
    }) as StoreSubscribeWithSelector<S>['subscribe'];

    return fn(set, get, api);
  };

export const subscribeWithSelector =
  subscribeWithSelectorImpl as unknown as SubscribeWithSelector;
