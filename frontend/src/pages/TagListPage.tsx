import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Anchor, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useDeleteTag, useTags } from '../api/tags'
import { TAG_TYPE_LABELS, type Tag } from '../api/types'
import { SortableTh } from '../components/SortableTh'
import { useSort } from '../hooks/useSort'

type TagSortKey = 'name' | 'type'

const tagComparators: Record<TagSortKey, (a: Tag, b: Tag) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  type: (a, b) => TAG_TYPE_LABELS[a.type].localeCompare(TAG_TYPE_LABELS[b.type]) || a.name.localeCompare(b.name),
}

export function TagListPage() {
  const { data: tags, isLoading, isError } = useTags()
  const deleteTag = useDeleteTag()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { sortKey, direction, onSort, sorted } = useSort<Tag, TagSortKey>(tags ?? [], tagComparators, 'type')

  const handleDelete = async (tag: Tag) => {
    if (!window.confirm(`Delete "${tag.name}"? Recipes using it will have it removed.`)) return
    setDeletingId(tag.id)
    try {
      await deleteTag.mutateAsync(tag.id)
      notifications.show({ message: 'Tag deleted', color: 'green' })
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Tags</Title>
        <Button component={Link} to="/tags/new">
          New Tag
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load tags.</Alert>}
      {tags && tags.length === 0 && <Text c="dimmed">No tags yet — create the first one.</Text>}

      {sorted.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SortableTh<TagSortKey> label="Name" sortKey="name" activeKey={sortKey} direction={direction} onSort={onSort} />
              <SortableTh<TagSortKey> label="Type" sortKey="type" activeKey={sortKey} direction={direction} onSort={onSort} />
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((tag) => (
              <Table.Tr key={tag.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/tags/${tag.id}/edit`}>
                    {tag.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{TAG_TYPE_LABELS[tag.type]}</Table.Td>
                <Table.Td>
                  <Button
                    color="red"
                    variant="subtle"
                    size="xs"
                    onClick={() => handleDelete(tag)}
                    loading={deletingId === tag.id}
                  >
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
