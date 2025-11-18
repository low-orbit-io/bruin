const isIterable = (value: unknown): value is Iterable<unknown> =>
  !!value && typeof value === 'object' && Symbol.iterator in value;

const hasEntries = (
  value: Iterable<unknown>,
): value is Iterable<unknown> & { entries(): Iterable<[unknown, unknown]> } =>
  typeof (value as any)?.entries === 'function';

const compareEntries = (
  valueA: { entries(): Iterable<[unknown, unknown]> },
  valueB: { entries(): Iterable<[unknown, unknown]> },
) => {
  const mapA = valueA instanceof Map ? valueA : new Map(valueA.entries());
  const mapB = valueB instanceof Map ? valueB : new Map(valueB.entries());

  if (mapA.size !== mapB.size) {
    return false;
  }

  for (const [key, value] of mapA) {
    if (!mapB.has(key) || !Object.is(value, mapB.get(key))) {
      return false;
    }
  }

  return true;
};

const compareIterables = (
  valueA: Iterable<unknown>,
  valueB: Iterable<unknown>,
) => {
  const iteratorA = valueA[Symbol.iterator]();
  const iteratorB = valueB[Symbol.iterator]();

  while (true) {
    const nextA = iteratorA.next();
    const nextB = iteratorB.next();

    if (nextA.done || nextB.done) {
      return !!nextA.done && !!nextB.done;
    }

    if (!Object.is(nextA.value, nextB.value)) {
      return false;
    }
  }
};

export function shallow<A, B>(valueA: A, valueB: B): boolean {
  if (Object.is(valueA, valueB)) {
    return true;
  }

  if (
    typeof valueA !== 'object' ||
    valueA === null ||
    typeof valueB !== 'object' ||
    valueB === null
  ) {
    return false;
  }

  if (Object.getPrototypeOf(valueA) !== Object.getPrototypeOf(valueB)) {
    return false;
  }

  if (isIterable(valueA) && isIterable(valueB)) {
    if (hasEntries(valueA) && hasEntries(valueB)) {
      return compareEntries(valueA, valueB);
    }

    return compareIterables(valueA, valueB);
  }

  return compareEntries(
    { entries: () => Object.entries(valueA) },
    { entries: () => Object.entries(valueB) },
  );
}
