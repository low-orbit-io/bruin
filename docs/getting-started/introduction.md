---
title: Introduction
description: How to use Bruin
nav: 0
---

# Introduction to Bruin

A fast, scalable state management solution with built-in history tracking and transactions.

Bruin extends Zustand's simple API with powerful features like time-travel debugging,
automatic history management, and transactional state updates.
It maintains full backward compatibility with Zustand while adding modern state management capabilities.

Bruin solves common React state management challenges, including the [zombie child problem],
[React concurrency], and [context loss] between mixed renderers -
just like Zustand, but with enhanced developer experience.

[zombie child problem]: https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
[react concurrency]: https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md
[context loss]: https://github.com/facebook/react/issues/13332

## Installation

Bruin is available as a package on NPM:

```bash
# NPM
npm install @low-orbit/bruin

# Yarn
yarn add @low-orbit/bruin

# PNPM
pnpm add @low-orbit/bruin
```

## First create a store

Your store is a hook! You can put anything in it: primitives, objects, functions.
The `set` function _merges_ state by default.

```tsx
import { create } from '@low-orbit/bruin';

interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

const useBear = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears: number) => set({ bears: newBears }),
}));
```

## Then bind your components, and that's it!

You can use the hook anywhere, without the need of providers.
Select your state and the consuming component will re-render when that state changes.
Undo and redo are available directly on the store.

```tsx
function BearCounter() {
  const bears = useBear((state) => state.bears);
  return <h1>{bears} bears around here...</h1>;
}

function Controls() {
  const increasePopulation = useBear((state) => state.increasePopulation);
  const { undo, redo, canUndo, canRedo } = useBear;
  return (
    <>
      <button onClick={increasePopulation}>one up</button>
      <button onClick={undo} disabled={!canUndo}>undo</button>
      <button onClick={redo} disabled={!canRedo}>redo</button>
    </>
  );
}
```

## Built-in History Tracking

Bruin automatically tracks state changes, enabling time-travel debugging:

```tsx
import { create } from '@low-orbit/bruin';

interface StoreState {
  count: number;
  increment: () => void;
}

const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () =>
    set((state) => ({ count: state.count + 1 })),
}));

// Access history
const store = useStore.getState();
console.log(store.getHistory()); // Array of complete state snapshots
store.undo(); // Restore entire previous state
store.redo(); // Restore entire next state
store.canUndo(); // Check if undo is possible
store.canRedo(); // Check if redo is possible
```

**Note:** Undo/redo restores the **entire state** to the previous snapshot (not just changed fields). Each store maintains its **own independent history** - multiple stores don't interfere with each other.

## Transactions

Batch multiple state updates into a single atomic change:

```tsx
import { create } from '@low-orbit/bruin';

interface StoreState {
  count: number;
  name: string;
  updateBoth: () => void;
}

const useStore = create<StoreState>((set) => ({
  count: 0,
  name: 'Alice',
  updateBoth: () => {
    set.transaction(
      () => {
        set({ count: 10 });
        set({ name: 'Bob' });
      },
      { name: 'Update both' },
    );
  },
}));
```

## 100% Zustand Compatible

Bruin is a drop-in replacement for Zustand. Simply replace `zustand` with `@low-orbit/bruin` in your imports,
and you're ready to go - no breaking changes, no migration needed!

## What's Next?

- Learn about [Bruin vs Zustand](./comparison.md)
- Explore [advanced TypeScript usage](../guides/advanced-typescript.md)
- Discover [middleware options](../middlewares/persist.md)
- Check out the [testing guide](../guides/testing.md)
