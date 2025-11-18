export function shallow<T>(objA: T, objB: T): boolean {
  // Same reference - always equal (use === to treat -0 and +0 as equal)
  if (objA === objB) {
    return true;
  }

  // Handle primitives and null/undefined
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return Object.is(objA, objB);
  }

  // Different prototypes - not equal
  const protoA = Object.getPrototypeOf(objA);
  const protoB = Object.getPrototypeOf(objB);

  if (protoA !== protoB) {
    return false;
  }

  // Handle iterables (Set, Map) before prototype restriction
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) {
      return false;
    }

    for (const [key, value] of objA) {
      if (!Object.is(value, objB.get(key))) {
        return false;
      }
    }
    return true;
  }

  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) {
      return false;
    }

    for (const value of objA) {
      if (!objB.has(value)) {
        return false;
      }
    }
    return true;
  }

  // For Date, RegExp, and other built-in objects with non-Object/Array prototypes,
  // return false if they're not the same reference (already checked above)
  if (protoA !== Object.prototype && protoA !== Array.prototype) {
    return false;
  }

  // Handle objects and arrays
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const keyA of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keyA) ||
      !Object.is(
        (objA as Record<string, unknown>)[keyA],
        (objB as Record<string, unknown>)[keyA],
      )
    ) {
      return false;
    }
  }

  return true;
}
