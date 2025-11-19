import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { create } from '../../../src/react';
import { HeadlessTimelineList, HeadlessTimelineCompact } from './headless';
import type { HistoryEntry } from './headless';
import { MantineTimeline, MantineControls } from './integrations/WithMantine';

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

// Main counter display
function Counter() {
  const count = useCounterStore((s) => s.count);
  const { increment, decrement, addAmount, reset } = useCounterStore.getState();

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Counter</h2>
      <div style={{
        fontSize: '64px',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '32px 0',
        color: '#3b82f6'
      }}>
        {count}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={decrement}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          -1
        </button>
        <button
          onClick={increment}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          +1
        </button>
        <button
          onClick={() => addAmount(5)}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          +5
        </button>
        <button
          onClick={() => addAmount(10)}
          style={{
            padding: '8px 16px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          +10
        </button>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// Headless timeline demo with inline styles
function HeadlessDemo() {
  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
        Headless Components (Unstyled)
      </h2>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
        These components provide all the logic with zero styling - you provide the UI.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Compact Controls</h3>
          <HeadlessTimelineCompact
            store={useCounterStore}
            renderControls={({ canUndo, canRedo, currentIndex, totalEntries, undo, redo, toggleList, showList }) => (
              <div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    style={{
                      padding: '8px 16px',
                      background: canUndo ? '#3b82f6' : '#e5e7eb',
                      color: canUndo ? 'white' : '#9ca3af',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: canUndo ? 'pointer' : 'not-allowed',
                      fontSize: '14px'
                    }}
                  >
                    ← Undo
                  </button>
                  <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold' }}>
                    {currentIndex + 1} / {totalEntries}
                  </span>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    style={{
                      padding: '8px 16px',
                      background: canRedo ? '#3b82f6' : '#e5e7eb',
                      color: canRedo ? 'white' : '#9ca3af',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: canRedo ? 'pointer' : 'not-allowed',
                      fontSize: '14px'
                    }}
                  >
                    Redo →
                  </button>
                  <button
                    onClick={toggleList}
                    style={{
                      padding: '8px 16px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginLeft: 'auto'
                    }}
                  >
                    {showList ? 'Hide' : 'Show'} Timeline
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    background: canUndo ? '#d1fae5' : '#f3f4f6',
                    color: canUndo ? '#065f46' : '#6b7280',
                    borderRadius: '4px'
                  }}>
                    Can Undo: {canUndo.toString()}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    background: canRedo ? '#d1fae5' : '#f3f4f6',
                    color: canRedo ? '#065f46' : '#6b7280',
                    borderRadius: '4px'
                  }}>
                    Can Redo: {canRedo.toString()}
                  </span>
                </div>
              </div>
            )}
            renderList={(entries: HistoryEntry<CounterStore>[], currentIndex: number) => (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>History Timeline:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {entries.map((entry, index) => {
                    const isCurrent = index === currentIndex;
                    return (
                      <span
                        key={index}
                        style={{
                          padding: '6px 12px',
                          background: isCurrent ? '#3b82f6' : '#f3f4f6',
                          color: isCurrent ? 'white' : '#374151',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: isCurrent ? 'bold' : 'normal'
                        }}
                      >
                        {entry.state.count}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          />
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Timeline List</h3>
          <HeadlessTimelineList
            store={useCounterStore}
            renderEntry={(entry: HistoryEntry<CounterStore>, index: number, isCurrent: boolean) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: isCurrent ? '#eff6ff' : 'white',
                  border: `2px solid ${isCurrent ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '16px' }}>
                    Count: <strong>{entry.state.count}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isCurrent && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        Current
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            emptyMessage={
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                No history yet. Make some changes to see history entries!
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

// Mantine integration demo
function MantineDemo() {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          Mantine Integration Example
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Same headless components, styled with Mantine UI for rapid development.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <MantineControls
          store={useCounterStore}
          title="Mantine Controls"
          description="Pre-styled controls with Mantine components"
          renderEntryContent={(state: CounterStore) => (
            <span>{state.count}</span>
          )}
        />
        <MantineTimeline
          store={useCounterStore}
          title="Mantine Timeline"
          description="Pre-styled timeline with Mantine components"
          renderEntryContent={(state: CounterStore) => (
            <span style={{ fontWeight: '600' }}>Count: {state.count}</span>
          )}
        />
      </div>
    </div>
  );
}

// Main app
function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
      padding: '32px'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            🐻 Bruin History Example
          </h1>
          <p style={{ fontSize: '20px', color: '#6b7280' }}>
            Demonstrating headless history visualization components
          </p>
        </header>

        <Counter />
        <HeadlessDemo />
        <MantineDemo />

        <footer style={{ marginTop: '48px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          <p>
            These examples show the <strong>headless pattern</strong> - logic without styling.
          </p>
          <p style={{ marginTop: '8px' }}>
            See <code style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px' }}>src/headless/</code> for the unstyled components.
          </p>
        </footer>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
);
