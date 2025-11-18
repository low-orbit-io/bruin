import { describe, expect, it } from 'vitest'

/**
 * Shallow Comparison Tests
 *
 * The shallow() function performs shallow equality comparison:
 * - Primitives: Uses Object.is()
 * - Objects/Arrays: Compares top-level properties only
 * - Sets/Maps: Compares entries
 * - Does NOT deeply compare nested structures
 *
 * This is useful for:
 * - Optimizing React re-renders
 * - Comparing selector results
 * - Implementing custom equality functions
 */

describe('Vanilla Shallow Comparison', () => {
  it('should be defined', async () => {
    const { shallow } = await import('../../src/vanilla/shallow')
    expect(shallow).toBeDefined()
    expect(typeof shallow).toBe('function')
  })

  describe('primitives', () => {
    it('compares numbers correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(1, 1)).toBe(true)
      expect(shallow(1, 2)).toBe(false)
      expect(shallow(0, 0)).toBe(true)
      expect(shallow(-0, +0)).toBe(true)
      expect(shallow(NaN, NaN)).toBe(true)
      expect(shallow(Infinity, Infinity)).toBe(true)
      expect(shallow(-Infinity, -Infinity)).toBe(true)
      expect(shallow(Infinity, -Infinity)).toBe(false)
    })

    it('compares strings correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow('hello', 'hello')).toBe(true)
      expect(shallow('hello', 'world')).toBe(false)
      expect(shallow('', '')).toBe(true)
    })

    it('compares booleans correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(true, true)).toBe(true)
      expect(shallow(false, false)).toBe(true)
      expect(shallow(true, false)).toBe(false)
    })

    it('compares null and undefined correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(null, null)).toBe(true)
      expect(shallow(undefined, undefined)).toBe(true)
      expect(shallow(null, undefined)).toBe(false)
    })

    it('compares symbols correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const sym1 = Symbol('test')
      const sym2 = Symbol('test')

      expect(shallow(sym1, sym1)).toBe(true)
      expect(shallow(sym1, sym2)).toBe(false)
    })
  })

  describe('objects', () => {
    it('compares empty objects as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow({}, {})).toBe(true)
    })

    it('compares objects with same properties as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    })

    it('compares objects with different properties as not equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow({ a: 1 }, { a: 2 })).toBe(false)
      expect(shallow({ a: 1 }, { b: 1 })).toBe(false)
      expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    })

    it('does not deeply compare nested objects', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const nested1 = { value: 1 }
      const nested2 = { value: 1 }

      // Same reference - equal
      expect(shallow({ nested: nested1 }, { nested: nested1 })).toBe(true)

      // Different reference - not equal (shallow comparison)
      expect(shallow({ nested: nested1 }, { nested: nested2 })).toBe(false)
    })

    it('compares objects with different number of keys', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false)
      expect(shallow({ a: 1, b: 2 }, { a: 1 })).toBe(false)
    })

    it('handles objects with undefined values', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow({ a: undefined }, { a: undefined })).toBe(true)
      expect(shallow({ a: undefined }, { a: null })).toBe(false)
      expect(shallow({ a: 1 }, { a: undefined })).toBe(false)
    })

    it('compares object references correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj = { a: 1 }
      expect(shallow(obj, obj)).toBe(true)

      const obj2 = { a: 1 }
      expect(shallow(obj, obj2)).toBe(true) // Same properties
    })

    it('handles objects with different prototypes', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      class A {
        a = 1
      }
      class B {
        a = 1
      }

      const objA = new A()
      const objB = new B()

      // Different prototypes
      expect(shallow(objA, objB)).toBe(false)
    })
  })

  describe('arrays', () => {
    it('compares empty arrays as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow([], [])).toBe(true)
    })

    it('compares arrays with same elements as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    it('compares arrays with different elements as not equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow([1, 2, 3], [1, 2, 4])).toBe(false)
      expect(shallow([1, 2], [1, 2, 3])).toBe(false)
    })

    it('does not deeply compare nested arrays', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const nested1 = [1, 2]
      const nested2 = [1, 2]

      // Same reference - equal
      expect(shallow([nested1], [nested1])).toBe(true)

      // Different reference - not equal
      expect(shallow([nested1], [nested2])).toBe(false)
    })

    it('compares arrays with different lengths', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow([1, 2], [1, 2, 3])).toBe(false)
      expect(shallow([1, 2, 3], [1, 2])).toBe(false)
    })

    it('handles arrays with undefined elements', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow([1, undefined, 3], [1, undefined, 3])).toBe(true)
      expect(shallow([1, undefined, 3], [1, null, 3])).toBe(false)
    })

    it('compares array references correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const arr = [1, 2, 3]
      expect(shallow(arr, arr)).toBe(true)

      const arr2 = [1, 2, 3]
      expect(shallow(arr, arr2)).toBe(true) // Same elements
    })
  })

  describe('Sets', () => {
    it('compares empty Sets as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(new Set(), new Set())).toBe(true)
    })

    it('compares Sets with same values as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true)
    })

    it('compares Sets with different values as not equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(new Set([1, 2, 3]), new Set([1, 2, 4]))).toBe(false)
      expect(shallow(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false)
    })

    it('handles Sets with different sizes', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(new Set([1]), new Set([1, 2]))).toBe(false)
      expect(shallow(new Set([1, 2]), new Set([1]))).toBe(false)
    })

    it('compares Set references correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const set = new Set([1, 2, 3])
      expect(shallow(set, set)).toBe(true)
    })

    it('does not deeply compare Set contents', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj = { a: 1 }
      const set1 = new Set([obj])
      const set2 = new Set([obj])
      const set3 = new Set([{ a: 1 }])

      expect(shallow(set1, set2)).toBe(true) // Same object reference
      expect(shallow(set1, set3)).toBe(false) // Different object reference
    })
  })

  describe('Maps', () => {
    it('compares empty Maps as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(new Map(), new Map())).toBe(true)
    })

    it('compares Maps with same entries as equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(
        shallow(
          new Map([
            ['a', 1],
            ['b', 2],
          ]),
          new Map([
            ['a', 1],
            ['b', 2],
          ])
        )
      ).toBe(true)
    })

    it('compares Maps with different entries as not equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(
        shallow(
          new Map([
            ['a', 1],
            ['b', 2],
          ]),
          new Map([
            ['a', 1],
            ['b', 3],
          ])
        )
      ).toBe(false)
    })

    it('handles Maps with different sizes', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(
        shallow(new Map([['a', 1]]), new Map([['a', 1], ['b', 2]]))
      ).toBe(false)
    })

    it('compares Map references correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const map = new Map([['a', 1]])
      expect(shallow(map, map)).toBe(true)
    })

    it('does not deeply compare Map values', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj = { a: 1 }
      const map1 = new Map([['key', obj]])
      const map2 = new Map([['key', obj]])
      const map3 = new Map([['key', { a: 1 }]])

      expect(shallow(map1, map2)).toBe(true) // Same object reference
      expect(shallow(map1, map3)).toBe(false) // Different object reference
    })
  })

  describe('mixed types', () => {
    it('compares different types as not equal', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      expect(shallow(1, '1')).toBe(false)
      expect(shallow([], {})).toBe(false)
      expect(shallow(new Set(), new Map())).toBe(false)
      expect(shallow(null, {})).toBe(false)
      expect(shallow(undefined, null)).toBe(false)
    })

    it('compares objects with arrays correctly', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      // Arrays are objects but have different prototypes
      expect(shallow([1, 2], { 0: 1, 1: 2 })).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles circular references in objects', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj1: any = { a: 1 }
      obj1.self = obj1

      const obj2: any = { a: 1 }
      obj2.self = obj2

      // Same reference - equal
      expect(shallow(obj1, obj1)).toBe(true)

      // Different objects with circular refs - not equal (shallow)
      expect(shallow(obj1, obj2)).toBe(false)
    })

    it('handles functions as values', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const fn = () => {}
      expect(shallow({ fn }, { fn })).toBe(true)
      expect(shallow({ fn: () => {} }, { fn: () => {} })).toBe(false)
    })

    it('handles Date objects', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-01')

      expect(shallow(date1, date1)).toBe(true)
      expect(shallow(date1, date2)).toBe(false) // Different objects
    })

    it('handles RegExp objects', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const regex1 = /test/g
      const regex2 = /test/g

      expect(shallow(regex1, regex1)).toBe(true)
      expect(shallow(regex1, regex2)).toBe(false) // Different objects
    })

    it('handles objects with Symbol keys', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const sym = Symbol('key')
      expect(shallow({ [sym]: 1 }, { [sym]: 1 })).toBe(true)
    })

    it('handles objects with getters', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj1 = {
        _value: 1,
        get value() {
          return this._value
        },
      }

      const obj2 = {
        _value: 1,
        get value() {
          return this._value
        },
      }

      // Getters are properties, compared by reference
      expect(shallow(obj1, obj1)).toBe(true)
      // Different objects have different getter functions
      expect(shallow(obj1, obj2)).toBe(false)
    })

    it('handles very large arrays efficiently', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const arr1 = Array.from({ length: 10000 }, (_, i) => i)
      const arr2 = Array.from({ length: 10000 }, (_, i) => i)

      expect(shallow(arr1, arr2)).toBe(true)

      arr2[5000] = 9999
      expect(shallow(arr1, arr2)).toBe(false)
    })

    it('handles very large objects efficiently', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj1 = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key${i}`, i])
      )
      const obj2 = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key${i}`, i])
      )

      expect(shallow(obj1, obj2)).toBe(true)

      obj2.key500 = 9999
      expect(shallow(obj1, obj2)).toBe(false)
    })
  })

  describe('performance characteristics', () => {
    it('should be fast for same reference', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj = { a: 1, b: 2, c: 3 }
      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        shallow(obj, obj)
      }
      const end = performance.now()

      // Same reference should be nearly instant
      expect(end - start).toBeLessThan(100)
    })

    it('should short-circuit on prototype mismatch', async () => {
      const { shallow } = await import('../../src/vanilla/shallow')

      const obj = { a: 1 }
      const arr = [1]

      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        shallow(obj, arr)
      }
      const end = performance.now()

      // Prototype mismatch should short-circuit
      expect(end - start).toBeLessThan(100)
    })
  })
})
