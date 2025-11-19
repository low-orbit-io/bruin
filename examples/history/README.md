# Bruin History Visualization Examples

Reference implementations showing how to build history visualization UIs with Bruin.

**Philosophy:** These are **examples to learn from and copy**, not a component library to install.

## 🎯 Start Here: Headless Components

The `/src/headless` directory contains unstyled components with zero dependencies.
These work with ANY UI library or styling approach.

### Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to see the demo.

## What's Inside

### Headless Components (`/src/headless`)

Core functionality with zero styling:

- **HeadlessTimelineList** - List-based timeline with custom entry renderer
- **HeadlessTimelineCompact** - Compact undo/redo controls
- **useHistoryState** - React hook for history state

**Why headless?**
- ✅ No UI library lock-in
- ✅ Maximum flexibility
- ✅ Zero dependencies (beyond React)
- ✅ Learn the patterns first

### Demo Application (`/src/main.tsx`)

The demo shows:
1. Counter with multiple actions that create history
2. Compact timeline with undo/redo controls
3. Full timeline list showing all entries
4. Current position highlighting

**Styling:** Uses Tailwind CSS (via CDN) for simple demo styling

## Usage Examples

### HeadlessTimelineList

```tsx
import { HeadlessTimelineList } from './headless';

<HeadlessTimelineList
  store={myStore}
  renderEntry={(entry, index, isCurrent) => (
    <div className={isCurrent ? 'current' : ''}>
      <strong>{entry.name || 'Unnamed'}</strong>
      <time>{new Date(entry.timestamp).toLocaleTimeString()}</time>
    </div>
  )}
/>
```

### HeadlessTimelineCompact

```tsx
import { HeadlessTimelineCompact } from './headless';

<HeadlessTimelineCompact
  store={myStore}
  renderControls={({ canUndo, canRedo, undo, redo, currentIndex, totalEntries }) => (
    <div className="flex gap-2">
      <button onClick={undo} disabled={!canUndo}>←</button>
      <span>{currentIndex + 1} / {totalEntries}</span>
      <button onClick={redo} disabled={!canRedo}>→</button>
    </div>
  )}
/>
```

### useHistoryState Hook

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

## Customization

**All components are examples** - copy and modify for your needs!

### Styling Approaches

The headless components work with any styling solution:

- **Tailwind CSS**: Use utility classes (like in the demo)
- **CSS Modules**: Import your styles
- **Styled Components**: Wrap in styled components
- **Plain CSS**: Use className prop
- **UI Libraries**: Mantine, Radix, MUI, Chakra, etc.

### Adding Features

Consider adding:
- Search/filter history entries
- Export/import history as JSON
- Diff view between states
- Visual branching for undo trees
- Performance metrics
- Memory usage indicators
- Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)

## Coming Soon

- `/src/integrations` - Examples with popular UI libraries (Mantine, Radix, MUI, etc.)
- `/src/demos` - Complete demo applications (TodoApp, TextEditor, etc.)

## File Structure

```
examples/history/
├── src/
│   ├── headless/              # Headless components (START HERE)
│   │   ├── types.ts
│   │   ├── useHistoryState.ts
│   │   ├── HeadlessTimelineList.tsx
│   │   ├── HeadlessTimelineCompact.tsx
│   │   ├── index.ts
│   │   └── README.md
│   ├── integrations/          # UI library examples (coming soon)
│   ├── demos/                 # Complete demos (coming soon)
│   └── main.tsx               # Demo application
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md (this file)
```

## Learn More

- [Bruin Documentation](../../docs)
- [History & Time Travel Guide](../../docs/guides/history-and-time-travel.md)
- [Core API Documentation](../../docs/apis/create-store.md)

## License

MIT - Same as Bruin core
