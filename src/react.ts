import React from 'react';
import { createStore as createVanillaStore } from './vanilla';
import type {
  ExtractState,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from './vanilla';

type ReadonlyStoreApi<T> = {
  getState: StoreApi<T>['getState'];
  getInitialState: StoreApi<T>['getInitialState'];
  subscribe: (...args: any[]) => () => void;
};

export type UseBoundStore<S extends ReadonlyStoreApi<unknown>> = {
  (): ExtractState<S>;
  <U>(selector: (state: ExtractState<S>) => U): U;
} & S;

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

const createImpl = <
  T,
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  createState: StateCreator<T, [], Mcs>,
) => {
  const api = createVanillaStore(createState);

  const useBoundStore: any = (selector?: any) => useStore(api, selector);

  Object.assign(useBoundStore, api);

  return useBoundStore as UseBoundStore<Mutate<StoreApi<T>, Mcs>>;
};

export function create<
  T,
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(createState: StateCreator<T, [], Mcs>): UseBoundStore<Mutate<StoreApi<T>, Mcs>>;
export function create<
  T,
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(createState: StateCreator<T, [], Mcs>) {
  return createImpl<T, Mcs>(createState);
}

export { createStore } from './vanilla';
export type { StoreApi } from './vanilla';
