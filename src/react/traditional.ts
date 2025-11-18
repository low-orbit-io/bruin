import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { UseBoundStore } from '../react';
import type {
  ExtractState,
  ExtractStateCreatorMutators,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../vanilla';
import { createStore as createVanillaStore } from '../vanilla';

type ReadonlyStoreApi<T> = {
  getState: StoreApi<T>['getState'];
  getInitialState: StoreApi<T>['getInitialState'];
  subscribe: (...args: any[]) => () => void;
};

type UseBoundStoreWithEqualityFn<S extends ReadonlyStoreApi<unknown>> = {
  (): ExtractState<S>;
  <U>(
    selector: (state: ExtractState<S>) => U,
    equalityFn?: (a: U, b: U) => boolean,
  ): U;
} & S;

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

const createWithEqualityFnImpl = <
  T,
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  createState: StateCreator<T, [], Mcs>,
) => {
  const api = createVanillaStore(createState);

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStoreWithEqualityFn(api, selector, equalityFn);

  Object.assign(useBoundStore, api);

  return useBoundStore as UseBoundStoreWithEqualityFn<
    Mutate<StoreApi<T>, Mcs>
  >;
};

export function createWithEqualityFn<
  TCreator extends StateCreator<any, [], any>,
>(
  createState: TCreator,
): UseBoundStoreWithEqualityFn<
  Mutate<
    StoreApi<ReturnType<TCreator>>,
    ExtractStateCreatorMutators<TCreator>
  >
>;
export function createWithEqualityFn<
  T,
  TCreator extends StateCreator<T, [], any> = StateCreator<T, [], any>,
>(
  createState: TCreator,
): UseBoundStoreWithEqualityFn<
  Mutate<StoreApi<T>, ExtractStateCreatorMutators<TCreator>>
>;
export function createWithEqualityFn<
  T,
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(createState: StateCreator<T, [], Mcs>) {
  return createWithEqualityFnImpl<T, Mcs>(createState);
}
