import { describe, expect, it } from 'vitest'
import { loadCheckedItems, saveCheckedItems, type KeyValueStorage } from './shoppingListStorage'

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const store = { ...initial }
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value
    },
  }
}

describe('shoppingListStorage', () => {
  it('returns an empty set when nothing has been stored yet', () => {
    expect(loadCheckedItems('1', fakeStorage())).toEqual(new Set())
  })

  it('round-trips a saved set of checked ingredient ids', () => {
    const storage = fakeStorage()
    saveCheckedItems('1', new Set([3, 7, 2]), storage)
    expect(loadCheckedItems('1', storage)).toEqual(new Set([3, 7, 2]))
  })

  it('keys storage per meal plan, not shared across plans', () => {
    const storage = fakeStorage()
    saveCheckedItems('1', new Set([1]), storage)
    saveCheckedItems('2', new Set([2]), storage)
    expect(loadCheckedItems('1', storage)).toEqual(new Set([1]))
    expect(loadCheckedItems('2', storage)).toEqual(new Set([2]))
  })

  it('falls back to an empty set for malformed or unexpected stored data', () => {
    expect(loadCheckedItems('1', fakeStorage({ 'shopping-list-checked:1': 'not json' }))).toEqual(new Set())
    expect(loadCheckedItems('1', fakeStorage({ 'shopping-list-checked:1': '{"not":"an array"}' }))).toEqual(
      new Set(),
    )
    expect(loadCheckedItems('1', fakeStorage({ 'shopping-list-checked:1': '[1,"two",3,null]' }))).toEqual(
      new Set([1, 3]),
    )
  })

  it('silently no-ops when the storage backend throws (e.g. quota exceeded)', () => {
    const throwingStorage: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }
    expect(() => saveCheckedItems('1', new Set([1]), throwingStorage)).not.toThrow()
  })
})
