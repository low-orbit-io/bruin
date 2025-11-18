import { StrictMode } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/**
 * React useShallow Hook Tests
 *
 * The useShallow hook combines shallow equality comparison with React hooks
 * to prevent unnecessary re-renders when selector results are shallow-equal.
 *
 * Key features tested:
 * - Prevents re-renders when shallow-equal
 * - Works with objects, arrays, Sets, Maps
 * - Memoizes selector results
 * - Integrates with Bruin stores
 */

describe('React useShallow Hook', () => {
  it('should be defined', async () => {
    const { useShallow } = await import('../../src/react/shallow')
    expect(useShallow).toBeDefined()
    expect(typeof useShallow).toBe('function')
  })

  it('prevents re-renders when object is shallow-equal', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      person: { name: 'John', age: 30 },
    }))

    const renderCount = vi.fn()

    function Component() {
      const person = useStore(useShallow((s) => s.person))
      renderCount()
      return (
        <div>
          {person.name} - {person.age}
        </div>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('John - 30')
    const initialCount = renderCount.mock.calls.length

    // Update with shallow-equal object - should not re-render
    act(() => {
      useStore.setState({ person: { name: 'John', age: 30 } })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update with different object - should re-render
    act(() => {
      useStore.setState({ person: { name: 'Jane', age: 25 } })
    })

    await findByText('Jane - 25')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('prevents re-renders when array is shallow-equal', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      items: [1, 2, 3],
    }))

    const renderCount = vi.fn()

    function Component() {
      const items = useStore(useShallow((s) => s.items))
      renderCount()
      return <div>{items.join(',')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('1,2,3')
    const initialCount = renderCount.mock.calls.length

    // Update with shallow-equal array - should not re-render
    act(() => {
      useStore.setState({ items: [1, 2, 3] })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update with different array - should re-render
    act(() => {
      useStore.setState({ items: [1, 2, 3, 4] })
    })

    await findByText('1,2,3,4')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('prevents re-renders for derived object selectors', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
    }))

    const renderCount = vi.fn()

    function Component() {
      const person = useStore(
        useShallow((s) => ({
          firstName: s.firstName,
          lastName: s.lastName,
        }))
      )
      renderCount()
      return (
        <div>
          {person.firstName} {person.lastName}
        </div>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('John Doe')
    const initialCount = renderCount.mock.calls.length

    // Update age (not in selector) - should not re-render
    act(() => {
      useStore.setState({ age: 31 })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update firstName - should re-render
    act(() => {
      useStore.setState({ firstName: 'Jane' })
    })

    await findByText('Jane Doe')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('works with array selector (e.g., Object.keys)', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      a: 1,
      b: 2,
      c: 3,
    }))

    const renderCount = vi.fn()

    function Component() {
      const keys = useStore(useShallow((s) => Object.keys(s)))
      renderCount()
      return <div>{keys.join(',')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('a,b,c')
    const initialCount = renderCount.mock.calls.length

    // Update values only - keys unchanged, should not re-render
    act(() => {
      useStore.setState({ a: 10, b: 20, c: 30 })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Add new key - should re-render
    act(() => {
      useStore.setState({ d: 4 } as any)
    })

    await findByText('a,b,c,d')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('works with Set selectors', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      tags: new Set(['react', 'typescript']),
    }))

    const renderCount = vi.fn()

    function Component() {
      const tags = useStore(useShallow((s) => s.tags))
      renderCount()
      return <div>{Array.from(tags).join(',')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('react,typescript')
    const initialCount = renderCount.mock.calls.length

    // Update with shallow-equal Set
    act(() => {
      useStore.setState({ tags: new Set(['react', 'typescript']) })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update with different Set
    act(() => {
      useStore.setState({ tags: new Set(['react', 'typescript', 'zustand']) })
    })

    await findByText('react,typescript,zustand')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('works with Map selectors', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      config: new Map([
        ['theme', 'dark'],
        ['lang', 'en'],
      ]),
    }))

    const renderCount = vi.fn()

    function Component() {
      const config = useStore(useShallow((s) => s.config))
      renderCount()
      return <div>{config.get('theme')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('dark')
    const initialCount = renderCount.mock.calls.length

    // Update with shallow-equal Map
    act(() => {
      useStore.setState({
        config: new Map([
          ['theme', 'dark'],
          ['lang', 'en'],
        ]),
      })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update with different Map
    act(() => {
      useStore.setState({
        config: new Map([
          ['theme', 'light'],
          ['lang', 'en'],
        ]),
      })
    })

    await findByText('light')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('handles multiple useShallow hooks in one component', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark', lang: 'en' },
    }))

    const renderCount = vi.fn()

    function Component() {
      const user = useStore(useShallow((s) => s.user))
      const settings = useStore(useShallow((s) => s.settings))
      renderCount()
      return (
        <div>
          {user.name} - {settings.theme}
        </div>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('John - dark')
    const initialCount = renderCount.mock.calls.length

    // Update user with shallow-equal
    act(() => {
      useStore.setState({ user: { name: 'John', age: 30 } })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update settings with shallow-equal
    act(() => {
      useStore.setState({ settings: { theme: 'dark', lang: 'en' } })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update user with different value
    act(() => {
      useStore.setState({ user: { name: 'Jane', age: 25 } })
    })

    await findByText('Jane - dark')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('works with vanilla stores', async () => {
    const { createStore } = await import('../../src/vanilla')
    const { useStore } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const store = createStore(() => ({
      items: [1, 2, 3],
    }))

    const renderCount = vi.fn()

    function Component() {
      const items = useStore(store, useShallow((s) => s.items))
      renderCount()
      return <div>{items.join(',')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('1,2,3')
    const initialCount = renderCount.mock.calls.length

    // Update with shallow-equal
    act(() => {
      store.setState({ items: [1, 2, 3] })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update with different value
    act(() => {
      store.setState({ items: [1, 2, 3, 4] })
    })

    await findByText('1,2,3,4')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('handles primitive selector results', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      count: 0,
      text: 'hello',
    }))

    const renderCount = vi.fn()

    function Component() {
      const count = useStore(useShallow((s) => s.count))
      renderCount()
      return <div>{count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('0')
    const initialCount = renderCount.mock.calls.length

    // Update with same value
    act(() => {
      useStore.setState({ count: 0 })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update with different value
    act(() => {
      useStore.setState({ count: 1 })
    })

    await findByText('1')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('handles complex nested selections', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      data: {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        settings: { theme: 'dark' },
      },
    }))

    const renderCount = vi.fn()

    function Component() {
      const userIds = useStore(useShallow((s) => s.data.users.map((u) => u.id)))
      renderCount()
      return <div>{userIds.join(',')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('1,2')
    const initialCount = renderCount.mock.calls.length

    // Update settings (not users) - IDs haven't changed
    act(() => {
      useStore.setState({
        data: {
          users: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
          ],
          settings: { theme: 'light' },
        },
      })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Update user IDs - should re-render
    act(() => {
      useStore.setState({
        data: {
          users: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
            { id: 3, name: 'Bob' },
          ],
          settings: { theme: 'light' },
        },
      })
    })

    await findByText('1,2,3')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('works correctly with empty objects and arrays', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      items: [] as number[],
      config: {} as Record<string, any>,
    }))

    const renderCount = vi.fn()

    function Component() {
      const items = useStore(useShallow((s) => s.items))
      const config = useStore(useShallow((s) => s.config))
      renderCount()
      return (
        <div>
          {items.length}-{Object.keys(config).length}
        </div>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('0-0')
    const initialCount = renderCount.mock.calls.length

    // Update with shallow-equal empty values
    act(() => {
      useStore.setState({ items: [], config: {} })
    })

    expect(renderCount).toHaveBeenCalledTimes(initialCount)

    // Add items
    act(() => {
      useStore.setState({ items: [1], config: { a: 1 } })
    })

    await findByText('1-1')
    expect(renderCount).toHaveBeenCalledTimes(initialCount + 2)
  })

  it('maintains referential equality for memoization', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      a: 1,
      b: 2,
      c: 3,
    }))

    const refs: any[] = []

    function Component() {
      const obj = useStore(useShallow((s) => ({ a: s.a, b: s.b })))
      refs.push(obj)
      return (
        <div>
          {obj.a}-{obj.b}
        </div>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('1-2')

    // Update c (not selected) - object reference should be same
    act(() => {
      useStore.setState({ c: 4 })
    })

    // Check that the same object reference is maintained
    const uniqueRefs = new Set(refs)
    expect(uniqueRefs.size).toBe(refs.length / 2) // StrictMode doubles renders
  })

  it('handles rapid updates efficiently', async () => {
    const { create } = await import('../../src/react')
    const { useShallow } = await import('../../src/react/shallow')

    const useStore = create(() => ({
      items: [1, 2, 3],
    }))

    const renderCount = vi.fn()

    function Component() {
      const items = useStore(useShallow((s) => s.items))
      renderCount()
      return <div>{items.join(',')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>
    )

    await findByText('1,2,3')
    const initialCount = renderCount.mock.calls.length

    // Rapid updates with same value
    act(() => {
      for (let i = 0; i < 10; i++) {
        useStore.setState({ items: [1, 2, 3] })
      }
    })

    // Should not re-render for any of them
    expect(renderCount).toHaveBeenCalledTimes(initialCount)
  })
})
