import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Traditional React Integration', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates a store with createWithEqualityFn', async () => {
    const { createWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const useStore = createWithEqualityFn(() => ({ count: 0 }));
    expect(useStore).toBeDefined();
    expect(typeof useStore).toBe('function');
  });

  it('uses the store with custom equality function', async () => {
    const { createWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const useStore = createWithEqualityFn(() => ({
      item: { value: 0 },
    }));

    const renderCount = vi.fn();

    function Component() {
      const item = useStore(
        (s) => s.item,
        (a, b) => a.value === b.value,
      );
      renderCount();
      return <div>value: {item.value}</div>;
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>,
    );

    await findByText('value: 0');
    const initialRenderCount = renderCount.mock.calls.length;

    // Update with same value - should not re-render due to custom equality
    act(() => {
      useStore.setState({ item: { value: 0 } });
    });

    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount);

    // Update with different value - should re-render
    act(() => {
      useStore.setState({ item: { value: 1 } });
    });

    await findByText('value: 1');
    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount + 2);
  });

  it('uses vanilla store with useStoreWithEqualityFn', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { useStoreWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const store = createStore(() => ({
      item: { value: 0 },
    }));

    const renderCount = vi.fn();

    function Component() {
      const item = useStoreWithEqualityFn(
        store,
        (s) => s.item,
        (a, b) => a.value === b.value,
      );
      renderCount();
      return <div>value: {item.value}</div>;
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>,
    );

    await findByText('value: 0');
    const initialRenderCount = renderCount.mock.calls.length;

    // Update with same value
    act(() => {
      store.setState({ item: { value: 0 } });
    });

    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount);

    // Update with different value
    act(() => {
      store.setState({ item: { value: 1 } });
    });

    await findByText('value: 1');
    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount + 2);
  });

  it('works without selector in useStoreWithEqualityFn', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { useStoreWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const store = createStore(() => ({ count: 0 }));

    function Counter() {
      const state = useStoreWithEqualityFn(store);
      return <div>count: {state.count}</div>;
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    await findByText('count: 0');
  });

  it('handles state updates correctly', async () => {
    const { createWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const useStore = createWithEqualityFn<{
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

    const { getByText, findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    await findByText('count: 0');

    fireEvent.click(getByText('button'));
    await findByText('count: 1');
  });

  it('handles selector with custom equality', async () => {
    const { createWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const useStore = createWithEqualityFn(() => ({
      items: [1, 2, 3],
    }));

    const renderCount = vi.fn();

    function Component() {
      const items = useStore(
        (s) => s.items,
        (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
      );
      renderCount();
      return <div>items: {items.join(',')}</div>;
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>,
    );

    await findByText('items: 1,2,3');
    const initialRenderCount = renderCount.mock.calls.length;

    // Update with same array content - should not re-render
    act(() => {
      useStore.setState({ items: [1, 2, 3] });
    });

    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount);

    // Update with different array - should re-render
    act(() => {
      useStore.setState({ items: [1, 2, 3, 4] });
    });

    await findByText('items: 1,2,3,4');
    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount + 2);
  });

  it('provides access to store API', async () => {
    const { createWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const useStore = createWithEqualityFn(() => ({ count: 0 }));

    expect(useStore.getState).toBeDefined();
    expect(useStore.setState).toBeDefined();
    expect(useStore.subscribe).toBeDefined();
    expect(useStore.getInitialState).toBeDefined();
  });

  it('handles multiple selectors independently', async () => {
    const { createWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const useStore = createWithEqualityFn(() => ({
      a: { value: 1 },
      b: { value: 2 },
    }));

    const aRenderCount = vi.fn();
    const bRenderCount = vi.fn();

    function ComponentA() {
      const a = useStore(
        (s) => s.a,
        (prev, next) => prev.value === next.value,
      );
      aRenderCount();
      return <div>a: {a.value}</div>;
    }

    function ComponentB() {
      const b = useStore(
        (s) => s.b,
        (prev, next) => prev.value === next.value,
      );
      bRenderCount();
      return <div>b: {b.value}</div>;
    }

    const { findByText } = render(
      <StrictMode>
        <ComponentA />
        <ComponentB />
      </StrictMode>,
    );

    await findByText('a: 1');
    await findByText('b: 2');

    const aInitialCount = aRenderCount.mock.calls.length;
    const bInitialCount = bRenderCount.mock.calls.length;

    // Update A - only ComponentA should re-render
    act(() => {
      useStore.setState({ a: { value: 10 } });
    });

    await findByText('a: 10');
    expect(aRenderCount).toHaveBeenCalledTimes(aInitialCount + 2);
    expect(bRenderCount).toHaveBeenCalledTimes(bInitialCount);

    // Update B - only ComponentB should re-render
    act(() => {
      useStore.setState({ b: { value: 20 } });
    });

    await findByText('b: 20');
    expect(aRenderCount).toHaveBeenCalledTimes(aInitialCount + 2);
    expect(bRenderCount).toHaveBeenCalledTimes(bInitialCount + 2);
  });

  it('handles primitive state with equality function', async () => {
    const { createWithEqualityFn } = await import(
      '../../src/react/traditional'
    );

    const useStore = createWithEqualityFn(() => 0);

    const renderCount = vi.fn();

    function Counter() {
      const count = useStore(
        (s) => s,
        (a, b) => a === b,
      );
      renderCount();
      return <div>count: {count}</div>;
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    );

    await findByText('count: 0');
    const initialRenderCount = renderCount.mock.calls.length;

    // Update with same value
    act(() => {
      useStore.setState(0);
    });

    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount);

    // Update with different value
    act(() => {
      useStore.setState(1);
    });

    await findByText('count: 1');
    expect(renderCount).toHaveBeenCalledTimes(initialRenderCount + 2);
  });
});
