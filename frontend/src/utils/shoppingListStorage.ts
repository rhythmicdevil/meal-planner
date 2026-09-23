// Persists which shopping-list items have been crossed off, per meal plan, to this device's
// local storage -- so backgrounding/reloading the tab mid-shopping-trip doesn't lose progress.
// Takes an injectable storage so this stays testable without depending on a browser/jsdom
// environment (the project's tests run in plain Node, not jsdom).
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function storageKey(mealPlanId: string): string {
  return `shopping-list-checked:${mealPlanId}`
}

export function loadCheckedItems(mealPlanId: string, storage: KeyValueStorage): Set<number> {
  try {
    const raw = storage.getItem(storageKey(mealPlanId))
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is number => typeof value === 'number'))
  } catch {
    return new Set()
  }
}

export function saveCheckedItems(mealPlanId: string, ids: Set<number>, storage: KeyValueStorage): void {
  try {
    storage.setItem(storageKey(mealPlanId), JSON.stringify([...ids]))
  } catch {
    // Storage might be unavailable (private browsing, quota exceeded) -- the toggle still
    // works for this session, it just won't survive a reload.
  }
}
