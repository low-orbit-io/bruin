import type { StateCreator, StoreMutatorIdentifier } from '../types/core';
import type { NamedSet, Write } from '../types/middleware';

type Action = { type: string };

type StoreRedux<A> = {
  dispatch: (a: A) => A;
  dispatchFromDevtools: true;
};

type ReduxState<A> = {
  dispatch: StoreRedux<A>['dispatch'];
};

type WithRedux<S, A> = Write<S, StoreRedux<A>>;

type Redux = <
  T,
  A extends Action,
  Cms extends [StoreMutatorIdentifier, unknown][] = [],
>(
  reducer: (state: T, action: A) => T,
  initialState: T,
) => StateCreator<Write<T, ReduxState<A>>, Cms, [['bruin/redux', A]]>;

declare module '../types/core' {
  interface StoreMutators<S, A> {
    'bruin/redux': WithRedux<S, A>;
  }
}

type ReduxImpl = <T, A extends Action>(
  reducer: (state: T, action: A) => T,
  initialState: T,
) => StateCreator<T & ReduxState<A>, [], []>;

const reduxImpl: ReduxImpl = (reducer, initial) => (set, _get, api) => {
  type S = typeof initial;
  type A = Parameters<typeof reducer>[1];

  (api as any).dispatch = (action: A) => {
    (set as NamedSet<S>)((state: S) => reducer(state, action), false, action);
    return action;
  };

  (api as any).dispatchFromDevtools = true;

  return { dispatch: (...args) => (api as any).dispatch(...args), ...initial };
};

export const redux = reduxImpl as unknown as Redux;
