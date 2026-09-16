import { useMutation } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { ImportedRecipe } from './types'

export function useImportRecipeFromUrl() {
  return useMutation({
    mutationFn: (url: string) =>
      apiFetch<ImportedRecipe>('/api/import/url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
  })
}
