import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export function useSort<T, K extends string>(
  items: T[],
  comparators: Record<K, (a: T, b: T) => number>,
  defaultKey: K,
) {
  const [sortKey, setSortKey] = useState<K>(defaultKey)
  const [direction, setDirection] = useState<SortDirection>('asc')

  const onSort = (key: K) => {
    if (key === sortKey) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setDirection('asc')
    }
  }

  const sorted = useMemo(() => {
    const result = [...items].sort(comparators[sortKey])
    return direction === 'asc' ? result : result.reverse()
  }, [items, sortKey, direction, comparators])

  return { sortKey, direction, onSort, sorted }
}
