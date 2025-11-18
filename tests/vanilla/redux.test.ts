import { describe, expect, it } from 'vitest'

/**
 * Vanilla redux Middleware Tests
 *
 * The redux middleware enables Redux-style reducer patterns
 * with dispatch and actions within Bruin stores.
 *
 * Key features tested:
 * - Reducer-based state updates
 * - Dispatch function on state and API
 * - Action type tracking
 * - Initial state setup
 * - Multiple action types
 * - Action payloads
 */

describe('Vanilla redux Middleware', () => {
  it('should be defined', async () => {
    const { redux } = await import('../../src/middleware/redux')
    expect(redux).toBeDefined()
    expect(typeof redux).toBe('function')
  })

  it('initializes state and provides dispatch (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { count: number }
    type Action = { type: 'increment' } | { type: 'decrement' }

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'increment':
          return { count: state.count + 1 }
        case 'decrement':
          return { count: state.count - 1 }
        default:
          return state
      }
    }

    const store = createStore(redux(reducer, { count: 0 }))

    // Initial state should be set
    expect(store.getState().count).toBe(0)

    // Dispatch should be available on state
    expect(typeof store.getState().dispatch).toBe('function')

    // Dispatch should be available on API
    expect(typeof store.dispatch).toBe('function')
  })

  it('updates state through dispatch (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { count: number }
    type Action = { type: 'increment' } | { type: 'decrement' }

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'increment':
          return { count: state.count + 1 }
        case 'decrement':
          return { count: state.count - 1 }
        default:
          return state
      }
    }

    const store = createStore(redux(reducer, { count: 0 }))

    store.dispatch({ type: 'increment' })
    expect(store.getState().count).toBe(1)

    store.dispatch({ type: 'increment' })
    expect(store.getState().count).toBe(2)

    store.dispatch({ type: 'decrement' })
    expect(store.getState().count).toBe(1)
  })

  it('handles actions with payloads (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { count: number }
    type Action =
      | { type: 'add'; value: number }
      | { type: 'subtract'; value: number }
      | { type: 'reset' }

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'add':
          return { count: state.count + action.value }
        case 'subtract':
          return { count: state.count - action.value }
        case 'reset':
          return { count: 0 }
        default:
          return state
      }
    }

    const store = createStore(redux(reducer, { count: 10 }))

    store.dispatch({ type: 'add', value: 5 })
    expect(store.getState().count).toBe(15)

    store.dispatch({ type: 'subtract', value: 3 })
    expect(store.getState().count).toBe(12)

    store.dispatch({ type: 'reset' })
    expect(store.getState().count).toBe(0)
  })

  it('returns dispatched action (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { value: number }
    type Action = { type: 'set'; value: number }

    const reducer = (state: State, action: Action): State => {
      if (action.type === 'set') {
        return { value: action.value }
      }
      return state
    }

    const store = createStore(redux(reducer, { value: 0 }))

    const action = { type: 'set' as const, value: 42 }
    const result = store.dispatch(action)

    expect(result).toBe(action)
    expect(result.type).toBe('set')
    expect(result.value).toBe(42)
  })

  it('works with complex state objects', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = {
      user: { name: string; age: number }
      settings: { theme: string }
    }

    type Action =
      | { type: 'setName'; name: string }
      | { type: 'setAge'; age: number }
      | { type: 'setTheme'; theme: string }

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'setName':
          return { ...state, user: { ...state.user, name: action.name } }
        case 'setAge':
          return { ...state, user: { ...state.user, age: action.age } }
        case 'setTheme':
          return { ...state, settings: { theme: action.theme } }
        default:
          return state
      }
    }

    const store = createStore(
      redux(reducer, {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' },
      }),
    )

    expect(store.getState().user.name).toBe('John')

    store.dispatch({ type: 'setName', name: 'Jane' })
    expect(store.getState().user.name).toBe('Jane')
    expect(store.getState().user.age).toBe(30) // Should preserve

    store.dispatch({ type: 'setAge', age: 25 })
    expect(store.getState().user.age).toBe(25)

    store.dispatch({ type: 'setTheme', theme: 'light' })
    expect(store.getState().settings.theme).toBe('light')
  })

  it('works with React create', async () => {
    const { create } = await import('../../src/react')
    const { redux } = await import('../../src/middleware/redux')

    type State = { count: number }
    type Action = { type: 'increment' } | { type: 'decrement' }

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'increment':
          return { count: state.count + 1 }
        case 'decrement':
          return { count: state.count - 1 }
        default:
          return state
      }
    }

    const useStore = create(redux(reducer, { count: 0 }))

    expect(useStore.getState().count).toBe(0)
    expect(typeof useStore.dispatch).toBe('function')

    useStore.dispatch({ type: 'increment' })
    expect(useStore.getState().count).toBe(1)
  })

  it('supports history with redux actions', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { count: number }
    type Action = { type: 'increment' } | { type: 'decrement' }

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'increment':
          return { count: state.count + 1 }
        case 'decrement':
          return { count: state.count - 1 }
        default:
          return state
      }
    }

    const store = createStore(redux(reducer, { count: 0 }))

    store.dispatch({ type: 'increment' })
    store.dispatch({ type: 'increment' })
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

  it('dispatch from both state and API refer to same function', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { value: number }
    type Action = { type: 'set'; value: number }

    const reducer = (state: State, action: Action): State => {
      if (action.type === 'set') {
        return { value: action.value }
      }
      return state
    }

    const store = createStore(redux(reducer, { value: 0 }))

    // Both should update the same state
    store.dispatch({ type: 'set', value: 10 })
    expect(store.getState().value).toBe(10)

    store.getState().dispatch({ type: 'set', value: 20 })
    expect(store.getState().value).toBe(20)
  })

  it('handles default case in reducer', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { count: number }
    type Action = { type: 'increment' } | { type: string }

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'increment':
          return { count: state.count + 1 }
        default:
          return state
      }
    }

    const store = createStore(redux(reducer, { count: 5 }))

    // Unknown action should not change state
    store.dispatch({ type: 'unknown' } as any)
    expect(store.getState().count).toBe(5)

    // Known action should work
    store.dispatch({ type: 'increment' })
    expect(store.getState().count).toBe(6)
  })

  it('supports multiple independent stores with redux', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { value: number }
    type Action = { type: 'increment' }

    const reducer = (state: State, action: Action): State => {
      if (action.type === 'increment') {
        return { value: state.value + 1 }
      }
      return state
    }

    const store1 = createStore(redux(reducer, { value: 0 }))
    const store2 = createStore(redux(reducer, { value: 100 }))

    store1.dispatch({ type: 'increment' })
    expect(store1.getState().value).toBe(1)
    expect(store2.getState().value).toBe(100) // Should not affect store2

    store2.dispatch({ type: 'increment' })
    expect(store1.getState().value).toBe(1) // Should not affect store1
    expect(store2.getState().value).toBe(101)
  })

  it('supports action creators pattern', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { redux } = await import('../../src/middleware/redux')

    type State = { count: number }
    type Action =
      | { type: 'INCREMENT' }
      | { type: 'ADD'; payload: number }

    // Action creators
    const increment = () => ({ type: 'INCREMENT' as const })
    const add = (payload: number) => ({ type: 'ADD' as const, payload })

    const reducer = (state: State, action: Action): State => {
      switch (action.type) {
        case 'INCREMENT':
          return { count: state.count + 1 }
        case 'ADD':
          return { count: state.count + action.payload }
        default:
          return state
      }
    }

    const store = createStore(redux(reducer, { count: 0 }))

    store.dispatch(increment())
    expect(store.getState().count).toBe(1)

    store.dispatch(add(10))
    expect(store.getState().count).toBe(11)
  })
})
