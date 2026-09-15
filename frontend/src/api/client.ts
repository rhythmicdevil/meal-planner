import type { ApiError } from './types'

export class ApiRequestError extends Error {
  status: number
  fieldErrors: Record<string, string> | null

  constructor(status: number, apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fieldErrors = apiError.fieldErrors ?? null
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let apiError: ApiError = { message: response.statusText }
    try {
      apiError = await response.json()
    } catch {
      // response had no JSON body; fall back to statusText above
    }
    throw new ApiRequestError(response.status, apiError)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
