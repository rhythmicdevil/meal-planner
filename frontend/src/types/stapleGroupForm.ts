export interface StapleItemRow {
  name: string
  ingredientId: number | null
  storeIds: number[]
}

export interface StapleGroupFormValues {
  name: string
  items: StapleItemRow[]
}

export const emptyStapleItemRow = (): StapleItemRow => ({
  name: '',
  ingredientId: null,
  storeIds: [],
})

export const emptyStapleGroupFormValues: StapleGroupFormValues = {
  name: '',
  items: [],
}
