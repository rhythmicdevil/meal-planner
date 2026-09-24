import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { StapleGroup, StapleGroupRequest } from './types'

const STAPLE_GROUPS_KEY = ['staple-groups']
const stapleGroupKey = (id: number | string) => ['staple-groups', String(id)]

export function useStapleGroups() {
  return useQuery({
    queryKey: STAPLE_GROUPS_KEY,
    queryFn: () => apiFetch<StapleGroup[]>('/api/staple-groups'),
  })
}

export function useStapleGroup(id: number | string | undefined) {
  return useQuery({
    queryKey: stapleGroupKey(id ?? ''),
    queryFn: () => apiFetch<StapleGroup>(`/api/staple-groups/${id}`),
    enabled: id !== undefined,
  })
}

export function useCreateStapleGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: StapleGroupRequest) =>
      apiFetch<StapleGroup>('/api/staple-groups', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAPLE_GROUPS_KEY })
    },
  })
}

export function useUpdateStapleGroup(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: StapleGroupRequest) =>
      apiFetch<StapleGroup>(`/api/staple-groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAPLE_GROUPS_KEY })
      queryClient.invalidateQueries({ queryKey: stapleGroupKey(id) })
    },
  })
}

export function useDeleteStapleGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/api/staple-groups/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAPLE_GROUPS_KEY })
    },
  })
}
