# Tailwind CSS Integration

This directory demonstrates how to use Bruin's headless history components with [Tailwind CSS](https://tailwindcss.com/).

## Components

### `TailwindTimeline`

A full timeline list showing all history entries with Tailwind utility classes.

**Features:**
- Uses `HeadlessTimelineList` under the hood
- Styled with Tailwind utility classes
- Responsive design out of the box
- Easy to customize with Tailwind's utilities
- Highlights the current history position

**Example:**

```tsx
import { TailwindTimeline } from './integrations/WithTailwind';

function App() {
  return (
    <TailwindTimeline
      store={myStore}
      title="State History"
      description="All state changes are tracked here"
      renderEntryContent={(state) => (
        <span className="font-semibold">Count: {state.count}</span>
      )}
    />
  );
}
```

### `TailwindControls`

Compact undo/redo controls with an expandable timeline.

**Features:**
- Uses `HeadlessTimelineCompact` under the hood
- Undo/Redo buttons with smooth transitions
- Current position indicator (e.g., "3 / 10")
- Toggle to show/hide full timeline
- Status badges with color-coded feedback

**Example:**

```tsx
import { TailwindControls } from './integrations/WithTailwind';

function App() {
  return (
    <TailwindControls
      store={myStore}
      title="History Controls"
      description="Navigate through your changes"
      renderEntryContent={(state) => state.count}
    />
  );
}
```

## Installation

To use these components, you need to have Tailwind CSS installed:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Or if using Vite (like this example):

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Setup

1. Configure your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

2. Add Tailwind directives to your CSS:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Customization

### Using Tailwind's Utility Classes

The power of Tailwind is that you can easily customize by modifying utility classes:

```tsx
<TailwindTimeline
  store={myStore}
  renderEntryContent={(state, timestamp) => (
    <div className="flex items-center gap-4">
      <span className="text-lg font-bold text-blue-600">
        Count: {state.count}
      </span>
      <span className="text-xs text-gray-500">
        {new Date(timestamp).toLocaleString()}
      </span>
    </div>
  )}
/>
```

### Responsive Design

Tailwind makes responsive design simple:

```tsx
<div className="
  grid grid-cols-1           /* Mobile: 1 column */
  md:grid-cols-2             /* Tablet: 2 columns */
  lg:grid-cols-3             /* Desktop: 3 columns */
  gap-4
">
  <TailwindTimeline store={store1} />
  <TailwindTimeline store={store2} />
  <TailwindTimeline store={store3} />
</div>
```

### Dark Mode

Add dark mode support easily:

```tsx
<div className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">
  <TailwindTimeline store={myStore} />
</div>
```

## Key Patterns

### Utility-First Styling

These components demonstrate the utility-first pattern:

1. **No custom CSS classes needed**
2. **Compose styles directly in JSX**
3. **Easy to see what styles are applied**
4. **Consistent design tokens from Tailwind**

### Conditional Classes

Using template literals for conditional styling:

```tsx
<div
  className={`
    p-3 mb-2 rounded-lg border-2 transition-all
    ${
      isCurrent
        ? 'bg-blue-50 border-blue-500 shadow-md'
        : 'bg-white border-gray-200 hover:border-gray-300'
    }
  `}
>
  {/* Entry content */}
</div>
```

### Helper: `clsx` or `classnames`

For complex conditional classes, consider using a helper:

```tsx
import clsx from 'clsx';

<div
  className={clsx(
    'p-3 mb-2 rounded-lg border-2 transition-all',
    isCurrent ? [
      'bg-blue-50',
      'border-blue-500',
      'shadow-md',
    ] : [
      'bg-white',
      'border-gray-200',
      'hover:border-gray-300',
    ]
  )}
>
```

## Common Tailwind Patterns Used

### Layout

```tsx
className="flex items-center justify-between gap-4"
className="grid grid-cols-3 gap-4"
className="space-y-4"  // Vertical spacing
```

### Spacing

```tsx
className="p-6"       // Padding
className="m-4"       // Margin
className="px-4 py-2" // Horizontal and vertical padding
className="gap-3"     // Gap in flex/grid
```

### Colors

```tsx
className="bg-blue-500 text-white"
className="border-gray-200"
className="hover:bg-blue-600"
```

### Typography

```tsx
className="text-xl font-bold"
className="text-sm text-gray-600"
className="font-mono"
```

### Effects

```tsx
className="shadow-lg"
className="rounded-lg"
className="transition-all"
className="hover:shadow-md"
```

### States

```tsx
className="disabled:opacity-50 disabled:cursor-not-allowed"
className="hover:bg-gray-300"
className="focus:ring-2 focus:ring-blue-500"
```

## Comparison with Other Integrations

| Feature | Mantine | Radix UI | Tailwind |
|---------|---------|----------|----------|
| Styling | Pre-styled components | Unstyled primitives | Utility classes |
| Customization | Mantine theme API | Full CSS control | Tailwind config + utilities |
| Bundle Size | Larger (components) | Smaller (primitives) | Varies (purged) |
| Learning Curve | Mantine API | HTML + ARIA | Utility classes |
| Best for | Rapid prototyping | Accessibility-first | Utility-first styling |

## Why Tailwind?

### Advantages

- **Utility-First**: Compose styles from utility classes
- **No CSS Files**: All styling in JSX (optional CSS for base styles)
- **Responsive Design**: Built-in responsive utilities
- **Design System**: Consistent spacing, colors, typography
- **PurgeCSS**: Only ship CSS you use
- **Customizable**: Extend with custom utilities

### When to Use

- You prefer utility-first CSS
- Want rapid iteration without writing CSS
- Need responsive design out of the box
- Building a custom design system
- Want to keep styles colocated with components

### When to Use Something Else

- **Need pre-built components**: Use Mantine
- **Need accessible primitives**: Use Radix UI
- **Prefer semantic CSS**: Use plain headless components
- **Team unfamiliar with Tailwind**: Consider alternatives

## Advanced Patterns

### Custom Wrapper with Tailwind

Create your own wrapper with custom Tailwind classes:

```tsx
export function MyCustomTimeline({ store }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl">
      <TailwindTimeline
        store={store}
        title="My Custom Timeline"
        renderEntryContent={(state) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {state.count}
            </div>
            <span className="text-lg">State #{state.count}</span>
          </div>
        )}
      />
    </div>
  );
}
```

### Extending Tailwind Config

Add custom colors, spacing, or utilities:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'timeline-current': '#3b82f6',
        'timeline-past': '#9ca3af',
      },
      spacing: {
        'timeline': '2.5rem',
      },
    },
  },
}
```

Then use in components:

```tsx
<div className="bg-timeline-current p-timeline">
  {/* Content */}
</div>
```

## Related

- [Headless Components](../../headless/README.md) - The unstyled base components
- [Mantine Integration](../WithMantine/README.md) - Pre-styled alternative
- [Radix UI Integration](../WithRadixUI/README.md) - Accessible primitives
- [Tailwind CSS Documentation](https://tailwindcss.com/) - Official Tailwind docs
