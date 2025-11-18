---
title: Comparison
description: How Bruin compares to other state management libraries
nav: 1
---

# Bruin vs Other State Management Libraries

Bruin builds on Zustand's foundation while adding powerful features for modern React applications.
On this page we'll compare Bruin to Zustand, Redux, Valtio, Jotai, and Recoil.

## Bruin vs Zustand

**Bruin is 100% backward compatible with Zustand** - it's a drop-in replacement with zero breaking changes.

### What Bruin Adds

Bruin extends Zustand with these built-in features:

**1. History Tracking**
```ts
import { create } from 'bruin'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
}))

// Built-in time-travel
useStore.getState().undo()
useStore.getState().redo()
useStore.getState().getHistory()
```

**2. Transactions**
```ts
const useStore = create((set) => ({
  count: 0,
  name: 'Alice',
  updateBoth: () => {
    set.transaction(() => {
      set({ count: 10 })
      set({ name: 'Bob' })
    }, { name: 'Update both' })
  }
}))
```

**3. Enhanced Middleware**
- All Zustand middleware works identically
- `persist` middleware can persist history states
- `devtools` middleware integrates with history timeline

### Migration from Zustand

No migration needed! Just update your imports:

```diff
- import { create } from 'zustand'
+ import { create } from 'bruin'
```

Everything else works exactly the same.

## Redux

### State Model (vs Redux)

Like Zustand, Bruin is based on an immutable state model.
However, Bruin doesn't require context providers.

**Bruin**

```ts
import { create } from 'bruin'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  increment: (qty: number) => set((state) => ({ count: state.count + qty })),
  decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
}))
```

You can also use a reducer pattern:

```ts
import { create } from 'bruin'

type State = {
  count: number
}

type Action = {
  type: 'increment' | 'decrement'
  qty: number
}

const countReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.qty }
    case 'decrement':
      return { count: state.count - action.qty }
    default:
      return state
  }
}

const useCountStore = create<State>((set) => ({
  count: 0,
  dispatch: (action: Action) => set((state) => countReducer(state, action)),
}))
```

**Redux**

```ts
import { createStore } from 'redux'
import { useSelector, useDispatch } from 'react-redux'

type State = {
  count: number
}

type Action = {
  type: 'increment' | 'decrement'
  qty: number
}

const countReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.qty }
    case 'decrement':
      return { count: state.count - action.qty }
    default:
      return state
  }
}

const countStore = createStore(countReducer)
```

### Render Optimization (vs Redux)

Both Bruin and Redux use manual selector-based optimization:

**Bruin**

```ts
const Component = () => {
  const count = useCountStore((state) => state.count)
  const increment = useCountStore((state) => state.increment)
  const decrement = useCountStore((state) => state.decrement)
  // ...
}
```

**Redux**

```ts
const Component = () => {
  const count = useSelector((state) => state.count)
  const dispatch = useDispatch()
  // ...
}
```

## Valtio

### State Model (vs Valtio)

Bruin and Valtio have fundamentally different approaches.
Bruin uses **immutable** state, while Valtio uses **mutable** state.

**Bruin**

```ts
import { create } from 'bruin'

type State = {
  obj: { count: number }
}

const store = create<State>(() => ({ obj: { count: 0 } }))

store.setState((prev) => ({ obj: { count: prev.obj.count + 1 } }))
```

**Valtio**

```ts
import { proxy } from 'valtio'

const state = proxy({ obj: { count: 0 } })

state.obj.count += 1
```

### Render Optimization (vs Valtio)

Valtio optimizes through property access.
Bruin requires manual selector optimization.

**Bruin**

```ts
import { create } from 'bruin'

const useCountStore = create(() => ({ count: 0 }))

const Component = () => {
  const count = useCountStore((state) => state.count)
  // ...
}
```

**Valtio**

```ts
import { proxy, useSnapshot } from 'valtio'

const state = proxy({ count: 0 })

const Component = () => {
  const { count } = useSnapshot(state)
  // ...
}
```

## Jotai

### State Model (vs Jotai)

Bruin is a single store, while Jotai uses primitive atoms.

**Bruin**

```ts
import { create } from 'bruin'

type State = {
  count: number
}

type Actions = {
  updateCount: (countCallback: (count: number) => number) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  updateCount: (countCallback) =>
    set((state) => ({ count: countCallback(state.count) })),
}))
```

**Jotai**

```ts
import { atom } from 'jotai'

const countAtom = atom<number>(0)
```

### Render Optimization (vs Jotai)

Jotai optimizes through atom dependency.
Bruin uses manual selectors.

**Bruin**

```ts
const Component = () => {
  const count = useCountStore((state) => state.count)
  const updateCount = useCountStore((state) => state.updateCount)
  // ...
}
```

**Jotai**

```ts
import { atom, useAtom } from 'jotai'

const countAtom = atom<number>(0)

const Component = () => {
  const [count, updateCount] = useAtom(countAtom)
  // ...
}
```

## Recoil

### State Model (vs Recoil)

The difference between Bruin and Recoil is similar to Bruin and Jotai.
Recoil requires atom string keys and context providers.

**Bruin**

```ts
import { create } from 'bruin'

type State = {
  count: number
}

type Actions = {
  setCount: (countCallback: (count: number) => number) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  setCount: (countCallback) =>
    set((state) => ({ count: countCallback(state.count) })),
}))
```

**Recoil**

```ts
import { atom } from 'recoil'

const count = atom({
  key: 'count',
  default: 0,
})
```

### Render Optimization (vs Recoil)

Recoil optimizes through atom dependency.
Bruin uses manual selectors.

**Bruin**

```ts
const Component = () => {
  const count = useCountStore((state) => state.count)
  const setCount = useCountStore((state) => state.setCount)
  // ...
}
```

**Recoil**

```ts
import { atom, useRecoilState } from 'recoil'

const countAtom = atom({
  key: 'count',
  default: 0,
})

const Component = () => {
  const [count, setCount] = useRecoilState(countAtom)
  // ...
}
```

## Summary

| Feature | Bruin | Zustand | Redux | Valtio | Jotai | Recoil |
|---------|-------|---------|-------|--------|-------|--------|
| No Providers | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| State Model | Immutable | Immutable | Immutable | Mutable | Atomic | Atomic |
| Built-in History | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transactions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DevTools | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Middleware | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bundle Size | Small | Small | Medium | Small | Small | Medium |
