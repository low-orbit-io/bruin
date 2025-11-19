# Chakra UI Integration

This directory demonstrates how to use Bruin's headless history components with [Chakra UI](https://chakra-ui.com/).

## Components

### `ChakraTimeline`

A full timeline list showing all history entries with Chakra UI styling.

**Features:**
- Uses `HeadlessTimelineList` under the hood
- Styled with Chakra Card, Box, and Tag components
- Responsive and accessible by default
- Smooth transitions and hover effects
- Customizable through Chakra's style props

**Example:**

```tsx
import { ChakraTimeline } from './integrations/WithChakraUI';

function App() {
  return (
    <ChakraTimeline
      store={myStore}
      title="State History"
      description="All state changes are tracked here"
      renderEntryContent={(state) => (
        <Text fontWeight="bold">Count: {state.count}</Text>
      )}
    />
  );
}
```

### `ChakraControls`

Compact undo/redo controls with a collapsible timeline using Chakra Collapse.

**Features:**
- Uses `HeadlessTimelineCompact` under the hood
- Chakra Button components with color schemes
- Collapse component for smooth animations
- Tag components for status badges
- Wrap component for responsive layout

**Example:**

```tsx
import { ChakraControls } from './integrations/WithChakraUI';

function App() {
  return (
    <ChakraControls
      store={myStore}
      title="History Controls"
      description="Navigate through your changes"
      renderEntryContent={(state) => state.count}
    />
  );
}
```

## Installation

To use these components, you need to install Chakra UI:

```bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
# or
pnpm add @chakra-ui/react @emotion/react @emotion/styled framer-motion
# or
yarn add @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

## Setup

Wrap your app with Chakra's ChakraProvider:

```tsx
import { ChakraProvider } from '@chakra-ui/react';

function App() {
  return (
    <ChakraProvider>
      {/* Your app */}
    </ChakraProvider>
  );
}
```

## Customization

### Using Chakra Theme

Customize the entire design system through the theme:

```tsx
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      // ... more shades
      900: '#0d47a1',
    },
  },
  fonts: {
    heading: `'Poppins', sans-serif`,
    body: `'Inter', sans-serif`,
  },
});

<ChakraProvider theme={theme}>
  <App />
</ChakraProvider>
```

### Style Props

Chakra components accept style props for inline customization:

```tsx
<ChakraTimeline
  store={myStore}
  renderEntryContent={(state, timestamp) => (
    <HStack spacing={3}>
      <Box
        bg="blue.500"
        color="white"
        px={3}
        py={1}
        borderRadius="full"
        fontWeight="bold"
      >
        {state.count}
      </Box>
      <Text fontSize="sm" color="gray.600">
        {new Date(timestamp).toLocaleString()}
      </Text>
    </HStack>
  )}
/>
```

### Color Modes

Chakra has built-in dark mode support:

```tsx
import { useColorMode, IconButton } from '@chakra-ui/react';

function DarkModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      icon={colorMode === 'light' ? '🌙' : '☀️'}
      onClick={toggleColorMode}
      aria-label="Toggle color mode"
    />
  );
}
```

## Key Patterns

### Chakra UI Philosophy

Chakra UI follows these principles:

1. **Style Props**: Apply styles directly via props
2. **Composition**: Build complex UIs from simple primitives
3. **Accessibility**: WAI-ARIA compliant by default
4. **Theme-Driven**: Consistent design through theme tokens
5. **Developer Experience**: TypeScript support and great DX

### Chakra Components Used

- **Card/CardHeader/CardBody**: Container components
- **Box**: Versatile layout primitive
- **HStack/VStack**: Flex layouts with spacing
- **Wrap/WrapItem**: Responsive wrapping container
- **Tag**: Badge/label component
- **Button**: Action buttons with color schemes
- **Collapse**: Smooth expand/collapse
- **Text/Heading**: Typography components
- **Divider**: Visual separators

### Responsive Design

Chakra makes responsive design easy:

```tsx
<Box
  display={{ base: 'block', md: 'flex' }}  // block on mobile, flex on desktop
  spacing={{ base: 2, md: 4, lg: 6 }}      // responsive spacing
>
  <ChakraTimeline store={store} />
</Box>
```

## Comparison with Other Integrations

| Feature | Tailwind | Mantine | Radix UI | MUI | Chakra UI |
|---------|----------|---------|----------|-----|-----------|
| Styling | Utility classes | Pre-styled | Unstyled | Material | Style props |
| Customization | Config | Theme API | Full CSS | Theme | Theme + props |
| Accessibility | Manual | Good | Excellent | Good | Excellent |
| Bundle Size | Small | Large | Small | Large | Medium |
| Best For | Custom | Rapid dev | A11y apps | Material | Modern apps |

## Why Chakra UI?

### Advantages

- **Style Props**: No CSS files needed, style directly in JSX
- **Composition**: Flexible component composition
- **Accessibility**: WCAG compliant out of the box
- **Dark Mode**: Built-in color mode support
- **TypeScript**: Excellent TypeScript support
- **Developer Experience**: Fast development with great DX
- **Framer Motion**: Smooth animations built-in

### When to Use

- Modern React applications
- Need excellent accessibility
- Want built-in dark mode
- Prefer style props over CSS
- TypeScript-first development
- Rapid prototyping

### When to Use Something Else

- **Need Material Design**: Use MUI integration
- **Prefer utility-first**: Use Tailwind integration
- **Need smallest bundle**: Use Radix UI or headless
- **Custom design system**: Use headless components

## Advanced Patterns

### Custom Color Scheme

Create custom component variants:

```tsx
const theme = extendTheme({
  components: {
    Card: {
      variants: {
        timeline: {
          container: {
            borderColor: 'blue.200',
            borderWidth: '2px',
          },
        },
      },
    },
  },
});

<Card variant="timeline">
  {/* Content */}
</Card>
```

### Responsive Variants

Use responsive arrays for props:

```tsx
<Button
  size={['sm', 'md', 'lg']}  // sm on mobile, md on tablet, lg on desktop
  colorScheme="blue"
>
  Action
</Button>
```

### Animation with Framer Motion

Chakra integrates seamlessly with Framer Motion:

```tsx
import { motion } from 'framer-motion';
import { Box } from '@chakra-ui/react';

const MotionBox = motion(Box);

<MotionBox
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <ChakraTimeline store={store} />
</MotionBox>
```

## Related

- [Headless Components](../../headless/README.md) - The unstyled base components
- [Mantine Integration](../WithMantine/README.md) - Alternative library
- [MUI Integration](../WithMUI/README.md) - Material Design
- [Radix UI Integration](../WithRadixUI/README.md) - Accessible primitives
- [Tailwind Integration](../WithTailwind/README.md) - Utility-first
- [Chakra UI Documentation](https://chakra-ui.com/) - Official docs
