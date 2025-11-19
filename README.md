<p align="center">
  <img src="docs/bear.jpg" />
</p>

[![npm version](https://img.shields.io/npm/v/@low-orbit/bruin.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@low-orbit/bruin)
[![npm downloads](https://img.shields.io/npm/dt/@low-orbit/bruin.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@low-orbit/bruin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, performant state management library built on simplified flux patterns. Features a hook-based API that's straightforward and flexible, without unnecessary complexity. Every store automatically tracks history for undo/redo functionality.

While the bear mascot is friendly, the library is robust. Significant effort went into handling React's tricky edge cases, including the [zombie child problem](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children), [react concurrency](https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md), and [context loss](https://github.com/facebook/react/issues/13332) between mixed renderers. Bruin handles these challenges correctly.

Built on [Zustand](https://github.com/pmndrs/zustand) for compatibility. If you're familiar with Zustand, you'll feel right at home with Bruin. The difference is automatic history tracking.

```bash
npm install @low-orbit/bruin
```

:warning: This readme is written for JavaScript users. If you are a TypeScript user, be sure to check out our [TypeScript Usage section](#typescript-usage).

## Creating a store

Stores are created as hooks. Store any data type: primitives, objects, or functions. Updates must be immutable, and the `set` function [merges state](./docs/guides/immutable-state-and-merging.md) automatically. History tracking happens automatically for every change.

```jsx
import { create } from '@low-orbit/bruin'

const useBearStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

## Use in your components

Use the store hook anywhere in your component tree—no providers required. Select the state you need and components re-render when those values change. Undo and redo are available directly on the store instance.

```jsx
function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} around here ...</h1>
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation)
  const { undo, redo, canUndo, canRedo } = useBearStore
  return (
    <>
      <button onClick={increasePopulation}>one up</button>
      <button onClick={undo} disabled={!canUndo}>undo</button>
      <button onClick={redo} disabled={!canRedo}>redo</button>
    </>
  )
}
```

### Why choose Bruin over Redux?

- Minimal setup with flexible patterns
- Hooks-first approach for consuming state
- No context provider wrappers needed
- [Supports transient updates without re-renders](#transient-updates-for-often-occurring-state-changes)
- **Built-in undo/redo** - History tracking without additional libraries

### Why choose Bruin over Context API?

- Reduced boilerplate code
- Selective re-renders based on state changes
- Centralized state with action-based updates
- **Automatic history** - Every change is tracked automatically

### Why choose Bruin over Zustand?

- Full Zustand compatibility, with additional features:
- **Automatic undo/redo** - History built into every store
- **Transactions** - Batch multiple updates together
- **History persistence** - Save history across sessions with `persistHistory`

---

# Recipes

## Undo/redo history

Bruin adds automatic undo/redo history to every store:

```jsx
const useBearStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}))

// Undo/redo methods available on the store
useBearStore.undo() // Go back one step (restores entire state)
useBearStore.redo() // Go forward one step (restores entire state)
useBearStore.canUndo() // Check if undo is possible
useBearStore.canRedo() // Check if redo is possible
```

**Important:** Undo/redo restores the **entire state** to the previous snapshot (not just changed fields). Each store maintains its **own independent history** - calling `undo()` on one store doesn't affect others.

## Transactions

Transactions group multiple changes into a single history entry:

```jsx
// Option 1: Using set.transaction (recommended)
const useStore = create((set) => ({
  count: 0,
  name: '',
  initialize: () =>
    set.transaction(
      () => {
        set({ count: 1 })
        set({ name: 'John' })
      },
      { name: 'Initialize User' },
    ),
}))

// Option 2: Using store.transaction
useStore.transaction(
  () => {
    useStore.setState({ count: 1 })
    useStore.setState({ name: 'John' })
  },
  { name: 'Initialize User' },
)
```

## Accessing all state

You can access the entire state object, but this will cause the component to re-render whenever any part of the state changes.

```jsx
const state = useBearStore()
```

## Selecting multiple state values

By default, Bruin uses strict equality (`===`) to detect changes, which works efficiently for primitive value selections.

```jsx
const nuts = useBearStore((state) => state.nuts)
const honey = useBearStore((state) => state.honey)
```

When selecting multiple values into a single object (similar to Redux's `mapStateToProps`), use [useShallow](./docs/guides/prevent-rerenders-with-use-shallow.md) to prevent re-renders when the selected values haven't changed according to shallow equality.

```jsx
import { create } from '@low-orbit/bruin'
import { useShallow } from '@low-orbit/bruin/react/shallow'

const useBearStore = create((set) => ({
  nuts: 0,
  honey: 0,
  treats: {},
  // ...
}))

// Object pick, re-renders the component when either state.nuts or state.honey change
const { nuts, honey } = useBearStore(
  useShallow((state) => ({ nuts: state.nuts, honey: state.honey })),
)

// Array pick, re-renders the component when either state.nuts or state.honey change
const [nuts, honey] = useBearStore(
  useShallow((state) => [state.nuts, state.honey]),
)

// Mapped picks, re-renders the component when state.treats changes in order, count or keys
const treats = useBearStore(useShallow((state) => Object.keys(state.treats)))
```

For advanced re-render control, you can provide a custom equality function (this requires using [`createWithEqualityFn`](./docs/migrations/migrating-to-v5.md#using-custom-equality-functions-such-as-shallow)).

```jsx
const treats = useBearStore(
  (state) => state.treats,
  (oldTreats, newTreats) => compare(oldTreats, newTreats),
)
```

## Replacing state entirely

The `set` function accepts a second parameter (defaults to `false`). When set to `true`, it replaces the entire state instead of merging. Take care not to accidentally remove important parts like action functions.

```jsx
const useFishStore = create((set) => ({
  salmon: 1,
  tuna: 2,
  deleteEverything: () => set({}, true), // clears the entire store, actions included
  deleteTuna: () => set(({ tuna, ...rest }) => rest, true),
}))
```

## Asynchronous actions

Bruin works seamlessly with async functions. Simply call `set` whenever your async operation completes.

```jsx
const useFishStore = create((set) => ({
  fishies: {},
  fetch: async (pond) => {
    const response = await fetch(pond)
    set({ fishies: await response.json() })
  },
}))
```

## Reading state within actions

While `set` supports function updates like `set(state => result)`, you can also access the current state using `get` without triggering an update.

```jsx
const useSoundStore = create((set, get) => ({
  sound: 'grunt',
  action: () => {
    const sound = get().sound
    // ...
  },
}))
```

## Accessing stores outside React components

When you need to read or modify state outside of React components, the store hook exposes utility methods directly.

:warning: This technique is not recommended for adding state in [React Server Components](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md) (typically in Next.js 13 and above). It can lead to unexpected bugs and privacy issues for your users. For more details, see [#2200](https://github.com/pmndrs/zustand/discussions/2200).

```jsx
const useDogStore = create(() => ({ paw: true, snout: true, fur: true }))

// Getting non-reactive fresh state
const paw = useDogStore.getState().paw
// Listening to all changes, fires synchronously on every change
const unsub1 = useDogStore.subscribe(console.log)
// Updating state, will trigger listeners
useDogStore.setState({ paw: false })
// Undo/redo available
useDogStore.undo()
useDogStore.redo()
// Unsubscribe listeners
unsub1()

// You can of course use the hook as you always would
function Component() {
  const paw = useDogStore((state) => state.paw)
  // ...
}
```

### Subscribing to specific state slices

To subscribe only to specific parts of state, use the `subscribeWithSelector` middleware.

This middleware extends `subscribe` with an additional signature:

```ts
subscribe(selector, callback, options?: { equalityFn, fireImmediately }): Unsubscribe
```

```js
import { subscribeWithSelector } from '@low-orbit/bruin/middleware'
const useDogStore = create(
  subscribeWithSelector(() => ({ paw: true, snout: true, fur: true })),
)

// Listening to selected changes, in this case when "paw" changes
const unsub2 = useDogStore.subscribe((state) => state.paw, console.log)
// Subscribe also exposes the previous value
const unsub3 = useDogStore.subscribe(
  (state) => state.paw,
  (paw, previousPaw) => console.log(paw, previousPaw),
)
// Subscribe also supports an optional equality function
const unsub4 = useDogStore.subscribe(
  (state) => [state.paw, state.fur],
  console.log,
  { equalityFn: shallow },
)
// Subscribe and fire immediately
const unsub5 = useDogStore.subscribe((state) => state.paw, console.log, {
  fireImmediately: true,
})
```

## Using Bruin without React

Bruin's core functionality works without React. When using the vanilla version, `createStore` returns store utilities instead of a React hook.

```jsx
import { createStore } from '@low-orbit/bruin/vanilla'

const store = createStore((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}))

const { getState, setState, subscribe, undo, redo } = store

export default store
```

Vanilla stores can be used with the `useStore` hook (available since v4).

```jsx
import { useStore } from '@low-orbit/bruin'
import { vanillaStore } from './vanillaStore'

const useBoundStore = (selector) => useStore(vanillaStore, selector)
```

:warning: Note that middlewares that modify `set` or `get` are not applied to `getState` and `setState`.

## Transient updates for frequent state changes

For state that changes frequently, `subscribe` lets you listen without triggering re-renders. Combine with `useEffect` to automatically clean up subscriptions on unmount. This provides significant [performance benefits](https://codesandbox.io/s/peaceful-johnson-txtws) when you can update the DOM directly.

```jsx
const useScratchStore = create((set) => ({ scratches: 0, ... }))

const Component = () => {
  // Fetch initial state
  const scratchRef = useRef(useScratchStore.getState().scratches)
  // Connect to the store on mount, disconnect on unmount, catch state-changes in a reference
  useEffect(() => useScratchStore.subscribe(
    state => (scratchRef.current = state.scratches)
  ), [])
  // ...
}
```

## Working with nested state? Try Immer

Updating deeply nested state structures can be tedious. [Immer](https://github.com/mweststrate/immer) makes it much easier.

```jsx
import { produce } from 'immer'

const useLushStore = create((set) => ({
  lush: { forest: { contains: { a: 'bear' } } },
  clearForest: () =>
    set(
      produce((state) => {
        state.lush.forest.contains = null
      }),
    ),
}))

const clearForest = useLushStore((state) => state.clearForest)
clearForest()
```

[Alternatively, there are some other solutions.](./docs/guides/updating-state.md#with-immer)

## Persist middleware

Save your store's state to any storage backend using the persist middleware.

```jsx
import { create } from '@low-orbit/bruin'
import { persist, createJSONStorage } from '@low-orbit/bruin/middleware'

const useFishStore = create(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
      persistHistory: true, // NEW: Persist undo/redo history across sessions
    },
  ),
)
```

[See the full documentation for this middleware.](./docs/integrations/persisting-store-data.md)

## Immer middleware

Bruin includes Immer as a middleware option for easier nested state updates.

```jsx
import { create } from '@low-orbit/bruin'
import { immer } from '@low-orbit/bruin/middleware/immer'

const useBeeStore = create(
  immer((set) => ({
    bees: 0,
    addBees: (by) =>
      set((state) => {
        state.bees += by
      }),
  })),
)
```

## Prefer Redux-style reducers?

You can implement reducer patterns manually:

```jsx
const types = { increase: 'INCREASE', decrease: 'DECREASE' }

const reducer = (state, { type, by = 1 }) => {
  switch (type) {
    case types.increase:
      return { grumpiness: state.grumpiness + by }
    case types.decrease:
      return { grumpiness: state.grumpiness - by }
  }
}

const useGrumpyStore = create((set) => ({
  grumpiness: 0,
  dispatch: (args) => set((state) => reducer(state, args)),
}))

const dispatch = useGrumpyStore((state) => state.dispatch)
dispatch({ type: types.increase, by: 2 })
```

Alternatively, use the redux middleware which configures your reducer, sets initial state, and adds dispatch to both the state and vanilla API.

```jsx
import { redux } from '@low-orbit/bruin/middleware'

const useGrumpyStore = create(redux(reducer, initialState))
```

## Redux DevTools integration

Use the [Redux DevTools Chrome extension](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) with Bruin's devtools middleware.

```jsx
import { devtools } from '@low-orbit/bruin/middleware'

// Usage with a plain action store, it will log actions as "setState"
const usePlainStore = create(devtools((set) => ...))
// Usage with a redux store, it will log full action types
const useReduxStore = create(devtools(redux(reducer, initialState)))
```

### Multiple stores with DevTools

Connect multiple stores to DevTools:

```jsx
import { devtools } from '@low-orbit/bruin/middleware'

// Plain stores log actions as "setState"
const usePlainStore1 = create(devtools((set) => ..., { name, store: storeName1 }))
const usePlainStore2 = create(devtools((set) => ..., { name, store: storeName2 }))
// Redux stores log full action types
const useReduxStore1 = create(devtools(redux(reducer, initialState)), { name, store: storeName3 })
const useReduxStore2 = create(devtools(redux(reducer, initialState)), { name, store: storeName4 })
```

Different connection names separate stores in DevTools and allow grouping related stores together.

The devtools middleware accepts the store function as the first argument. The second argument can include a store name or [serialize](https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md#serialize) configuration.

Store naming: `devtools(..., {name: "MyStore"})` creates a separate DevTools instance named "MyStore".

Serialization: `devtools(..., { serialize: { options: true } })` configures serialization options.

#### Action Logging

Each store logs actions independently (unlike Redux's combined reducers). For combining stores, see https://github.com/pmndrs/zustand/issues/163

You can log a specific action type for each `set` function by passing a third parameter:

```jsx
const useBearStore = create(devtools((set) => ({
  ...
  eatFish: () => set(
    (prev) => ({ fishes: prev.fishes > 1 ? prev.fishes - 1 : 0 }),
    undefined,
    'bear/eatFish'
  ),
  ...
```

You can also log the action's type along with its payload:

```jsx
  ...
  addFishes: (count) => set(
    (prev) => ({ fishes: prev.fishes + count }),
    undefined,
    { type: 'bear/addFishes', count, }
  ),
  ...
```

If an action type is not provided, it is defaulted to "anonymous". You can customize this default value by providing an `anonymousActionType` parameter:

```jsx
devtools(..., { anonymousActionType: 'unknown', ... })
```

If you wish to disable devtools (on production for instance). You can customize this setting by providing the `enabled` parameter:

```jsx
devtools(..., { enabled: false, ... })
```

## Using React Context

Stores created with `create` don't need context providers. However, you might want to use Context for dependency injection or to initialize stores with component props. Since stores are hooks, passing them directly as context values can violate React's rules of hooks.

The recommended approach (available since v4) is to use a vanilla store with Context.

```jsx
import { createContext, useContext } from 'react'
import { createStore, useStore } from '@low-orbit/bruin'

const store = createStore(...) // vanilla store without hooks

const StoreContext = createContext()

const App = () => (
  <StoreContext.Provider value={store}>
    ...
  </StoreContext.Provider>
)

const Component = () => {
  const store = useContext(StoreContext)
  const slice = useStore(store, selector)
  // ...
}
```

## TypeScript Usage

TypeScript support is straightforward. Use `create<State>()(...)` instead of `create(...)` to provide type information.

```ts
import { create } from '@low-orbit/bruin'
import { devtools, persist } from '@low-orbit/bruin/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
        bears: 0,
        increase: (by) => set((state) => ({ bears: state.bears + by })),
      }),
      {
        name: 'bear-storage',
      },
    ),
  ),
)
```

A more detailed TypeScript guide is [here](docs/guides/beginner-typescript.md) and [there](docs/guides/advanced-typescript.md).

## Best practices

- Code organization: [Splitting stores into separate slices](./docs/guides/slices-pattern.md)
- Recommended patterns: [Flux-inspired practices](./docs/guides/flux-inspired-practice.md)
- [Calling actions outside React event handlers (pre-React 18)](./docs/guides/event-handler-in-pre-react-18.md)
- [Testing strategies](./docs/guides/testing.md)
- Explore more in [the documentation](./docs/)

## Third-Party Libraries

The community has created various extensions and integrations for Bruin. See [third-party libraries documentation](./docs/integrations/third-party-libraries.md) for available options.

## Comparing with other libraries

- [How Bruin compares to other React state management solutions](https://github.com/low-orbit-io/bruin#whats-different-from-zustand)

## How Bruin Extends Zustand

Bruin maintains full compatibility with Zustand while adding:

- ✅ **Automatic undo/redo** - Every store tracks history automatically
- ✅ **Transactions** - Batch multiple updates into single history entries
- ✅ **History persistence** - Save history across sessions with `persistHistory`
- ✅ **Path subscriptions** - Subscribe to specific nested object paths
- ✅ **Structural sharing** - Efficient immutable updates via built-in Immer

All Zustand features and patterns work identically in Bruin.

## License

MIT - Derivative work based on Zustand. See [LICENSE](./LICENSE) for attribution.
