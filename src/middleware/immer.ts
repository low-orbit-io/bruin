import type { StateCreator, StoreMutatorIdentifier } from '../types/core';

type Immer = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, Mps, Mcs>,
) => StateCreator<T, Mps, [['bruin/immer', never], ...Mcs]>;

type ImmerImpl = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, Mps, Mcs>,
) => StateCreator<T, Mps, [['bruin/immer', never], ...Mcs]>;

declare module '../types/core' {
  interface StoreMutators<S, A> {
    'bruin/immer': {
      state: S;
    };
  }
}

const immerImpl: ImmerImpl = (initializer) => (set, get, api) =>
  initializer(
    (partial, replace) => {
      const nextState =
        typeof partial === 'function'
          ? (partial as (state: typeof api.getState) => typeof api.getState)(
              api.getState(),
            )
          : partial;
      return set(nextState, replace);
    },
    get,
    api,
  );

export const immer = immerImpl as unknown as Immer;

