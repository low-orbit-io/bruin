import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { create } from '../../../src/react';
import { HeadlessTimelineList, HeadlessTimelineCompact } from './headless';
import type { HistoryEntry } from './headless';

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

// Compact timeline demo
function CompactTimelineDemo() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Compact History Controls</h2>
      <HeadlessTimelineCompact
        store={useCounterStore}
        renderControls={({ canUndo, canRedo, currentIndex, totalEntries, undo, redo, toggleList, showList }) => (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Undo
              </button>
              <span className="text-lg font-mono">
                {currentIndex + 1} / {totalEntries}
              </span>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Redo →
              </button>
              <button
                onClick={toggleList}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition ml-auto"
              >
                {showList ? 'Hide' : 'Show'} Timeline
              </button>
            </div>
          </div>
        )}
        renderList={(entries, currentIndex) => (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold mb-2">History Timeline:</h3>
            <ul className="space-y-2">
              {entries.map((entry: HistoryEntry<CounterStore>, index: number) => (
                <li
                  key={index}
                  className={`p-2 rounded ${
                    index === currentIndex
                      ? 'bg-blue-100 border-2 border-blue-500 font-bold'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Count: {entry.state.count}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      />
    </div>
  );
}

// List timeline demo
function ListTimelineDemo() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Timeline List (All Entries)</h2>
      <HeadlessTimelineList
        store={useCounterStore}
        renderEntry={(entry: HistoryEntry<CounterStore>, index: number, isCurrent: boolean) => (
          <div
            className={`p-3 mb-2 rounded border-2 transition ${
              isCurrent
                ? 'bg-blue-50 border-blue-500 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-mono text-lg">
                  Count: <strong>{entry.state.count}</strong>
                </span>
                {isCurrent && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                <div>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                <div className="text-xs">Entry #{index + 1}</div>
              </div>
            </div>
          </div>
        )}
        emptyMessage={
          <div className="text-center text-gray-500 py-8">
            No history yet. Make some changes to see history entries!
          </div>
        }
      />
    </div>
  );
}

// Main app
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🐻 Bruin History Example
          </h1>
          <p className="text-xl text-gray-600">
            Demonstrating headless history visualization components
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Counter />
          <CompactTimelineDemo />
        </div>

        <div className="grid grid-cols-1">
          <ListTimelineDemo />
        </div>

        <footer className="mt-12 text-center text-sm text-gray-600">
          <p>
            These components use <strong>headless patterns</strong> - zero
            styling, maximum flexibility.
          </p>
          <p className="mt-2">
            See <code className="bg-gray-200 px-2 py-1 rounded">src/headless/</code> for the
            unstyled components.
          </p>
        </footer>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
