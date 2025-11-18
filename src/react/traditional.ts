import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { UseBoundStore } from '../react';
import type { ExtractState, StateCreator, StoreApi } from '../vanilla';
import { createStore as createVanillaStore } from '../vanilla';

type ReadonlyStoreApi<T> = Pick<
  StoreApi<T>,
  'getState' | 'getInitialState' | 'subscribe'
>;

const identity = <T>(arg: T): T => arg;

export function useStoreWithEqualityFn<S extends ReadonlyStoreApi<unknown>>(
  api: S,
): ExtractState<S>;

export function useStoreWithEqualityFn<S extends ReadonlyStoreApi<unknown>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U,
): U;

export function useStoreWithEqualityFn<S extends ReadonlyStoreApi<unknown>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U,
  equalityFn: (a: U, b: U) => boolean,
): U;

export function useStoreWithEqualityFn<TState, StateSlice>(
  api: ReadonlyStoreApi<TState>,
  selector: (state: TState) => StateSlice = identity as any,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean,
) {
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getInitialState,
    selector,
    equalityFn,
  );
  return slice;
}

const createWithEqualityFnImpl = <T>(createState: StateCreator<T>) => {
  const api = createVanillaStore(createState);

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStoreWithEqualityFn(api, selector, equalityFn);

  Object.assign(useBoundStore, api);

  return useBoundStore;
};

export const createWithEqualityFn = <T>(
  createState: StateCreator<T>,
): UseBoundStore<StoreApi<T>> => {
  return createWithEqualityFnImpl(createState);
};
