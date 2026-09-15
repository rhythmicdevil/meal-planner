import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Menu, MenuRequest } from './types'

const MENUS_KEY = ['menus']
const menuKey = (id: number | string) => ['menus', String(id)]

export function useMenus() {
  return useQuery({
    queryKey: MENUS_KEY,
    queryFn: () => apiFetch<Menu[]>('/api/menus'),
  })
}

export function useMenu(id: number | string | undefined) {
  return useQuery({
    queryKey: menuKey(id ?? ''),
    queryFn: () => apiFetch<Menu>(`/api/menus/${id}`),
    enabled: id !== undefined,
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: MenuRequest) =>
      apiFetch<Menu>('/api/menus', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY })
    },
  })
}

export function useUpdateMenu(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: MenuRequest) =>
      apiFetch<Menu>(`/api/menus/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY })
      queryClient.invalidateQueries({ queryKey: menuKey(id) })
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/api/menus/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY })
    },
  })
}
