import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../types/core';
import type { Write } from '../types/middleware';

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

type WithSelectorSubscribe<S> = S extends { getState: () => infer T }
  ? Write<S, StoreSubscribeWithSelector<T>>
  : never;

declare module '../types/core' {
  interface StoreMutators<S, A> {
    'bruin/subscribeWithSelector': WithSelectorSubscribe<S> &
      Record<keyof A, never>;
  }
}

type SubscribeFn<T> = StoreApi<T>['subscribe'] & {
  <U>(
    selector: (state: T) => U,
    listener: (selectedState: U, previousSelectedState: U) => void,
    options?: {
      equalityFn?: (a: U, b: U) => boolean;
      fireImmediately?: boolean;
    },
  ): () => void;
};

type StoreSubscribeWithSelector<T> = {
  subscribe: SubscribeFn<T>;
};

type SubscribeWithSelectorImpl = <T extends object>(
  storeInitializer: StateCreator<T, [], []>,
) => StateCreator<T, [], [['bruin/subscribeWithSelector', never]]>;

const subscribeWithSelectorImpl: SubscribeWithSelectorImpl = (fn) => {
  const creator = (
    set: Parameters<typeof fn>[0],
    get: Parameters<typeof fn>[1],
    api: Parameters<typeof fn>[2],
  ) => {
    type S = ReturnType<typeof fn>;
    type Listener = (state: S, previousState: S) => void;
    const origSubscribe = api.subscribe.bind(api) as StoreApi<S>['subscribe'];
    const baseSubscribe = origSubscribe as unknown as (
      listenerOrPath: Listener | (string | number)[],
      listenerArg?: Listener,
    ) => () => void;

    api.subscribe = ((
      listenerOrSelector: any,
      listener?: any,
      options?: any,
    ) => {
      if (Array.isArray(listenerOrSelector)) {
        return baseSubscribe(listenerOrSelector, listener);
      }

      if (listener) {
        const selector = listenerOrSelector;
        const equalityFn = options?.equalityFn || Object.is;
        let currentSlice = selector(api.getState());

        const handler = listener as (
          selectedState: unknown,
          previousSelectedState: unknown,
        ) => void;

        const selectorListener: Listener = (state) => {
          const nextSlice = selector(state);

          if (!equalityFn(currentSlice, nextSlice)) {
            const previousSlice = currentSlice;
            handler((currentSlice = nextSlice), previousSlice);
          }
        };

        if (options?.fireImmediately) {
          handler(currentSlice, currentSlice);
        }

        return baseSubscribe(selectorListener);
      }

      return baseSubscribe(listenerOrSelector as Listener);
    }) as StoreSubscribeWithSelector<S>['subscribe'];

    return fn(set, get, api);
  };
  (creator as any).$$storeMutators = [
    ['bruin/subscribeWithSelector', undefined],
  ] as const;
  return creator as StateCreator<
    ReturnType<typeof fn>,
    [],
    [['bruin/subscribeWithSelector', never]]
  >;
};

export const subscribeWithSelector =
  subscribeWithSelectorImpl as unknown as SubscribeWithSelector;
