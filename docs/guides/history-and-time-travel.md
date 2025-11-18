---
title: History & Time Travel
description: Built-in history tracking and time-travel debugging in Bruin
nav: 100
---

# History & Time Travel

One of Bruin's key features is built-in history tracking. Every state change is automatically recorded,
enabling time-travel debugging, undo/redo functionality, and detailed state inspection.

## Basic Usage

Every Bruin store automatically tracks its history:

```ts
import { create } from 'bruin';

const useStore = create((set) => ({
  count: 0,
  increment: () =>
    set((state) => ({ count: state.count + 1 }), false, 'increment'),
  decrement: () =>
    set((state) => ({ count: state.count - 1 }), false, 'decrement'),
}));

// Access history methods
const store = useStore.getState();

// Undo last change
store.undo();

// Redo last undone change
store.redo();

// Get full history
const history = store.getHistory();
console.log(history);
// [
//   { state: { count: 0 }, action: 'init' },
//   { state: { count: 1 }, action: 'increment' },
//   { state: { count: 2 }, action: 'increment' },
// ]
```

## Naming Actions

Provide action names for better debugging:

```ts
const useStore = create((set) => ({
  count: 0,
  user: null,

  // Third parameter is the action name
  increment: () =>
    set((state) => ({ count: state.count + 1 }), false, 'increment counter'),

  setUser: (user) => set({ user }, false, `set user: ${user.name}`),
}));
```

Action names appear in:

- History timeline
- Redux DevTools
- Debug logs

## History Navigation

Navigate through state history programmatically:

```ts
const store = useStore.getState();

// Check if undo/redo available
console.log(store.canUndo()); // true if history exists
console.log(store.canRedo()); // true if future states exist

// Navigate history
if (store.canUndo()) {
  store.undo();
}

if (store.canRedo()) {
  store.redo();
}

// Jump to specific point in history
const history = store.getHistory();
store.jumpToHistoryIndex(2); // Go to third state
```

## Clearing History

Clear history when needed:

```ts
const store = useStore.getState();

// Clear all history
store.clearHistory();

// Or create a new "checkpoint"
store.clearHistory({ keepCurrent: true });
```

## Skipping History

Some updates shouldn't be tracked (e.g., UI-only state):

```ts
const useStore = create((set) => ({
  data: [],
  isLoading: false,

  fetchData: async () => {
    // Skip history for loading state
    set({ isLoading: true }, false, { skipHistory: true });

    const data = await fetch('/api/data');

    // Track this change
    set({ data, isLoading: false }, false, 'fetch data');
  },
}));
```

## History in React Components

Use history in your components:

```tsx
import { create } from 'bruin';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function HistoryControls() {
  const canUndo = useStore((state) => state.canUndo());
  const canRedo = useStore((state) => state.canRedo());
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);

  return (
    <div>
      <button disabled={!canUndo} onClick={undo}>
        Undo
      </button>
      <button disabled={!canRedo} onClick={redo}>
        Redo
      </button>
    </div>
  );
}

function HistoryTimeline() {
  const history = useStore((state) => state.getHistory());
  const jumpTo = useStore((state) => state.jumpToHistoryIndex);

  return (
    <ul>
      {history.map((entry, index) => (
        <li key={index} onClick={() => jumpTo(index)}>
          {entry.action || 'unnamed'}: {JSON.stringify(entry.state)}
        </li>
      ))}
    </ul>
  );
}
```

## Persist History

Use the persist middleware to save/restore history:

```ts
import { create } from 'bruin';
import { persist } from 'bruin/middleware';

const useStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'my-store',
      persistHistory: true, // Enable history persistence
    },
  ),
);
```

Now your history will be saved to localStorage and restored on page reload!

## DevTools Integration

History automatically integrates with Redux DevTools:

```ts
import { create } from 'bruin';
import { devtools } from 'bruin/middleware';

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    { name: 'MyStore' },
  ),
);
```

DevTools will show:

- Full history timeline
- Action names
- Time-travel capabilities
- State snapshots

## Configuration

Configure history behavior per store:

```ts
import { create } from 'bruin';

const useStore = create(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  {
    historyLimit: 50, // Keep last 50 states (default: unlimited)
    enableHistory: true, // Enable/disable history (default: true)
  },
);
```

## Best Practices

1. **Name your actions** - Makes debugging much easier
2. **Skip trivial updates** - Use `skipHistory` for UI-only state
3. **Set history limits** - Prevent memory issues in long-running apps
4. **Clear history strategically** - After major workflows or user actions
5. **Use with DevTools** - Visualize your state changes

## TypeScript

History methods are fully typed:

```ts
import { create } from 'bruin';

type Store = {
  count: number;
  increment: () => void;
  // History methods are automatically added
};

const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// All methods are typed
const store = useStore.getState();
store.undo(); // ✓ Type-safe
store.getHistory(); // ✓ Returns typed history entries
```

## Examples

### Undo/Redo Buttons

```tsx
function Editor() {
  const text = useStore((state) => state.text)
  const canUndo = useStore((state) => state.canUndo())
  const canRedo = useStore((state) => state.canRedo())
  const undo = useStore((state) => state.undo)
  const redo = useStore((state) => state.redo)

  return (
    <div>
      <textarea value={text} onChange={...} />
      <button disabled={!canUndo} onClick={undo}>↶ Undo</button>
      <button disabled={!canRedo} onClick={redo}>↷ Redo</button>
    </div>
  )
}
```

### History Viewer

```tsx
function HistoryDebugger() {
  const history = useStore((state) => state.getHistory());
  const currentIndex = useStore((state) => state.getCurrentHistoryIndex());
  const jumpTo = useStore((state) => state.jumpToHistoryIndex);

  return (
    <div className="history-viewer">
      <h3>State History</h3>
      {history.map((entry, index) => (
        <div
          key={index}
          className={index === currentIndex ? 'current' : ''}
          onClick={() => jumpTo(index)}
        >
          <strong>{entry.action}</strong>
          <pre>{JSON.stringify(entry.state, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
```

## Related

- [Transactions](./transactions.md) - Batch multiple updates
- [DevTools Middleware](../middlewares/devtools.md) - Debug with Redux DevTools
- [Persist Middleware](../middlewares/persist.md) - Save history to storage
