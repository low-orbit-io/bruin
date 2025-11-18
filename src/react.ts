import React from 'react';
import type {
  ExtractState,
  ExtractStateCreatorMutators,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from './types/core';
import type { ReadonlyStoreApi, UseBoundStore } from './types/react';
import { createStore as createVanillaStore } from './vanilla';

export type { ReadonlyStoreApi, UseBoundStore } from './types/react';

const identity = <T>(arg: T): T => arg;

export function useStore<S extends ReadonlyStoreApi<unknown>>(
  api: S,
): ExtractState<S>;

export function useStore<S extends ReadonlyStoreApi<unknown>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U,
): U;

export function useStore<TState, StateSlice>(
  api: ReadonlyStoreApi<TState>,
  selector: (state: TState) => StateSlice = identity as any,
) {
  const slice = React.useSyncExternalStore(
    api.subscribe,
    React.useCallback(() => selector(api.getState()), [api, selector]),
    React.useCallback(() => selector(api.getInitialState()), [api, selector]),
  );
  React.useDebugValue(slice);
  return slice;
}

const createImpl = <T, Mcs extends [StoreMutatorIdentifier, unknown][] = []>(
  createState: StateCreator<T, [], Mcs>,
) => {
  const api = createVanillaStore(createState);

  const useBoundStore: any = (selector?: any) => useStore(api, selector);

  Object.assign(useBoundStore, api);

  return useBoundStore as UseBoundStore<Mutate<StoreApi<T>, Mcs>>;
};

export function create<TCreator extends StateCreator<any, any[], any>>(
  initializer: TCreator,
): UseBoundStore<
  Mutate<
    StoreApi<
      TCreator extends StateCreator<infer T, any, any, infer U>
        ? U extends T
          ? T
          : U extends infer R
            ? R
            : never
        : TCreator extends (...args: any[]) => infer R
          ? R
          : never
    >,
    ExtractStateCreatorMutators<TCreator>
  >
>;
export function create<T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
  initializer: StateCreator<T, [], Mos>,
): UseBoundStore<Mutate<StoreApi<T>, Mos>>;
export function create<T>(): <
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>,
) => UseBoundStore<Mutate<StoreApi<T>, Mos>>;
export function create<T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
  initializer?: StateCreator<T, [], Mos>,
): any {
  if (!initializer) {
    return <Mos2 extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer2: StateCreator<T, [], Mos2>,
    ) => createImpl<T, Mos2>(initializer2);
  }
  // Check if this is a StateCreator with middleware (has $$storeMutators)
  // If so, extract the return type and mutators
  const mutators = (initializer as any).$$storeMutators;
  if (mutators) {
    // This is a middleware-wrapped StateCreator, use ReturnType to extract T
    return createImpl<ReturnType<typeof initializer>, typeof mutators>(
      initializer as StateCreator<
        ReturnType<typeof initializer>,
        [],
        typeof mutators
      >,
    );
  }
  return createImpl<T, Mos>(initializer);
}

export { createStore } from './vanilla';
export type { StoreApi } from './vanilla';
