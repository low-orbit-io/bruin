import { describe, expect, it, vi } from 'vitest';

/**
 * Vanilla subscribeWithSelector Middleware Tests
 *
 * The subscribeWithSelector middleware enhances the basic subscribe API
 * to support selective subscriptions with custom equality functions.
 *
 * Key features tested:
 * - Basic subscription (same as vanilla subscribe)
 * - Selector-based subscriptions
 * - Custom equality functions
 * - Fire immediately option
 * - Multiple simultaneous subscriptions
 * - Unsubscribe functionality
 */

describe('Vanilla subscribeWithSelector Middleware', () => {
  it('should be defined', async () => {
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );
    expect(subscribeWithSelector).toBeDefined();
    expect(typeof subscribeWithSelector).toBe('function');
  });

  it('supports basic subscription without selector (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      count: number;
      text: string;
      inc: () => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        count: 0,
        text: 'hello',
        inc: () => set((s) => ({ count: s.count + 1 })),
      })),
    );

    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    expect(listener).not.toHaveBeenCalled();

    store.getState().inc();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.getState().inc();
    expect(listener).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
  });

  it('subscribes to selected state only (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      count: number;
      text: string;
      inc: () => void;
      setText: (text: string) => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        count: 0,
        text: 'hello',
        inc: () => set((s) => ({ count: s.count + 1 })),
        setText: (text: string) => set({ text }),
      })),
    );

    const listener = vi.fn();
    const unsubscribe = store.subscribe((s) => s.count, listener);

    expect(listener).not.toHaveBeenCalled();

    // Update count - should trigger
    store.getState().inc();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1, 0);

    // Update text - should NOT trigger (different selector)
    store.getState().setText('world');
    expect(listener).toHaveBeenCalledTimes(1);

    // Update count again - should trigger
    store.getState().inc();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(2, 1);

    unsubscribe();
  });

  it('supports custom equality function (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      items: number[];
      addItem: (item: number) => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        items: [1, 2, 3],
        addItem: (item: number) =>
          set((s) => ({
            items: [...s.items, item],
          })),
      })),
    );

    // Custom equality that only checks array length
    const equalityFn = (a: number[], b: number[]) => a.length === b.length;

    const listener = vi.fn();
    store.subscribe((s) => s.items, listener, { equalityFn });

    // Add item - length changes from 3 to 4, should trigger
    store.getState().addItem(4);
    expect(listener).toHaveBeenCalledTimes(1);

    // Replace with same length array - should NOT trigger (same length)
    store.setState({ items: [5, 6, 7, 8] });
    expect(listener).toHaveBeenCalledTimes(1);

    // Add another item - length changes, should trigger
    store.getState().addItem(9);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('supports fireImmediately option (Zustand behavior)', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      count: number;
      inc: () => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        count: 42,
        inc: () => set((s) => ({ count: s.count + 1 })),
      })),
    );

    const listener = vi.fn();
    store.subscribe((s) => s.count, listener, { fireImmediately: true });

    // Should be called immediately with current state
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(42, 42);

    // Update count
    store.getState().inc();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(43, 42);
  });

  it('supports multiple subscriptions with different selectors', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      count: number;
      text: string;
      inc: () => void;
      setText: (text: string) => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        count: 0,
        text: 'hello',
        inc: () => set((s) => ({ count: s.count + 1 })),
        setText: (text: string) => set({ text }),
      })),
    );

    const countListener = vi.fn();
    const textListener = vi.fn();
    const bothListener = vi.fn();

    store.subscribe((s) => s.count, countListener);
    store.subscribe((s) => s.text, textListener);
    store.subscribe((s) => ({ count: s.count, text: s.text }), bothListener);

    // Update count
    store.getState().inc();
    expect(countListener).toHaveBeenCalledTimes(1);
    expect(textListener).toHaveBeenCalledTimes(0);
    expect(bothListener).toHaveBeenCalledTimes(1);

    // Update text
    store.getState().setText('world');
    expect(countListener).toHaveBeenCalledTimes(1);
    expect(textListener).toHaveBeenCalledTimes(1);
    expect(bothListener).toHaveBeenCalledTimes(2);
  });

  it('correctly compares objects with default equality (Object.is)', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      user: { name: string; age: number };
      updateName: (name: string) => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        user: { name: 'John', age: 30 },
        updateName: (name: string) =>
          set((s) => ({ user: { ...s.user, name } })),
      })),
    );

    const listener = vi.fn();
    store.subscribe((s) => s.user, listener);

    // Update user - new object reference, should trigger
    store.getState().updateName('Jane');
    expect(listener).toHaveBeenCalledTimes(1);

    // Set same object reference - should NOT trigger
    const currentUser = store.getState().user;
    store.setState({ user: currentUser });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('supports shallow equality for object comparisons', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );
    const { shallow } = await import('../../src/vanilla/shallow');

    type StoreState = {
      user: { name: string; age: number };
      updateAge: (age: number) => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        user: { name: 'John', age: 30 },
        updateAge: (age: number) => set((s) => ({ user: { ...s.user, age } })),
      })),
    );

    const listener = vi.fn();
    store.subscribe((s) => s.user, listener, { equalityFn: shallow });

    // Update with shallow-equal object - should NOT trigger
    store.setState({ user: { name: 'John', age: 30 } });
    expect(listener).toHaveBeenCalledTimes(0);

    // Update with different values - should trigger
    store.getState().updateAge(31);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('handles unsubscribe correctly for selector subscriptions', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      count: number;
      inc: () => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        count: 0,
        inc: () => set((s) => ({ count: s.count + 1 })),
      })),
    );

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsub1 = store.subscribe((s) => s.count, listener1);
    const unsub2 = store.subscribe((s) => s.count, listener2);

    store.getState().inc();
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    // Unsubscribe first listener
    unsub1();

    store.getState().inc();
    expect(listener1).toHaveBeenCalledTimes(1); // Should not increase
    expect(listener2).toHaveBeenCalledTimes(2); // Should increase

    unsub2();
  });

  it('works with primitive selector return values', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      count: number;
      inc: () => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        count: 0,
        inc: () => set((s) => ({ count: s.count + 1 })),
      })),
    );

    const listener = vi.fn();
    store.subscribe((s) => s.count, listener);

    store.getState().inc();
    expect(listener).toHaveBeenCalledWith(1, 0);

    store.getState().inc();
    expect(listener).toHaveBeenCalledWith(2, 1);
  });

  it('works with computed/derived values', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      firstName: string;
      lastName: string;
      setFirstName: (firstName: string) => void;
      setLastName: (lastName: string) => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        firstName: 'John',
        lastName: 'Doe',
        setFirstName: (firstName: string) => set({ firstName }),
        setLastName: (lastName: string) => set({ lastName }),
      })),
    );

    const listener = vi.fn();
    // Subscribe to computed full name
    store.subscribe((s) => `${s.firstName} ${s.lastName}`, listener);

    store.getState().setFirstName('Jane');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('Jane Doe', 'John Doe');

    store.getState().setLastName('Smith');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith('Jane Smith', 'Jane Doe');
  });

  it('supports fireImmediately with custom equality', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { subscribeWithSelector } = await import(
      '../../src/middleware/subscribeWithSelector'
    );

    type StoreState = {
      items: number[];
      addItem: (item: number) => void;
    };
    const store = createStore<StoreState>()(
      subscribeWithSelector((set) => ({
        items: [1, 2, 3],
        addItem: (item: number) =>
          set((s) => ({
            items: [...s.items, item],
          })),
      })),
    );

    const listener = vi.fn();
    const equalityFn = (a: number[], b: number[]) => a.length === b.length;

    store.subscribe((s) => s.items, listener, {
      equalityFn,
      fireImmediately: true,
    });

    // Should fire immediately
    expect(listener).toHaveBeenCalledTimes(1);
    const initialItems = [1, 2, 3];
    expect(listener).toHaveBeenCalledWith(
      expect.arrayContaining(initialItems),
      expect.arrayContaining(initialItems),
    );
  });
});
