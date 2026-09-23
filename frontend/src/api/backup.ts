import { useMutation } from '@tanstack/react-query'
import { ApiRequestError } from './client'
import type { ApiError } from './types'

async function parseError(response: Response): Promise<ApiError> {
  try {
    return await response.json()
  } catch {
    return { message: response.statusText }
  }
}

// Not a TanStack Query hook like the rest of api/*.ts -- this is a one-shot download action,
// not cached app data, and the response is a .sql file rather than JSON.
export async function exportBackup(): Promise<void> {
  const response = await fetch('/api/backup/export')
  if (!response.ok) {
    throw new ApiRequestError(response.status, await parseError(response))
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'meal-planner-backup.sql'

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function useImportBackup() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/backup/import', { method: 'POST', body: formData })
      if (!response.ok) {
        throw new ApiRequestError(response.status, await parseError(response))
      }
    },
  })
}
