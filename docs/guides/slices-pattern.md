---
title: Slices Pattern
nav: 14
---

## Slicing the store into smaller stores

Your store can become bigger and bigger and tougher to maintain as you add more features.

You can divide your main store into smaller individual stores to achieve modularity. This is simple to accomplish in Bruin!

The first individual store:

```tsx
import { StateCreator } from '@inboxhealth/bruin';

interface FishSlice {
  fishes: number;
  addFish: () => void;
}

export const createFishSlice: StateCreator<FishSlice> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
});
```

Another individual store:

```tsx
interface BearSlice {
  bears: number;
  addBear: () => void;
  eatFish: () => void;
}

export const createBearSlice: StateCreator<BearSlice> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
});
```

You can now combine both the stores into **one bounded store**:

```tsx
import { create } from '@inboxhealth/bruin';
import { createBearSlice } from './bearSlice';
import { createFishSlice } from './fishSlice';

type BoundStore = BearSlice & FishSlice;

export const useBoundStore = create<BoundStore>((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}));
```

### Usage in a React component

```tsx
import { useBoundStore } from './stores/useBoundStore';

function App() {
  const bears = useBoundStore((state) => state.bears);
  const fishes = useBoundStore((state) => state.fishes);
  const addBear = useBoundStore((state) => state.addBear);
  return (
    <div>
      <h2>Number of bears: {bears}</h2>
      <h2>Number of fishes: {fishes}</h2>
      <button onClick={() => addBear()}>Add a bear</button>
    </div>
  );
}

export default App;
```

### Updating multiple stores

You can update multiple stores, at the same time, in a single function.

```tsx
interface BearFishSlice {
  addBearAndFish: () => void;
}

export const createBearFishSlice: StateCreator<BearFishSlice> = (set, get) => ({
  addBearAndFish: () => {
    get().addBear();
    get().addFish();
  },
});
```

Combining all the stores together is the same as before.

```tsx
import { create } from '@inboxhealth/bruin';
import { createBearSlice } from './bearSlice';
import { createFishSlice } from './fishSlice';
import { createBearFishSlice } from './createBearFishSlice';

type BoundStore = BearSlice & FishSlice & BearFishSlice;

export const useBoundStore = create<BoundStore>((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
  ...createBearFishSlice(...a),
}));
```

## Adding middlewares

Adding middlewares to a combined store is the same as with other normal stores.

Adding `persist` middleware to our `useBoundStore`:

```tsx
import { create } from '@inboxhealth/bruin';
import { createBearSlice } from './bearSlice';
import { createFishSlice } from './fishSlice';
import { persist } from '@inboxhealth/bruin/middleware';

type BoundStore = BearSlice & FishSlice;

export const useBoundStore = create<BoundStore>()(
  persist(
    (...a) => ({
      ...createBearSlice(...a),
      ...createFishSlice(...a),
    }),
    { name: 'bound-store' },
  ),
);
```

Please keep in mind you should only apply middlewares in the combined store. Applying them inside individual slices can lead to unexpected issues.

## Usage with TypeScript

A detailed guide on how to use the slice pattern in Bruin with TypeScript can be found [here](./advanced-typescript.md#slices-pattern).
