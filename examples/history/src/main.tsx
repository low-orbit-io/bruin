import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { create } from '../../../src/react';
import { MantineTimeline, MantineControls } from './integrations/WithMantine';
import { RadixTimeline, RadixControls } from './integrations/WithRadixUI';
import { TailwindTimeline, TailwindControls } from './integrations/WithTailwind';
import { MUITimeline, MUIControls } from './integrations/WithMUI';
import { ChakraTimeline, ChakraControls } from './integrations/WithChakraUI';
import './index.css';

// Create MUI theme
const muiTheme = createTheme();

// Create a simple counter store to demonstrate history
type CounterStore = {
  count: number;
  increment: () => void;
  decrement: () => void;
  addAmount: (amount: number) => void;
  reset: () => void;
};

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state: CounterStore) => ({ count: state.count + 1 })),
  decrement: () => set((state: CounterStore) => ({ count: state.count - 1 })),
  addAmount: (amount: number) =>
    set((state: CounterStore) => ({ count: state.count + amount })),
  reset: () => set({ count: 0 }),
}));

// Main counter display (using Tailwind)
function Counter() {
  const count = useCounterStore((s) => s.count);
  const { increment, decrement, addAmount, reset } = useCounterStore.getState();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Counter</h2>
      <div className="text-6xl font-bold text-center my-8 text-blue-600">
        {count}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={decrement}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          -1
        </button>
        <button
          onClick={increment}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          +1
        </button>
        <button
          onClick={() => addAmount(5)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          +5
        </button>
        <button
          onClick={() => addAmount(10)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          +10
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// Tab navigation
type IntegrationTab = 'tailwind' | 'mantine' | 'radix' | 'mui' | 'chakra';

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 font-semibold rounded-t-lg transition-all
        ${
          active
            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      {children}
    </button>
  );
}

// Render entry content helper
const renderEntryContent = (state: CounterStore) => (
  <span className="font-semibold">Count: {state.count}</span>
);

// Main app
function App() {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('tailwind');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🐻 Bruin History Example
          </h1>
          <p className="text-xl text-gray-600">
            Demonstrating history visualization with three UI approaches
          </p>
        </header>

        {/* Counter Section */}
        <div className="mb-8">
          <Counter />
        </div>

        {/* Integration Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex border-b border-gray-200">
              <TabButton
                active={activeTab === 'tailwind'}
                onClick={() => setActiveTab('tailwind')}
              >
                Tailwind CSS
              </TabButton>
              <TabButton
                active={activeTab === 'mantine'}
                onClick={() => setActiveTab('mantine')}
              >
                Mantine UI
              </TabButton>
              <TabButton
                active={activeTab === 'radix'}
                onClick={() => setActiveTab('radix')}
              >
                Radix UI
              </TabButton>
              <TabButton
                active={activeTab === 'mui'}
                onClick={() => setActiveTab('mui')}
              >
                Material-UI
              </TabButton>
              <TabButton
                active={activeTab === 'chakra'}
                onClick={() => setActiveTab('chakra')}
              >
                Chakra UI
              </TabButton>
            </div>

            <div className="p-6 bg-gray-50">
              {activeTab === 'tailwind' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Tailwind CSS Integration</h3>
                    <p className="text-gray-600 mb-6">
                      Utility-first CSS framework - compose styles from utility classes
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TailwindControls
                      store={useCounterStore}
                      title="Tailwind Controls"
                      description="Compact undo/redo with expandable timeline"
                      renderEntryContent={renderEntryContent}
                    />
                    <TailwindTimeline
                      store={useCounterStore}
                      title="Tailwind Timeline"
                      description="Full history list with all entries"
                      renderEntryContent={renderEntryContent}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Key Features:</strong> Utility classes, rapid iteration, responsive design,
                      customizable via tailwind.config.js
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'mantine' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Mantine UI Integration</h3>
                    <p className="text-gray-600 mb-6">
                      Pre-styled component library - rapid development with beautiful defaults
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MantineControls
                      store={useCounterStore}
                      title="Mantine Controls"
                      description="Compact undo/redo with expandable timeline"
                      renderEntryContent={renderEntryContent}
                    />
                    <MantineTimeline
                      store={useCounterStore}
                      title="Mantine Timeline"
                      description="Full history list with all entries"
                      renderEntryContent={renderEntryContent}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Key Features:</strong> Pre-styled components, theming system, rich component library,
                      built-in accessibility
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'radix' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Radix UI Integration</h3>
                    <p className="text-gray-600 mb-6">
                      Unstyled accessible primitives - full design control with excellent a11y
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RadixControls
                      store={useCounterStore}
                      title="Radix Controls"
                      description="Compact undo/redo with expandable timeline"
                      renderEntryContent={renderEntryContent}
                    />
                    <RadixTimeline
                      store={useCounterStore}
                      title="Radix Timeline"
                      description="Full history list with all entries"
                      renderEntryContent={renderEntryContent}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Key Features:</strong> Unstyled primitives, accessibility-first, keyboard navigation,
                      ARIA compliant, full CSS control
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'mui' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Material-UI Integration</h3>
                    <p className="text-gray-600 mb-6">
                      Google's Material Design system - comprehensive component library
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MUIControls
                      store={useCounterStore}
                      title="MUI Controls"
                      description="Compact undo/redo with expandable timeline"
                      renderEntryContent={renderEntryContent}
                    />
                    <MUITimeline
                      store={useCounterStore}
                      title="MUI Timeline"
                      description="Full history list with all entries"
                      renderEntryContent={renderEntryContent}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Key Features:</strong> Material Design, elevation system, comprehensive library,
                      theming, enterprise-ready
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'chakra' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Chakra UI Integration</h3>
                    <p className="text-gray-600 mb-6">
                      Modern component library - style props and excellent DX
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChakraControls
                      store={useCounterStore}
                      title="Chakra Controls"
                      description="Compact undo/redo with expandable timeline"
                      renderEntryContent={renderEntryContent}
                    />
                    <ChakraTimeline
                      store={useCounterStore}
                      title="Chakra Timeline"
                      description="Full history list with all entries"
                      renderEntryContent={renderEntryContent}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Key Features:</strong> Style props, composition, accessibility, dark mode,
                      framer-motion animations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-left py-3 px-4">Tailwind</th>
                  <th className="text-left py-3 px-4">Mantine</th>
                  <th className="text-left py-3 px-4">Radix</th>
                  <th className="text-left py-3 px-4">MUI</th>
                  <th className="text-left py-3 px-4">Chakra</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium">Styling</td>
                  <td className="py-3 px-4">Utility classes</td>
                  <td className="py-3 px-4">Pre-styled</td>
                  <td className="py-3 px-4">Unstyled</td>
                  <td className="py-3 px-4">Material Design</td>
                  <td className="py-3 px-4">Style props</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium">Customization</td>
                  <td className="py-3 px-4">High</td>
                  <td className="py-3 px-4">Medium</td>
                  <td className="py-3 px-4">Maximum</td>
                  <td className="py-3 px-4">Medium</td>
                  <td className="py-3 px-4">High</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium">Accessibility</td>
                  <td className="py-3 px-4">Manual</td>
                  <td className="py-3 px-4">Good</td>
                  <td className="py-3 px-4">Excellent</td>
                  <td className="py-3 px-4">Good</td>
                  <td className="py-3 px-4">Excellent</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium">Bundle Size</td>
                  <td className="py-3 px-4">Small</td>
                  <td className="py-3 px-4">Large</td>
                  <td className="py-3 px-4">Small</td>
                  <td className="py-3 px-4">Large</td>
                  <td className="py-3 px-4">Medium</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Best For</td>
                  <td className="py-3 px-4">Custom</td>
                  <td className="py-3 px-4">Rapid dev</td>
                  <td className="py-3 px-4">A11y apps</td>
                  <td className="py-3 px-4">Material</td>
                  <td className="py-3 px-4">Modern</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-600">
          <p>
            All five integrations use the <strong>same headless components</strong> under the hood.
          </p>
          <p className="mt-2">
            See <code className="bg-gray-200 px-2 py-1 rounded">src/headless/</code> for the
            unstyled base components.
          </p>
        </footer>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <ChakraProvider>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </ChakraProvider>
    </MantineProvider>
  </StrictMode>,
);
