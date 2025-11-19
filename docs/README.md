# Bruin Documentation

Welcome to the Bruin documentation! Bruin is a modern state management library that extends Zustand with powerful features like built-in history tracking and transactions.

## Quick Links

### Getting Started

- [Introduction](./getting-started/introduction.md) - Learn the basics of Bruin
- [Comparison](./getting-started/comparison.md) - How Bruin compares to other libraries

### Core APIs

- [create](./apis/create.md) - Create a Bruin store
- [createStore](./apis/create-store.md) - Create a vanilla store
- [shallow](./apis/shallow.md) - Shallow equality comparison

### Bruin Features

- [History & Time Travel](./guides/history-and-time-travel.md) - Built-in undo/redo
- [Transactions](./guides/transactions.md) - Batch state updates atomically

### Hooks

- [useStore](./hooks/use-store.md) - Basic store hook
- [useShallow](./hooks/use-shallow.md) - Shallow comparison hook

### Guides

- [TypeScript Guide](./guides/beginner-typescript.md) - Using Bruin with TypeScript
- [Testing](./guides/testing.md) - How to test Bruin stores
- [Next.js Integration](./guides/nextjs.md) - Using Bruin with Next.js
- [SSR & Hydration](./guides/ssr-and-hydration.md) - Server-side rendering

### Middleware

- [Persist](./middlewares/persist.md) - Persist state to storage
- [Devtools](./middlewares/devtools.md) - Redux DevTools integration
- [Immer](./middlewares/immer.md) - Use Immer for immutability
- [Redux](./middlewares/redux.md) - Redux-style patterns
- [Combine](./middlewares/combine.md) - Combine multiple stores

### Integrations

- [Third-Party Libraries](./integrations/third-party-libraries.md) - Use Bruin with other libs
- [Immer Middleware](./integrations/immer-middleware.md) - Immer integration details

## 100% Zustand Compatible

Bruin is a drop-in replacement for Zustand. All Zustand code works with Bruin - just change your imports:

```diff
- import { create } from 'zustand'
+ import { create } from '@low-orbit/bruin'
```

No migration needed, no breaking changes!

## What Makes Bruin Special?

### Built-in History

Every store automatically tracks state changes:

```ts
const store = useStore.getState();
store.undo(); // Go back
store.redo(); // Go forward
store.getHistory(); // View all states
store.getHistoryMemoryUsage(); // Monitor memory usage
```

Configure memory limits to prevent unbounded growth:

```ts
const useStore = create(
  (set) => ({ count: 0 }),
  {
    maxHistorySize: 100, // Max 100 entries
    maxHistoryMemory: 25 * 1024 * 1024, // OR max 25MB
  },
);
```

### Transactions

Batch multiple updates into one atomic change:

```ts
set.transaction(
  () => {
    set({ field1: 'value1' });
    set({ field2: 'value2' });
  },
  { name: 'Update multiple fields' },
);
```

### Enhanced Middleware

All Zustand middleware works, plus:

- Persist middleware can save/restore history
- Devtools middleware shows history timeline
- Memory-based history limits to prevent unbounded growth
- Full TypeScript support

## Contributing

Found an issue or want to contribute? Check out our [GitHub repository](https://github.com/low-orbit-io/bruin).

## License

MIT
