import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Vanilla devtools Middleware Tests
 *
 * The devtools middleware enables Redux DevTools integration
 * for debugging Bruin stores with time-travel capabilities.
 *
 * Key features tested:
 * - Basic DevTools connection
 * - Action tracking and naming
 * - Time-travel (jump to state)
 * - State serialization
 * - Connection options (name, enabled, etc)
 * - Anonymous actions tracking
 * - History timeline integration (Bruin enhancement)
 * - Pause/resume functionality
 */

describe('Vanilla devtools Middleware', () => {
  // Mock Redux DevTools Extension
  let mockDevtools: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      init: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    };

    mockDevtools = {
      connect: vi.fn(() => mockConnection),
    };

    // Mock window.__REDUX_DEVTOOLS_EXTENSION__
    (global as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: mockDevtools,
    };
  });

  afterEach(() => {
    delete (global as any).window;
    vi.clearAllMocks();
  });

  it('should be defined', async () => {
    const { devtools } = await import('../../src/middleware/devtools');
    expect(devtools).toBeDefined();
    expect(typeof devtools).toBe('function');
  });

  it('connects to Redux DevTools on initialization', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({ count: 0, inc: () => set({ count: 1 }) }), {
        name: 'TestStore',
      }),
    );

    expect(mockDevtools.connect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TestStore' }),
    );
    expect(mockConnection.init).toHaveBeenCalled();
  });

  it('does not connect when enabled is false', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    createStore(
      devtools(() => ({ count: 0 }), {
        enabled: false,
      }),
    );

    expect(mockDevtools.connect).not.toHaveBeenCalled();
  });

  it('does not connect when DevTools extension is not available', async () => {
    delete (global as any).window.__REDUX_DEVTOOLS_EXTENSION__;

    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    // Should not throw, just skip connection
    expect(() => {
      createStore(devtools(() => ({ count: 0 })));
    }).not.toThrow();
  });

  it('tracks actions with custom names', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set({ count: 1 }, false, 'increment'),
      })),
    );

    store.getState().inc();

    expect(mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'increment' }),
      expect.any(Object),
    );
  });

  it('tracks anonymous actions', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set({ count: 1 }),
      })),
    );

    store.getState().inc();

    expect(mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.stringContaining('anonymous') }),
      expect.any(Object),
    );
  });

  it('supports setState direct calls', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set({ count: 1 }),
      })),
    );

    store.setState({ count: 5 });

    expect(mockConnection.send).toHaveBeenCalled();
  });

  it('supports time-travel from DevTools', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set((s: { count: number }) => ({ count: s.count + 1 })),
      })),
    );

    store.getState().inc();
    store.getState().inc();
    expect(store.getState().count).toBe(2);

    // Simulate DevTools DISPATCH message with JUMP_TO_STATE
    const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];
    subscribeCallback({
      type: 'DISPATCH',
      payload: { type: 'JUMP_TO_STATE' },
      state: JSON.stringify({ count: 1 }),
    });

    expect(store.getState().count).toBe(1);
  });

  it('supports time-travel JUMP_TO_ACTION', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set((s: { count: number }) => ({ count: s.count + 1 })),
      })),
    );

    store.getState().inc();
    store.getState().inc();

    // Simulate JUMP_TO_ACTION
    const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];
    subscribeCallback({
      type: 'DISPATCH',
      payload: { type: 'JUMP_TO_ACTION' },
      state: JSON.stringify({ count: 0 }),
    });

    expect(store.getState().count).toBe(0);
  });

  it('supports custom serialize options', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    // Should accept serialize options without error
    expect(() => {
      createStore<{ count: number; inc: () => void }>(
        devtools(
          (set) => ({
            count: 0,
            inc: () => set({ count: 1 }),
          }),
          {
            serialize: {
              options: {
                date: true,
                regex: true,
              },
            },
          },
        ),
      );
    }).not.toThrow();
  });

  it('supports pause/resume functionality', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set((s: { count: number }) => ({ count: s.count + 1 })),
      })),
    );

    // Simulate PAUSE_RECORDING
    const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];
    subscribeCallback({
      type: 'DISPATCH',
      payload: { type: 'PAUSE_RECORDING' },
    });

    const sendCallsBefore = mockConnection.send.mock.calls.length;

    // Actions while paused should not be sent
    store.getState().inc();

    expect(mockConnection.send.mock.calls.length).toBe(sendCallsBefore);
  });

  it('works with React create', async () => {
    const { create } = await import('../../src/react');
    const { devtools } = await import('../../src/middleware/devtools');

    const useStore = create<{ count: number; inc: () => void }>()(
      devtools((set) => ({ count: 0, inc: () => set({ count: 1 }) }), {
        name: 'ReactStore',
      }),
    );

    expect(mockDevtools.connect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ReactStore' }),
    );

    useStore.getState().inc();
    expect(mockConnection.send).toHaveBeenCalled();
  });

  it('integrates with Bruin history timeline', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools(
        (set) => ({
          count: 0,
          inc: () =>
            (set as any)(
              (s: { count: number }) => ({ count: s.count + 1 }),
              false,
              'increment',
            ),
        }),
        { name: 'HistoryStore' },
      ),
    );

    store.getState().inc();
    store.getState().inc();

    // History should be tracked
    const history = store.getHistory();

    expect(history.length).toBeGreaterThan(0);

    // DevTools should receive history timeline info with store name prefix
    expect(mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'HistoryStore increment' }),
      expect.any(Object),
    );
  });

  it('handles IMPORT_STATE from DevTools', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore(
      devtools(() => ({
        count: 0,
        text: 'hello',
      })),
    );

    // Simulate IMPORT_STATE
    const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];
    const importedState = {
      nextLiftedState: {
        computedStates: [{ state: { count: 42, text: 'imported' } }],
      },
    };

    subscribeCallback({
      type: 'DISPATCH',
      payload: { type: 'IMPORT_STATE', ...importedState },
    });

    expect(store.getState().count).toBe(42);
    expect(store.getState().text).toBe('imported');
  });

  it('supports custom action name from function', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools(
        (set) => ({
          count: 0,
          inc: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'Store',
          actionCreators: {
            inc: () => ({ type: 'INCREMENT' }),
          },
        },
      ),
    );

    store.getState().inc();

    // Should use custom action name
    expect(mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.any(String) }),
      expect.any(Object),
    );
  });

  it('supports multiple independent stores', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    createStore(devtools(() => ({ count: 0 }), { name: 'Store1' }));
    createStore(devtools(() => ({ count: 0 }), { name: 'Store2' }));

    expect(mockDevtools.connect).toHaveBeenCalledTimes(2);
    expect(mockDevtools.connect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Store1' }),
    );
    expect(mockDevtools.connect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Store2' }),
    );
  });

  it('handles COMMIT action from DevTools', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set((s: { count: number }) => ({ count: s.count + 1 })),
      })),
    );

    store.getState().inc();
    store.getState().inc();

    const initCallsBefore = mockConnection.init.mock.calls.length;

    // Simulate COMMIT
    const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];
    subscribeCallback({
      type: 'DISPATCH',
      payload: { type: 'COMMIT' },
    });

    // Should re-init with current state
    expect(mockConnection.init.mock.calls.length).toBe(initCallsBefore + 1);
  });

  it('handles ROLLBACK action from DevTools', async () => {
    const { createStore } = await import('../../src/vanilla');
    const { devtools } = await import('../../src/middleware/devtools');

    const store = createStore<{ count: number; inc: () => void }>(
      devtools((set) => ({
        count: 0,
        inc: () => set((s: { count: number }) => ({ count: s.count + 1 })),
      })),
    );

    store.getState().inc();
    store.getState().inc();
    expect(store.getState().count).toBe(2);

    // Simulate ROLLBACK
    const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];
    subscribeCallback({
      type: 'DISPATCH',
      payload: { type: 'ROLLBACK' },
      state: JSON.stringify({ count: 0 }),
    });

    expect(store.getState().count).toBe(0);
  });

  describe('Zustand-compatible features', () => {
    it('exports NamedSet type', async () => {
      const { NamedSet } = await import('../../src/middleware/devtools');
      expect(NamedSet).toBeDefined();
    });

    it('provides devtools.cleanup() API', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore(
        devtools(() => ({
          count: 0,
        })),
      );

      expect((store as any).devtools).toBeDefined();
      expect(typeof (store as any).devtools.cleanup).toBe('function');

      const unsubscribeSpy = vi.fn();
      mockConnection.unsubscribe = unsubscribeSpy;
      (store as any).devtools.cleanup();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('supports store option for multi-store tracking', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store1 = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'MultiStore',
          store: 'store1',
        }),
      );

      createStore(
        devtools(() => ({ count: 0 }), {
          name: 'MultiStore',
          store: 'store2',
        }),
      );

      expect(mockDevtools.connect).toHaveBeenCalledTimes(1);
      expect(mockConnection.init).toHaveBeenCalledWith(
        expect.objectContaining({
          store1: expect.any(Object),
          store2: expect.any(Object),
        }),
      );

      store1.setState({ count: 5 });
      expect(mockConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'store1/...',
        }),
        expect.objectContaining({
          store1: expect.any(Object),
          store2: expect.any(Object),
        }),
      );
    });

    it('automatically detects action names from stack traces', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore<{ count: number; increment: () => void }>(
        devtools((set) => ({
          count: 0,
          increment: () => {
            set({ count: 1 });
          },
        })),
      );

      store.getState().increment();

      expect(mockConnection.send).toHaveBeenCalled();
      const lastCall =
        mockConnection.send.mock.calls[
          mockConnection.send.mock.calls.length - 1
        ];
      expect(lastCall[0].type).toBeTruthy();
    });

    it('handles ACTION message type from DevTools', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore(
        devtools(() => ({
          count: 0,
          text: 'hello',
        })),
      );

      const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];

      subscribeCallback({
        type: 'ACTION',
        payload: JSON.stringify({
          type: '__setState',
          state: { count: 42, text: 'updated' },
        }),
      });

      expect(store.getState().count).toBe(42);
      expect(store.getState().text).toBe('updated');
    });

    it('warns about reserved __setState action type', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const { createStore } = await import('../../src/vanilla');
      const { redux } = await import('../../src/middleware/redux');
      const { devtools } = await import('../../src/middleware/devtools');

      const reducer = (state: { count: number }, action: any) => {
        if (action.type === '__setState') {
          return { ...state, ...action.state };
        }
        return state;
      };

      const store = createStore(devtools(redux(reducer, { count: 0 }))) as any;

      store.dispatch({ type: '__setState', state: { count: 1 } });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('__setState'),
      );

      consoleWarnSpy.mockRestore();
    });

    it('handles ACTION message with custom action type', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { redux } = await import('../../src/middleware/redux');
      const { devtools } = await import('../../src/middleware/devtools');

      const reducer = (state: { count: number }, action: any) => {
        switch (action.type) {
          case 'INCREMENT':
            return { count: state.count + 1 };
          default:
            return state;
        }
      };

      const store = createStore<{
        count: number;
        dispatch: (action: any) => any;
      }>(devtools(redux(reducer, { count: 0 })));

      const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];

      subscribeCallback({
        type: 'ACTION',
        payload: JSON.stringify({
          type: 'INCREMENT',
        }),
      });

      expect(store.getState().count).toBe(1);
    });

    it('handles JSON parsing errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      createStore(
        devtools(() => ({
          count: 0,
        })),
      );

      const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];

      subscribeCallback({
        type: 'DISPATCH',
        payload: { type: 'ROLLBACK' },
        state: 'invalid json{',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not parse'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('supports setState with action parameter (NamedSet)', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore(
        devtools(() => ({
          count: 0,
        })),
      );

      const setState = store.setState as any;

      setState({ count: 5 }, false, 'customAction');

      expect(mockConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'customAction' }),
        expect.any(Object),
      );
    });

    it('tracks multiple stores sharing a connection', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store1 = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'SharedConnection',
          store: 'store1',
        }),
      );

      const store2 = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'SharedConnection',
          store: 'store2',
        }),
      );

      store1.setState({ count: 10 });
      store2.setState({ count: 20 });

      const sendCalls = mockConnection.send.mock.calls;
      expect(sendCalls.length).toBeGreaterThan(0);

      const lastCall = sendCalls[sendCalls.length - 1];
      expect(lastCall[1]).toEqual(
        expect.objectContaining({
          store1: expect.any(Object),
          store2: expect.any(Object),
        }),
      );
    });

    it('handles store-specific state updates in multi-store mode', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'MultiStore',
          store: 'myStore',
        }),
      );

      const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];

      subscribeCallback({
        type: 'ACTION',
        payload: JSON.stringify({
          type: '__setState',
          state: { myStore: { count: 100 } },
        }),
      });

      expect(store.getState().count).toBe(100);
    });

    it('handles JUMP_TO_STATE in multi-store mode', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'MultiStore',
          store: 'myStore',
        }),
      );

      const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];

      subscribeCallback({
        type: 'DISPATCH',
        payload: { type: 'JUMP_TO_STATE' },
        state: JSON.stringify({ myStore: { count: 50 } }),
      });

      expect(store.getState().count).toBe(50);
    });

    it('handles RESET in multi-store mode', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'MultiStore',
          store: 'myStore',
        }),
      );

      store.setState({ count: 10 });

      const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];

      subscribeCallback({
        type: 'DISPATCH',
        payload: { type: 'RESET' },
      });

      expect(store.getState().count).toBe(0);
      expect(mockConnection.init).toHaveBeenCalledWith(
        expect.objectContaining({
          myStore: expect.any(Object),
        }),
      );
    });

    it('handles IMPORT_STATE in multi-store mode', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'MultiStore',
          store: 'myStore',
        }),
      );

      const subscribeCallback = mockConnection.subscribe.mock.calls[0][0];

      subscribeCallback({
        type: 'DISPATCH',
        payload: {
          type: 'IMPORT_STATE',
          nextLiftedState: {
            computedStates: [
              {
                state: { myStore: { count: 99 } },
              },
            ],
          },
        },
      });

      expect(store.getState().count).toBe(99);
    });

    it('cleans up tracked connections on cleanup', async () => {
      const { createStore } = await import('../../src/vanilla');
      const { devtools } = await import('../../src/middleware/devtools');

      const store1 = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'TrackedStore',
          store: 'store1',
        }),
      );

      const store2 = createStore(
        devtools(() => ({ count: 0 }), {
          name: 'TrackedStore',
          store: 'store2',
        }),
      );

      (store1 as any).devtools.cleanup();

      store2.setState({ count: 5 });

      const lastCall =
        mockConnection.send.mock.calls[
          mockConnection.send.mock.calls.length - 1
        ];
      expect(lastCall[1]).not.toHaveProperty('store1');
      expect(lastCall[1]).toHaveProperty('store2');
    });
  });
});
