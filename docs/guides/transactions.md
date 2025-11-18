---
title: Transactions
description: Batch multiple state updates atomically in Bruin
nav: 101
---

# Transactions

Transactions allow you to batch multiple state updates into a single atomic change.
All updates within a transaction are applied together, creating only one history entry
and triggering subscribers only once.

## Basic Usage

Use `set.transaction()` to batch multiple updates:

```ts
import { create } from 'bruin'

const useStore = create((set) => ({
  firstName: '',
  lastName: '',
  email: '',

  updateProfile: (data) => {
    set.transaction(() => {
      set({ firstName: data.firstName })
      set({ lastName: data.lastName })
      set({ email: data.email })
    }, { name: 'update profile' })
  },
}))
```

Without transactions, this would create 3 history entries and notify subscribers 3 times.
With transactions, it's atomic - one history entry, one notification.

## Transaction Options

Configure transaction behavior:

```ts
set.transaction(() => {
  set({ field1: 'value1' })
  set({ field2: 'value2' })
}, {
  name: 'transaction name',  // Name for history/devtools
  skipHistory: false,        // Skip history tracking (default: false)
})
```

## Why Use Transactions?

### 1. Atomic Updates

Ensure related state changes happen together:

```ts
const useStore = create((set) => ({
  balance: 1000,
  transactions: [],

  transfer: (amount, recipient) => {
    set.transaction(() => {
      // Both updates succeed or both fail
      set((state) => ({ balance: state.balance - amount }))
      set((state) => ({
        transactions: [
          ...state.transactions,
          { amount, recipient, date: new Date() }
        ]
      }))
    }, { name: `transfer $${amount}` })
  },
}))
```

### 2. Performance Optimization

Reduce re-renders by batching updates:

```ts
const useStore = create((set) => ({
  users: [],
  filter: '',
  sortBy: 'name',

  loadData: async () => {
    const data = await fetchUsers()

    set.transaction(() => {
      set({ users: data.users })
      set({ filter: data.defaultFilter })
      set({ sortBy: data.defaultSort })
    }, { name: 'load initial data' })

    // Components re-render only once!
  },
}))
```

### 3. Clean History

Keep your history timeline organized:

```ts
// Without transactions
increment()  // History entry #1
increment()  // History entry #2
increment()  // History entry #3

// With transactions
set.transaction(() => {
  increment()
  increment()
  increment()
}, { name: 'increment by 3' })
// Just one history entry!
```

## Nested Transactions

Transactions can be nested:

```ts
const useStore = create((set) => ({
  data: {},

  complexUpdate: () => {
    set.transaction(() => {
      set({ field1: 'value1' })

      // Nested transaction
      set.transaction(() => {
        set({ field2: 'value2' })
        set({ field3: 'value3' })
      }, { name: 'nested update' })

      set({ field4: 'value4' })
    }, { name: 'complex update' })
  },
}))
```

The outer transaction groups all changes into one atomic update.

## Error Handling

Transactions automatically roll back on errors:

```ts
const useStore = create((set, get) => ({
  balance: 100,

  purchase: (item) => {
    const previousState = get()

    try {
      set.transaction(() => {
        set((state) => ({ balance: state.balance - item.price }))

        if (get().balance < 0) {
          throw new Error('Insufficient funds')
        }

        set((state) => ({
          purchases: [...state.purchases, item]
        }))
      }, { name: 'purchase item' })
    } catch (error) {
      // State automatically rolled back
      console.error(error.message)
    }
  },
}))
```

## React Integration

Transactions work seamlessly with React:

```tsx
import { create } from 'bruin'

const useStore = create((set) => ({
  formData: {
    name: '',
    email: '',
    phone: '',
  },
  isValid: false,
  errors: [],

  updateForm: (updates) => {
    set.transaction(() => {
      set((state) => ({
        formData: { ...state.formData, ...updates }
      }))

      const formData = { ...useStore.getState().formData, ...updates }
      const errors = validateForm(formData)

      set({ errors })
      set({ isValid: errors.length === 0 })
    }, { name: 'update form' })
  },
}))

function Form() {
  const { formData, isValid, errors, updateForm } = useStore()

  // Component re-renders only once per transaction
  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => updateForm({ name: e.target.value })}
      />
      {!isValid && <div className="errors">{errors}</div>}
    </form>
  )
}
```

## With Middleware

Transactions work with all Bruin middleware:

### Persist Middleware

```ts
import { create } from 'bruin'
import { persist } from 'bruin/middleware'

const useStore = create(
  persist(
    (set) => ({
      items: [],
      total: 0,

      addMultipleItems: (newItems) => {
        set.transaction(() => {
          set((state) => ({
            items: [...state.items, ...newItems]
          }))
          set((state) => ({
            total: state.items.length
          }))
        }, { name: 'add multiple items' })
      },
    }),
    { name: 'cart-store' }
  )
)

// Transaction saved to storage as one atomic update
```

### DevTools Middleware

```ts
import { create } from 'bruin'
import { devtools } from 'bruin/middleware'

const useStore = create(
  devtools(
    (set) => ({
      count: 0,

      incrementBy: (amount) => {
        set.transaction(() => {
          for (let i = 0; i < amount; i++) {
            set((state) => ({ count: state.count + 1 }))
          }
        }, { name: `increment by ${amount}` })
      },
    }),
    { name: 'Counter' }
  )
)

// DevTools shows one action for the entire transaction
```

## TypeScript

Transactions are fully typed:

```ts
import { create } from 'bruin'

type Store = {
  count: number
  name: string
  update: () => void
}

const useStore = create<Store>((set) => ({
  count: 0,
  name: '',

  update: () => {
    set.transaction(() => {
      set({ count: 10 })  // ✓ Type-safe
      set({ name: 'test' })  // ✓ Type-safe
      // set({ invalid: true })  // ✗ Type error
    }, { name: 'update' })
  },
}))
```

## Best Practices

1. **Use for related updates** - Group logically related state changes
2. **Name your transactions** - Helps debugging and history tracking
3. **Don't overuse** - Not every multi-set needs a transaction
4. **Consider performance** - Use when batching reduces re-renders
5. **Handle errors** - Wrap in try/catch if updates can fail

## Common Patterns

### Form Submission

```ts
const useStore = create((set) => ({
  formData: {},
  isSubmitting: false,
  error: null,

  submitForm: async (data) => {
    set.transaction(() => {
      set({ isSubmitting: true })
      set({ error: null })
    }, { name: 'start submit', skipHistory: true })

    try {
      await api.submit(data)

      set.transaction(() => {
        set({ formData: {} })
        set({ isSubmitting: false })
      }, { name: 'submit success' })
    } catch (error) {
      set.transaction(() => {
        set({ error: error.message })
        set({ isSubmitting: false })
      }, { name: 'submit failed' })
    }
  },
}))
```

### Bulk Operations

```ts
const useStore = create((set) => ({
  items: [],
  selectedIds: [],

  deleteSelected: () => {
    set.transaction(() => {
      const ids = new Set(get().selectedIds)

      set((state) => ({
        items: state.items.filter(item => !ids.has(item.id))
      }))
      set({ selectedIds: [] })
    }, { name: 'delete selected items' })
  },
}))
```

### State Migration

```ts
const useStore = create((set) => ({
  version: 1,
  data: {},

  migrateToV2: () => {
    set.transaction(() => {
      set({ version: 2 })
      set((state) => ({
        data: transformDataV1ToV2(state.data)
      }))
    }, { name: 'migrate to v2' })
  },
}))
```

## Comparison with Other Approaches

### Without Transactions

```ts
// 3 updates, 3 history entries, 3 re-renders
set({ field1: 'a' })
set({ field2: 'b' })
set({ field3: 'c' })
```

### With Object Merge

```ts
// 1 update, 1 history entry, 1 re-render
// But can't use setState callback pattern
set({ field1: 'a', field2: 'b', field3: 'c' })
```

### With Transactions

```ts
// 1 update, 1 history entry, 1 re-render
// Can use setState callbacks and complex logic
set.transaction(() => {
  set({ field1: 'a' })
  set((state) => ({ field2: calculateB(state) }))
  set((state) => ({ field3: calculateC(state) }))
}, { name: 'complex update' })
```

## Related

- [History & Time Travel](./history-and-time-travel.md) - Understanding history tracking
- [Updating State](./updating-state.md) - State update patterns
- [Performance Optimization](./performance-optimization.md) - Reducing re-renders
