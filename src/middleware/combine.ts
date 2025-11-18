import type { StateCreator } from '../vanilla';

type Write<T, U> = Omit<T, keyof U> & U;

export function combine<T extends object, U extends object>(
  initialState: T,
  create: StateCreator<Write<T, U>>,
): StateCreator<Write<T, U>> {
  return (...args) => Object.assign({}, initialState, create(...args));
}
