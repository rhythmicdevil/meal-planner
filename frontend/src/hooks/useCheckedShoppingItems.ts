import { useState } from 'react'
import { loadCheckedItems, saveCheckedItems } from '../utils/shoppingListStorage'

export function useCheckedShoppingItems(mealPlanId: string) {
  const [loadedForId, setLoadedForId] = useState(mealPlanId)
  const [checked, setChecked] = useState<Set<number>>(() => loadCheckedItems(mealPlanId, window.localStorage))

  // React Router reuses this page's component instance across navigations that only change
  // the :id param (no remount), so a plain useState initializer alone wouldn't notice a
  // different meal plan. Adjusting state directly during render (rather than in a useEffect)
  // avoids both the extra render pass and a flash of the previous plan's checked items.
  if (mealPlanId !== loadedForId) {
    setLoadedForId(mealPlanId)
    setChecked(loadCheckedItems(mealPlanId, window.localStorage))
  }

  const toggle = (ingredientId: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(ingredientId)) {
        next.delete(ingredientId)
      } else {
        next.add(ingredientId)
      }
      saveCheckedItems(mealPlanId, next, window.localStorage)
      return next
    })
  }

  return { checked, toggle }
}
