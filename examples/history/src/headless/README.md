# Headless History Components

Unstyled, flexible components for visualizing Bruin history.

## Philosophy

These components provide **logic without styling**. You control the appearance completely through:
- Custom render functions
- Your own CSS/styling solution
- Any UI library you prefer

**Zero dependencies** beyond React and Bruin.

## Components

### HeadlessTimelineList

List-based timeline that renders each history entry with your custom renderer.

```tsx
import { HeadlessTimelineList } from './headless';

<HeadlessTimelineList
  store={myStore}
  renderEntry={(entry, index, isCurrent) => (
    <div className={isCurrent ? 'bg-blue-100' : ''}>
      <strong>{entry.name || 'Unnamed'}</strong>
      <time>{new Date(entry.timestamp).toLocaleTimeString()}</time>
    </div>
  )}
/>
```

**Props:**
- `store`: Your Bruin store instance
- `renderEntry`: Function to render each entry
- `emptyMessage`: What to show when history is empty (optional)
- `className`, `style`: Standard React props (optional)

### HeadlessTimelineCompact

Minimal undo/redo controls with optional expandable list.

```tsx
import { HeadlessTimelineCompact } from './headless';

<HeadlessTimelineCompact
  store={myStore}
  renderControls={({ canUndo, canRedo, currentIndex, totalEntries, undo, redo, toggleList }) => (
    <div className="flex gap-2">
      <button onClick={undo} disabled={!canUndo}>←</button>
      <span>{currentIndex + 1} / {totalEntries}</span>
      <button onClick={redo} disabled={!canRedo}>→</button>
      <button onClick={toggleList}>History</button>
    </div>
  )}
  renderList={(entries, currentIndex) => (
    <ul>
      {entries.map((entry, index) => (
        <li key={index} className={index === currentIndex ? 'font-bold' : ''}>
          {entry.name}
        </li>
      ))}
    </ul>
  )}
/>
```

**Props:**
- `store`: Your Bruin store instance
- `renderControls`: Function to render undo/redo controls (optional)
- `renderList`: Function to render expanded list (optional)
- `showList`: Controlled visibility (optional)
- `onToggleList`: Callback when list is toggled (optional)
- `className`, `style`: Standard React props (optional)

## Custom Hook

### useHistoryState

React hook to access history state reactively.

```tsx
import { useHistoryState } from './headless';

function MyComponent() {
  const { history, currentIndex, canUndo, canRedo, undo, redo } = useHistoryState(myStore);

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <span>Position: {currentIndex + 1} of {history.length}</span>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

**Returns:**
- `history`: Array of history entries
- `currentIndex`: Current position in history
- `canUndo`: Boolean - can go back
- `canRedo`: Boolean - can go forward
- `undo`: Function to undo
- `redo`: Function to redo

## TypeScript Types

All components are fully typed. Import types from `./headless`:

```tsx
import type {
  HistoryEntry,
  HistoryState,
  HeadlessTimelineListProps,
  HeadlessTimelineCompactProps
} from './headless';
```

## Why Headless?

**Flexibility**: Works with any CSS framework or design system
**No Lock-in**: Not tied to a specific UI library
**Learning**: Understand the patterns before adding styling
**Control**: You decide how it looks and behaves

## Next Steps

See the `/integrations` directory for examples of wrapping these headless components with popular UI libraries:
- Mantine
- Radix UI
- Material-UI
- Chakra UI
- Tailwind CSS
