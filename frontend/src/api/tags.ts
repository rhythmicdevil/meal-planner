import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Tag, TagRequest } from './types'

const TAGS_KEY = ['tags']
const tagKey = (id: number | string) => ['tags', String(id)]

export function useTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: () => apiFetch<Tag[]>('/api/tags'),
  })
}

export function useTag(id: number | string | undefined) {
  return useQuery({
    queryKey: tagKey(id ?? ''),
    queryFn: () => apiFetch<Tag>(`/api/tags/${id}`),
    enabled: id !== undefined,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TagRequest) =>
      apiFetch<Tag>('/api/tags', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
    },
  })
}

export function useUpdateTag(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TagRequest) =>
      apiFetch<Tag>(`/api/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
      queryClient.invalidateQueries({ queryKey: tagKey(id) })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => apiFetch<void>(`/api/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
    },
  })
}
