import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'bruin/vanilla';

vi.mock('react', () => ({}));

const consoleError = console.error;
afterEach(() => {
  console.error = consoleError;
});

describe('History Management', () => {
  type CounterState = {
    count: number;
    inc: () => void;
    dec: () => void;
  };

  it('maintains history of state changes', () => {
    const store = createStore<CounterState>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
    }));

    expect(store.getState().count).toBe(0);

    store.getState().inc();

    expect(store.getState().count).toBe(1);

    store.getState().inc();

    expect(store.getState().count).toBe(2);

    store.undo();

    expect(store.getState().count).toBe(1);

    store.undo();

    expect(store.getState().count).toBe(0);

    store.undo();

    expect(store.getState().count).toBe(0);

    store.redo();

    expect(store.getState().count).toBe(1);

    store.redo();

    expect(store.getState().count).toBe(2);

    store.redo();

    expect(store.getState().count).toBe(2);
  });

  it('clears future history on new change after undo', () => {
    const store = createStore<CounterState>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
    }));

    store.getState().inc();
    store.getState().inc();
    store.getState().inc();

    store.undo();
    store.undo();

    store.getState().dec();

    store.redo();

    expect(store.getState().count).toBe(0);
  });

  it('provides canUndo and canRedo helpers', () => {
    const store = createStore<{ value: number }>(() => ({ value: 0 }));

    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);

    store.setState({ value: 1 });

    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);

    store.undo();

    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(true);

    store.redo();

    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);
  });

  it('respects maxHistorySize option', () => {
    const store = createStore<{ value: number }>(() => ({ value: 0 }), {
      maxHistorySize: 3,
    });

    store.setState({ value: 1 });
    store.setState({ value: 2 });
    store.setState({ value: 3 });
    store.setState({ value: 4 });
    store.setState({ value: 5 });

    store.undo();
    store.undo();
    store.undo();

    expect(store.getState().value).toBe(2);
    expect(store.canUndo()).toBe(false);
  });
});

describe('Synchronous Updates', () => {
  it('creates separate history entries for each setState call', () => {
    const store = createStore<{ a: number; b: number }>(() => ({ a: 0, b: 0 }));
    const listener = vi.fn();

    store.subscribe(listener);

    store.setState({ a: 1 });
    store.setState({ b: 1 });

    expect(listener).toHaveBeenCalledTimes(2);

    expect(store.getState()).toEqual({ a: 1, b: 1 });

    store.undo();

    expect(store.getState()).toEqual({ a: 1, b: 0 });

    store.undo();

    expect(store.getState()).toEqual({ a: 0, b: 0 });
  });

  it('notifies listeners synchronously', () => {
    const store = createStore<{ value: number }>(() => ({ value: 0 }));
    const listener = vi.fn();

    store.subscribe(listener);

    store.setState({ value: 1 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ value: 1 }, { value: 0 });

    store.setState({ value: 2 });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({ value: 2 }, { value: 1 });
  });
});

describe('Transaction API', () => {
  it('groups multiple updates in a transaction', () => {
    const store = createStore<{ a: number; b: number; c: number }>(() => ({
      a: 0,
      b: 0,
      c: 0,
    }));

    store.transaction(() => {
      store.setState({ a: 1 });
      store.setState({ b: 2 });
      store.setState({ c: 3 });
    });

    expect(store.getState()).toEqual({ a: 1, b: 2, c: 3 });

    store.undo();

    expect(store.getState()).toEqual({ a: 0, b: 0, c: 0 });

    store.redo();

    expect(store.getState()).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('can name transactions', () => {
    const store = createStore<{ value: number }>(() => ({ value: 0 }));

    store.transaction(
      () => {
        store.setState({ value: 10 });
        store.setState({ value: 20 });
      },
      { name: 'Double update' },
    );

    const history = store.getHistory();

    expect(history[history.length - 1].name).toBe('Double update');
  });

  it('rolls back transaction on error', () => {
    const store = createStore<{ value: number }>(() => ({ value: 0 }));

    expect(() => {
      store.transaction(() => {
        store.setState({ value: 1 });

        throw new Error('Transaction failed');
      });
    }).toThrow('Transaction failed');

    expect(store.getState().value).toBe(0);
    expect(store.canUndo()).toBe(false);
  });

  it('supports nested transactions', () => {
    const store = createStore<{ a: number; b: number }>(() => ({ a: 0, b: 0 }));

    store.transaction(() => {
      store.setState({ a: 1 });

      store.transaction(() => {
        store.setState({ b: 1 });
      });

      store.setState({ a: 2 });
    });

    expect(store.getState()).toEqual({ a: 2, b: 1 });

    store.undo();

    expect(store.getState()).toEqual({ a: 0, b: 0 });
  });

  it('supports set.transaction API in state creator', () => {
    const store = createStore<{ a: number; b: number; updateBoth: (a: number, b: number) => void }>((set) => ({
      a: 0,
      b: 0,
      updateBoth: (a: number, b: number) =>
        set.transaction(() => {
          set({ a });
          set({ b });
        }),
    }));

    store.getState().updateBoth(1, 2);

    expect(store.getState().a).toBe(1);
    expect(store.getState().b).toBe(2);

    store.undo();

    expect(store.getState().a).toBe(0);
    expect(store.getState().b).toBe(0);
  });

  it('supports set.transaction with options', () => {
    const store = createStore<{ value: number }>((set) => ({
      value: 0,
      update: (val: number) =>
        set.transaction(() => {
          set({ value: val });
        }, { name: 'Custom Update' }),
    }));

    store.getState().update(42);

    const history = store.getHistory();

    expect(history[history.length - 1].name).toBe('Custom Update');
  });
});

describe('Computed Fields', () => {
  it('excludes computed fields from history', () => {
    type State = {
      firstName: string;
      lastName: string;
      fullName: string;
      setFirstName: (name: string) => void;
      setLastName: (name: string) => void;
    };

    const store = createStore<State>(
      (set, get) => ({
        firstName: 'John',
        lastName: 'Doe',
        get fullName() {
          return `${get().firstName} ${get().lastName}`;
        },
        setFirstName: (name) => set({ firstName: name }),
        setLastName: (name) => set({ lastName: name }),
      }),
      {
        computedFields: ['fullName'],
      },
    );

    expect(store.getState().fullName).toBe('John Doe');

    store.getState().setFirstName('Jane');

    expect(store.getState().fullName).toBe('Jane Doe');

    store.undo();

    expect(store.getState().firstName).toBe('John');
    expect(store.getState().fullName).toBe('John Doe');
  });

  it('handles multiple computed fields', () => {
    type State = {
      count: number;
      double: number;
      triple: number;
      inc: () => void;
    };

    const store = createStore<State>(
      (set, get) => ({
        count: 1,
        get double() {
          return get().count * 2;
        },
        get triple() {
          return get().count * 3;
        },
        inc: () => set((state) => ({ count: state.count + 1 })),
      }),
      {
        computedFields: ['double', 'triple'],
      },
    );

    expect(store.getState().double).toBe(2);
    expect(store.getState().triple).toBe(3);

    store.getState().inc();

    expect(store.getState().count).toBe(2);
    expect(store.getState().double).toBe(4);
    expect(store.getState().triple).toBe(6);

    store.undo();

    expect(store.getState().count).toBe(1);
    expect(store.getState().double).toBe(2);
    expect(store.getState().triple).toBe(3);
  });
});

describe('Structural Sharing', () => {
  it('preserves unchanged nested objects', () => {
    type State = {
      user: { name: string; age: number };
      settings: { theme: string; lang: string };
    };

    const store = createStore<State>(() => ({
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark', lang: 'en' },
    }));

    const initialSettings = store.getState().settings;

    store.setState({ user: { name: 'Jane', age: 25 } });

    expect(store.getState().settings).toBe(initialSettings);
  });

  it('works with arrays', () => {
    type State = {
      items: Array<{ id: number; value: string }>;
    };

    const store = createStore<State>(() => ({
      items: [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
      ],
    }));

    const initialFirstItem = store.getState().items[0];

    store.setState((state) => ({
      items: [...state.items, { id: 3, value: 'c' }],
    }));

    expect(store.getState().items[0]).toBe(initialFirstItem);
    expect(store.getState().items.length).toBe(3);
  });
});

describe('Backwards Compatibility', () => {
  it('works without history features when not used', () => {
    const store = createStore<{ count: number }>(() => ({ count: 0 }));

    store.setState({ count: 1 });

    expect(store.getState().count).toBe(1);

    const unsubscribe = store.subscribe(() => {});

    unsubscribe();

    expect(store.getInitialState().count).toBe(0);
  });

  it('accepts Zustand middleware', () => {
    const logger = (config: any) => (set: any, get: any, api: any) =>
      config(
        (...args: any[]) => {
          console.log('Setting state');
          set(...args);
        },
        get,
        api,
      );

    const store = createStore<{ count: number }>(logger(() => ({ count: 0 })));

    store.setState({ count: 1 });

    expect(store.getState().count).toBe(1);
  });
});
