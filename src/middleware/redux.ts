import type { StateCreator, StoreApi } from '../vanilla';

type Action = {
  type: string;
  [key: string]: any;
};

type Write<T, U> = Omit<T, keyof U> & U;

type StoreRedux<A extends Action> = {
  dispatch: (action: A) => A;
  dispatchFromDevtools?: boolean;
};

type WithRedux<S, A extends Action> = Write<S, StoreRedux<A>>;

type StoreMutatorIdentifier = string;

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'bruin/redux': WithRedux<S, A extends Action ? A : never>;
  }
}

type Redux = <
  T,
  A extends Action,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  reducer: (state: T, action: A) => T,
  initialState: T,
) => StateCreator<WithRedux<T, A>, Mps, Mcs>;

type ReduxImpl = <T, A extends Action>(
  reducer: (state: T, action: A) => T,
  initialState: T,
) => StateCreator<WithRedux<T, A>, [], []>;

const reduxImpl: ReduxImpl = (reducer, initial) => (set, _get, api) => {
  (api as StoreApi<any> & StoreRedux<any>).dispatch = (action: Action) => {
    set((state: any) => {
      const baseState = state as Parameters<typeof reducer>[0];
      const newState = reducer(
        baseState,
        action as Parameters<typeof reducer>[1],
      );
      return { ...newState, dispatch: state.dispatch };
    }, false);
    return action;
  };

  (api as StoreApi<any> & StoreRedux<any>).dispatchFromDevtools = true;

  return Object.assign({}, initial, {
    dispatch: (action: Action) =>
      (api as StoreApi<any> & StoreRedux<any>).dispatch(action),
  }) as any;
};

export const redux = reduxImpl as unknown as Redux;
