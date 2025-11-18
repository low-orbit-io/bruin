import { act, cleanup, fireEvent, render } from '@testing-library/react';
import React, { useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { create } from '../../src/react';

describe('React Integration - Basic', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates a store hook', () => {
    const useStore = create<{ count: number }>()(() => ({ count: 0 }));
    expect(useStore).toBeDefined();
    expect(typeof useStore).toBe('function');
  });

  it('uses the store without selector', async () => {
    const useStore = create<{ count: number }>()(() => ({ count: 0 }));

    function Counter() {
      const state = useStore();
      return <div>count: {state.count}</div>;
    }

    const { findByText } = render(<Counter />);

    await findByText('count: 0');
  });

  it('uses the store with selector', async () => {
    const useStore = create<{ count: number; text: string }>()(() => ({
      count: 0,
      text: 'hello',
    }));

    function Counter() {
      const count = useStore((s) => s.count);
      return <div>count: {count}</div>;
    }

    const { findByText } = render(<Counter />);

    await findByText('count: 0');
  });

  it('updates state and re-renders component', async () => {
    const useStore = create<{
      count: number;
      inc: () => void;
    }>((set) => ({
      count: 0,
      inc: () => set((s) => ({ count: s.count + 1 })),
    }));

    function Counter() {
      const { count, inc } = useStore();
      return (
        <div>
          <div>count: {count}</div>
          <button onClick={inc}>button</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Counter />);

    await findByText('count: 0');

    fireEvent.click(getByText('button'));
    await findByText('count: 1');
  });

  it('only re-renders components that use changed state slice', async () => {
    const useStore = create<{
      count: number;
      text: string;
      inc: () => void;
      setText: (text: string) => void;
    }>((set) => ({
      count: 0,
      text: 'hello',
      inc: () => set((s) => ({ count: s.count + 1 })),
      setText: (text) => set({ text }),
    }));

    const counterRenderCount = vi.fn();
    const textRenderCount = vi.fn();

    function Counter() {
      const count = useStore((s) => s.count);
      const inc = useStore((s) => s.inc);
      counterRenderCount();
      return (
        <div>
          <div>count: {count}</div>
          <button onClick={inc}>inc</button>
        </div>
      );
    }

    function Text() {
      const text = useStore((s) => s.text);
      const setText = useStore((s) => s.setText);
      textRenderCount();
      return (
        <div>
          <div>text: {text}</div>
          <button onClick={() => setText('world')}>set</button>
        </div>
      );
    }

    const { getByText, findByText } = render(
      <>
        <Counter />
        <Text />
      </>,
    );

    await findByText('count: 0');
    await findByText('text: hello');

    // Initial renders
    expect(counterRenderCount).toHaveBeenCalledTimes(1);
    expect(textRenderCount).toHaveBeenCalledTimes(1);

    // Update count - only Counter should re-render
    fireEvent.click(getByText('inc'));
    await findByText('count: 1');

    expect(counterRenderCount).toHaveBeenCalledTimes(2); // 1 initial + 1 update
    expect(textRenderCount).toHaveBeenCalledTimes(1); // No change

    // Update text - only Text should re-render
    fireEvent.click(getByText('set'));
    await findByText('text: world');

    expect(counterRenderCount).toHaveBeenCalledTimes(2); // No change
    expect(textRenderCount).toHaveBeenCalledTimes(2); // 1 initial + 1 update
  });

  it('accesses store API from hook', () => {
    const useStore = create<{ count: number }>()(() => ({ count: 0 }));

    expect(useStore.getState).toBeDefined();
    expect(useStore.setState).toBeDefined();
    expect(useStore.subscribe).toBeDefined();
    expect(useStore.getInitialState).toBeDefined();
    expect(useStore.undo).toBeDefined();
    expect(useStore.redo).toBeDefined();
    expect(useStore.transaction).toBeDefined();
  });

  it('updates state via store API', async () => {
    const useStore = create<{ count: number }>()(() => ({ count: 0 }));

    function Counter() {
      const count = useStore((s) => s.count);
      return <div>count: {count}</div>;
    }

    const { findByText } = render(<Counter />);

    await findByText('count: 0');

    act(() => {
      useStore.setState({ count: 1 });
    });

    await findByText('count: 1');
  });

  it('handles undefined state', async () => {
    const useStore = create<{ count: number } | undefined>()(
      () => undefined as { count: number } | undefined,
    );

    function Component() {
      const state = useStore();
      return <div>{state === undefined ? 'undefined' : 'defined'}</div>;
    }

    const { findByText } = render(<Component />);

    await findByText('undefined');
  });

  it('handles non-object state (primitives)', async () => {
    const useStore = create<number>()(() => 0);

    function Counter() {
      const count = useStore();
      return <div>count: {count}</div>;
    }

    const { findByText } = render(<Counter />);

    await findByText('count: 0');

    act(() => {
      useStore.setState(1);
    });

    await findByText('count: 1');
  });

  it('handles selector returning primitive', async () => {
    const useStore = create<{ count: number; text: string }>()(() => ({
      count: 0,
      text: 'hello',
    }));

    function Component() {
      const count = useStore((s) => s.count);
      const text = useStore((s) => s.text);
      return (
        <div>
          {count} {text}
        </div>
      );
    }

    const { findByText } = render(<Component />);

    await findByText('0 hello');
  });

  it('handles selector returning object', async () => {
    const useStore = create<{ nested: { value: number } }>()(() => ({
      nested: { value: 0 },
    }));

    function Component() {
      const nested = useStore((s) => s.nested);
      return <div>value: {nested.value}</div>;
    }

    const { findByText } = render(<Component />);

    await findByText('value: 0');
  });

  it('handles multiple selectors in one component', async () => {
    const useStore = create<{
      count: number;
      text: string;
      inc: () => void;
    }>((set) => ({
      count: 0,
      text: 'hello',
      inc: () => set((s) => ({ count: s.count + 1 })),
    }));

    function Component() {
      const count = useStore((s) => s.count);
      const text = useStore((s) => s.text);
      const inc = useStore((s) => s.inc);
      return (
        <div>
          <div>
            {count} {text}
          </div>
          <button onClick={inc}>button</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Component />);

    await findByText('0 hello');

    fireEvent.click(getByText('button'));
    await findByText('1 hello');
  });

  it('batches updates within React event handler', async () => {
    const useStore = create<{
      count: number;
      text: string;
      update: () => void;
    }>((set) => ({
      count: 0,
      text: 'hello',
      update: () => {
        set({ count: 1 });
        set({ text: 'world' });
      },
    }));

    const renderCount = vi.fn();

    function Component() {
      const state = useStore();
      renderCount();
      return (
        <div>
          <div>
            {state.count} {state.text}
          </div>
          <button onClick={state.update}>button</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Component />);

    await findByText('0 hello');
    const initialRenderCount = renderCount.mock.calls.length;

    fireEvent.click(getByText('button'));
    await findByText('1 world');

    // Should only render once for both updates (batched by React 18+)
    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount + 1); // Batched
  });

  it('handles errors in selector', async () => {
    const useStore = create<{ count: number }>()(() => ({ count: 0 }));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    function Component() {
      const value = useStore((s) => {
        if (s.count === 1) throw new Error('selector error');
        return s.count;
      });
      return <div>value: {value}</div>;
    }

    class ErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
      }
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      render() {
        if (this.state.hasError) {
          return <div>error boundary</div>;
        }
        return this.props.children;
      }
    }

    const { findByText } = render(
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>,
    );

    await findByText('value: 0');

    act(() => {
      useStore.setState({ count: 1 });
    });

    await findByText('error boundary');

    consoleError.mockRestore();
  });

  it('handles dynamic selector changes', async () => {
    const useStore = create<{ count1: number; count2: number }>()(() => ({
      count1: 0,
      count2: 100,
    }));

    function Component() {
      const [which, setWhich] = useState<'count1' | 'count2'>('count1');
      const count = useStore((s) => s[which]);
      return (
        <div>
          <div>count: {count}</div>
          <button onClick={() => setWhich('count2')}>switch</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Component />);

    await findByText('count: 0');

    fireEvent.click(getByText('switch'));
    await findByText('count: 100');
  });

  it('works with useEffect dependencies', async () => {
    const useStore = create<{ count: number }>()(() => ({ count: 0 }));
    const effectCallback = vi.fn();

    function Component() {
      const count = useStore((s) => s.count);
      useEffect(() => {
        effectCallback(count);
      }, [count]);
      return <div>count: {count}</div>;
    }

    const { findByText } = render(<Component />);

    await findByText('count: 0');
    expect(effectCallback).toHaveBeenCalledWith(0);

    act(() => {
      useStore.setState({ count: 1 });
    });

    await findByText('count: 1');
    expect(effectCallback).toHaveBeenCalledWith(1);
  });

  it('works with history features', async () => {
    const useStore = create<{
      count: number;
      inc: () => void;
    }>((set) => ({
      count: 0,
      inc: () => set((s) => ({ count: s.count + 1 })),
    }));

    function Component() {
      const count = useStore((s) => s.count);
      const inc = useStore((s) => s.inc);
      return (
        <div>
          <div>count: {count}</div>
          <button onClick={inc}>inc</button>
          <button onClick={useStore.undo}>undo</button>
          <button onClick={useStore.redo}>redo</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Component />);

    await findByText('count: 0');

    fireEvent.click(getByText('inc'));
    await findByText('count: 1');

    fireEvent.click(getByText('undo'));
    await findByText('count: 0');

    fireEvent.click(getByText('redo'));
    await findByText('count: 1');
  });

  it('works with transactions', async () => {
    const useStore = create<{
      x: number;
      y: number;
      move: (dx: number, dy: number) => void;
    }>((set, get, api) => ({
      x: 0,
      y: 0,
      move: (dx, dy) =>
        api.transaction(() => {
          set((s) => ({ x: s.x + dx }));
          set((s) => ({ y: s.y + dy }));
        }),
    }));

    const renderCount = vi.fn();

    function Component() {
      const state = useStore();
      renderCount();
      return (
        <div>
          <div>
            {state.x},{state.y}
          </div>
          <button onClick={() => state.move(1, 2)}>move</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Component />);

    await findByText('0,0');
    const initialRenderCount = renderCount.mock.calls.length;

    fireEvent.click(getByText('move'));
    await findByText('1,2');

    // Transaction should batch updates - only one re-render
    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount + 1); // Batched
  });
});

describe('React Integration - useStore hook', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses vanilla store in React', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { useStore } = await import('../../src/react');

    const store = createStore(() => ({ count: 0 }));

    function Counter() {
      const count = useStore(store, (s) => s.count);
      return <div>count: {count}</div>;
    }

    const { findByText } = render(<Counter />);

    await findByText('count: 0');
  });

  it('updates when vanilla store changes', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { useStore } = await import('../../src/react');

    const store = createStore<{
      count: number;
      inc: () => void;
    }>((set) => ({
      count: 0,
      inc: () => set((s) => ({ count: s.count + 1 })),
    }));

    function Counter() {
      const count = useStore(store, (s) => s.count);
      const inc = useStore(store, (s) => s.inc);
      return (
        <div>
          <div>count: {count}</div>
          <button onClick={inc}>button</button>
        </div>
      );
    }

    const { getByText, findByText } = render(<Counter />);

    await findByText('count: 0');

    fireEvent.click(getByText('button'));
    await findByText('count: 1');
  });

  it('works without selector', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { useStore } = await import('../../src/react');

    const store = createStore(() => ({ count: 0 }));

    function Counter() {
      const state = useStore(store);
      return <div>count: {state.count}</div>;
    }

    const { findByText } = render(<Counter />);

    await findByText('count: 0');
  });
});
