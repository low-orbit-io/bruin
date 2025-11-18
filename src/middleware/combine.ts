import type { StateCreator } from '../vanilla.ts'

type Write<T, U> = Omit<T, keyof U> & U
type StoreMutatorIdentifier = string

/**
 * Combine middleware for separating initial state from actions
 *
 * Provides better type inference and cleaner separation between
 * state data and action methods.
 *
 * @example
 * ```ts
 * const store = createStore(
 *   combine(
 *     { count: 0 },
 *     (set) => ({
 *       inc: () => set((s) => ({ count: s.count + 1 }))
 *     })
 *   )
 * )
 * ```
 *
 * @param initialState - The initial state object
 * @param create - State creator function that returns actions
 * @returns Combined state creator
 */
export function combine<
  T extends object,
  U extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initialState: T,
  create: StateCreator<T, Mps, Mcs, U>,
): StateCreator<Write<T, U>, Mps, Mcs> {
  return (...args) => Object.assign({}, initialState, (create as any)(...args))
}
