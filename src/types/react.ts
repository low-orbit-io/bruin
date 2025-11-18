import type { ExtractState, StoreApi } from './core';

export type ReadonlyStoreApi<T> = {
  getState: StoreApi<T>['getState'];
  getInitialState: StoreApi<T>['getInitialState'];
  subscribe: (...args: any[]) => () => void;
};

export type UseBoundStore<S extends ReadonlyStoreApi<unknown>> = {
  (): ExtractState<S>;
  <U>(selector: (state: ExtractState<S>) => U): U;
} & S;

export type UseBoundStoreWithEqualityFn<S extends ReadonlyStoreApi<unknown>> = {
  (): ExtractState<S>;
  <U>(
    selector: (state: ExtractState<S>) => U,
    equalityFn?: (a: U, b: U) => boolean,
  ): U;
} & S;
