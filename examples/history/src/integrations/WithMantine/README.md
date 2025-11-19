# Mantine UI Integration

This directory demonstrates how to use Bruin's headless history components with [Mantine UI](https://mantine.dev/).

## Components

### `MantineTimeline`

A full timeline list showing all history entries with Mantine styling.

**Features:**
- Uses `HeadlessTimelineList` under the hood
- Styled with Mantine Card, Badge, and Group components
- Highlights the current history position
- Customizable entry rendering

**Example:**

```tsx
import { MantineTimeline } from './integrations/WithMantine';

function App() {
  return (
    <MantineTimeline
      store={myStore}
      title="State History"
      description="All state changes are tracked here"
      renderEntryContent={(state) => (
        <span>Count: {state.count}</span>
      )}
    />
  );
}
```

### `MantineControls`

Compact undo/redo controls with an expandable timeline.

**Features:**
- Uses `HeadlessTimelineCompact` under the hood
- Undo/Redo buttons with disabled states
- Current position indicator (e.g., "3 / 10")
- Toggle to show/hide full timeline
- Status badges showing undo/redo availability

**Example:**

```tsx
import { MantineControls } from './integrations/WithMantine';

function App() {
  return (
    <MantineControls
      store={myStore}
      title="History Controls"
      description="Navigate through your changes"
      renderEntryContent={(state) => state.count}
    />
  );
}
```

## Installation

To use these components, you need to install Mantine:

```bash
npm install @mantine/core @mantine/hooks
# or
pnpm add @mantine/core @mantine/hooks
# or
yarn add @mantine/core @mantine/hooks
```

## Setup

Wrap your app with Mantine's provider:

```tsx
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

function App() {
  return (
    <MantineProvider>
      {/* Your app */}
    </MantineProvider>
  );
}
```

## Customization

Both components accept render functions to customize how entries are displayed:

```tsx
<MantineTimeline
  store={myStore}
  renderEntryContent={(state, timestamp) => (
    <div>
      <strong>Count:</strong> {state.count}
      <small>{new Date(timestamp).toLocaleString()}</small>
    </div>
  )}
/>
```

## Key Patterns

### Wrapping Headless Components

These components demonstrate the "headless wrapper" pattern:

1. **Accept the same core props** (store, render functions)
2. **Add UI library-specific props** (title, description, Mantine styling props)
3. **Use the headless component internally** for all logic
4. **Provide styled render functions** that use Mantine components

### Example: Timeline Wrapper

```tsx
export function MantineTimeline({ store, title, renderEntryContent }) {
  return (
    <Card withBorder>  {/* Mantine styling */}
      <HeadlessTimelineList
        store={store}  {/* Pass through core props */}
        renderEntry={(entry, index, isCurrent) => (
          <Card>  {/* Mantine-styled entry */}
            {renderEntryContent(entry.state, entry.timestamp)}
          </Card>
        )}
      />
    </Card>
  );
}
```

## Comparison with Headless

| Feature | Headless | Mantine Integration |
|---------|----------|---------------------|
| Styling | None (you provide) | Pre-styled with Mantine |
| Flexibility | Maximum | Opinionated design |
| Dependencies | Zero UI deps | Requires @mantine/core |
| Customization | Full control via render props | Limited to Mantine's API |
| Best for | Custom designs | Quick prototypes, Mantine apps |

## Design Decisions

### Why These Components?

- **Timeline**: Shows all history in a vertical list - good for detailed inspection
- **Controls**: Compact undo/redo UI - good for inline controls

### Mantine-Specific Features Used

- **Card with withBorder**: Clean section containers
- **Badge**: Status indicators and timeline markers
- **Button with disabled states**: Proper undo/redo UX
- **Group and Stack**: Consistent spacing and alignment
- **Color variants**: Visual feedback (filled vs light, colors)

## Related

- [Headless Components](../../headless/README.md) - The unstyled base components
- [Radix UI Integration](../WithRadixUI/README.md) - Alternative UI library
- [Tailwind Integration](../WithTailwind/README.md) - Utility-first approach
