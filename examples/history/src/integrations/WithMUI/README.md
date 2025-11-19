# Material-UI (MUI) Integration

This directory demonstrates how to use Bruin's headless history components with [Material-UI](https://mui.com/).

## Components

### `MUITimeline`

A full timeline list showing all history entries with Material-UI styling.

**Features:**
- Uses `HeadlessTimelineList` under the hood
- Styled with MUI Card, Paper, and Chip components
- Material Design elevation and transitions
- Highlights the current history position
- Customizable entry rendering

**Example:**

```tsx
import { MUITimeline } from './integrations/WithMUI';

function App() {
  return (
    <MUITimeline
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

### `MUIControls`

Compact undo/redo controls with a collapsible timeline using MUI Collapse.

**Features:**
- Uses `HeadlessTimelineCompact` under the hood
- MUI Button components with proper states
- Collapse animation for timeline
- Chip components for status and entries
- Current position indicator (e.g., "3 / 10")

**Example:**

```tsx
import { MUIControls } from './integrations/WithMUI';

function App() {
  return (
    <MUIControls
      store={myStore}
      title="History Controls"
      description="Navigate through your changes"
      renderEntryContent={(state) => state.count}
    />
  );
}
```

## Installation

To use these components, you need to install Material-UI:

```bash
npm install @mui/material @emotion/react @emotion/styled
# or
pnpm add @mui/material @emotion/react @emotion/styled
# or
yarn add @mui/material @emotion/react @emotion/styled
```

## Setup

Wrap your app with MUI's ThemeProvider:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Customization

### Using MUI Theme

Customize colors and spacing through the theme:

```tsx
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});
```

### Custom Styling with `sx` Prop

MUI components accept the `sx` prop for inline styling:

```tsx
<MUITimeline
  store={myStore}
  renderEntryContent={(state, timestamp) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="h6" color="primary.main">
        Count: {state.count}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {new Date(timestamp).toLocaleString()}
      </Typography>
    </Box>
  )}
/>
```

### Render Functions

Both components accept render functions to customize content:

```tsx
<MUIControls
  store={myStore}
  renderEntryContent={(state, timestamp) => (
    `State ${state.count} at ${new Date(timestamp).toLocaleString()}`
  )}
/>
```

## Key Patterns

### Material Design Principles

These components follow Material Design guidelines:

1. **Elevation**: Cards use elevation prop for depth
2. **Transitions**: Smooth animations on state changes
3. **Typography**: Consistent text hierarchy with variant prop
4. **Color System**: Uses theme palette for consistency
5. **Spacing**: MUI spacing scale (theme.spacing())

### MUI Components Used

- **Card/CardContent**: Container for sections
- **Paper**: Individual timeline entries
- **Button**: Action buttons with variants (contained, outlined)
- **Chip**: Status indicators and badges
- **Collapse**: Smooth expand/collapse animation
- **Typography**: Text with semantic variants
- **Stack/Box**: Layout primitives
- **Divider**: Visual separators

### Component Composition

Example of MUI composition pattern:

```tsx
<Card elevation={2}>
  <CardContent>
    <Stack spacing={2}>
      <Typography variant="h5">Title</Typography>
      <Divider />
      <Box>
        <Button variant="contained">Action</Button>
      </Box>
    </Stack>
  </CardContent>
</Card>
```

## Comparison with Other Integrations

| Feature | Tailwind | Mantine | Radix UI | MUI |
|---------|----------|---------|----------|-----|
| Styling | Utility classes | Pre-styled | Unstyled primitives | Material Design |
| Customization | High (config) | Medium (theme) | Maximum (CSS) | Medium (theme) |
| Design System | Custom | Mantine design | Any design | Material Design |
| Bundle Size | Small (purged) | Large | Small | Large |
| Best For | Custom designs | Rapid dev | Accessible apps | Material Design apps |

## Why Material-UI?

### Advantages

- **Material Design**: Google's design system built-in
- **Comprehensive**: 60+ components out of the box
- **Theming**: Powerful theming system with design tokens
- **TypeScript**: Excellent TypeScript support
- **Enterprise Ready**: Battle-tested at scale
- **Accessibility**: WCAG compliant components

### When to Use

- Building Material Design applications
- Need comprehensive component library
- Want consistent design system
- TypeScript-first development
- Enterprise applications

### When to Use Something Else

- **Need smaller bundle**: Use Tailwind or Radix UI
- **Custom design system**: Use headless components
- **Prefer utility-first**: Use Tailwind integration
- **Need maximum flexibility**: Use headless components

## Advanced Patterns

### Theming

Create custom theme with your brand colors:

```tsx
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  spacing: 8, // Base spacing unit (8px)
});
```

### Responsive Design

Use MUI's responsive utilities:

```tsx
<Stack
  direction={{ xs: 'column', sm: 'row' }}
  spacing={{ xs: 1, sm: 2, md: 4 }}
>
  <MUITimeline store={store} />
</Stack>
```

### Dark Mode

MUI supports dark mode through theme:

```tsx
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <MUITimeline store={store} />
    </ThemeProvider>
  );
}
```

### Custom Variants

Extend MUI components with custom variants:

```tsx
const theme = createTheme({
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'dashed' },
          style: {
            border: '2px dashed grey',
          },
        },
      ],
    },
  },
});
```

## Related

- [Headless Components](../../headless/README.md) - The unstyled base components
- [Mantine Integration](../WithMantine/README.md) - Alternative pre-styled library
- [Radix UI Integration](../WithRadixUI/README.md) - Accessible primitives
- [Tailwind Integration](../WithTailwind/README.md) - Utility-first approach
- [Material-UI Documentation](https://mui.com/) - Official MUI docs
