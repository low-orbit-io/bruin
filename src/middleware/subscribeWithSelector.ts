import type {
  StateCreator,
  StoreMutatorIdentifier,
} from '../vanilla';

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

type Write<T, U> = Omit<T, keyof U> & U;

type WithSelectorSubscribe<S> = S extends { getState: () => infer T }
  ? Write<S, StoreSubscribeWithSelector<T>>
  : never;

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'bruin/subscribeWithSelector': WithSelectorSubscribe<S> &
      Record<keyof A, never>;
  }
}

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

type SubscribeWithSelectorImpl = <T extends object>(
  storeInitializer: StateCreator<T, [], []>,
) => StateCreator<T, [], []>;

const subscribeWithSelectorImpl: SubscribeWithSelectorImpl =
  (fn) => (set, get, api) => {
    type S = ReturnType<typeof fn>;
    type Listener = (state: S, previousState: S) => void;

    const origSubscribe = api.subscribe as (
      listenerOrPath: Listener | (string | number)[],
      listenerArg?: (selectedState: any, previousSelectedState: any) => void,
    ) => () => void;

    api.subscribe = ((selector: any, optListener: any, options: any) => {
      if (Array.isArray(selector)) {
        return origSubscribe(selector, optListener);
      }

      let listener: Listener = selector;

      if (optListener) {
        const equalityFn = options?.equalityFn || Object.is;

        let currentSlice = selector(api.getState());

        listener = (state) => {
          const nextSlice = selector(state);

          if (!equalityFn(currentSlice, nextSlice)) {
            const previousSlice = currentSlice;

            optListener((currentSlice = nextSlice), previousSlice);
          }
        };

        if (options?.fireImmediately) {
          optListener(currentSlice, currentSlice);
        }
      }

      return origSubscribe(listener);
    }) as any;

    const initialState = fn(set, get, api);

    return initialState;
  };

export const subscribeWithSelector =
  subscribeWithSelectorImpl as unknown as SubscribeWithSelector;
