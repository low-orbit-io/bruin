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

const immerImpl: ImmerImpl = (initializer) => (set, get, api) => {
  const wrappedSet = ((partial: any, replace?: boolean) => {
    const nextState =
      typeof partial === 'function'
        ? (partial as (state: any) => any)((get as any)())
        : partial;
    return (set as any)(nextState, replace);
  }) as any;
  return initializer(wrappedSet, get, api);
};

export const immer = immerImpl as unknown as Immer;
