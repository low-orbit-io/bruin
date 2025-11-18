import { describe, expect, it, vi } from 'vitest'

/**
 * Vanilla combine Middleware Tests
 *
 * The combine middleware provides syntactic sugar for separating
 * initial state from action creators, improving type inference.
 *
 * Key features tested:
 * - Basic state + actions combination
 * - Type inference for state and actions
 * - Works with createStore
 * - Works with React create
 * - Can be composed with other middlewares
 */

describe('Vanilla combine Middleware', () => {
  it('should be defined', async () => {
    const { combine } = await import('../../src/middleware/combine')
    expect(combine).toBeDefined()
    expect(typeof combine).toBe('function')
  })

  it('combines initial state with actions (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine(
        { count: 0, text: 'hello' },
        (set) => ({
          inc: () => set((s) => ({ count: s.count + 1 })),
          setText: (text: string) => set({ text }),
        }),
      ),
    )

    // Initial state should be present
    expect(store.getState().count).toBe(0)
    expect(store.getState().text).toBe('hello')

    // Actions should be present
    expect(typeof store.getState().inc).toBe('function')
    expect(typeof store.getState().setText).toBe('function')

    // Actions should work
    store.getState().inc()
    expect(store.getState().count).toBe(1)

    store.getState().setText('world')
    expect(store.getState().text).toBe('world')
  })

  it('works with React create', async () => {
    const { create } = await import('../../src/react')
    const { combine } = await import('../../src/middleware/combine')

    const useStore = create(
      combine({ count: 0 }, (set) => ({
        inc: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    expect(useStore.getState().count).toBe(0)
    expect(typeof useStore.getState().inc).toBe('function')

    useStore.getState().inc()
    expect(useStore.getState().count).toBe(1)
  })

  it('preserves state updates through setState', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine(
        { count: 0, enabled: true },
        (set) => ({
          inc: () => set((s) => ({ count: s.count + 1 })),
          toggle: () => set((s) => ({ enabled: !s.enabled })),
        }),
      ),
    )

    // Direct setState should work
    store.setState({ count: 10 })
    expect(store.getState().count).toBe(10)

    // Actions should still work
    store.getState().inc()
    expect(store.getState().count).toBe(11)

    store.getState().toggle()
    expect(store.getState().enabled).toBe(false)
  })

  it('allows actions to access full state', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine(
        { count: 0, multiplier: 2 },
        (set, get) => ({
          incrementByMultiplier: () => {
            const state = get()
            set({ count: state.count + state.multiplier })
          },
        }),
      ),
    )

    expect(store.getState().count).toBe(0)

    store.getState().incrementByMultiplier()
    expect(store.getState().count).toBe(2)

    store.setState({ multiplier: 5 })
    store.getState().incrementByMultiplier()
    expect(store.getState().count).toBe(7)
  })

  it('supports computed methods in actions', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine(
        { firstName: 'John', lastName: 'Doe' },
        (set, get) => ({
          getFullName: () => {
            const state = get()
            return `${state.firstName} ${state.lastName}`
          },
          setFirstName: (firstName: string) => set({ firstName }),
          setLastName: (lastName: string) => set({ lastName }),
        }),
      ),
    )

    expect(store.getState().getFullName()).toBe('John Doe')

    store.getState().setFirstName('Jane')
    expect(store.getState().getFullName()).toBe('Jane Doe')

    store.getState().setLastName('Smith')
    expect(store.getState().getFullName()).toBe('Jane Smith')
  })

  it('works with empty initial state', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine({}, (set) => ({
        value: 0,
        inc: () => set((s: any) => ({ value: s.value + 1 })),
      })),
    )

    expect(store.getState().value).toBe(0)
    expect(typeof store.getState().inc).toBe('function')

    store.getState().inc()
    expect(store.getState().value).toBe(1)
  })

  it('works with only initial state (no actions)', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine({ count: 5, text: 'hello' }, () => ({})),
    )

    expect(store.getState().count).toBe(5)
    expect(store.getState().text).toBe('hello')

    // Can still use setState
    store.setState({ count: 10 })
    expect(store.getState().count).toBe(10)
  })

  it('subscribes to state changes correctly', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine({ count: 0 }, (set) => ({
        inc: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    const listener = vi.fn()
    store.subscribe(listener)

    store.getState().inc()
    expect(listener).toHaveBeenCalledTimes(1)

    store.setState({ count: 10 })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('supports nested objects in initial state', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine(
        { user: { name: 'John', age: 30 }, settings: { theme: 'dark' } },
        (set) => ({
          updateName: (name: string) =>
            set((s) => ({ user: { ...s.user, name } })),
          updateTheme: (theme: string) => set({ settings: { theme } }),
        }),
      ),
    )

    expect(store.getState().user.name).toBe('John')
    expect(store.getState().settings.theme).toBe('dark')

    store.getState().updateName('Jane')
    expect(store.getState().user.name).toBe('Jane')

    store.getState().updateTheme('light')
    expect(store.getState().settings.theme).toBe('light')
  })

  it('works with history functionality', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine({ count: 0 }, (set) => ({
        inc: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    store.getState().inc()
    store.getState().inc()
    expect(store.getState().count).toBe(2)

    // Undo should work
    store.undo()
    expect(store.getState().count).toBe(1)

    store.undo()
    expect(store.getState().count).toBe(0)

    // Redo should work
    store.redo()
    expect(store.getState().count).toBe(1)
  })

  it('actions have access to store API', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { combine } = await import('../../src/middleware/combine')

    const store = createStore(
      combine({ count: 0 }, (set, get, api) => ({
        incrementAndCheck: () => {
          set((s) => ({ count: s.count + 1 }))
          const newCount = get().count
          return newCount
        },
        reset: () => {
          const initialState = api.getInitialState()
          set({ count: initialState.count })
        },
      })),
    )

    const result = store.getState().incrementAndCheck()
    expect(result).toBe(1)

    store.getState().incrementAndCheck()
    expect(store.getState().count).toBe(2)

    store.getState().reset()
    expect(store.getState().count).toBe(0)
  })
})
