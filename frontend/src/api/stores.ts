import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Store, StoreRequest } from './types'

const STORES_KEY = ['stores']
const storeKey = (id: number | string) => ['stores', String(id)]

export function useStores() {
  return useQuery({
    queryKey: STORES_KEY,
    queryFn: () => apiFetch<Store[]>('/api/stores'),
  })
}

export function useStore(id: number | string | undefined) {
  return useQuery({
    queryKey: storeKey(id ?? ''),
    queryFn: () => apiFetch<Store>(`/api/stores/${id}`),
    enabled: id !== undefined,
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: StoreRequest) =>
      apiFetch<Store>('/api/stores', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY })
    },
  })
}

export function useUpdateStore(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: StoreRequest) =>
      apiFetch<Store>(`/api/stores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY })
      queryClient.invalidateQueries({ queryKey: storeKey(id) })
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => apiFetch<void>(`/api/stores/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY })
    },
  })
}
