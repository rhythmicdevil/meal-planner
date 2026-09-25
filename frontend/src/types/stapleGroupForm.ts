export interface StapleItemRow {
  name: string
  ingredientId: number | null
  isFood: boolean
  storeIds: number[]
  quantity: number
}

export interface StapleGroupFormValues {
  name: string
  items: StapleItemRow[]
}

export const emptyStapleItemRow = (): StapleItemRow => ({
  name: '',
  ingredientId: null,
  isFood: false,
  storeIds: [],
  quantity: 1,
})

export const emptyStapleGroupFormValues: StapleGroupFormValues = {
  name: '',
  items: [],
}
