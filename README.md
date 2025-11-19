# Bruin 🐻

[![npm version](https://img.shields.io/npm/v/@low-orbit/bruin.svg)](https://www.npmjs.com/package/@low-orbit/bruin)
[![npm downloads](https://img.shields.io/npm/dm/@low-orbit/bruin.svg)](https://www.npmjs.com/package/@low-orbit/bruin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A small, fast state-management solution with built-in undo/redo history. Based on [Zustand](https://github.com/pmndrs/zustand).

If you know Zustand, you already know Bruin. Plus history.

## Installation

```bash
npm install @low-orbit/bruin
# or
pnpm add @low-orbit/bruin
# or
yarn add @low-orbit/bruin
```

## First create a store

Your store is a hook! You can put anything in it: primitives, objects, functions. History is automatic.

```jsx
import { create } from '@low-orbit/bruin';

const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));
```

## Then bind your components, and that's it!

Use the hook anywhere. Access undo/redo directly from the store.

```jsx
function Counter() {
  const { count, inc } = useStore();
  const { undo, redo, canUndo, canRedo } = useStore;

  return (
    <>
      <span>{count}</span>
      <button onClick={inc}>+1</button>
      <button onClick={undo} disabled={!canUndo}>
        undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        redo
      </button>
    </>
  );
}
```

## History Features

Bruin adds automatic undo/redo history to every store:

```jsx
const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

// Undo/redo methods available on the store
useStore.undo(); // Go back one step (restores entire state)
useStore.redo(); // Go forward one step (restores entire state)
useStore.canUndo(); // Check if undo is possible
useStore.canRedo(); // Check if redo is possible
```

**Important:** Undo/redo restores the **entire state** to the previous snapshot (not just changed fields). Each store maintains its **own independent history** - calling `undo()` on one store doesn't affect others.

### Transactions

Transactions group multiple changes:

```jsx
// Option 1: Using set.transaction (recommended)
const useStore = create((set) => ({
  count: 0,
  name: '',
  initialize: () =>
    set.transaction(
      () => {
        set({ count: 1 });
        set({ name: 'John' });
      },
      { name: 'Initialize User' },
    ),
}));

// Option 2: Using store.transaction
useStore.transaction(
  () => {
    useStore.setState({ count: 1 });
    useStore.setState({ name: 'John' });
  },
  { name: 'Initialize User' },
);
```

## Middleware

All Zustand middleware works out of the box:

### Persist

```jsx
import { persist, createJSONStorage } from '@low-orbit/bruin/middleware';

const useStore = create(
  persist((set) => ({ count: 0 }), {
    name: 'counter-storage',
    storage: createJSONStorage(() => localStorage),
    persistHistory: true, // NEW: Persist undo/redo history across sessions
  }),
);
```

### DevTools

```jsx
import { devtools } from '@low-orbit/bruin/middleware';

const useStore = create(
  devtools((set) => ({ count: 0 }), { name: 'CounterStore' }),
);
```

### SubscribeWithSelector

```jsx
import { subscribeWithSelector } from '@low-orbit/bruin/middleware';

const useStore = create(
  subscribeWithSelector((set) => ({
    position: { x: 0, y: 0 },
  })),
);

// Only notified when position.x changes
useStore.subscribe(
  (state) => state.position.x,
  (x, prevX) => console.log('x changed:', prevX, '->', x),
);
```

### Combine

```jsx
import { combine } from '@low-orbit/bruin/middleware';

const useStore = create(
  combine(
    { count: 0 }, // Initial state
    (set) => ({
      // Actions
      inc: () => set((s) => ({ count: s.count + 1 })),
    }),
  ),
);
```

### Redux

```jsx
import { redux } from '@low-orbit/bruin/middleware';

const useStore = create(
  redux(
    (state, action) => {
      switch (action.type) {
        case 'INC':
          return { ...state, count: state.count + 1 };
        default:
          return state;
      }
    },
    { count: 0 },
  ),
);

useStore.dispatch({ type: 'INC' });
```

## Vanilla Usage

Works without React too:

```js
import { createStore } from '@low-orbit/bruin/vanilla';

const store = createStore((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));

store.getState().count; // 0
store.getState().inc();
store.getState().count; // 1
store.undo();
store.getState().count; // 0
```

## Shallow Comparison

Prevent unnecessary re-renders:

```jsx
import { useShallow } from '@low-orbit/bruin/react/shallow';

const items = useStore(useShallow((state) => state.items));
```

## TypeScript

Full TypeScript support with excellent inference:

```tsx
import { create } from '@low-orbit/bruin';

interface BearState {
  bears: number;
  addBear: () => void;
  removeBear: () => void;
}

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  removeBear: () => set((state) => ({ bears: state.bears - 1 })),
}));
```

## What's Different from Zustand?

Bruin is 100% compatible with Zustand, plus:

- ✅ **Automatic undo/redo** - Built-in history for every store
- ✅ **Transactions** - Group multiple state changes
- ✅ **History persistence** - Optional `persistHistory` in persist middleware
- ✅ **Path subscriptions** - Subscribe to specific object paths
- ✅ **Structural sharing** - Efficient updates via Immer (built-in)

Everything else works exactly like Zustand.

## License

MIT - Derivative work based on Zustand. See [LICENSE](./LICENSE) for attribution.
