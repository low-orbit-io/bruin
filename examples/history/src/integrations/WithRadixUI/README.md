# Radix UI Integration

This directory demonstrates how to use Bruin's headless history components with [Radix UI](https://www.radix-ui.com/) primitives.

## Components

### `RadixTimeline`

A full timeline list showing all history entries with Radix UI primitives.

**Features:**
- Uses `HeadlessTimelineList` under the hood
- Built with Radix Separator for visual dividers
- Semantic HTML with proper ARIA attributes
- Accessible by default
- Minimal, customizable styling

**Example:**

```tsx
import { RadixTimeline } from './integrations/WithRadixUI';

function App() {
  return (
    <RadixTimeline
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

### `RadixControls`

Compact undo/redo controls with a collapsible timeline using Radix Collapsible.

**Features:**
- Uses `HeadlessTimelineCompact` under the hood
- Radix Collapsible for smooth expand/collapse
- Undo/Redo buttons with proper disabled states
- Full keyboard navigation support
- Screen reader friendly with ARIA labels

**Example:**

```tsx
import { RadixControls } from './integrations/WithRadixUI';

function App() {
  return (
    <RadixControls
      store={myStore}
      title="History Controls"
      description="Navigate through your changes"
      renderEntryContent={(state) => state.count}
    />
  );
}
```

## Installation

To use these components, you need to install Radix UI primitives:

```bash
npm install @radix-ui/react-separator @radix-ui/react-collapsible
# or
pnpm add @radix-ui/react-separator @radix-ui/react-collapsible
# or
yarn add @radix-ui/react-separator @radix-ui/react-collapsible
```

## Setup

Import the styles (or customize them):

```tsx
import './integrations/WithRadixUI/styles.css';
```

The included styles are minimal and meant as a starting point. Radix UI components are **unstyled by default**, giving you complete control over the visual design.

## Customization

### Styling

The included `styles.css` provides basic styling. You can:

1. **Use the provided styles as-is** (good for prototypes)
2. **Customize the CSS variables and classes** (modify styles.css)
3. **Replace with your own styling solution** (Tailwind, CSS-in-JS, etc.)

Example with custom styles:

```tsx
<RadixTimeline
  store={myStore}
  renderEntryContent={(state, timestamp) => (
    <div className="my-custom-entry">
      <strong>Count:</strong> {state.count}
    </div>
  )}
/>
```

### Render Functions

Both components accept render functions to customize content:

```tsx
<RadixControls
  store={myStore}
  renderEntryContent={(state, timestamp) => (
    `State ${state.count} at ${new Date(timestamp).toLocaleString()}`
  )}
/>
```

## Key Patterns

### Radix Primitives Used

1. **Separator**: Visual dividers between sections
2. **Collapsible**: Smooth expand/collapse for the timeline view

### Accessibility Features

These components demonstrate Radix UI's accessibility advantages:

```tsx
// Proper ARIA attributes
<div role="listitem" aria-current={isCurrent ? 'true' : 'false'}>
  {/* Entry content */}
</div>

// Keyboard navigation
<button aria-label="Undo last change" onClick={undo}>
  ← Undo
</button>

// Screen reader friendly status
<span role="status">
  {currentIndex + 1} / {totalEntries}
</span>
```

### Wrapping Headless Components

Example of wrapping pattern:

```tsx
export function RadixControls({ store, title }) {
  return (
    <div className="radix-controls">
      <HeadlessTimelineCompact
        store={store}
        renderControls={({ undo, redo, toggleList }) => (
          <Collapsible.Root>  {/* Radix primitive */}
            <button onClick={undo}>Undo</button>
            <Collapsible.Trigger>Toggle</Collapsible.Trigger>
            <Collapsible.Content>
              {/* Timeline content */}
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      />
    </div>
  );
}
```

## Comparison with Other Integrations

| Feature | Mantine | Radix UI | Tailwind |
|---------|---------|----------|----------|
| Styling | Pre-styled | Unstyled primitives | Utility classes |
| Accessibility | Built-in | Excellent (primitives) | Manual |
| Dependencies | @mantine/core | Multiple primitives | Tailwind CSS |
| Customization | Mantine API | Full CSS control | Full utility control |
| Best for | Rapid development | Accessible, custom designs | Utility-first styling |

## Why Radix UI?

### Advantages

- **Accessibility First**: WAI-ARIA compliant out of the box
- **Unstyled**: Complete control over visual design
- **Composable**: Mix and match primitives as needed
- **Keyboard Navigation**: Built-in keyboard support
- **Framework Agnostic Styling**: Use any CSS solution

### When to Use

- Building accessible applications
- Need complete design control
- Want behavior without opinions
- Using a custom design system

### When to Use Something Else

- **Need rapid prototyping**: Use Mantine (pre-styled)
- **Prefer utility-first**: Use Tailwind integration
- **Want zero dependencies**: Use plain headless components

## Radix Primitives Deep Dive

### Collapsible

Used in `RadixControls` for the expandable timeline:

```tsx
<Collapsible.Root open={showList} onOpenChange={toggleList}>
  <Collapsible.Trigger>Toggle Timeline</Collapsible.Trigger>
  <Collapsible.Content>
    {/* Timeline entries */}
  </Collapsible.Content>
</Collapsible.Root>
```

Features:
- Smooth animations (CSS-based)
- Keyboard accessible
- Controlled/uncontrolled modes
- Proper ARIA attributes

### Separator

Used for visual dividers:

```tsx
<Separator.Root className="radix-separator" />
```

Features:
- Semantic `role="separator"`
- Horizontal/vertical orientations
- Decorative or meaningful

## Related

- [Headless Components](../../headless/README.md) - The unstyled base components
- [Mantine Integration](../WithMantine/README.md) - Pre-styled alternative
- [Tailwind Integration](../WithTailwind/README.md) - Utility-first approach
- [Radix UI Documentation](https://www.radix-ui.com/) - Official Radix UI docs
