import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type {
  ExtractState,
  ExtractStateCreatorMutators,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../types/core';
import type {
  ReadonlyStoreApi,
  UseBoundStoreWithEqualityFn,
} from '../types/react';
import { createStore as createVanillaStore } from '../vanilla';

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
    useStoreWithEqualityFn(api as any, selector, equalityFn);

  Object.assign(useBoundStore, api);

  return useBoundStore as any as UseBoundStoreWithEqualityFn<
    Mutate<StoreApi<T>, Mcs>
  >;
};

type CreateWithEqualityFn = {
  <TCreator extends StateCreator<any, [], any>>(
    createState: TCreator,
  ): UseBoundStoreWithEqualityFn<
    Mutate<StoreApi<ReturnType<TCreator>>, ExtractStateCreatorMutators<TCreator>>
  >;
  <T, TCreator extends StateCreator<T, [], any> = StateCreator<T, [], any>>(
    createState: TCreator,
  ): UseBoundStoreWithEqualityFn<
    Mutate<StoreApi<T>, ExtractStateCreatorMutators<TCreator>>
  >;
};

export const createWithEqualityFn = (<
  T,
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(createState: StateCreator<T, [], Mcs>) => {
  return createWithEqualityFnImpl<T, Mcs>(createState);
}) as CreateWithEqualityFn;
