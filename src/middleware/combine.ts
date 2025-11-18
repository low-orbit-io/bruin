import type { StateCreator, StoreMutatorIdentifier } from '../vanilla';

type Write<T, U> = Omit<T, keyof U> & U;

export function combine<
  T extends object,
  U extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initialState: T,
  create: StateCreator<T, Mps, Mcs, U>,
): StateCreator<Write<T, U>, Mps, Mcs> {
  const additionalCreator = create as StateCreator<T, Mps, Mcs, U>;
  return ((set, get, api) =>
    Object.assign(
      {},
      initialState,
      additionalCreator(set as any, get as any, api as any),
    )) as StateCreator<Write<T, U>, Mps, Mcs>;
}
