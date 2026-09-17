import { Group, Table, Text, UnstyledButton } from '@mantine/core'
import type { SortDirection } from '../hooks/useSort'

interface SortableThProps<K extends string> {
  label: string
  sortKey: K
  activeKey: K
  direction: SortDirection
  onSort: (key: K) => void
}

export function SortableTh<K extends string>({ label, sortKey, activeKey, direction, onSort }: SortableThProps<K>) {
  const isActive = sortKey === activeKey
  return (
    <Table.Th>
      <UnstyledButton onClick={() => onSort(sortKey)}>
        <Group gap={4} wrap="nowrap">
          <Text fw={600} size="sm">
            {label}
          </Text>
          {isActive && (
            <Text size="xs" c="dimmed">
              {direction === 'asc' ? '▲' : '▼'}
            </Text>
          )}
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}
