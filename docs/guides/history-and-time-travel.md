---
title: History & Time Travel
description: Built-in history tracking and time-travel debugging in Bruin
nav: 100
---

# History & Time Travel

One of Bruin's key features is built-in history tracking. Every state change is
automatically recorded, enabling time-travel debugging, undo/redo functionality,
and detailed state inspection.

## Basic Usage

Every Bruin store automatically tracks its history:

```ts
import { create } from '@low-orbit/bruin';

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

## How Undo/Redo Works

### Complete State Restoration

Bruin uses a **snapshot-based approach** for history tracking. When you call
`undo()` or `redo()`, the **entire state** is restored to the previous snapshot,
not just the changed fields.

```ts
const useStore = create((set) => ({
  count: 0,
  name: 'Alice',
  setName: (name: string) => set({ name }),
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Modify state
useStore.getState().setName('Bob'); // State: { count: 0, name: 'Bob' }
useStore.getState().increment(); // State: { count: 1, name: 'Bob' }

// Undo restores the ENTIRE previous state
useStore.undo(); // State: { count: 0, name: 'Bob' } ✅
// Both count AND name are restored

useStore.undo(); // State: { count: 0, name: 'Alice' } ✅
// Complete initial state restored
```

Each history entry stores a **complete snapshot** of the entire state object at
that point in time. This ensures:

- **Reliability**: Exact state restoration without partial updates
- **Simplicity**: No complex diff/patch logic needed
- **Consistency**: All fields are guaranteed to be in sync

### Per-Store History Isolation

Each Bruin store maintains its **own independent history**. Undo/redo operations
only affect the store they're called on:

```ts
// Create two independent stores
const userStore = create((set) => ({
  name: 'Alice',
  setName: (name: string) => set({ name }),
}));

const counterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Modify both stores
userStore.getState().setName('Bob');
counterStore.getState().increment();
counterStore.getState().increment();

// Undo only affects the store you call it on
userStore.undo(); // userStore.name → 'Alice' ✅
// counterStore.count → still 2 ✅ (unchanged)

counterStore.undo(); // counterStore.count → 1 ✅
// userStore.name → still 'Alice' ✅ (unchanged)
```

**Key points:**

- Each store has its own history array and index
- Stores don't interfere with each other's history
- You must call `undo()`/`redo()` on the specific store you want to revert
- Perfect for applications with multiple independent state domains

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

// Get history
const history = store.getHistory();

// Check memory usage
const memInfo = store.getHistoryMemoryUsage();
console.log(`History using ${memInfo.totalBytes} bytes`);
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
import { create } from '@low-orbit/bruin';

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
  const currentIndex = useStore((state) => state.getCurrentHistoryIndex());

  return (
    <ul>
      {history.map((entry, index) => (
        <li
          key={index}
          className={index === currentIndex ? 'current' : ''}
        >
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
import { create } from '@low-orbit/bruin';
import { persist } from '@low-orbit/bruin/middleware';

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
import { create } from '@low-orbit/bruin';
import { devtools } from '@low-orbit/bruin/middleware';

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
import { create } from '@low-orbit/bruin';

const useStore = create(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  {
    maxHistorySize: 50, // Keep last 50 states (default: 50)
    maxHistoryMemory: 10 * 1024 * 1024, // Max 10MB of history (optional)
    estimateSize: (state) => {
      // Custom size estimator (optional)
      return JSON.stringify(state).length;
    },
    onMemoryLimitReached: (info) => {
      // Callback when memory limit is hit (optional)
      console.warn(`History memory limit reached. Removed ${info.entriesRemoved} entries.`);
    },
  },
);
```

### Memory Management

Bruin includes built-in memory estimation to prevent unbounded memory growth in long-running applications. You can set both count-based and memory-based limits:

```ts
const useStore = create(
  (set) => ({
    data: [],
    addItem: (item) => set((s) => ({ data: [...s.data, item] })),
  }),
  {
    maxHistorySize: 100, // Max 100 entries
    maxHistoryMemory: 25 * 1024 * 1024, // OR max 25MB
    // Whichever limit is hit first removes old entries
  },
);
```

#### Monitoring Memory Usage

Check current history memory usage:

```ts
const store = useStore.getState();
const memInfo = store.getHistoryMemoryUsage();

console.log(`Total: ${memInfo.totalBytes} bytes`);
console.log(`Average: ${memInfo.averageBytes} bytes per entry`);
console.log(`Entries: ${memInfo.entryCount}`);

if (memInfo.maxBytes) {
  console.log(`Limit: ${memInfo.maxBytes} bytes`);
  console.log(`Usage: ${memInfo.utilizationPercent}%`);
}
```

#### Custom Size Estimation

For stores with complex data structures, provide a custom size estimator:

```ts
const useStore = create(
  (set) => ({
    images: [],
    documents: [],
  }),
  {
    maxHistoryMemory: 50 * 1024 * 1024, // 50MB
    estimateSize: (state) => {
      let size = 0;
      // Images: base64 strings are ~1.33x original size
      state.images.forEach(img => {
        size += img.data.length * 0.75;
      });
      // Documents: already know their size
      state.documents.forEach(doc => {
        size += doc.sizeBytes;
      });
      return size;
    },
  },
);
```

## Best Practices

1. **Name your actions** - Makes debugging much easier
2. **Skip trivial updates** - Use `skipHistory` for UI-only state
3. **Set history limits** - Prevent memory issues in long-running apps
   - Use `maxHistorySize` for count-based limits
   - Use `maxHistoryMemory` for memory-based limits (recommended for large states)
   - Both limits work together - whichever is hit first removes old entries
4. **Monitor memory usage** - Use `getHistoryMemoryUsage()` to track memory consumption
5. **Clear history strategically** - After major workflows or user actions
6. **Use with DevTools** - Visualize your state changes
7. **Understand state restoration** - Remember that undo restores the entire
   state, not just changed fields
8. **Isolate concerns** - Use separate stores for independent domains to benefit
   from per-store history isolation
9. **Custom size estimation** - For stores with binary data or complex structures,
   provide a custom `estimateSize` function for more accurate memory tracking

## TypeScript

History methods are fully typed:

```ts
import { create } from '@low-orbit/bruin';

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

  return (
    <div className="history-viewer">
      <h3>State History</h3>
      {history.map((entry, index) => (
        <div
          key={index}
          className={index === currentIndex ? 'current' : ''}
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
