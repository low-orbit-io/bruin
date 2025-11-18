import type { StateCreator, StoreApi } from '../vanilla.ts'

type Write<T, U> = Omit<T, keyof U> & U

type WithSelectorSubscribe<S> = S extends { getState: () => infer T }
  ? Write<S, StoreSubscribeWithSelector<T>>
  : never

type StoreSubscribeWithSelector<T> = {
  subscribe: {
    (listener: (selectedState: T, previousSelectedState: T) => void): () => void
    <U>(
      selector: (state: T) => U,
      listener: (selectedState: U, previousSelectedState: U) => void,
      options?: {
        equalityFn?: (a: U, b: U) => boolean
        fireImmediately?: boolean
      },
    ): () => void
  }
}

type StoreMutatorIdentifier = string

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'bruin/subscribeWithSelector': WithSelectorSubscribe<S>
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
) => StateCreator<T, Mps, [['bruin/subscribeWithSelector', never], ...Mcs]>

type SubscribeWithSelectorImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
) => StateCreator<T, [], []>

const subscribeWithSelectorImpl: SubscribeWithSelectorImpl =
  (fn) => (set, get, api) => {
    type S = ReturnType<typeof fn>
    type Listener = (state: S, previousState: S) => void

    // Save the original subscribe function
    const origSubscribe = api.subscribe as (listener: Listener) => () => void

    // Replace api.subscribe with enhanced version
    api.subscribe = ((
      listenerOrSelector: Listener | ((state: S) => any),
      maybeListener?: (selectedState: any, previousSelectedState: any) => void,
      options?: {
        equalityFn?: (a: any, b: any) => boolean
        fireImmediately?: boolean
      },
    ) => {
      // Case 1: Basic subscription without selector (first overload)
      if (maybeListener === undefined) {
        return origSubscribe(listenerOrSelector as Listener)
      }

      // Case 2: Subscription with selector (second overload)
      const selector = listenerOrSelector as (state: S) => any
      const listener = maybeListener
      const equalityFn = options?.equalityFn || Object.is

      // Get initial selected state
      let currentSlice = selector(get())

      // Fire immediately if requested
      if (options?.fireImmediately) {
        listener(currentSlice, currentSlice)
      }

      // Create wrapper listener that only fires when selected state changes
      const listenerWrapper: Listener = (state, previousState) => {
        const nextSlice = selector(state)

        // Only notify if the selected slice has changed according to equalityFn
        if (!equalityFn(currentSlice, nextSlice)) {
          const previousSlice = currentSlice
          currentSlice = nextSlice
          listener(nextSlice, previousSlice)
        }
      }

      // Subscribe with the wrapper
      return origSubscribe(listenerWrapper)
    }) as StoreSubscribeWithSelector<S>['subscribe']

    return fn(set, get, api)
  }

export const subscribeWithSelector =
  subscribeWithSelectorImpl as unknown as SubscribeWithSelector
